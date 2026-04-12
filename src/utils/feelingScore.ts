import type { FeelingAnswers, FeelingOption } from '@/modules/exploration/FeelingCheck';
import { getScoringWeights, getScoringThresholds } from "@/domains/admin/store/admin.store";

/** high=3، medium=2، low=1، zero=0. المجموع 0–9. 0–2 أخضر، 3–5 أصفر، 6–9 أحمر */
function points(opt: FeelingOption): number {
  const weights = getScoringWeights();
  if (opt === "often") return weights.often;
  if (opt === "sometimes") return weights.sometimes;
  if (opt === "rarely") return weights.rarely;
  return weights.never;
}

export function feelingScoreToRing(answers: FeelingAnswers): "green" | "yellow" | "red" {
  const score = points(answers.q1) + points(answers.q2) + points(answers.q3);
  const thresholds = getScoringThresholds();
  if (score <= thresholds.lowMax) return "green";
  if (score <= thresholds.mediumMax) return "yellow";
  return "red";
}

/** النتيجة من 0 لـ 9 (للتخزين/العرض) */
export function feelingScore(answers: FeelingAnswers): number {
  return points(answers.q1) + points(answers.q2) + points(answers.q3);
}
