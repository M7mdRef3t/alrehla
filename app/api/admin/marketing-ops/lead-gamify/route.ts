import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function buildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  try {
    const { leadId, points } = await req.json();
    if (!leadId || typeof points !== 'number') {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const supabase = buildClient();

    // 1. Get current metadata
    const { data: lead, error: fetchError } = await supabase
      .from("marketing_leads")
      .select("metadata")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    // 2. Append points to gamification state
    const currentGamification = lead.metadata?.boarding_gamification || {};
    const newTotal = (currentGamification.awareness_points || 0) + points;
    
    const newMetadata = {
      ...(lead.metadata || {}),
      boarding_gamification: {
        ...currentGamification,
        awareness_points: newTotal,
        last_granted_at: new Date().toISOString()
      }
    };

    // 3. Save
    const { error: updateError } = await supabase
      .from("marketing_leads")
      .update({ metadata: newMetadata })
      .eq("id", leadId);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, newTotal });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
