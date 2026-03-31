import { NextResponse } from "next/server";
import { WhatsAppAutomationService, type WhatsAppWebhookPayload } from "@/services/whatsappAutomationService";

export const runtime = "edge"; // Edge function for fast webhook response

/**
 * ============================================================================
 * GET: Webhook Verification (Specifically for Meta Cloud API)
 * ============================================================================
 * Meta requires a GET request to verify the endpoint when you first configure it.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_SECRET || "alrehla_whatsapp_secret_2024";

  if (mode && token) {
    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
      console.log("[WhatsApp Webhook] Verification successful.");
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.warn("[WhatsApp Webhook] Verification failed. Token mismatch.");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ message: "WhatsApp Webhook Endpoint is active." }, { status: 200 });
}

/**
 * ============================================================================
 * POST: Receive Incoming Messages
 * ============================================================================
 * Receives messages from WhatsApp (Meta, UltraMsg, etc.) and processes them.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!rawBody) return NextResponse.json({ error: "Empty body" }, { status: 400 });

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // --- META CLOUD API PARSER ---
    if (body.object === "whatsapp_business_account" && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages && value.messages.length > 0) {
            const message = value.messages[0];
            const contact = value.contacts?.[0];
            
            // Only process text messages for now in Auto-Reply V1
            if (message.type === "text") {
              const payload: WhatsAppWebhookPayload = {
                message_id: message.id,
                from: message.from,
                to: value.metadata?.display_phone_number || "unknown", // Our business number
                body: message.text?.body || "",
                type: message.type,
                timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                raw: body,
              };

              // Async processing: Do NOT `await` to return 200 OK immediately to WhatsApp
              // Meta expects a 2xx response within 20 seconds, edge functions shouldn't block.
              // We use Context.waitUntil in a real Edge deployment, or just fire-and-forget here.
              Promise.resolve(WhatsAppAutomationService.handleInboundMessage(payload)).catch(err => {
                console.error("[WhatsApp Webhook] Background processing error:", err);
              });
            }
          }
        }
      }
      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    // --- ULTRAMSG / GENERIC PARSER (Fallback) ---
    // If it's a direct message payload (e.g. UltraMsg `eventTrigger === "message_received"`)
    if (body.event_type === "message_received" || body.id || body.body) {
       const payload: WhatsAppWebhookPayload = {
          message_id: body.id || `msg_${Date.now()}`,
          from: body.from || body.sender || "unknown",
          to: body.to || body.receiver || "unknown",
          body: body.body || "",
          type: body.type || "text",
          timestamp: new Date().toISOString(),
          raw: body,
       };

       Promise.resolve(WhatsAppAutomationService.handleInboundMessage(payload)).catch(err => {
         console.error("[WhatsApp Webhook] Generic Background processing error:", err);
       });
       
       return NextResponse.json({ status: "success" }, { status: 200 });
    }

    // Unknown provider format
    console.warn("[WhatsApp Webhook] Unrecognized payload format:", JSON.stringify(body).slice(0, 200));
    return NextResponse.json({ status: "ignored", reason: "unsupported_format" }, { status: 200 });

  } catch (error) {
    console.error("[WhatsApp Webhook] Fatal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
