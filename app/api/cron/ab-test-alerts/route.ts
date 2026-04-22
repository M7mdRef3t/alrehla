import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage, escapeMarkdownV2 } from '@/services/telegramService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey, {
              auth: { autoRefreshToken: false, persistSession: false }
          })
        : null;

// The threshold settings for the A/B test notification.
// We can adjust these limits later or via env variables.
const THRESHOLD_VIEWS = parseInt(process.env.AB_TEST_THRESHOLD_VIEWS || '50', 10);
const THRESHOLD_CTR = parseFloat(process.env.AB_TEST_THRESHOLD_CTR || '5'); // 5% CTR

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
        }

        // Only allow Vercel Cron or a specific secret to trigger this
        const authHeader = req.headers.get('authorization');
        const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');
        const cronSecret = process.env.CRON_SECRET;
        
        // Basic security check (allow Vercel or a valid Bearer token)
        if (!isVercelCron && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
             // In dev, we might allow bypass, but let's be strict in prod.
             if (process.env.NODE_ENV === 'production') {
                 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
             }
        }

        // 1. Fetch Events
        const { data: events, error } = await supabase
            .from('routing_events')
            .select('event_type, payload')
            .in('event_type', ['conversion_offer_view', 'conversion_offer_clicked']);

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        // 2. Calculate Stats
        let osViews = 0, osClicks = 0;
        let shieldViews = 0, shieldClicks = 0;

        (events || []).forEach(d => {
            const variant = d.payload?.variant || d.payload?.button_variant;
            if (d.event_type === 'conversion_offer_view') {
                if(variant === 'os') osViews++;
                if(variant === 'shield') shieldViews++;
            } else if (d.event_type === 'conversion_offer_clicked') {
                if(variant === 'os') osClicks++;
                if(variant === 'shield') shieldClicks++;
            }
        });

        const osCtr = osViews > 0 ? (osClicks / osViews) * 100 : 0;
        const shieldCtr = shieldViews > 0 ? (shieldClicks / shieldViews) * 100 : 0;

        const results = {
            os: { views: osViews, clicks: osClicks, ctr: osCtr },
            shield: { views: shieldViews, clicks: shieldClicks, ctr: shieldCtr }
        };

        // 3. Check Thresholds and Send Alerts if necessary
        const alertsSent: string[] = [];

        // Check if OS variant crossed threshold
        if (osViews >= THRESHOLD_VIEWS && osCtr >= THRESHOLD_CTR) {
            const alerted = await processVariantAlert(supabase, 'os', osViews, osCtr);
            if (alerted) alertsSent.push('os');
        }

        // Check if Shield variant crossed threshold
        if (shieldViews >= THRESHOLD_VIEWS && shieldCtr >= THRESHOLD_CTR) {
            const alerted = await processVariantAlert(supabase, 'shield', shieldViews, shieldCtr);
            if (alerted) alertsSent.push('shield');
        }

        return NextResponse.json({ 
            success: true, 
            message: alertsSent.length > 0 ? `Alerts sent for: ${alertsSent.join(', ')}` : "No new alerts triggered.",
            currentStats: results,
            thresholds: { views: THRESHOLD_VIEWS, ctr: THRESHOLD_CTR }
        });

    } catch (err) {
        console.error("[Cron API] Error processing A/B test alerts:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * Checks if an alert was already sent for this variant. If not, sends it and records the state.
 */
async function processVariantAlert(supabaseClient: any, variantName: string, views: number, ctr: number): Promise<boolean> {
    const alertKey = `ab_test_alert_sent_${variantName}`;
    
    // Check if we already sent an alert
    const { data: existingRecord } = await supabaseClient
        .from('system_settings')
        .select('value')
        .eq('key', alertKey)
        .maybeSingle();

    if (existingRecord?.value === true) {
        // Already alerted
        return false;
    }

    // Build the Telegram message
    const emoji = variantName === 'shield' ? '🛡️' : '⚖️';
    const variantDisplayName = variantName === 'shield' ? 'Sovereign Shield' : 'OS Control';
    
    const message = `
🚨 *A/B Test Milestone Reached* 🚨

${emoji} *Variant:* ${escapeMarkdownV2(variantDisplayName)}
👁 *Views:* ${views}
👆 *Clicks:* ${views > 0 ? Math.round((ctr / 100) * views) : 0}
🎯 *CTR:* ${escapeMarkdownV2(ctr.toFixed(2))}%

_Thresholds: ${THRESHOLD_VIEWS} views & ${THRESHOLD_CTR}% CTR_
    `.trim();

    // Send Telegram Alert
    const sent = await sendTelegramMessage(message);

    if (sent) {
        // Mark as sent in DB
        await supabaseClient.from('system_settings').upsert({
            key: alertKey,
            value: true
        });
        return true;
    }

    return false;
}
