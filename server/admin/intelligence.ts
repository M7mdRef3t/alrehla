import { createClient } from "@supabase/supabase-js";
import { OracleService } from "../../src/services/oracleService";

const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 Minutes

function buildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
}

export async function handleOraclePulse(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const supabase = buildClient();

  try {
    const now = Date.now();
    
    // 0. Rate Limiting + Cache Recovery
    const { data: systemMeta } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["oracle_last_pulse", "oracle_last_insights", "oracle_last_stats"]);

    const lastPulseTime = systemMeta?.find(m => m.key === 'oracle_last_pulse')?.value;
    const lastCachedInsights = systemMeta?.find(m => m.key === 'oracle_last_insights')?.value;
    const lastCachedStats = systemMeta?.find(m => m.key === 'oracle_last_stats')?.value;

    if (lastPulseTime) {
        const lastPulseDate = new Date(String(lastPulseTime)).getTime();
        if (now - lastPulseDate < RATE_LIMIT_COOLDOWN_MS) {
            const remainingMs = RATE_LIMIT_COOLDOWN_MS - (now - lastPulseDate);
            
            // Premium UX: Return cached insights & stats even during cooldown
            return res.status(429).json({ 
                ok: false, 
                error: "Cooldown active", 
                retryAfterSec: Math.ceil(remainingMs / 1000),
                insights: typeof lastCachedInsights === 'string' ? JSON.parse(lastCachedInsights) : lastCachedInsights,
                stats: typeof lastCachedStats === 'string' ? JSON.parse(lastCachedStats) : lastCachedStats,
                isCached: true
            });
        }
    }

    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Recent Breakthroughs (Truth Vault)
    const { data: truths } = await supabase
      .from("truth_vault")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    // 2. Behavioral Friction (Aggregating Time Spent in Illusions)
    const { data: outcomeEvents } = await supabase
      .from("routing_events")
      .select("payload")
      .eq("event_type", "outcome_reported")
      .gte("occurred_at", sevenDaysAgo)
      .limit(200);

    const frictionStats: Record<string, { totalTime: number; count: number }> = {};
    outcomeEvents?.forEach((e: any) => {
        const telemetry = e.payload?.telemetry;
        const segmentKey = e.payload?.segmentKey || "unknown";
        const latency = Number(telemetry?.completionLatencySec);
        
        if (Number.isFinite(latency) && latency > 0) {
            if (!frictionStats[segmentKey]) frictionStats[segmentKey] = { totalTime: 0, count: 0 };
            frictionStats[segmentKey].totalTime += latency;
            frictionStats[segmentKey].count += 1;
        }
    });

    const behavioralFriction = Object.entries(frictionStats).map(([key, stat]) => ({
        scenario: key,
        avgTimeSec: Math.round(stat.totalTime / stat.count),
        sampleSize: stat.count
    })).sort((a, b) => b.avgTimeSec - a.avgTimeSec);

    // 3. Event Pulse (Routing Context)
    const { data: rawEvents } = await supabase
      .from("routing_events")
      .select("event_type")
      .gte("occurred_at", oneDayAgo);
    
    const eventCounts: Record<string, number> = {};
    rawEvents?.forEach((e: any) => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
    });

    // 4. Active Now Estimate
    const { data: pulseStats } = await supabase.rpc('get_live_pulse_stats');
    const activeNow = pulseStats?.[0]?.active_now_estimate || 0;

    // 5. AI Generation
    const insights = await OracleService.generateSovereignInsights({
        recentTruths: truths || [],
        eventCounts,
        activeNow,
        behavioralFriction
    });

    // 6. Update Cooldown + Cache Insights & Stats
    const finalStats = {
        activeNow,
        breakthroughs24h: truths?.length || 0,
        events24h: Object.values(eventCounts).reduce((a, b) => a + b, 0),
        behavioralFriction
    };

    await Promise.all([
        supabase.from("system_settings").upsert({
            key: "oracle_last_pulse",
            value: new Date().toISOString()
        }, { onConflict: "key" }),
        supabase.from("system_settings").upsert({
            key: "oracle_last_insights",
            value: JSON.stringify(insights)
        }, { onConflict: "key" }),
        supabase.from("system_settings").upsert({
            key: "oracle_last_stats",
            value: JSON.stringify(finalStats)
        }, { onConflict: "key" })
    ]);

    return res.status(200).json({
      ok: true,
      insights,
      stats: finalStats
    });

  } catch (error: any) {
    console.error("[Oracle Pulse Error]:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
