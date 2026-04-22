import type { MapNode as MapNodeType } from "./mapTypes";

/**
 * Centralized utility to filter nodes based on current map context.
 * Used by CoreMapScreen, MapCanvas, and DawayirCanvas to ensure consistency.
 */
export function filterNodesByContext(
  nodes: MapNodeType[],
  goalIdFilter?: string | null,
  galaxyGoalIds?: string[] | null
): MapNodeType[] {
  // 1. If we have a specific list of goals (Galaxy mode), filter by those
  if (galaxyGoalIds && galaxyGoalIds.length > 0) {
    return nodes.filter((n) => galaxyGoalIds.includes(n.goalId ?? "general"));
  }

  // 2. If we have a specific goal filter active (Sidebar selection)
  if (goalIdFilter && goalIdFilter !== "") {
    if (goalIdFilter === "family") {
      return nodes.filter(
        (n) =>
          n.goalId === "family" ||
          n.goalId == null ||
          n.treeRelation?.type === "family"
      );
    }
    return nodes.filter((n) => (n.goalId ?? "general") === goalIdFilter);
  }

  // 3. No filter active, return all
  return nodes;
}
