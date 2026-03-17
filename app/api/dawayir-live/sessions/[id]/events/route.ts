import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../../src/modules/dawayir-live/server/auth";
import {
  appendSessionActivity,
  getSessionAccess,
} from "../../../../../../src/modules/dawayir-live/server/repository";
import { mirrorAnalyticsEvent } from "../../../../../../src/modules/dawayir-live/server/telemetry";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const access = await getSessionAccess(auth.client, id, auth.userId);
  if (!access || (access.role !== "owner" && access.role !== "partner")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    events?: Array<Record<string, unknown>>;
    replayFrames?: Array<Record<string, unknown>>;
    metrics?: Record<string, unknown> | null;
  };

  await appendSessionActivity(auth.client, id, {
    events: Array.isArray(body.events) ? (body.events as never[]) : [],
    replayFrames: Array.isArray(body.replayFrames) ? (body.replayFrames as never[]) : [],
    metrics: body.metrics ?? null,
  });

  await mirrorAnalyticsEvent(auth.client, auth.userId, "live_events_appended", {
    sessionId: id,
    events: Array.isArray(body.events) ? body.events.length : 0,
    replayFrames: Array.isArray(body.replayFrames) ? body.replayFrames.length : 0,
  });

  return NextResponse.json({ ok: true });
}
