import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

// ─── Resend Webhook Event types ────────────────────────────────────────────
interface ResendWebhookEvent {
  type:
    | "email.sent"
    | "email.delivered"
    | "email.opened"
    | "email.clicked"
    | "email.bounced"
    | "email.complained";
  data: {
    email_id: string;
    to: string[];
    subject?: string;
    click?: { link: string; url?: string };
    bounce?: { type?: string };
    webhook_id?: string;
  };
  created_at: string;
}

function buildClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

// Verify Resend webhook signature (optional but recommended)
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // Skip if not configured
  if (!signature) return false;

  const [, hash] = signature.split("=");
  const expected = createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("hex");

  return hash === expected;
}

// ─── Sovereign Mail Command: Status priority logic ─────────────────────────
const STATUS_PRIORITY: Record<string, number> = {
  queued: 0, sent: 1, delivered: 2, opened: 3, clicked: 4,
  bounced: 99, complained: 99, failed: 99,
};

const EVENT_TO_STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

function shouldUpgradeStatus(current: string, incoming: string): boolean {
  if (incoming === "bounced" || incoming === "complained") return true;
  return (STATUS_PRIORITY[incoming] ?? 0) > (STATUS_PRIORITY[current] ?? 0);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("svix-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = buildClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }

  const emailId = event.data?.email_id;
  const recipientEmail = event.data?.to?.[0];
  const eventTime = event.created_at ?? new Date().toISOString();

  if (!emailId) {
    return NextResponse.json({ ok: true, skipped: "no_email_id" });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1: Sovereign Mail Command — email_sends + email_events
  // ═══════════════════════════════════════════════════════════════════════════
  const newStatus = EVENT_TO_STATUS[event.type];

  if (newStatus) {
    const { data: emailSend } = await supabase
      .from("email_sends")
      .select("id, status")
      .eq("resend_id", emailId)
      .maybeSingle();

    if (emailSend) {
      // Insert event record
      await supabase.from("email_events").insert({
        email_send_id: emailSend.id,
        resend_event_id: event.data.webhook_id ?? null,
        event_type: newStatus,
        metadata: {
          raw_type: event.type,
          click_url: event.data.click?.url ?? event.data.click?.link ?? undefined,
          bounce_type: event.data.bounce?.type ?? undefined,
          timestamp: eventTime,
        },
      });

      // Upgrade status if applicable
      if (shouldUpgradeStatus(emailSend.status, newStatus)) {
        await supabase
          .from("email_sends")
          .update({ status: newStatus })
          .eq("id", emailSend.id);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2: Legacy — marketing_lead_outreach_queue (backward compatible)
  // ═══════════════════════════════════════════════════════════════════════════
  switch (event.type) {
    case "email.opened": {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ opened_at: eventTime })
        .eq("resend_message_id", emailId)
        .is("opened_at", null);
      break;
    }

    case "email.clicked": {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ clicked_at: eventTime })
        .eq("resend_message_id", emailId)
        .is("clicked_at", null);
      break;
    }

    case "email.bounced": {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ bounced: true, status: "failed", last_error: "email_bounced" })
        .eq("resend_message_id", emailId);

      if (recipientEmail) {
        await supabase
          .from("marketing_leads")
          .update({ unsubscribed: true, unsubscribed_at: eventTime })
          .eq("email", recipientEmail)
          .eq("unsubscribed", false);
      }
      break;
    }

    case "email.complained": {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ complained: true, status: "failed", last_error: "spam_complaint" })
        .eq("resend_message_id", emailId);

      if (recipientEmail) {
        await supabase
          .from("marketing_leads")
          .update({ unsubscribed: true, unsubscribed_at: eventTime })
          .eq("email", recipientEmail);
        await supabase
          .from("marketing_lead_outreach_queue")
          .update({ status: "cancelled" })
          .eq("lead_email", recipientEmail)
          .eq("status", "pending");
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ ok: true, type: event.type });
}
