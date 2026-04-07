import type { FlowNode } from "../components/admin/flow-mind-map/types";

export interface FlowNodeMetric {
  count: number;
  parentCount: number | null;
  conversionRate: number | null;
  dropOffCount: number | null;
}

function safeCount(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function buildFlowNodeMetrics(
  nodes: FlowNode[],
  links: Array<[string, string]>
): Record<string, FlowNodeMetric> {
  const countById: Record<string, number> = {};
  for (const node of nodes) countById[node.id] = safeCount(node.count);

  const parentByChild: Record<string, string> = {};
  for (const [childId, parentId] of links) {
    if (!parentByChild[childId]) parentByChild[childId] = parentId;
  }

  const result: Record<string, FlowNodeMetric> = {};
  for (const node of nodes) {
    const count = countById[node.id] ?? 0;
    const parentId = parentByChild[node.id];
    const parentCount = parentId ? (countById[parentId] ?? 0) : null;
    const conversionRate = parentCount != null && parentCount > 0
      ? Math.round((count / parentCount) * 100)
      : null;
    const dropOffCount = parentCount != null ? Math.max(0, parentCount - count) : null;

    result[node.id] = {
      count,
      parentCount,
      conversionRate,
      dropOffCount
    };
  }

  return result;
}
