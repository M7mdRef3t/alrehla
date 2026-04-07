import type { RealityAnswers, RealityOption } from '@/modules/exploration/RealityCheck';
import { getScoringWeights, getScoringThresholds } from "@/state/adminState";

/** تواصل: high=3، medium=2، low=1، zero=0. المجموع 6–9 أخضر، 3–5 أصفر، 0–2 أحمر */
function points(opt: RealityOption): number {
  const weights = getScoringWeights();
  if (opt === "often") return weights.often;
  if (opt === "sometimes") return weights.sometimes;
  if (opt === "rarely") return weights.rarely;
  return weights.never;
}

export function realityScoreToRing(answers: RealityAnswers): "green" | "yellow" | "red" {
  const score = points(answers.q1) + points(answers.q2) + points(answers.q3);
  const thresholds = getScoringThresholds();
  if (score > thresholds.mediumMax) return "green";
  if (score > thresholds.lowMax) return "yellow";
  return "red";
}
