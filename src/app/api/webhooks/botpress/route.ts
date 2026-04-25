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

    // 1. Botpress Specific Extraction
    // userId often contains the phone number in Botpress WhatsApp integration
    const { userId, type, payload, conversationId } = body;

    if (type === "message" && userId) {
      console.log(`[WebhookInbound] Processing message from ${userId}: ${payload?.text}`);
      
      const { error: insertError } = await supabase.from("whatsapp_message_events").insert({
        from_phone: userId,
        to_phone: "botpress",
        message_body: payload?.text || "Media/Other",
        direction: "inbound",
        intent_detected: payload?.intent || "unknown",
        whatsapp_message_id: body.id || `bp_${Date.now()}`,
        raw_payload: body
      });

      if (insertError) {
        console.error("[WebhookInbound] Database insertion error:", insertError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WebhookInbound] Fatal error:", err);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
