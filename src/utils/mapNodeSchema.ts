import type { MapNode, TreeRelationType } from "../modules/map/mapTypes";

const TREE_TYPES = new Set<TreeRelationType>(["family", "work", "social"]);

function sanitizeTreeRelation(raw: unknown): MapNode["treeRelation"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  const type = record.type;
  const relationLabel = record.relationLabel;
  if (typeof type !== "string" || !TREE_TYPES.has(type as TreeRelationType)) return undefined;
  if (typeof relationLabel !== "string" || relationLabel.trim() === "") return undefined;
  const rawParentId = record.parentId;
  const parentId =
    rawParentId == null || rawParentId === ""
      ? null
      : typeof rawParentId === "string"
        ? rawParentId
        : null;
  return {
    type: type as TreeRelationType,
    parentId,
    relationLabel
  };
}

export function sanitizeMapNodes(nodes: unknown): MapNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes
    .filter((node): node is MapNode => Boolean(node && typeof node === "object"))
    .map((node) => {
      const safeTree = sanitizeTreeRelation((node as { treeRelation?: unknown }).treeRelation);
      if (!safeTree) {
        const rest = { ...(node as MapNode & { treeRelation?: unknown }) };
        delete rest.treeRelation;
        return rest as MapNode;
      }
      return {
        ...(node as MapNode),
        treeRelation: safeTree
      };
    });
}
