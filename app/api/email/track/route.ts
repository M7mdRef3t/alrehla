import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * GET /api/email/track
 *
 * Internal email tracking — replaces Resend webhooks entirely.
 *
 * Query params:
 *   t    = "open" | "click"
 *   id   = email_sends tracking ID
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
      // Record the open event
      await supabase.from("email_events").insert({
        email_send_id: trackingId,
        event_type: "opened",
        metadata: {
          tracked_at: new Date().toISOString(),
          user_agent: req.headers.get("user-agent") || "unknown",
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        },
      });

      // Update email_sends status (only upgrade, never downgrade)
      const { data: current } = await supabase
        .from("email_sends")
        .select("status")
        .eq("id", trackingId)
        .single();

      if (current && (STATUS_PRIORITY[current.status] || 0) < (STATUS_PRIORITY["opened"] || 0)) {
        await supabase
          .from("email_sends")
          .update({ status: "opened", updated_at: new Date().toISOString() })
          .eq("id", trackingId);
      }

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

      // Record the click event
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

      // Update email_sends status
      const { data: current } = await supabase
        .from("email_sends")
        .select("status")
        .eq("id", trackingId)
        .single();

      if (current && (STATUS_PRIORITY[current.status] || 0) < (STATUS_PRIORITY["clicked"] || 0)) {
        await supabase
          .from("email_sends")
          .update({ status: "clicked", updated_at: new Date().toISOString() })
          .eq("id", trackingId);
      }

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
