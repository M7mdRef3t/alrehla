import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { OracleService } from "@/services/oracleService";

export const dynamic = "force-dynamic";

function buildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
}

// 👁️ GET — Oracle Overview & Stats
export async function GET() {
  const supabase = buildClient();
  
  // 1. Get stats of analyzed vs unanalyzed
  const { data: totalLeads } = await supabase.from("marketing_leads").select("id", { count: "exact", head: true });
  const { data: analyzedLeads } = await supabase
    .from("marketing_leads")
    .select("id", { count: "exact", head: true })
    .not("last_ai_analysis_at", "is", null);

  // 2. Get distribution by Grade
  const { data: grades } = await supabase.rpc("get_oracle_grade_distribution");
  
  // 3. Get recent "Strategic Insights" (Manual or AI generated)
  const { data: recentInsights } = await supabase
    .from("marketing_leads")
    .select("id, name, email, metadata, last_ai_analysis_at")
    .not("last_ai_analysis_at", "is", null)
    .order("last_ai_analysis_at", { ascending: false })
    .limit(5);

  // 4. Get Funnel Stats (Last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Total unique anonymous visitors
  const { data: uniqueVisitors } = await supabase
    .from("routing_events")
    .select("anonymous_id", { count: "exact", head: true })
    .gte("occurred_at", oneDayAgo);
    
  // Total leads generated
  const { data: newLeads } = await supabase
    .from("marketing_leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", oneDayAgo);

  return NextResponse.json({
    ok: true,
    stats: {
        total: totalLeads?.length || 0,
        analyzed: analyzedLeads?.length || 0,
        pending: (totalLeads?.length || 0) - (analyzedLeads?.length || 0),
        funnel: {
            visitors24h: uniqueVisitors?.length || 0,
            leads24h: newLeads?.length || 0,
            conversionRate: uniqueVisitors?.length ? ((newLeads?.length || 0) / uniqueVisitors.length) * 100 : 0
        }
    },
    distribution: grades || [],
    recentInsights
  });
}

// 🧠 POST — Trigger Batch Analysis
export async function POST(req: Request) {
  const { batchSize = 10 } = await req.json();
  const supabase = buildClient();

  // 1. Fetch leads that need analysis
  // Prioritize "Engaged" or "Converted" leads first for maximum impact
  const { data: leads, error: fetchError } = await supabase
    .from("marketing_leads")
    .select("*")
    .or("last_ai_analysis_at.is.null,last_ai_analysis_at.lt." + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("has_deep_converted", { ascending: false })
    .order("has_converted", { ascending: false })
    .limit(batchSize);

  if (fetchError || !leads || leads.length === 0) {
    return NextResponse.json({ ok: false, message: "No leads found for analysis" });
  }

  // 2. Run Oracle Analysis
  const results = await OracleService.analyzeLeadBatch(leads);

  // 3. Update Leads in Database
  const updates = leads.map(lead => {
    const verdict = results[lead.id];
    if (!verdict) return null;

    const metadata = {
        ...(lead.metadata || {}),
        oracle_grade: verdict.grade,
        oracle_intent: verdict.intent,
        oracle_reasoning: verdict.reasoning,
        oracle_recommended_action: verdict.recommendedAction,
        oracle_is_spam: verdict.isSpam
    };

    return {
        id: lead.id,
        metadata,
        last_ai_analysis_at: new Date().toISOString()
    };
  }).filter(Boolean);

  if (updates.length > 0) {
    const { error: updateError } = await supabase
        .from("marketing_leads")
        .upsert(updates as any);
    
    if (updateError) {
        console.error("Failed to update credits", updateError);
        return NextResponse.json({ ok: false, error: updateError.message });
    }
  }

  return NextResponse.json({
    ok: true,
    analyzedCount: updates.length,
    results
  });
}
