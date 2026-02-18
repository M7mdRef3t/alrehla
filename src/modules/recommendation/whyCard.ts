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
      label: "تذبذب النبض مرتفع",
      value: `${Math.round(features.pulseInstability7d * 100)}%`
    });
  }

  if (features.riskRatio >= 0.3) {
    addReason(reasons, {
      code: "red_shift",
      label: "نسبة الاستنزاف على الخريطة عالية",
      value: `${Math.round(features.riskRatio * 100)}%`
    });
  }

  if (features.entropyScore >= 60) {
    addReason(reasons, {
      code: "entropy_high",
      label: "مؤشر الفوضى أعلى من الطبيعي",
      value: `${features.entropyScore}/100`
    });
  }

  if (features.sessionHesitation >= 0.45) {
    addReason(reasons, {
      code: "session_hesitation",
      label: "تردد الجلسة واضح",
      value: `${Math.round(features.sessionHesitation * 100)}%`
    });
  }

  if (features.taskCompletion7d < 0.5) {
    addReason(reasons, {
      code: "task_gap",
      label: "تنفيذ المهام أقل من المطلوب",
      value: `${Math.round(features.taskCompletion7d * 100)}%`
    });
  }

  if (riskBand === "low" && features.taskCompletion7d >= 0.6) {
    addReason(reasons, {
      code: "stability_gain",
      label: "الاستقرار يسمح بخطوة نمو",
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
      ? "أولوية الآن: تثبيت الحالة قبل أي تصعيد"
      : riskBand === "medium"
        ? "أولوية الآن: حدّ ناعم يمنع الانتكاس"
        : candidate.actionType === "open_mission"
          ? "أولوية الآن: تعميق التقدم بخطوة قابلة للتنفيذ"
          : "أولوية الآن: تثبيت مكسب الوعي الحالي";

  return {
    headline,
    reasons: reasons.slice(0, 3)
  };
}
