import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type RoutingCandidate = {
  id: string;
  title: string;
  message: string;
  cta: string;
  actionType: string;
  actionPayload?: Record<string, unknown>;
};

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toRiskBand(riskRatio: number): "low" | "medium" | "high" {
  if (riskRatio >= 0.7) return "high";
  if (riskRatio >= 0.45) return "medium";
  return "low";
}

export async function POST(req: NextRequest, ctx: { params: { action: string } }) {
  const action = String(ctx.params.action || "");
  const body = await req.json().catch(() => ({}));
  const supabaseAdmin = getSupabaseAdminClient();

  if (action === "next-step-v2") {
    const candidates = Array.isArray(body?.candidates) ? (body.candidates as RoutingCandidate[]) : [];
    const selected = candidates[0];
    if (!selected) {
      return NextResponse.json({ error: "No candidates available" }, { status: 400 });
    }

    const decisionId = randomId("decision_v2");
    const riskRatio = Number(body?.features?.riskRatio ?? 0);
    const response = {
      decisionId,
      action: {
        id: selected.id,
        title: selected.title,
        message: selected.message,
        cta: selected.cta,
        actionType: selected.actionType,
        actionPayload: selected.actionPayload ?? {}
      },
      why: {
        headline: "تم اختيار أعلى خطوة تأثيرًا مع مراعاة الحمل الإدراكي",
        reasons: [
          { code: "policy_score", label: "بناءً على إشارات الحالة الحالية" },
          { code: "swarm_score", label: "ومؤشرات نجاح التجارب السابقة" },
          { code: "cognitive_capacity", label: "ومواءمة الطاقة الإدراكية الحالية" }
        ]
      },
      confidence: 0.68,
      riskBand: toRiskBand(riskRatio),
      source: "template_fallback",
      isExploration: false,
      epsilon: 0.12,
      expiresAt: Date.now() + 6 * 60 * 60 * 1000
    };

    if (supabaseAdmin) {
      await supabaseAdmin.from("routing_decisions_v2").insert({
        id: decisionId,
        user_id: typeof body?.userId === "string" ? body.userId : null,
        session_id: body?.sessionId ?? null,
        surface: body?.surface ?? "map",
        source: response.source,
        segment_key: body?.segmentKey ?? "unknown",
        confidence: response.confidence,
        is_exploration: false,
        cognitive_capacity: typeof body?.cognitiveCapacity === "number" ? body.cognitiveCapacity : null,
        context: body ?? null,
        candidates: candidates.slice(0, 10),
        chosen_step: response.action,
        created_at: new Date().toISOString(),
        expires_at: new Date(response.expiresAt).toISOString()
      });
    }

    return NextResponse.json(response, { status: 200 });
  }

  if (action === "outcome-v2") {
    const decisionId = typeof body?.decisionId === "string" ? body.decisionId : "";
    if (!decisionId) {
      return NextResponse.json({ error: "Missing decisionId" }, { status: 400 });
    }

    if (supabaseAdmin) {
      await supabaseAdmin.from("routing_outcomes_v2").insert({
        decision_id: decisionId,
        user_id: typeof body?.userId === "string" ? body.userId : null,
        acted: Boolean(body?.acted),
        completed: body?.completed == null ? null : Boolean(body.completed),
        completion_latency_sec: typeof body?.timeToActionSec === "number" ? body.timeToActionSec : null,
        pulse_delta: typeof body?.pulseDelta === "number" ? body.pulseDelta : null,
        reported_at: new Date(typeof body?.reportedAt === "number" ? body.reportedAt : Date.now()).toISOString()
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "intervention-trigger") {
    const decisionId = typeof body?.decisionId === "string" ? body.decisionId : "";
    if (!decisionId) {
      return NextResponse.json({ error: "Missing decisionId" }, { status: 400 });
    }

    if (supabaseAdmin) {
      await supabaseAdmin.from("routing_events").insert({
        user_id: typeof body?.userId === "string" ? body.userId : null,
        session_id: typeof body?.sessionId === "string" ? body.sessionId : null,
        event_type: "intervention_triggered",
        payload: {
          decisionId,
          segmentKey: body?.segmentKey ?? "unknown",
          surface: body?.surface ?? "map",
          source: body?.source ?? "template_fallback",
          hesitationSec: typeof body?.hesitationSec === "number" ? body.hesitationSec : null,
          cognitiveLoadRequired:
            typeof body?.cognitiveLoadRequired === "number" ? body.cognitiveLoadRequired : null,
          actionType: typeof body?.actionType === "string" ? body.actionType : null
        }
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: "Unknown routing action" }, { status: 404 });
}

