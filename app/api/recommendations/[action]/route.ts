import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type RecommendationCandidate = {
  id: string;
  title: string;
  message: string;
  cta: string;
  actionType: string;
  actionPayload?: Record<string, unknown>;
  tags?: string[];
};

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function chooseCandidate(candidates: RecommendationCandidate[]): RecommendationCandidate | null {
  if (candidates.length === 0) return null;
  const breathing = candidates.find((item) => item.actionType === "open_breathing");
  return breathing ?? candidates[0];
}

export async function POST(req: NextRequest, ctx: { params: { action: string } }) {
  const action = String(ctx.params.action || "");
  const body = await req.json().catch(() => ({}));
  const supabaseAdmin = getSupabaseAdminClient();

  if (action === "next-step") {
    const candidates = Array.isArray(body?.candidates) ? (body.candidates as RecommendationCandidate[]) : [];
    const selected = chooseCandidate(candidates);
    if (!selected) {
      return NextResponse.json({ error: "Missing candidates" }, { status: 400 });
    }

    const decisionId = randomId("decision_cloud");
    const riskRatio = Number(body?.features?.riskRatio ?? 0);
    const response = {
      decisionId,
      action: selected,
      why: {
        headline: "تم اختيار الخطوة الأعلى أمانًا وتأثيرًا الآن",
        reasons: [
          { code: "pulse_instability", label: "اعتمادًا على مؤشرات الحالة الحالية" },
          { code: "task_gap", label: "وبناءً على فجوة التنفيذ الأخيرة" }
        ]
      },
      confidence: 0.72,
      riskBand: riskRatio >= 0.7 ? "high" : riskRatio >= 0.45 ? "medium" : "low",
      source: "cloud_ranker",
      expiresAt: Date.now() + 12 * 60 * 60 * 1000
    };

    if (supabaseAdmin) {
      await supabaseAdmin.from("next_step_decisions").insert({
        id: decisionId,
        session_id: body?.sessionId ?? null,
        phase: body?.phase ?? null,
        risk_band: response.riskBand,
        source: response.source,
        confidence: response.confidence,
        action_type: selected.actionType,
        action_payload: selected.actionPayload ?? null,
        feature_snapshot: body?.features ?? null,
        created_at: new Date().toISOString(),
        expires_at: new Date(response.expiresAt).toISOString()
      });
    }

    return NextResponse.json(response, { status: 200 });
  }

  if (action === "outcome") {
    const decisionId = typeof body?.decisionId === "string" ? body.decisionId : "";
    if (!decisionId) {
      return NextResponse.json({ error: "Missing decisionId" }, { status: 400 });
    }

    if (supabaseAdmin) {
      await supabaseAdmin.from("next_step_outcomes").insert({
        decision_id: decisionId,
        acted: Boolean(body?.acted),
        completed: body?.completed == null ? null : Boolean(body.completed),
        pulse_delta: typeof body?.pulseDelta === "number" ? body.pulseDelta : null,
        time_to_action_sec: typeof body?.timeToActionSec === "number" ? body.timeToActionSec : null,
        reported_at: new Date(typeof body?.reportedAt === "number" ? body.reportedAt : Date.now()).toISOString()
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: "Unknown recommendations action" }, { status: 404 });
}

