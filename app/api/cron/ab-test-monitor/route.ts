import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { telegramBot } from "@/services/telegramBot";

// Initialize admin client strictly for Cron execution
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const THRESHOLD_VIEWS = 100;
const THRESHOLD_CTR = 15; // Percent

export async function GET(req: Request) {
  try {
    // Basic auth check if invoked via Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        // We log it but do not strictly block in development
        if (process.env.NODE_ENV === "production") {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    // 1. Fetch Views
    const { data: viewsData, error: viewErr } = await supabaseAdmin
      .from("analytics_events")
      .select("properties")
      .eq("event_name", "conversion_offer_view");

    // 2. Fetch Clicks
    const { data: clicksData, error: clickErr } = await supabaseAdmin
      .from("analytics_events")
      .select("properties")
      .eq("event_name", "conversion_offer_clicked");

    if (viewErr || clickErr) {
        throw new Error(viewErr?.message || clickErr?.message || 'Error fetching analytics');
    }

    const stats: Record<'A' | 'B', { views: number; clicks: number; ctr: number }> = {
      A: { views: 0, clicks: 0, ctr: 0 },
      B: { views: 0, clicks: 0, ctr: 0 },
    };

    viewsData?.forEach((event: any) => {
      const v = event.properties?.variant;
      if (v === "A" || v === "B") stats[v as 'A' | 'B'].views++;
    });

    clicksData?.forEach((event: any) => {
      const v = event.properties?.button_variant;
      if (v === "A" || v === "B") stats[v as 'A' | 'B'].clicks++;
    });

    stats.A.ctr = stats.A.views > 0 ? (stats.A.clicks / stats.A.views) * 100 : 0;
    stats.B.ctr = stats.B.views > 0 ? (stats.B.clicks / stats.B.views) * 100 : 0;

    // Evaluate Victory (B breaking thresholds)
    let winner: 'A' | 'B' | null = null;
    let baselineCtr = 0;
    
    // We strictly check if B has broken the threshold to alert replacing the baseline.
    if (stats.B.views >= THRESHOLD_VIEWS && stats.B.ctr >= THRESHOLD_CTR && stats.B.ctr > stats.A.ctr) {
        winner = 'B';
        baselineCtr = stats.A.ctr;
    } else if (stats.A.views >= THRESHOLD_VIEWS && stats.A.ctr >= THRESHOLD_CTR && stats.A.ctr > stats.B.ctr) {
        // Technically A is baseline, but if it outperforms expectations heavily, we might want to know.
        winner = 'A';
        baselineCtr = stats.B.ctr; // comparison
    }

    if (!winner) {
        return NextResponse.json({ success: true, message: "Thresholds not met yet.", stats });
    }

    // 3. Prevent Spam (Check if we successfully alerted already)
    const alertSignature = `ab_test_alert_sent_${winner}_${stats[winner].views}`; // Unique enough to trigger maybe once every X views, but let's just make it purely: has it alerted for this Variant > Threshold at all?
    // Let's use flow_audit to record the fact
    const { data: auditLogs } = await supabaseAdmin
      .from('flow_audit')
      .select('id')
      .eq('action', 'ab_test_alert_sent')
      .eq('details->>variant', winner)
      // Check last 24h
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (auditLogs && auditLogs.length > 0) {
        return NextResponse.json({ success: true, message: `Already alerted for winning variant ${winner} recently.`, stats });
    }

    const insight = winner === 'B' 
        ? "الزر الأزرق القوي يثير الفضول والانتباه بشكل مدهش ويتجاوز النسخة المألوفة."
        : "المركز يستقر بشكل ممتاز؛ زر الدفع الكلاسيكي يحقق إقناعاً ومصداقية أعلى.";

    // 4. Send Telegram Alert!
    await telegramBot.notifyABTestThresholdBroken({
        testName: "Sanctuary Checkout Button Color",
        winningVariant: winner,
        views: stats[winner].views,
        clicks: stats[winner].clicks,
        ctr: stats[winner].ctr,
        baselineCtr,
        insight
    });

    // 5. Log it to prevent spam
    await supabaseAdmin
      .from('flow_audit')
      .insert({
          action: 'ab_test_alert_sent',
          session_id: 'system-cron',
          details: { variant: winner, stats: stats }
      });

    return NextResponse.json({ success: true, message: `Alert sent for variant ${winner}!`, stats });
  } catch (error: any) {
    console.error('[CRON / ab-test-monitor] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
