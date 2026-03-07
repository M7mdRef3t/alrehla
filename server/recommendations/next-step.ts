import { getServiceSupabase, parseJsonBody } from "../../api/user/_shared.js";

type Candidate = {
  id: string;
  title: string;
  message: string;
  cta: string;
  actionType: string;
  actionPayload?: Record<string, unknown>;
  tags: string[];
};

type RecommendationFeatures = {
  entropyScore?: unknown;
  riskRatio?: unknown;
  pulseInstability7d?: unknown;
  sessionHesitation?: unknown;
};

type NextStepRequestBody = {
  candidates?: unknown;
  features?: RecommendationFeatures;
  sessionId?: unknown;
  phase?: unknown;
};

type ApiRequest = {
  method?: string;
  body?: NextStepRequestBody;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function rankCandidates(candidates: Candidate[], features?: RecommendationFeatures): Candidate[] {
  const entropy = Number(features?.entropyScore ?? 0);
  const riskRatio = Number(features?.riskRatio ?? 0);
  const pulseInstability = Number(features?.pulseInstability7d ?? 0);
  const hesitation = Number(features?.sessionHesitation ?? 0);

  return [...candidates].sort((a, b) => {
    const score = (candidate: Candidate) => {
      let value = 0;
      if (candidate.actionType === "open_breathing") value += pulseInstability * 3 + hesitation;
      if (candidate.actionType === "review_red_node") value += riskRatio * 4;
      if (candidate.actionType === "open_mission") value += (1 - riskRatio) * 2 + (entropy < 55 ? 1 : 0);
      if (candidate.tags?.includes("growth")) value += entropy < 45 ? 1 : 0;
      return value;
    };
    return score(b) - score(a);
  });
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = await parseJsonBody(req);
  const candidates = Array.isArray(body?.candidates) ? (body.candidates as Candidate[]) : [];
  if (candidates.length === 0) {
    res.status(400).json({ error: "Missing candidates" });
    return;
  }

  const ranked = rankCandidates(candidates, body?.features);
  const chosen = ranked[0];
  const now = Date.now();
  const decisionId = randomId("decision_cloud");
  const response = {
    decisionId,
    action: chosen,
    why: {
      headline: "تم اختيار الخطوة الأعلى أمانًا وتأثيرًا الآن",
      reasons: [
        { code: "pulse_instability", label: "اعتمادًا على مؤشرات الحالة الحالية" },
        { code: "task_gap", label: "وبناءً على فجوة التنفيذ الأخيرة" }
      ]
    },
    confidence: 0.72,
    riskBand: body?.features?.riskRatio >= 0.7 ? "high" : body?.features?.riskRatio >= 0.45 ? "medium" : "low",
    source: "cloud_ranker",
    expiresAt: now + 12 * 60 * 60 * 1000
  };

  const supabase = getServiceSupabase();
  if (supabase) {
    await supabase.from("next_step_decisions").insert({
      id: decisionId,
      session_id: body?.sessionId ?? null,
      phase: body?.phase ?? null,
      risk_band: response.riskBand,
      source: response.source,
      confidence: response.confidence,
      action_type: chosen.actionType,
      action_payload: chosen.actionPayload ?? null,
      feature_snapshot: body?.features ?? null,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(response.expiresAt).toISOString()
    });
  }

  res.status(200).json(response);
}

