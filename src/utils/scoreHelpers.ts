import type { Ring } from "../modules/map/mapTypes";

export type AdviceZone = "green" | "yellow" | "red";

/**
 * تحويل النتيجة (score) إلى دائرة (ring)
 */
export function scoreToRing(score: number): Ring {
  if (score > 2) return "red";
  if (score >= 1) return "yellow";
  return "green";
}

/**
 * تحويل النتيجة (score) إلى منطقة نصيحة (zone)
 */
export function scoreToZone(score: number): AdviceZone {
  if (score > 2) return "red";
  if (score >= 1) return "yellow";
  return "green";
}

/**
 * الحصول على التسمية العربية للدائرة
 */
export function getRingLabel(ring: Ring): string {
  const labels: Record<Ring, string> = {
    green: "صحية",
    yellow: "محتاجة انتباه",
    red: "استنزاف"
  };
  return labels[ring];
}

/**
 * تحليل شامل للنتيجة
 */
export function analyzeScore(score: number): {
  ring: Ring;
  zone: AdviceZone;
  label: string;
} {
  const ring = scoreToRing(score);
  const zone = scoreToZone(score);
  const label = getRingLabel(ring);
  
  return { ring, zone, label };
}
