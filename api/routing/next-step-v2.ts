import { buildRoutingContextV2 } from "./context-builder.js";
import { loadPrecomputedCandidates } from "./candidate-generator.js";
import { getEpsilon, rankCandidatesV2 } from "./swarm-ranker.js";
import { getServiceSupabase, parseJsonBody, randomId } from "./_shared.js";

type FallbackCandidate = {
  id: string;
  title: string;
  message: string;
  cta: string;
  actionType: string;
  actionPayload?: Record<string, unknown>;
  tags: string[];
};

function buildFallbackFromIncomingCandidates(candidates: FallbackCandidate[]) {
  const chosen = candidates[0];
  return {
    action: chosen,
    source: "template_fallback" as const,
    confidence: 0.48
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = await parseJsonBody(req);
  const context = buildRoutingContextV2(body);
  const now = Date.now();
  const decisionId = randomId("decision_v2");
  const supabase = getServiceSupabase();
  if (!supabase) {
    res.status(503).json({ error: "Supabase unavailable" });
    return;
  }

  const precomputed = await loadPrecomputedCandidates(supabase, context, 20);
  let chosen: any = null;
  let source: "cloud_ranker_v2" | "template_fallback" = "cloud_ranker_v2";
  let confidence = 0.72;
  let rankedForStore: any[] = [];
  let isExploration = false;

  if (precomputed.length > 0) {
    const ranked = await rankCandidatesV2(supabase, context, precomputed);
    chosen = ranked[0];
    rankedForStore = ranked.slice(0, 10).map((item) => ({
      id: item.id,
      contentId: item.contentId ?? null,
      edgeId: item.edgeId ?? null,
      finalScore: item.finalScore,
      policyScore: item.policyScore,
      swarmScore: item.swarmScore,
      cognitivePenalty: item.cognitivePenalty,
      explorationBonus: item.explorationBonus
    }));
    isExploration = Boolean(chosen?.isExploration);
  } else {
    const incoming = Array.isArray(body?.candidates) ? (body.candidates as FallbackCandidate[]) : [];
    if (incoming.length === 0) {
      res.status(400).json({ error: "No candidates available" });
      return;
    }
    const fallback = buildFallbackFromIncomingCandidates(incoming);
    chosen = fallback.action;
    source = fallback.source;
    confidence = fallback.confidence;
  }

  const response = {
    decisionId,
    action: {
      id: chosen.id,
      title: chosen.title,
      message: chosen.message,
      cta: chosen.cta,
      actionType: chosen.actionType,
      actionPayload: chosen.actionPayload ?? {}
    },
    why: {
      headline: isExploration
        ? "نختبر خطوة جديدة مناسبة لرفع جودة التوجيه"
        : "تم اختيار أعلى خطوة تأثيرًا مع مراعاة الحمل الإدراكي",
      reasons: [
        { code: "policy_score", label: "بناءً على إشارات الحالة الحالية" },
        { code: "swarm_score", label: "ومؤشرات نجاح التجارب السابقة (مع decay)" },
        { code: "cognitive_capacity", label: "ومواءمة الطاقة الإدراكية الحالية" }
      ]
    },
    confidence,
    riskBand: context.riskRatio >= 0.7 ? "high" : context.riskRatio >= 0.45 ? "medium" : "low",
    source,
    isExploration,
    epsilon: getEpsilon(),
    expiresAt: now + 6 * 60 * 60 * 1000
  };

  await supabase.from("routing_decisions_v2").insert({
    id: decisionId,
    user_id: context.userId,
    session_id: context.sessionId,
    surface: context.surface,
    source,
    segment_key: context.segmentKey,
    confidence: response.confidence,
    is_exploration: isExploration,
    cognitive_capacity: context.cognitiveCapacity,
    context: context,
    candidates: rankedForStore,
    chosen_step: response.action,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(response.expiresAt).toISOString()
  });

  await supabase.from("routing_events").insert({
    user_id: context.userId,
    session_id: context.sessionId,
    event_type: "decision_created",
    payload: {
      decisionId,
      segmentKey: context.segmentKey,
      source,
      isExploration,
      epsilon: getEpsilon()
    }
  });

  if (isExploration) {
    const edgeId = String(response.action?.actionPayload?.edgeId ?? "").trim();
    if (edgeId) {
      await supabase.rpc("increment_swarm_exploration_count", {
        in_edge_id: edgeId,
        in_segment_key: context.segmentKey
      });
    }
  }

  res.status(200).json(response);
}
