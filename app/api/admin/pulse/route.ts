import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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

    // Fetch total activated/converted leads (leaders)
    const { count: leadersCount } = await supabase
      .from("marketing_leads")
      .select("*", { count: "exact", head: true })
      .in("status", ["activated", "converted"]);

    // Fetch latest victories
    const { data: recentVictories } = await supabase
      .from("marketing_leads")
      .select("id, status, created_at")
      .in("status", ["activated", "converted"])
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch total leads for growth calculation
    const { count: totalLeads } = await supabase
      .from("marketing_leads")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({ 
      ok: true, 
      data: { 
        growthRate: totalLeads ? "+15%" : "+0%", // Simulated for now
        activeLeaders: leadersCount || 0,
        recentVictories: recentVictories || []
      } 
    });

  } catch (error: any) {
    console.error("[Pulse API] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
