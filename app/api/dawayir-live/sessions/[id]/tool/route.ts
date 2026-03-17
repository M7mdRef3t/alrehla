import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../../src/modules/dawayir-live/server/auth";
import {
  getSessionAccess,
  getSessionDetail,
  upsertArtifact,
} from "../../../../../../src/modules/dawayir-live/server/repository";
import {
  buildExpertInsight,
  buildMentalMap,
  generateLoopRecall,
  generateSummary,
  generateTruthContract,
} from "../../../../../../src/modules/dawayir-live/server/artifacts";

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
    name?: string;
    args?: Record<string, unknown>;
  };

  const detail = await getSessionDetail(auth.client, id);
  const args = body.args ?? {};

  if (body.name === "get_expert_insight") {
    const result = buildExpertInsight(String(args.topic ?? "النمط الحالي"), detail);
    return NextResponse.json({ result });
  }

  if (body.name === "save_mental_map") {
    const result = buildMentalMap(detail);
    const artifact = await upsertArtifact(auth.client, id, {
      artifactType: "mental_map",
      title: typeof args.title === "string" ? args.title : "Mental Map",
      content: result,
      createdBy: auth.userId,
    });
    return NextResponse.json({ result, artifact });
  }

  if (body.name === "generate_session_report") {
    const summary = generateSummary(detail, null);
    const loopRecall = generateLoopRecall(detail, summary);
    const artifact = await upsertArtifact(auth.client, id, {
      artifactType: "session_report",
      title: "Session Report",
      content: { summary, loopRecall },
      createdBy: auth.userId,
    });
    return NextResponse.json({
      result: { ok: true, summary },
      artifact,
      summary,
      loopRecall,
    });
  }

  if (body.name === "create_truth_contract") {
    const summary = generateSummary(detail, null);
    const truthContract = generateTruthContract(detail, summary);
    const loopRecall = generateLoopRecall(detail, summary);
    const artifact = await upsertArtifact(auth.client, id, {
      artifactType: "truth_contract",
      title: "Truth Contract",
      content: truthContract as unknown as Record<string, unknown>,
      createdBy: auth.userId,
    });
    await upsertArtifact(auth.client, id, {
      artifactType: "loop_recall",
      title: "Loop Recall",
      content: loopRecall as unknown as Record<string, unknown>,
      createdBy: auth.userId,
    });
    return NextResponse.json({
      result: { ok: true, truthContract, loopRecall },
      artifact,
      truthContract,
      loopRecall,
    });
  }

  return NextResponse.json({ error: "Unsupported tool" }, { status: 400 });
}
