import type { FeatureVectorV1, JourneyPhaseV1, NextStepCandidateV1, RiskBandV1 } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function withId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function calculateRiskScore(features: FeatureVectorV1): number {
  const riskRatioScaled = features.riskRatio * 100;
  const pulseScaled = features.pulseInstability7d * 100;
  const hesitationScaled = features.sessionHesitation * 100;
  const volatilityScaled = clamp(features.ringVolatility7d * 8, 0, 100);
  const score =
    features.entropyScore * 0.4 +
    riskRatioScaled * 0.25 +
    pulseScaled * 0.2 +
    hesitationScaled * 0.1 +
    volatilityScaled * 0.05;
  return Math.round(clamp(score, 0, 100));
}

export function resolveRiskBand(riskScore: number): RiskBandV1 {
  if (riskScore >= 70) return "high";
  if (riskScore >= 45) return "medium";
  return "low";
}

function containmentCandidates(features: FeatureVectorV1): NextStepCandidateV1[] {
  const focusNodeId = features.focusNodeId;
  return [
    {
      id: withId("candidate_containment_breath"),
      title: "خد نَفَس واهدى قبل ما تقرر",
      message: "الأعصاب مشدودة شوية دلوقتي.. نهدي الدنيا الأول.",
      cta: "ابدأ تنفّس 60 ثانية",
      actionType: "open_breathing",
      tags: ["containment", "safety"]
    },
    {
      id: withId("candidate_containment_map"),
      title: "راجع أعلى نقطة ضغط",
      message: "فيه إشارة استنزاف نشطة على الخريطة. راجعها بدون مواجهة الآن.",
      cta: "افتح الخريطة",
      actionType: "review_red_node",
      actionPayload: focusNodeId ? { nodeId: focusNodeId } : undefined,
      tags: ["containment", "red_shift"]
    },
    {
      id: withId("candidate_containment_log"),
      title: "تفريغ آمن بدل ردّ فعل",
      message: "سجل موقفًا واحدًا الآن لتقليل الاندفاع.",
      cta: "سجّل موقف",
      actionType: "log_situation",
      actionPayload: focusNodeId ? { nodeId: focusNodeId } : undefined,
      tags: ["containment", "journal"]
    }
  ];
}

function mediumRiskCandidates(phase: JourneyPhaseV1, features: FeatureVectorV1): NextStepCandidateV1[] {
  const focusNodeId = features.focusNodeId;
  const shared: NextStepCandidateV1[] = [
    {
      id: withId("candidate_boundary_soft"),
      title: "حدّ ناعم لوقف النزيف",
      message: "المرحلة الحالية تحتاج مسافة ذكية لا قطيعة كاملة.",
      cta: "نفّذ حدّ ناعم",
      actionType: "set_soft_boundary",
      actionPayload: focusNodeId ? { nodeId: focusNodeId } : undefined,
      tags: ["boundary", "medium_risk"]
    },
    {
      id: withId("candidate_review_red"),
      title: "تثبيت المدار قبل التعمّق",
      message: "حدّد العلاقة الأعلى ضغطًا وأعد تموضعها بهدوء.",
      cta: "راجع المدار",
      actionType: "review_red_node",
      actionPayload: focusNodeId ? { nodeId: focusNodeId } : undefined,
      tags: ["boundary", "map"]
    }
  ];

  if (phase === "resistance") {
    shared.push({
      id: withId("candidate_resistance_breath"),
      title: "منع الانتكاس الفوري",
      message: "مؤشر التردد مرتفع. خطوة تنظيم صغيرة أفضل من قفزة كبيرة.",
      cta: "تنفّس الآن",
      actionType: "open_breathing",
      tags: ["resistance", "containment"]
    });
  } else {
    shared.push({
      id: withId("candidate_mission_light"),
      title: "خطوة مهمة خفيفة",
      message: "نحافظ على التقدم بخطوة قابلة للتنفيذ اليوم.",
      cta: "افتح المهمة",
      actionType: "open_mission",
      actionPayload: focusNodeId ? { nodeId: focusNodeId } : undefined,
      tags: ["mission", "progress"]
    });
  }

  return shared;
}

function lowRiskCandidates(phase: JourneyPhaseV1, features: FeatureVectorV1): NextStepCandidateV1[] {
  const focusNodeId = features.focusNodeId;
  const candidates: NextStepCandidateV1[] = [];

  if (features.hasMissionReadyNode !== false) {
    candidates.push({
      id: withId("candidate_growth_mission"),
      title: "خطوة جديدة.. بس بالهداوة",
      message: "حالتك مستقرة، ودي فرصة ممتازة تاخد خطوة جادة.",
      cta: "اكمل مهمة اليوم",
      actionType: "open_mission",
      actionPayload: focusNodeId ? { nodeId: focusNodeId } : undefined,
      tags: ["growth", "mission"]
    });
  }

  candidates.push(
    {
      id: withId("candidate_growth_tools"),
      title: "وسّع أدواتك",
      message: "الآن وقت مناسب لاستخدام أداة إضافية من الرحلة.",
      cta: "افتح أدوات الرحلة",
      actionType: "open_tools",
      tags: ["growth", "tools"]
    },
    {
      id: withId("candidate_growth_reflect"),
      title: "التثبيت قبل التوسعة",
      message: "سجّل انعكاسًا قصيرًا لتثبيت نمط النجاح.",
      cta: "دوّن انعكاسًا",
      actionType: "journal_reflection",
      tags: ["growth", "reflection"]
    }
  );

  if (phase === "lost") {
    candidates.unshift({
      id: withId("candidate_add_first_person"),
      title: "نقطة البداية",
      message: "الخريطة حالياً فاضية. أول خطوة عشان تبدأ شغل بجد إنك تضيف شخص شاغلك.",
      cta: "ضيف شخص للخريطة",
      actionType: "open_map",
      tags: ["onboarding", "mapping"]
    });
  } else if (phase === "mapping" || phase === "awareness") {
    candidates.unshift({
      id: withId("candidate_mapping_review"),
      title: "أشخاص محتاجين تحليل",
      message: "فيه دوائر ضفتها بس لسه محتاجة تحليل. اقف على أي شخص مجهول عشان نعرف نحطه في المدار الصح.",
      cta: "اختار شخص للبدء",
      actionType: "open_map",
      tags: ["mapping", "clarity"]
    });
  }

  return candidates;
}

function rankCandidates(candidates: NextStepCandidateV1[], phase: JourneyPhaseV1, features: FeatureVectorV1): NextStepCandidateV1[] {
  const scored = candidates.map((candidate) => {
    let score = 0;
    if (candidate.tags.includes(phase)) score += 2;
    if (candidate.actionType === "open_breathing" && features.pulseInstability7d >= 0.5) score += 3;
    if (candidate.actionType === "review_red_node" && features.riskRatio >= 0.35) score += 3;
    if (candidate.actionType === "open_mission" && features.taskCompletion7d < 0.6) score += 2;
    if (candidate.actionType === "journal_reflection" && features.sessionHesitation >= 0.4) score += 1;
    return { candidate, score };
  });
  return scored.sort((a, b) => b.score - a.score).map((item) => item.candidate);
}

export interface CandidateGenerationResult {
  riskScore: number;
  riskBand: RiskBandV1;
  candidates: NextStepCandidateV1[];
}

export function generateCandidatesByPolicy(
  phase: JourneyPhaseV1,
  features: FeatureVectorV1
): CandidateGenerationResult {
  const riskScore = calculateRiskScore(features);
  const riskBand = resolveRiskBand(riskScore);
  const base =
    riskBand === "high"
      ? containmentCandidates(features)
      : riskBand === "medium"
        ? mediumRiskCandidates(phase, features)
        : lowRiskCandidates(phase, features);

  return {
    riskScore,
    riskBand,
    candidates: rankCandidates(base, phase, features).slice(0, 5)
  };
}
