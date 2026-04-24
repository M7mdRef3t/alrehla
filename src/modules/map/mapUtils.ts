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
    return nodes.filter((n) => galaxyGoalIds.includes(n.goalId ?? "general") || n.goalId == null);
  }

  // 2. If we have a specific goal filter active (Sidebar selection)
  if (goalIdFilter && goalIdFilter !== "" && goalIdFilter !== "unknown") {
    if (goalIdFilter === "family") {
      const filtered = nodes.filter(
        (n) =>
          n.goalId === "family" ||
          n.goalId == null ||
          n.treeRelation?.type === "family"
      );
      console.log(`[filterNodesByContext] family-filter: in=${nodes.length} out=${filtered.length}`);
      return filtered;
    }
    // Show nodes that match the goal OR legacy nodes that have no goal assigned yet
    const filtered = nodes.filter((n) => (n.goalId ?? "general") === goalIdFilter || n.goalId == null);
    console.log(`[filterNodesByContext] context-filter(${goalIdFilter}): in=${nodes.length} out=${filtered.length}`);
    return filtered;
  }

  // 3. No filter active (or 'unknown'), return all
  return nodes;
}
