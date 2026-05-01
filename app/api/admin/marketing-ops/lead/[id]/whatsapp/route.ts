import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../../_lib/supabaseAdmin";

// GET /api/admin/marketing-ops/lead/[id]/whatsapp
// Fetches the whatsapp message events associated with a lead
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Missing supabase admin" }, { status: 500 });
    }


    // We can also fetch the lead to get its phone number and query by phone,
    // just in case of events without lead_id.
    const { data: lead } = await supabase
      .from("marketing_leads")
      .select("phone_normalized, metadata")
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

    return NextResponse.json({ 
      ok: true, 
      events: events || [],
      autopilotEnabled: lead?.metadata?.ai_autopilot === true
    });
  } catch (error: any) {
    console.error("[WhatsApp Chat API] Internal Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/marketing-ops/lead/[id]/whatsapp
// Sends a manual free-text message to the lead
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const body = await req.json();
    const { message, action, templateName } = body;

    const { WhatsAppCloudService } = await import("@/services/whatsappCloudService");
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Missing admin client" }, { status: 500 });
    }

    // 1. Get phone number and metadata
    const { data: lead } = await supabase
      .from("marketing_leads")
      .select("phone_normalized, name, campaign, metadata")
      .eq("id", leadId)
      .single();

    if (!lead?.phone_normalized) {
      return NextResponse.json({ ok: false, error: "Lead phone number not found" }, { status: 404 });
    }

    // --- Action: Send Template ---
    if (action === "send_template") {
      const tName = templateName || process.env.META_WA_HANDSHAKE_TEMPLATE || "alrehla_welcome_handshake";
      const result = await WhatsAppCloudService.sendTemplate(lead.phone_normalized, leadId, tName);
      
      if (!result.success) {
        return NextResponse.json({ 
          ok: false, 
          error: result.error?.message || "Meta API error",
          errorCode: result.error?.code 
        }, { status: 400 });
      }
      return NextResponse.json({ ok: true, messageId: result.message_id });
    }

    // --- Action: Toggle Auto Pilot ---
    if (action === "toggle_autopilot") {
      const { enable } = body;
      const currentMetadata = lead.metadata || {};
      const newMetadata = { ...currentMetadata, ai_autopilot: enable === true };
      
      const { error: updateError } = await supabase
        .from("marketing_leads")
        .update({ metadata: newMetadata })
        .eq("id", leadId);
        
      if (updateError) {
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }
      
      return NextResponse.json({ ok: true, autopilotEnabled: enable === true });
    }

    // --- Action: Draft AI Reply ---
    if (action === "draft_reply") {
      const { OracleService } = await import("@/services/oracleService");
      
      // Fetch recent events for context
      const { data: events } = await supabase
        .from("whatsapp_message_events")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true })
        .limit(20);
        
      const draftResult = await OracleService.draftWhatsAppReply(events || [], { 
        name: lead.name,
        campaign: lead.campaign 
      });

      return NextResponse.json({ ok: true, draftResult });
    }

    // --- Default: Send Free Text ---
    if (!message || !message.trim()) {
      return NextResponse.json({ ok: false, error: "Empty message" }, { status: 400 });
    }

    const result = await WhatsAppCloudService.sendFreeText(lead.phone_normalized, leadId, message);

    if (!result.success) {
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
