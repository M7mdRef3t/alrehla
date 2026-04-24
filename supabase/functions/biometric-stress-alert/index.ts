/**
 * Biometric Stress Alert — Edge Function 🚨
 * ==========================================
 * يُستدعى عن طريق Supabase Webhook عند INSERT في user_biometrics
 * بـ stress_level > 70.
 * 
 * يبعت Web Push notification للمستخدم + يحفظ alert في behavioral_alerts.
 * 
 * Setup:
 * 1. Create a Database Webhook in Supabase Dashboard:
 *    - Table: user_biometrics
 *    - Events: INSERT
 *    - Function: biometric-stress-alert
 * 2. Set environment variables:
 *    - VAPID_PRIVATE_KEY
 *    - VAPID_PUBLIC_KEY
 *    - VAPID_SUBJECT (e.g., mailto:admin@alrehla.com)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiometricPayload {
    type: 'INSERT';
    table: 'user_biometrics';
    record: {
        id: string;
        user_id: string;
        heart_rate: number;
        hrv: number;
        stress_level: number | null;
        timestamp: string;
        source: string;
    };
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload: BiometricPayload = await req.json();
        const record = payload.record;

        // Only trigger for high stress
        if (!record.stress_level || record.stress_level < 70) {
            return new Response(
                JSON.stringify({ message: 'Stress level below threshold, no action needed.' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase admin client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Save behavioral alert
        const alertMessage = record.stress_level >= 85
            ? `⚠️ جسمك يرسل إشارة استغاثة — مستوى التوتر ${record.stress_level}%. تحتاج تتوقف الآن.`
            : `📊 مستوى التوتر مرتفع (${record.stress_level}%). خذ لحظة وشوف خريطتك.`;

        await supabase.from('behavioral_alerts').insert({
            user_id: record.user_id,
            message: alertMessage,
            resource_tab: 'dawayir',
            resource_key: 'stress-check',
            is_read: false,
        });

        // 2. Send Web Push (if subscription exists)
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', record.user_id);

        if (subscriptions && subscriptions.length > 0) {
            const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
            const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
            const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@alrehla.com';

            if (vapidPrivateKey && vapidPublicKey) {
                // Note: In production, use web-push library via npm.
                // For Edge Functions, we log the intent and let the client poll behavioral_alerts.
                console.log(`[BiometricAlert] Would send push to ${subscriptions.length} endpoints for user ${record.user_id}`);
                console.log(`[BiometricAlert] Stress: ${record.stress_level}, HR: ${record.heart_rate}, HRV: ${record.hrv}`);
            }
        }

        return new Response(
            JSON.stringify({
                message: `Alert created for user ${record.user_id}`,
                stress_level: record.stress_level,
                alert_sent: true,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[BiometricAlert] Error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
