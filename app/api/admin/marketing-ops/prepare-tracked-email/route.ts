import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import { verifyAppRouterAdmin } from "../../../../../server/admin/_shared";
import { injectOpenTracker, injectClickTracker } from "../../email/engine";
import { buildMarketingEmail } from "@/lib/marketing/emailTemplate";

export const dynamic = "force-dynamic";

function buildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
}

async function checkAuth(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET || process.env.MARKETING_DEBUG_KEY;
  const auth = req.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  return await verifyAppRouterAdmin(req);
}

/**
 * POST /api/admin/marketing-ops/prepare-tracked-email
 *
 * Prepares a fully tracked HTML email for manual Gmail sends.
 * 1. Creates/updates a queue row with a unique tracking UUID
 * 2. Builds the premium HTML template
 * 3. Injects open-tracking pixel + click-tracking wrappers
 * 4. Returns the tracked HTML for the client to copy to clipboard
 *
 * Input:  { leadId: string, name?: string, email: string }
 * Output: { ok: true, html: string, trackingId: string }
 */
export async function POST(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    leadId?: string;
    name?: string;
    email?: string;
  };

  const { leadId, name, email } = body;

  if (!leadId || !email) {
    return NextResponse.json({ ok: false, error: "leadId and email are required" }, { status: 400 });
  }

  const supabase = buildClient();
  const trackingId = uuid();
  const sentAt = new Date().toISOString();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.alrehla.app").replace(/\/$/, "");
  const personalLink = `${appUrl}/go/${leadId}`;

  // ── 1. Upsert queue row with tracking ID ────────────────────────────────
  const { data: existingQueue } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("id")
    .eq("lead_id", leadId)
    .eq("channel", "email")
    .maybeSingle();

  if (existingQueue) {
    await supabase
      .from("marketing_lead_outreach_queue")
      .update({
        status: "sent",
        sent_at: sentAt,
        last_error: "MANUAL_GMAIL_TRACKED",
        resend_message_id: trackingId,
        lead_email: email.toLowerCase().trim(),
      })
      .eq("id", existingQueue.id);
  } else {
    await supabase
      .from("marketing_lead_outreach_queue")
      .insert({
        lead_id: leadId,
        lead_email: email.toLowerCase().trim(),
        channel: "email",
        status: "sent",
        sent_at: sentAt,
        last_error: "MANUAL_GMAIL_TRACKED",
        resend_message_id: trackingId,
      });
  }

  // ── 2. Update marketing_leads status ────────────────────────────────────
  await supabase
    .from("marketing_leads")
    .update({
      status: "engaged",
      email_status: "sent",
      last_contacted_at: sentAt,
    })
    .eq("id", leadId);

  // ── 3. Build HTML with tracking injected ────────────────────────────────
  let html = buildMarketingEmail({ name: name || undefined, personalLink });

  // Inject open-tracking pixel (invisible 1x1 GIF)
  html = injectOpenTracker(html, trackingId);

  // Wrap all links with click-tracking redirects
  html = injectClickTracker(html, trackingId);

  console.log(`[PrepareTrackedEmail] ✅ Prepared tracked email for ${email} | TrackingID: ${trackingId}`);

  return NextResponse.json({
    ok: true,
    html,
    trackingId,
    personalLink,
  });
}
