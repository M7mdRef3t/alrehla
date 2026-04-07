import type { Ring } from "@/modules/map/mapTypes";
import { addPersonCopy } from "@/copy/addPerson";

/** صيغة قياسية: high=دايماً/جداً، medium=أحياناً، low=نادراً، zero=أبداً/لأ */
export type QuickAnswer1 = "high" | "medium" | "low" | "zero";
export type QuickAnswer2 = "high" | "medium" | "low" | "zero";

export interface SuggestedRingResult {
  ring: Ring;
  reason: string;
}

/**
 * يقترح الدائرة المناسبة لشخص جديد بناءً على إجابات السؤالين السريعين.
 * س1 (استنزاف): high=أسوأ، zero=أفضل. س2 (أمان): high=أفضل، zero=أسوأ.
 */
export function suggestInitialRing(
  answer1: QuickAnswer1,
  answer2: QuickAnswer2
): SuggestedRingResult {
  const red = answer1 === "high" || answer2 === "zero";
  const green = answer1 === "zero" && answer2 === "high";

  let ring: Ring;
  if (red) ring = "red";
  else if (green) ring = "green";
  else ring = "yellow";

  const reason = addPersonCopy.suggestionReasons[ring];
  return { ring, reason };
}
