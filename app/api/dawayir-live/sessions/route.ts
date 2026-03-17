import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../src/modules/dawayir-live/server/auth";
import { createSession, listSessionsForUser } from "../../../../src/modules/dawayir-live/server/repository";
import { mirrorAnalyticsEvent, mirrorJourneyEvent } from "../../../../src/modules/dawayir-live/server/telemetry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const sessions = await listSessionsForUser(auth.client, auth.userId);
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const session = await createSession(auth.client, auth.userId, {
    title: typeof body.title === "string" ? body.title : null,
    mode: typeof body.mode === "string" ? body.mode : "standard",
    language: typeof body.language === "string" ? body.language : "ar",
    entrySurface: typeof body.entrySurface === "string" ? body.entrySurface : "dawayir-live",
    goalContext: body.goalContext && typeof body.goalContext === "object" ? (body.goalContext as Record<string, unknown>) : {},
  });

  await Promise.all([
    mirrorJourneyEvent(auth.client, auth.userId, "live_session_created", { sessionId: session.id, mode: session.mode }),
    mirrorAnalyticsEvent(auth.client, auth.userId, "live_session_created", {
      sessionId: session.id,
      mode: session.mode,
      language: session.language,
    }),
  ]);

  return NextResponse.json({ session }, { status: 201 });
}
