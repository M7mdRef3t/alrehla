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
    click?: { link: string };
  };
  created_at: string;
}

function buildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
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
  const emailId = event.data?.email_id;
  const recipientEmail = event.data?.to?.[0];
  const eventTime = event.created_at ?? new Date().toISOString();

  if (!emailId) {
    return NextResponse.json({ ok: true, skipped: "no_email_id" });
  }

  // ─── Handle each event type ───────────────────────────────────────────────
  switch (event.type) {
    case "email.opened": {
      // Update the queue row that matches this resend_message_id
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ opened_at: eventTime })
        .eq("resend_message_id", emailId)
        .is("opened_at", null); // Only set the first open
      break;
    }

    case "email.clicked": {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ clicked_at: eventTime })
        .eq("resend_message_id", emailId)
        .is("clicked_at", null); // Only set the first click
      break;
    }

    case "email.bounced": {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ bounced: true, status: "failed", last_error: "email_bounced" })
        .eq("resend_message_id", emailId);

      // Mark as unsubscribed-equivalent to stop future sends
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
      // Spam complaint — must unsubscribe immediately
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ complained: true, status: "failed", last_error: "spam_complaint" })
        .eq("resend_message_id", emailId);

      if (recipientEmail) {
        await supabase
          .from("marketing_leads")
          .update({ unsubscribed: true, unsubscribed_at: eventTime })
          .eq("email", recipientEmail);
        // Cancel all pending outreach for this person
        await supabase
          .from("marketing_lead_outreach_queue")
          .update({ status: "cancelled" })
          .eq("lead_email", recipientEmail)
          .eq("status", "pending");
      }
      break;
    }

    default:
      // email.sent, email.delivered — no action needed in DB
      break;
  }

  return NextResponse.json({ ok: true, type: event.type });
}
