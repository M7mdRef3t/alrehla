import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../../src/modules/dawayir-live/server/auth";
import {
  completeSession,
  getSessionAccess,
  getSessionDetail,
  upsertArtifact,
} from "../../../../../../src/modules/dawayir-live/server/repository";
import {
  generateLoopRecall,
  generateSummary,
  generateTruthContract,
} from "../../../../../../src/modules/dawayir-live/server/artifacts";
import { mirrorAnalyticsEvent, mirrorJourneyEvent } from "../../../../../../src/modules/dawayir-live/server/telemetry";

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
    metrics?: Record<string, unknown>;
    requestedSummary?: Record<string, unknown> | null;
  };

  const detail = await getSessionDetail(auth.client, id);
  const summary = generateSummary(detail, (body.requestedSummary as never) ?? null);
  const truthContract = generateTruthContract(detail, summary);
  const loopRecall = generateLoopRecall(detail, summary);

  const session = await completeSession(auth.client, id, {
    summary,
    metrics: body.metrics ?? {},
  });

  const artifacts = await Promise.all([
    upsertArtifact(auth.client, id, {
      artifactType: "session_summary",
      title: summary.title,
      content: summary as unknown as Record<string, unknown>,
      createdBy: auth.userId,
    }),
    upsertArtifact(auth.client, id, {
      artifactType: "truth_contract",
      title: "Truth Contract",
      content: truthContract as unknown as Record<string, unknown>,
      createdBy: auth.userId,
    }),
    upsertArtifact(auth.client, id, {
      artifactType: "loop_recall",
      title: "Loop Recall",
      content: loopRecall as unknown as Record<string, unknown>,
      createdBy: auth.userId,
    }),
    upsertArtifact(auth.client, id, {
      artifactType: "session_report",
      title: "Session Report",
      content: {
        summary,
        truthContract,
        loopRecall,
      },
      createdBy: auth.userId,
    }),
  ]);

  await Promise.all([
    mirrorJourneyEvent(auth.client, auth.userId, "live_session_completed", { sessionId: id }),
    mirrorAnalyticsEvent(auth.client, auth.userId, "live_session_completed", {
      sessionId: id,
      breakthroughs: summary.breakthroughs.length,
    }),
  ]);

  return NextResponse.json({
    session,
    artifacts,
    summary,
    truthContract,
    loopRecall,
  });
}
