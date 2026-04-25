import { NextRequest, NextResponse } from "next/server";
import { WhatsAppCloudService } from "@/services/whatsappCloudService";

/**
 * Botpress Reply Webhook
 * Receives the AI-generated responses from Botpress (via a Webhook Action in the Botpress Flow)
 * and forwards them to the user via Meta's WhatsApp Cloud API.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.BOTPRESS_WEBHOOK_SECRET || "alrehla_handshake";

    // Optional: Add basic security so only our Botpress bot can call this route
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn("[BotpressReply] Unauthorized attempt to send message.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, text, leadId } = body;

    if (!phone || !text) {
      console.error("[BotpressReply] Missing phone or text in payload:", body);
      return NextResponse.json({ error: "Bad Request: missing phone or text" }, { status: 400 });
    }

    console.log(`[BotpressReply] Forwarding AI response to ${phone}: ${text.substring(0, 50)}...`);

    // We pass a generic leadId if one is not provided. 
    // In a real scenario, Botpress should pass the leadId back, or we look it up by phone.
    const targetLeadId = leadId || `sys_${Date.now()}`;

    const result = await WhatsAppCloudService.sendFreeText(phone, targetLeadId, text);

    if (!result.success) {
      console.error("[BotpressReply] Failed to send via WhatsApp:", result.error);
      return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 502 });
    }

    console.log("[BotpressReply] Message sent successfully.");
    return NextResponse.json({ ok: true, messageId: result.message_id });

  } catch (error) {
    console.error("[BotpressReply] Fatal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
