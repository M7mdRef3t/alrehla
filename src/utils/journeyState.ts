import { resolveAdviceCategory, type AdviceCategory } from "../data/adviceScripts";

const DEFAULT_JOURNEY_GOAL_ID = "family";

export interface ValidJourneyState {
  goalId: string;
  category: AdviceCategory;
}

export function ensureValidJourneyState(goalId?: string | null): ValidJourneyState {
  const normalizedGoalId = (goalId ?? "").trim();
  const nextGoalId = normalizedGoalId.length > 0 ? normalizedGoalId : DEFAULT_JOURNEY_GOAL_ID;

  return {
    goalId: nextGoalId,
    category: resolveAdviceCategory(nextGoalId)
  };
}
