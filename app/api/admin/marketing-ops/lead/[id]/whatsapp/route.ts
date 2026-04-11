import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../../_lib/supabaseAdmin";

// GET /api/admin/marketing-ops/lead/[id]/whatsapp
// Fetches the whatsapp message events associated with a lead
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Missing supabase admin" }, { status: 500 });
    }

    const leadId = params.id;

    // We can also fetch the lead to get its phone number and query by phone,
    // just in case of events without lead_id.
    const { data: lead } = await supabase
      .from("marketing_leads")
      .select("phone_normalized")
      .eq("id", leadId)
      .single();

    let query = supabase
      .from("whatsapp_message_events")
      .select("*")
      .order("created_at", { ascending: true }); // Chronological order

    if (lead?.phone_normalized) {
      query = query.or(`lead_id.eq.${leadId},from_phone.eq.${lead.phone_normalized},to_phone.eq.${lead.phone_normalized}`);
    } else {
      query = query.eq("lead_id", leadId);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("[WhatsApp Chat API] Error fetching events:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, events: events || [] });
  } catch (error: any) {
    console.error("[WhatsApp Chat API] Internal Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/marketing-ops/lead/[id]/whatsapp
// Sends a manual free-text message to the lead
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { message } = body;
    const leadId = params.id;

    if (!message || !message.trim()) {
      return NextResponse.json({ ok: false, error: "Empty message" }, { status: 400 });
    }

    const { WhatsAppCloudService } = await import("@/services/whatsappCloudService");
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Missing admin client" }, { status: 500 });
    }

    // 1. Get phone number
    const { data: lead } = await supabase
      .from("marketing_leads")
      .select("phone_normalized")
      .eq("id", leadId)
      .single();

    if (!lead?.phone_normalized) {
      return NextResponse.json({ ok: false, error: "Lead phone number not found" }, { status: 404 });
    }

    // 2. Send via Meta API
    const result = await WhatsAppCloudService.sendFreeText(lead.phone_normalized, leadId, message);

    if (!result.success) {
      // If Meta returns error 131047, it means the 24h window is closed
      const isWindowClosed = result.error?.code === 131047;
      return NextResponse.json({ 
        ok: false, 
        error: result.error?.message || "Meta API error",
        errorCode: result.error?.code,
        isWindowClosed 
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true, messageId: result.message_id });
  } catch (error: any) {
    console.error("[WhatsApp Send API] Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
