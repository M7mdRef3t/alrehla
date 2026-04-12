import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MapNode, Ring } from "../map/mapTypes";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { mapCopy } from "@/copy/map";
import { guardianCopy } from "@/copy/guardianCopy";
import { Target } from "lucide-react";
import { getMissionProgressSummary } from "@/utils/missionProgress";

const RING_STYLES: Record<Ring, { dot: string; border: string; bg: string }> = {
  green: { dot: "bg-teal-600", border: "border-teal-600", bg: "bg-teal-100" },
  yellow: { dot: "bg-orange-500", border: "border-orange-500", bg: "bg-orange-100" },
  red: { dot: "bg-rose-600", border: "border-rose-600", bg: "bg-rose-100" }
};

/** خلية في الشجرة: شخص واحد أو زوجين (أب+أم / زوج+زوجة) */
export interface TreeCell {
  nodes: MapNode[];
  children: TreeCell[];
}

const COUPLE_LABELS: [string, string][] = [
  ["أب", "أم"],
  ["أم", "أب"],
  ["زوج", "زوجة"],
  ["زوجة", "زوج"]
];

function getRelationLabel(node: MapNode): string {
  return (node.treeRelation?.relationLabel ?? "").trim();
}

/** يجمع عقد في خلايا: زوجين (أب+أم أو زوج+زوجة) أو فرد */
function groupIntoCells(nodes: MapNode[]): MapNode[][] {
  if (nodes.length === 0) return [];
  const used = new Set<string>();
  const cells: MapNode[][] = [];

  for (const [a, b] of COUPLE_LABELS) {
    const nodeA = nodes.find((n) => !used.has(n.id) && getRelationLabel(n) === a);
    const nodeB = nodes.find((n) => !used.has(n.id) && getRelationLabel(n) === b);
    if (nodeA && nodeB) {
      used.add(nodeA.id);
      used.add(nodeB.id);
      cells.push(a === "أب" || a === "زوج" ? [nodeA, nodeB] : [nodeB, nodeA]);
    }
  }

  for (const n of nodes) {
    if (!used.has(n.id)) {
      used.add(n.id);
      cells.push([n]);
    }
  }
  return cells;
}

/** يبني شجرة نسب: جذور (أفراد أو أزواج) ثم أبناء كل خلية */
function buildTreeStructure(nodes: MapNode[]): TreeCell[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, MapNode[]>();
  for (const n of nodes) {
    const parentId = n.treeRelation?.parentId ?? null;
    if (parentId != null && byId.has(parentId)) {
      const list = childrenOf.get(parentId) ?? [];
      list.push(n);
      childrenOf.set(parentId, list);
    }
  }
  const roots = nodes.filter((n) => {
    const parentId = n.treeRelation?.parentId ?? null;
    if (parentId == null) return true;
    if (!byId.has(parentId)) return true;
    return false;
  });
  const rootCells = groupIntoCells(roots);

  function getChildNodes(cell: MapNode[]): MapNode[] {
    const ids = new Set(cell.map((n) => n.id));
    const out: MapNode[] = [];
    ids.forEach((id) => (childrenOf.get(id) ?? []).forEach((n) => out.push(n)));
    return out;
  }

  function toTreeCell(cellNodes: MapNode[]): TreeCell {
    const childNodes = getChildNodes(cellNodes);
    const childCells = groupIntoCells(childNodes);
    const children = childCells.map(toTreeCell);
    return { nodes: cellNodes, children };
  }

  const result = rootCells.map((cellNodes) => toTreeCell(cellNodes));
  const assigned = new Set<string>();
  function collectIds(c: TreeCell) {
    c.nodes.forEach((n) => assigned.add(n.id));
    c.children.forEach(collectIds);
  }
  result.forEach(collectIds);
  const remaining = nodes.filter((n) => !assigned.has(n.id));
  if (remaining.length > 0) {
    groupIntoCells(remaining).forEach((cellNodes) => result.push(toTreeCell(cellNodes)));
  }
  return result;
}

interface TreeNodeButtonProps {
  node: MapNode;
  onSelect: (id: string) => void;
}

const TreeNodeButton: FC<TreeNodeButtonProps> = ({ node, onSelect }) => {
  const style = RING_STYLES[node.ring];
  const setRecoveryPlanOpenWith = useMapState((s) => s.setRecoveryPlanOpenWith);
  const missionBadge = useMemo(() => getMissionProgressSummary(node), [node]);
  const openRecoveryPlan = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecoveryPlanOpenWith({ preselectedNodeId: node.id });
  };
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <motion.button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-right transition-all shrink-0 ${style.border} ${style.bg}`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        title={`${mapCopy.legendGreen}/${mapCopy.legendYellow}/${mapCopy.legendRed} — اضغط للتفاصيل`}
      >
        <span className={`w-3 h-3 rounded-full shrink-0 ${style.dot}`} />
        <span className="flex flex-col items-start">
          <span className="text-sm font-semibold text-slate-800">{node.label}</span>
          {missionBadge ? (
            <span
              className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                missionBadge.tone === "done"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {missionBadge.label}
            </span>
          ) : null}
        </span>
      </motion.button>
      <motion.button
        type="button"
        onClick={openRecoveryPlan}
        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-teal-400 bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors shrink-0"
        title={guardianCopy.defenseProtocol}
        aria-label={guardianCopy.defenseProtocol}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <Target className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

const FocusTraumaRecoveryButton: FC<{ rootId: string; rootLabel: string }> = ({ rootId }) => {
  const setRecoveryPlanOpenWith = useMapState((s) => s.setRecoveryPlanOpenWith);
  return (
    <motion.button
      type="button"
      onClick={() => setRecoveryPlanOpenWith({ focusTraumaInheritance: true, preselectedNodeId: rootId })}
      className="flex items-center gap-2 rounded-full border-2 border-rose-400 bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-200 transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Target className="w-4 h-4" />
      {mapCopy.focusTraumaRecoveryCta}
    </motion.button>
  );
};

interface TreeNodeBlockProps {
  cell: TreeCell;
  onSelect: (id: string) => void;
}

/** خطوط هيكل الشجرة: عمودي من الخلية → أفقي → عمودي لكل ابن */
const TreeConnector: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col items-center w-full">
    <div className="w-1 h-5 bg-slate-400 rounded-full shrink-0" aria-hidden />
    <div className="w-full max-w-[90%] min-h-[2px] bg-slate-400 shrink-0" aria-hidden />
    <div className="flex flex-row justify-center gap-8 md:gap-12 items-start flex-wrap mt-1">
      {children}
    </div>
  </div>
);

/** عقدة/خلية في شجرة النسب: أب+أم جنب بعض أو شخص واحد، ثم خطوط ثم الأبناء */
const TreeNodeBlock: FC<TreeNodeBlockProps> = ({ cell, onSelect }) => {
  const hasChildren = cell.children.length > 0;
  const isCouple = cell.nodes.length === 2;
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row items-center justify-center gap-3 flex-wrap">
        {cell.nodes.map((node) => (
          <TreeNodeButton key={node.id} node={node} onSelect={onSelect} />
        ))}
        {isCouple && (
          <div className="w-6 h-0.5 bg-slate-400 rounded shrink-0" aria-hidden title="ربط الزوجين" />
        )}
      </div>
      {hasChildren && (
        <TreeConnector>
          {cell.children.map((childCell) => (
            <div key={childCell.nodes.map((n) => n.id).join(",")} className="flex flex-col items-center">
              <div className="w-1 h-5 bg-slate-400 rounded-full shrink-0 mb-0.5" aria-hidden />
              <TreeNodeBlock cell={childCell} onSelect={onSelect} />
            </div>
          ))}
        </TreeConnector>
      )}
    </div>
  );
};

interface FamilyTreeViewProps {
  onNodeClick: (nodeId: string) => void;
}

export const FamilyTreeView: FC<FamilyTreeViewProps> = ({ onNodeClick }) => {
  const allNodes = useMapState((s) => s.nodes);
  const nodes = useMemo(
    () =>
      allNodes.filter(
        (n) =>
          n.goalId === "family" ||
          n.goalId == null ||
          n.treeRelation?.type === "family"
      ),
    [allNodes]
  );
  const treeRoots = useMemo(() => buildTreeStructure(nodes), [nodes]);

  const allRedBranches = useMemo(() => {
    const branches: { root: MapNode; branch: MapNode[] }[] = [];
    function collectBranch(cell: TreeCell, branch: MapNode[]): void {
      cell.nodes.forEach((n) => branch.push(n));
      cell.children.forEach((c) => collectBranch(c, branch));
    }
    function checkRedBranch(cell: TreeCell): { root: MapNode; branch: MapNode[] } | null {
      const branch: MapNode[] = [];
      collectBranch(cell, branch);
      if (branch.length >= 2 && branch.every((n) => n.ring === "red")) return { root: cell.nodes[0]!, branch };
      for (const c of cell.children) {
        const sub = checkRedBranch(c);
        if (sub) return sub;
      }
      return null;
    }
    treeRoots.forEach((r) => {
      const b = checkRedBranch(r);
      if (b) branches.push(b);
    });
    return branches;
  }, [treeRoots]);

  if (nodes.length === 0) {
    return (
      <div className="mt-6 p-6 rounded-2xl bg-slate-100/80 border border-slate-200 border-dashed text-center">
        <p className="text-sm font-semibold text-slate-700">{mapCopy.familyTreeEmpty}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 w-full max-w-4xl mx-auto text-center overflow-x-auto">
      <p className="text-sm text-slate-600 mb-4">{mapCopy.familyTreeHint}</p>
      {allRedBranches.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border-2 border-rose-200 text-right space-y-3">
          <p className="text-sm font-semibold text-rose-900">
            {mapCopy.insightInheritedPattern(allRedBranches.map((b) => b.root.label).join(" و "))}
          </p>
          <div className="flex flex-wrap gap-2 justify-end">
            {allRedBranches.map((b) => (
              <FocusTraumaRecoveryButton key={b.root.id} rootId={b.root.id} rootLabel={b.root.label} />
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col items-center gap-10 py-4">
        {treeRoots.map((root) => (
          <TreeNodeBlock key={root.nodes.map((n) => n.id).join("-")} cell={root} onSelect={onNodeClick} />
        ))}
      </div>
    </div>
  );
};


