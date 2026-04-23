import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { data: leads, error } = await supabase
      .from("marketing_leads")
      .select("id, created_at, source, status");

    if (error) throw error;

    const totalLeads = leads.length;
    const conversions = leads.filter(l => ["activated", "proof_received", "payment_requested", "converted"].includes(l.status)).length;
    
    // Hardcoded total spend for now
    const spend = 5000;
    const cac = conversions > 0 ? spend / conversions : 0;
    const roas = conversions > 0 ? ((conversions * 1500) / spend) : 0;

    const kpis = {
      totalSpend: spend,
      totalSpendChange: 0,
      combinedCAC: cac,
      cacChange: 0,
      roas: roas,
      roasChange: 0,
      conversions: conversions,
      conversionsChange: 0,
      totalLeads: totalLeads,
    };

    // Platform Breakdown
    const platformStats: Record<string, any> = {};
    leads.forEach(l => {
      const source = (l.source || "organic").toLowerCase();
      const platform = source.includes("facebook") || source.includes("meta") || source.includes("fb") ? "fb" 
        : source.includes("google") ? "google" 
        : source.includes("tiktok") ? "tiktok" 
        : "organic";
        
      if (!platformStats[platform]) {
        platformStats[platform] = { platform, spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cac: 0, roas: 0, trend: 'stable' };
      }
      
      if (["activated", "proof_received", "payment_requested", "converted"].includes(l.status)) {
        platformStats[platform].conversions++;
      }
    });

    const platformBreakdown = Object.values(platformStats).map(p => {
        const estimatedSpend = p.platform === 'fb' ? spend * 0.8 : (p.platform === 'google' ? spend * 0.2 : 0);
        return {
            ...p,
            spend: estimatedSpend,
            cac: p.conversions > 0 ? estimatedSpend / p.conversions : 0,
            roas: p.conversions > 0 ? (p.conversions * 1500) / estimatedSpend : 0
        };
    });

    // Daily Performance
    const dailyStats: Record<string, any> = {};
    leads.forEach(l => {
        const date = l.created_at.split('T')[0];
        if (!dailyStats[date]) {
            dailyStats[date] = { date, spend: 0, conversions: 0, cac: 0, roas: 0 };
        }
        if (["activated", "proof_received", "payment_requested", "converted"].includes(l.status)) {
            dailyStats[date].conversions++;
        }
    });
    
    // Sort and calculate daily spend/cac
    const dailyPerformance = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)).map(d => {
        const estimatedSpend = spend / (Object.keys(dailyStats).length || 1);
        return {
            ...d,
            spend: estimatedSpend,
            cac: d.conversions > 0 ? estimatedSpend / d.conversions : 0,
            roas: d.conversions > 0 ? (d.conversions * 1500) / estimatedSpend : 0
        };
    }).slice(-14);

    return NextResponse.json({ ok: true, data: { kpis, platformBreakdown, dailyPerformance } });

  } catch (error: any) {
    console.error("[AdAnalytics API] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
