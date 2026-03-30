import { NextResponse } from "next/server";
import { WhatsAppAutomationService, type WhatsAppWebhookPayload } from "@/services/whatsappAutomationService";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verification Layer (Optional security check)
    // In a real scenario, you'd check a signature or a secret token from the gateway
    const authHeader = req.headers.get("Authorization");
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.warn("[WhatsAppWebhook] Unauthorized access attempt");
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Transform raw gateway payload to our internal format
    // This depends on the gateway provider (e.g., UltraMsg, Twilio, or custom)
    // Assuming a standard format for this implementation:
    const payload: WhatsAppWebhookPayload = {
      message_id: body.id || body.messageId || `msg_${Date.now()}`,
      from: body.from || body.sender || "",
      to: body.to || body.receiver || "",
      body: body.body || body.text || "",
      type: body.type || "text",
      timestamp: body.timestamp || new Date().toISOString(),
      raw: body
    };

    if (!payload.from) {
      return NextResponse.json({ ok: false, error: "missing_sender" }, { status: 400 });
    }

    // Process asynchronously so we can return 200 OK immediately to the gateway
    // This prevents timeouts if the processing (CRM sync) takes too long.
    void WhatsAppAutomationService.handleInboundMessage(payload).catch((err: unknown) => {
      console.error("[WhatsAppWebhook] Async processing error:", err);
    });

    return NextResponse.json({ ok: true, message: "received" });
  } catch (error) {
    console.error("[WhatsAppWebhook] Route error:", error);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

/**
 * Handle GET for webhook verification (some providers like Meta/Facebook require this)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsAppWebhook] Webhook verified successfully");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: false, error: "verification_failed" }, { status: 403 });
}
