import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MapNode, Ring } from "../map/mapTypes";
import { useMapState } from "@/state/mapState";
import { mapCopy } from "@/copy/map";

const RING_STYLES: Record<Ring, { dot: string; border: string; bg: string }> = {
  green: { dot: "bg-teal-400", border: "border-teal-400", bg: "bg-teal-50" },
  yellow: { dot: "bg-amber-400", border: "border-amber-400", bg: "bg-amber-50" },
  red: { dot: "bg-rose-400", border: "border-rose-400", bg: "bg-rose-50" }
};

function buildTreeLevels(nodes: MapNode[]): MapNode[][] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const levels: MapNode[][] = [];
  const assigned = new Set<string>();
  const roots = nodes.filter((n) => {
    const parentId = n.treeRelation?.parentId ?? null;
    if (parentId == null) return true;
    if (!byId.has(parentId)) return true;
    return false;
  });
  roots.forEach((n) => assigned.add(n.id));
  levels.push(roots);
  let current = roots;
  while (current.length > 0) {
    const next: MapNode[] = [];
    for (const parent of current) {
      const children = nodes.filter(
        (n) => n.treeRelation?.parentId === parent.id && !assigned.has(n.id)
      );
      children.forEach((n) => assigned.add(n.id));
      next.push(...children);
    }
    if (next.length === 0) break;
    levels.push(next);
    current = next;
  }
  const remaining = nodes.filter((n) => !assigned.has(n.id));
  if (remaining.length > 0) {
    if (levels.length === 0) levels.push(remaining);
    else levels[0] = [...levels[0], ...remaining];
  }
  return levels;
}

const NodeChip: FC<{ node: MapNode; onSelect: (id: string) => void }> = ({ node, onSelect }) => {
  const style = RING_STYLES[node.ring];
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-2 text-sm font-semibold ${style.border} ${style.bg}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
      {node.label}
    </motion.button>
  );
};

interface ForestViewProps {
  onNodeClick: (nodeId: string) => void;
}

export const ForestView: FC<ForestViewProps> = ({ onNodeClick }) => {
  const allNodes = useMapState((s) => s.nodes);
  const familyNodes = useMemo(() => allNodes.filter((n) => n.goalId === "family" || (n.goalId == null && n.treeRelation?.type === "family")), [allNodes]);
  const workNodes = useMemo(() => allNodes.filter((n) => n.goalId === "work"), [allNodes]);
  const socialNodesSimple = useMemo(
    () => allNodes.filter((n) => ["love", "money", "general", "unknown"].includes(n.goalId ?? "general")),
    [allNodes]
  );

  const familyLevels = useMemo(() => buildTreeLevels(familyNodes), [familyNodes]);
  const workLevels = useMemo(() => buildTreeLevels(workNodes), [workNodes]);

  return (
    <div className="mt-6 w-full max-w-xl mx-auto text-right space-y-8">
      {familyNodes.length > 0 && (
        <section aria-labelledby="forest-family">
          <h2 id="forest-family" className="text-lg font-bold text-slate-800 mb-3">
            {mapCopy.contextFamily}
          </h2>
          <div className="space-y-4">
            {familyLevels.map((levelNodes, i) => (
              <div key={i} className="flex flex-wrap justify-center gap-2">
                {levelNodes.map((node) => (
                  <NodeChip key={node.id} node={node} onSelect={onNodeClick} />
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {workNodes.length > 0 && (
        <section aria-labelledby="forest-work">
          <h2 id="forest-work" className="text-lg font-bold text-slate-800 mb-3">
            {mapCopy.contextWork}
          </h2>
          <div className="space-y-4">
            {workLevels.map((levelNodes, i) => (
              <div key={i} className="flex flex-wrap justify-center gap-2">
                {levelNodes.map((node) => (
                  <NodeChip key={node.id} node={node} onSelect={onNodeClick} />
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {socialNodesSimple.length > 0 && (
        <section aria-labelledby="forest-social">
          <h2 id="forest-social" className="text-lg font-bold text-slate-800 mb-3">
            {mapCopy.contextLove} / {mapCopy.contextGeneral}
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {socialNodesSimple.map((node) => (
              <NodeChip key={node.id} node={node} onSelect={onNodeClick} />
            ))}
          </div>
        </section>
      )}

      {familyNodes.length === 0 && workNodes.length === 0 && socialNodesSimple.length === 0 && (
        <p className="text-sm text-slate-600 text-center py-6">{mapCopy.familyTreeEmpty}</p>
      )}
    </div>
  );
};


