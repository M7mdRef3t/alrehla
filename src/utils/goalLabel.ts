import { goalPickerCopy } from "../copy/goalPicker";
import { resolveAdviceCategory } from "../data/adviceScripts";

export function getGoalLabel(goalId?: string | null): string {
  if (!goalId) return "";
  const option = goalPickerCopy.options.find((item) => item.id === goalId);
  if (option?.label) return option.label;
  if (goalId === "general") return "عام";
  return goalId;
}

export function getLastGoalMeta(
  lastGoalById: Record<string, { category: string; updatedAt: number }> | undefined,
  fallbackGoalId?: string | null,
  fallbackCategory?: string | null
): { goalId: string; category: string } | null {
  const entries = lastGoalById ? Object.entries(lastGoalById) : [];
  if (entries.length > 0) {
    const [goalId, meta] = entries.reduce(
      (best, current) => (current[1].updatedAt > best[1].updatedAt ? current : best),
      entries[0]
    );
    return { goalId, category: meta.category };
  }
  if (fallbackGoalId) {
    const category = fallbackCategory ?? resolveAdviceCategory(fallbackGoalId);
    return { goalId: fallbackGoalId, category };
  }
  return null;
}
