import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/services/supabaseClient";

/**
 * Botpress/Meta Webhook Endpoint
 * Receives events from Botpress Cloud or Meta directly.
 * Handles GET for handshake verification and POST for message processing.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("[WebhookHandshake] Attempting verification:", { mode, token });

  // Verify the token matches (using BOTPRESS_WEBHOOK_SECRET as a generic verify token if not specified)
  const verifyToken = process.env.BOTPRESS_WEBHOOK_SECRET || "alrehla_handshake";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WebhookHandshake] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WebhookHandshake] Verification failed. Expected:", verifyToken, "Got:", token);
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[WebhookInbound] Received payload:", JSON.stringify(body, null, 2));

    const supabase = supabaseAdmin;
    if (!supabase) {
      console.error("[WebhookInbound] Supabase admin not initialized");
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    // 1. Meta WhatsApp Payload Extraction
    if (body.object === "whatsapp_business_account" && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          if (value && value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const fromPhone = message.from;
              const messageId = message.id;
              const text = message.type === "text" ? message.text?.body : `[Media: ${message.type}]`;
              
              console.log(`[WebhookInbound] Processing message from ${fromPhone}: ${text}`);
              
              // A. Save to Sovereign CRM
              const { error: insertError } = await supabase.from("whatsapp_message_events").insert({
                from_phone: fromPhone,
                to_phone: "system",
                message_body: text || "",
                direction: "inbound",
                intent_detected: "pending_analysis",
                whatsapp_message_id: messageId,
                raw_payload: body
              });

              if (insertError) {
                console.error("[WebhookInbound] Database insertion error:", insertError);
              }

              // B. Forward to Botpress for AI Processing
              // We import BotpressService dynamically to avoid edge runtime issues if it has Node.js deps
              const { BotpressService } = await import("@/services/botpressService");
              await BotpressService.sendMessage({
                userId: fromPhone,
                text: text || "Media Message",
                metadata: { source: "whatsapp", messageId }
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WebhookInbound] Fatal error:", err);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
