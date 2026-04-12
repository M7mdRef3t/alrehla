import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * GET /api/email/track
 *
 * Universal email tracking endpoint — handles both:
 *   1. Automated sends (via engine.ts → email_sends table)
 *   2. Manual Gmail sends (via prepare-tracked-email → marketing_lead_outreach_queue)
 *
 * Query params:
 *   t    = "open" | "click"
 *   id   = tracking UUID (stored as email_sends.id or queue.resend_message_id)
 *   url  = (for clicks) the original URL to redirect to
 *
 * For opens:  Returns a 1x1 transparent GIF (tracking pixel)
 * For clicks: Records the click then 302-redirects to the original URL
 */

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function buildAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const STATUS_PRIORITY: Record<string, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  bounced: 10,
  complained: 10,
  failed: 10,
};

/**
 * Updates the marketing_lead_outreach_queue row (manual Gmail tracking)
 * and the marketing_leads.email_status field.
 */
async function updateQueueTracking(
  supabase: ReturnType<typeof buildAdmin>,
  trackingId: string,
  eventType: "opened" | "clicked"
) {
  const now = new Date().toISOString();

  // Find queue row by resend_message_id = trackingId
  const { data: queueRow } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("id, lead_id, lead_email, opened_at, clicked_at")
    .eq("resend_message_id", trackingId)
    .maybeSingle();

  if (!queueRow) return;

  // Update queue row
  const queueUpdate: Record<string, unknown> = {};
  if (eventType === "opened" && !queueRow.opened_at) {
    queueUpdate.opened_at = now;
  }
  if (eventType === "clicked" && !queueRow.clicked_at) {
    queueUpdate.clicked_at = now;
    // Click implies open
    if (!queueRow.opened_at) {
      queueUpdate.opened_at = now;
    }
  }

  if (Object.keys(queueUpdate).length > 0) {
    await supabase
      .from("marketing_lead_outreach_queue")
      .update(queueUpdate)
      .eq("id", queueRow.id);
  }

  // Update marketing_leads email_status
  const newStatus = eventType === "clicked" ? "clicked" : "opened";
  if (queueRow.lead_id) {
    // Only upgrade status, never downgrade
    const { data: lead } = await supabase
      .from("marketing_leads")
      .select("email_status")
      .eq("id", queueRow.lead_id)
      .maybeSingle();

    const currentPriority = STATUS_PRIORITY[lead?.email_status || "none"] ?? -1;
    const newPriority = STATUS_PRIORITY[newStatus] ?? 0;

    if (newPriority > currentPriority) {
      await supabase
        .from("marketing_leads")
        .update({ email_status: newStatus })
        .eq("id", queueRow.lead_id);
    }
  }

  console.log(`[EmailTrack] ✅ Queue tracking updated: ${eventType} for ${queueRow.lead_email} (trackingId: ${trackingId})`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("t");
  const trackingId = searchParams.get("id");
  const redirectUrl = searchParams.get("url");

  if (!trackingId || !type) {
    // Still return pixel to avoid broken images
    return new NextResponse(TRANSPARENT_GIF, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }

  const supabase = buildAdmin();

  try {
    // ── Handle OPEN tracking ──────────────────────────────────────────────
    if (type === "open") {
      try {
        await supabase.from("email_events").insert({
          email_send_id: trackingId,
          event_type: "opened",
          metadata: {
            tracked_at: new Date().toISOString(),
            user_agent: req.headers.get("user-agent") || "unknown",
            ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          },
        });
      } catch {
        // Silently ignore if table doesn't exist
      }

      // Update email_sends status (only upgrade, never downgrade) — for automated sends
      const { data: current } = await supabase
        .from("email_sends")
        .select("status")
        .eq("id", trackingId)
        .maybeSingle();

      if (current && (STATUS_PRIORITY[current.status] || 0) < (STATUS_PRIORITY["opened"] || 0)) {
        await supabase
          .from("email_sends")
          .update({ status: "opened", updated_at: new Date().toISOString() })
          .eq("id", trackingId);
      }

      // ── Manual Gmail tracking: update queue + marketing_leads ──────────
      await updateQueueTracking(supabase, trackingId, "opened");

      // Return tracking pixel
      return new NextResponse(TRANSPARENT_GIF, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Expires": "0",
          "Pragma": "no-cache",
        },
      });
    }

    // ── Handle CLICK tracking ─────────────────────────────────────────────
    if (type === "click" && redirectUrl) {
      const decodedUrl = decodeURIComponent(redirectUrl);

      try {
        await supabase.from("email_events").insert({
          email_send_id: trackingId,
          event_type: "clicked",
          metadata: {
            click_url: decodedUrl,
            tracked_at: new Date().toISOString(),
            user_agent: req.headers.get("user-agent") || "unknown",
            ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          },
        });
      } catch {
        // Silently ignore if table doesn't exist
      }

      // Update email_sends status — for automated sends
      const { data: current } = await supabase
        .from("email_sends")
        .select("status")
        .eq("id", trackingId)
        .maybeSingle();

      if (current && (STATUS_PRIORITY[current.status] || 0) < (STATUS_PRIORITY["clicked"] || 0)) {
        await supabase
          .from("email_sends")
          .update({ status: "clicked", updated_at: new Date().toISOString() })
          .eq("id", trackingId);
      }

      // ── Manual Gmail tracking: update queue + marketing_leads ──────────
      await updateQueueTracking(supabase, trackingId, "clicked");

      // Redirect to original URL
      return NextResponse.redirect(decodedUrl, 302);
    }
  } catch (err) {
    console.error("[EmailTrack] Error:", err);
  }

  // Fallback — return pixel
  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}
