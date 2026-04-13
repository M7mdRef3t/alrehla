import type { FC } from "react";
import { useMemo } from "react";
import { Target } from "lucide-react";
import { useMapState } from '@/modules/map/dawayirIndex';
import type { RecoveryPath } from "../pathEngine/pathTypes";
import type { MapNode } from "../map/mapTypes";

function isRecoveryPath(x: unknown): x is RecoveryPath {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const phases = o?.phases as Record<string, { tasks?: unknown[] }> | undefined;
  return Array.isArray(phases?.week1?.tasks);
}

export interface TodayTaskInfo {
  nodeId: string;
  nodeLabel: string;
  taskTitle: string;
  taskId: string;
}

function getFirstIncompleteTask(nodes: MapNode[]): TodayTaskInfo | null {
  const withPath = nodes
    .filter((n) => n.recoveryProgress?.recoveryPathSnapshot)
    .sort((a, b) => (b.recoveryProgress?.lastPathGeneratedAt ?? 0) - (a.recoveryProgress?.lastPathGeneratedAt ?? 0));

  for (const node of withPath) {
    const snap = node.recoveryProgress!.recoveryPathSnapshot;
    const completed = node.recoveryProgress?.completedSteps ?? [];
    if (!isRecoveryPath(snap)) continue;
    for (const week of ["week1", "week2", "week3"] as const) {
      const phase = snap.phases[week];
      const tasks = phase?.tasks ?? [];
      for (const task of tasks) {
        if (!completed.includes(task.id)) {
          return {
            nodeId: node.id,
            nodeLabel: node.label,
            taskTitle: task.title,
            taskId: task.id
          };
        }
      }
    }
  }
  return null;
}

interface TodayTaskStripProps {
  onOpenRecoveryPlan: (nodeId: string) => void;
}

export const TodayTaskStrip: FC<TodayTaskStripProps> = ({ onOpenRecoveryPlan }) => {
  const nodes = useMapState((s) => s.nodes);
  const task = useMemo(() => getFirstIncompleteTask(nodes), [nodes]);

  if (!task) return null;

  return (
    <button
      type="button"
      onClick={() => onOpenRecoveryPlan(task.nodeId)}
      className="w-full text-right rounded-xl border-2 border-teal-200 dark:border-teal-700 bg-teal-50/80 dark:bg-teal-900/30 px-3 py-2.5 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors group"
      title={`${task.taskTitle} — لـ ${task.nodeLabel}. اضغط لفتح مسار الحماية.`}
    >
      <p className="text-xs font-semibold text-teal-800 dark:text-teal-200 mb-0.5">
        خطوة اليوم
      </p>
      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 group-hover:text-teal-700 dark:group-hover:text-teal-300">
        {task.taskTitle}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        لـ {task.nodeLabel}
      </p>
      <span className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 mt-1">
        <Target className="w-3.5 h-3.5" />
        افتح مسار الحماية
      </span>
    </button>
  );
};

