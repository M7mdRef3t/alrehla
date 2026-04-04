import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Resend Webhook Handler  — /api/marketing/webhook/resend
 * Verifies HMAC-SHA256 signature then syncs events to Supabase.
 * Set RESEND_WEBHOOK_SECRET in your env to enable signature verification.
 */

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // skip if secret not configured
  const signature = req.headers.get("svix-signature") ?? req.headers.get("resend-signature");
  if (!signature) return false;

  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  try {
    // Support both "v1,<hex>" format and bare hex
    const raw = signature.replace(/^v\d+,/, "");
    return timingSafeEqual(Buffer.from(expected), Buffer.from(raw, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // ── Signature Verification ─────────────────────────────────────────────────
    if (WEBHOOK_SECRET) {
      const valid = await verifySignature(req, rawBody);
      if (!valid) {
        console.warn("[Resend Webhook] Invalid signature — rejected");
        return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const { type, data, created_at } = body;

    if (!type || !data || !data.email_id) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const resendMsgId = data.email_id as string;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    console.warn(`[Resend Webhook] ✓ Event: ${type} | MsgId: ${resendMsgId}`);

    // ── Update Outreach Queue ──────────────────────────────────────────────────
    if (type === "email.opened") {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ opened_at: created_at || new Date().toISOString() })
        .eq("resend_message_id", resendMsgId)
        .is("opened_at", null);

    } else if (type === "email.clicked") {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ clicked_at: created_at || new Date().toISOString() })
        .eq("resend_message_id", resendMsgId)
        .is("clicked_at", null);

    } else if (type === "email.bounced") {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ bounced: true, last_error: "resend_bounced" })
        .eq("resend_message_id", resendMsgId);

    } else if (type === "email.complained") {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ complained: true, last_error: "resend_complaint" })
        .eq("resend_message_id", resendMsgId);

    } else if (type === "email.unsubscribed") {
      // ── Unsubscribe: update lead directly ───────────────────────────────────
      const { data: queueRow } = await supabase
        .from("marketing_lead_outreach_queue")
        .select("lead_email, lead_id")
        .eq("resend_message_id", resendMsgId)
        .maybeSingle();

      const email = (data.to as string[] | undefined)?.[0] ?? queueRow?.lead_email;
      if (email) {
        await supabase
          .from("marketing_leads")
          .update({
            unsubscribed: true,
            unsubscribed_at: created_at || new Date().toISOString(),
          })
          .eq("email", email);

        await supabase
          .from("marketing_lead_outreach_queue")
          .update({ status: "cancelled" })
          .eq("lead_email", email)
          .eq("status", "pending");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Resend Webhook Error]", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
