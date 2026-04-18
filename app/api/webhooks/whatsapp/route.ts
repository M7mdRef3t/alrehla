import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

/**
 * WhatsApp Meta Webhook 📲
 * =======================
 * GET: Verification for Meta configuration.
 * POST: Receiving messages and status updates.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "alrehla_sovereign_2026";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification Successful.");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Log the event for reliability/debugging
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from("whatsapp_message_events").insert([{
        direction: "inbound",
        raw_payload: body
      }]);
    }

    // 2. Triage Payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value || !value.messages) {
      return NextResponse.json({ ok: true }); // Acknowledge status updates
    }

    const message = value.messages[0];
    const from = message.from; // Sender's phone
    const text = message.text?.body?.trim();

    if (!text) return NextResponse.json({ ok: true });

    console.log(`[WhatsApp Webhook] Incoming from ${from}: ${text}`);

    // 3. Logic: Check for Activation (Pattern Match)
    // Looking for receipt numbers or standard VC patterns
    const receiptMatch = text.match(/\d{10,}/); // Simple heuristic for receipt numbers
    if (receiptMatch) {
       const receiptNumber = receiptMatch[0];
       await handleAutoActivation(from, receiptNumber);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WhatsApp Webhook Error]:", err);
    return NextResponse.json({ error: "internal_failure" }, { status: 500 });
  }
}

async function handleAutoActivation(phone: string, receipt: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  // 1. Find user by phone (Normalization)
  let searchPhone = phone;
  if (searchPhone.startsWith("20")) searchPhone = "0" + searchPhone.slice(2); // +201... -> 01...

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .or(`phone.eq.${phone},phone.eq.${searchPhone}`)
    .single();

  if (!profile) {
    console.log(`[WhatsApp Auth] No profile found for ${phone}`);
    return;
  }

  // 2. Trigger Activation Engine
  const { data: result, error } = await supabase.rpc("activate_founding_cohort_seat", {
    p_user_id: profile.id,
    p_provider: "whatsapp_auto",
    p_payment_ref: receipt
  });

  if (error) {
    console.error("[WhatsApp Auth] RPC Failed:", error);
    return;
  }

  // 3. Notify Success back to WhatsApp
  if (result?.activated) {
     const { WhatsAppCloudService } = await import("@/services/whatsappCloudService");
     const msg = `تم تفعيل رحلتك بنجاح يا ${profile.full_name}! 🌊✨\nأهلاً بك في الفوج التأسيسي. يمكنك الآن الدخول للمنصة واستكشاف خريطتك.`;
     await WhatsAppCloudService.sendFreeText(phone, profile.id, msg);
  }
}
