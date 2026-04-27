import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

/**
 * Meta WhatsApp Webhook
 * Handles Challenge verification (GET) and status updates (POST).
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const isTokenValid = token === process.env.META_WA_VERIFY_TOKEN || token === "alrehla_handshake";

  if (mode && token) {
    if (mode === "subscribe" && isTokenValid) {
      console.log("[WhatsAppWebhook] Webhook verified successfully.");
      return new Response(challenge, { status: 200 });
    } else {
      console.warn("[WhatsAppWebhook] Verification failed. Got:", token);
      return new Response("Forbidden", { status: 403 });
    }
  }
  return new Response("Not Found", { status: 404 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }

  // Meta sends statuses for delivery tracking
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  
  const statuses = value?.statuses;
  const messages = value?.messages;

  // 1. Handle Status Updates (Delivered, Read, Failed)
  if (statuses && statuses.length > 0) {
    for (const status of statuses) {
      const recipientId = status.recipient_id;
      const statusType = status.status; // delivered, read, failed

      if (statusType === "delivered" || statusType === "read") {
        const phoneNormalized = `+${recipientId.replace(/\D/g, "")}`;
        
        const { data: leads } = await supabaseAdmin
          .from("marketing_leads")
          .select("lead_id, metadata")
          .eq("phone_normalized", phoneNormalized)
          .order("created_at", { ascending: false })
          .limit(1);

        if (leads && leads.length > 0) {
          const lead = leads[0];
          const updatedMetadata = {
            ...(lead.metadata || {}),
            whatsapp_status: "verified",
            whatsapp_delivery_id: status.id,
            whatsapp_validated_at: new Date().toISOString()
          };

          const { error: updateError } = await supabaseAdmin
            .from("marketing_leads")
            .update({ metadata: updatedMetadata })
            .eq("lead_id", lead.lead_id);

          if (updateError) {
            console.error("[WhatsAppWebhook] Failed updating lead metadata:", updateError);
          }

          console.log(`[WhatsAppWebhook] Lead ${lead.lead_id} marked as verified (Phone: ${recipientId})`);
        }
      } else if (statusType === "failed") {
        console.error(`[WhatsAppWebhook] Delivery failed for ${recipientId}:`, status.errors);
      }
    }
  }

  // 2. Handle Inbound Messages
  if (messages && messages.length > 0) {
    const { whatsappAutomationService } = await import("../../../../src/services/whatsappAutomationService");

    for (const msg of messages) {
      const fromPhoneRaw = msg.from;
      const messageBody = msg.text?.body || msg.interactive?.button_reply?.title || msg.button?.text || "";
      const senderName = value?.contacts?.[0]?.profile?.name || "";

      const hasImage = msg.type === "image" && msg.image?.id;

      const payload = {
        from: fromPhoneRaw,
        name: senderName,
        text: messageBody,
        timestamp: msg.timestamp || new Date().getTime().toString(),
        messageId: msg.id,
        hasImage: !!hasImage,
        imageId: hasImage ? msg.image.id : undefined,
        metadata: {
          raw: msg
        },
        gateway: 'meta' as const
      };

      console.log(`[WhatsAppWebhook] Delegating message from ${fromPhoneRaw} to automation service`);
      await whatsappAutomationService.processInboundMessage(payload);
    }
  }

  return NextResponse.json({ ok: true });
}
