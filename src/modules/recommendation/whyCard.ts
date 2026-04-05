import type {
  FeatureVectorV1,
  NextStepCandidateV1,
  NextStepWhyCardV1,
  RiskBandV1,
  WhyReasonV1
} from "./types";

function addReason(
  reasons: WhyReasonV1[],
  reason: WhyReasonV1
): void {
  if (!reasons.some((item) => item.code === reason.code)) reasons.push(reason);
}

export function buildWhyCard(
  riskBand: RiskBandV1,
  features: FeatureVectorV1,
  candidate: NextStepCandidateV1
): NextStepWhyCardV1 {
  const reasons: WhyReasonV1[] = [];

  if (features.pulseInstability7d >= 0.4) {
    addReason(reasons, {
      code: "pulse_instability",
      label: "نبضك عالي شوية",
      value: `${Math.round(features.pulseInstability7d * 100)}%`
    });
  }

  if (features.riskRatio >= 0.3) {
    addReason(reasons, {
      code: "red_shift",
      label: "دايرة الاستنزاف بتكبر",
      value: `${Math.round(features.riskRatio * 100)}%`
    });
  }

  if (features.entropyScore >= 60) {
    addReason(reasons, {
      code: "entropy_high",
      label: "الدنيا ملخبطة زيادة",
      value: `${features.entropyScore}/100`
    });
  }

  if (features.sessionHesitation >= 0.45) {
    addReason(reasons, {
      code: "session_hesitation",
      label: "الحيرة واضحة في الجلسة",
      value: `${Math.round(features.sessionHesitation * 100)}%`
    });
  }

  if (features.taskCompletion7d < 0.5) {
    addReason(reasons, {
      code: "task_gap",
      label: "المهام واقعة منك شوية",
      value: `${Math.round(features.taskCompletion7d * 100)}%`
    });
  }

  if (riskBand === "low" && features.taskCompletion7d >= 0.6) {
    addReason(reasons, {
      code: "stability_gain",
      label: "حالتك تسمح تتحرك لقدام",
      value: `${Math.round(features.taskCompletion7d * 100)}%`
    });
  }

  if (reasons.length < 2) {
    addReason(reasons, {
      code: "boundary_progress",
      label: "الخطوة المختارة توازن الأمان مع التقدم"
    });
  }
  if (reasons.length < 2) {
    addReason(reasons, {
      code: "task_gap",
      label: "هذه الخطوة مصممة لتقليل التردد وزيادة التنفيذ"
    });
  }

  const headline =
    riskBand === "high"
      ? "أهم حاجة دلوقت: نثبّت مكاننا عشان منتهزش"
      : riskBand === "medium"
        ? "أهم حاجة دلوقت: مسافة ذكية عشان متتعبش"
        : candidate.actionType === "open_mission"
          ? "أهم حاجة دلوقت: حان وقت الخطوة الجادة"
          : "أهم حاجة دلوقت: نثبّت اللي وصلنا له بالوعي";

  return {
    headline,
    reasons: reasons.slice(0, 3)
  };
}
