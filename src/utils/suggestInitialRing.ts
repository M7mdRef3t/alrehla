import type { Ring } from "../modules/map/mapTypes";
import { addPersonCopy } from "../copy/addPerson";

export type QuickAnswer1 = "high" | "medium" | "low" | "no";
export type QuickAnswer2 = "yes" | "sometimes" | "no";

export interface SuggestedRingResult {
  ring: Ring;
  reason: string;
}

/**
 * يقترح الدائرة المناسبة لشخص جديد بناءً على إجابات السؤالين السريعين.
 */
export function suggestInitialRing(
  answer1: QuickAnswer1,
  answer2: QuickAnswer2
): SuggestedRingResult {
  const red = answer1 === "high" || answer2 === "no";
  const green = answer1 === "no" && answer2 === "yes";

  let ring: Ring;
  if (red) ring = "red";
  else if (green) ring = "green";
  else ring = "yellow";

  const reason = addPersonCopy.suggestionReasons[ring];
  return { ring, reason };
}
