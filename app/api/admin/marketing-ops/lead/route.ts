import { NextResponse } from "next/server";
import { buildClient } from "../../../../../src/utils/supabase/adminService";
import { authenticateGlobalRoute } from "../../../../../src/server/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const auth = await authenticateGlobalRoute(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, phone_normalized, email, source_type, campaign } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_lead_id" }, { status: 400 });
    }

    const supabase = buildClient();
    
    const { error } = await supabase
      .from("marketing_leads")
      .update({
        name,
        phone_normalized,
        email,
        source_type,
        campaign,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("[marketing-ops/lead] Update error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[marketing-ops/lead] Unexpected error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await authenticateGlobalRoute(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, action } = body;

    if (action === "resend_email") {
      if (!email) {
        return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
      }

      const supabase = buildClient();
      
      // Update existing queue entry for this email or insert a new one
      const { data: existing } = await supabase
        .from("marketing_lead_outreach_queue")
        .select("id")
        .eq("lead_email", email)
        .eq("channel", "email")
        .maybeSingle();

      if (existing) {
        // Reset the queue to pending
        await supabase
          .from("marketing_lead_outreach_queue")
          .update({
            status: "pending",
            opened_at: null,
            clicked_at: null,
            bounced: false,
            complained: false,
            last_error: null,
            attempts: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Create new outreach queue item
        await supabase
          .from("marketing_lead_outreach_queue")
          .insert({
            lead_email: email,
            channel: "email",
            status: "pending",
            step: "initial",
            attempts: 0
          });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (error: any) {
    console.error("[marketing-ops/lead] Resend error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
