/**
 * تجميع بيانات الأطلس — إحصائيات مجمّعة بدون هوية (دور × منطقة × أعراض × مسارات).
 * للاستخدام في لوحة تحكم الأطلس فقط.
 */

import type { MapNode } from "@/modules/map/mapTypes";
import { getAggregateStats, getEventsByDay } from "./journeyTracking";
import { PATH_NAMES } from "@/modules/pathEngine/pathResolver";

export type RoleId = "family" | "work" | "love" | "money" | "unknown";
export type ZoneId = "red" | "yellow" | "green" | "grey";

const ROLE_LABELS: Record<RoleId, string> = {
  family: "العيلة",
  work: "الشغل",
  love: "الحب",
  money: "الفلوس والحياة",
  unknown: "غير محدد"
};

export interface PainHeatmapCell {
  role: RoleId;
  zone: ZoneId;
  count: number;
  roleLabel: string;
  zoneLabel: string;
}

function normalizeRole(goalId: string | undefined): RoleId {
  if (!goalId) return "unknown";
  if (["family", "work", "love", "money"].includes(goalId)) return goalId as RoleId;
  return "unknown";
}

function zoneFromNode(node: MapNode): ZoneId {
  if (node.isDetached || node.detachmentMode) return "grey";
  return node.ring;
}

/** خريطة الألم الحرارية: دور × منطقة */
export function getPainHeatmapData(nodes: MapNode[]): PainHeatmapCell[] {
  const grid: Record<string, number> = {};
  const roles: RoleId[] = ["family", "work", "love", "money", "unknown"];
  const zones: ZoneId[] = ["red", "yellow", "green", "grey"];
  roles.forEach((r) => zones.forEach((z) => { grid[`${r}-${z}`] = 0; }));

  for (const node of nodes) {
    const role = normalizeRole(node.goalId);
    const zone = zoneFromNode(node);
    const key = `${role}-${zone}`;
    grid[key] = (grid[key] ?? 0) + 1;
  }

  const zoneLabels: Record<ZoneId, string> = {
    red: "أحمر",
    yellow: "أصفر",
    green: "أخضر",
    grey: "رمادي"
  };

  return roles.flatMap((role) =>
    zones.map((zone) => ({
      role,
      zone,
      count: grid[`${role}-${zone}`] ?? 0,
      roleLabel: ROLE_LABELS[role],
      zoneLabel: zoneLabels[zone]
    }))
  );
}

export interface SymptomRoleCount {
  symptomId: string;
  symptomLabel: string;
  role: RoleId;
  roleLabel: string;
  count: number;
}

/** تشريح الأعراض: عرض × دور (لشبكة أو أعمدة) */
export function getSymptomAnatomyData(
  nodes: MapNode[],
  symptomIdToLabel: (id: string) => string
): SymptomRoleCount[] {
  const counts: Record<string, number> = {};
  for (const node of nodes) {
    const role = normalizeRole(node.goalId);
    const ids = node.analysis?.selectedSymptoms ?? [];
    for (const id of ids) {
      const key = `${id}-${role}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.entries(counts).map(([key, count]) => {
    const [symptomId, role] = key.split("-") as [string, RoleId];
    return {
      symptomId,
      symptomLabel: symptomIdToLabel(symptomId),
      role,
      roleLabel: ROLE_LABELS[role] ?? role,
      count
    };
  });
}

export interface RecoveryLabBar {
  pathId: string;
  pathLabel: string;
  starts: number;
  completions: number;
  completionRate: number;
}

/** مختبر التعافي: معدل إكمال المسارات */
export function getRecoveryLabData(): RecoveryLabBar[] {
  const stats = getAggregateStats();
  const pathIds = Object.keys(stats.byPathId);
  return pathIds.map((pathId) => {
    const row = stats.byPathId[pathId]!;
    const rate = row.starts > 0 ? Math.round((row.completions / row.starts) * 100) : 0;
    return {
      pathId,
      pathLabel: PATH_NAMES[pathId as keyof typeof PATH_NAMES] ?? pathId,
      starts: row.starts,
      completions: row.completions,
      completionRate: rate
    };
  }).filter((r) => r.starts > 0);
}

export interface CollectiveConsciousnessPoint {
  date: string;
  pathStarts: number;
  taskCompletions: number;
  nodesAdded: number;
  moodAvg: number | null;
}

/** مؤشر الوعي الجماعي: سلاسل زمنية */
export function getCollectiveConsciousnessData(): CollectiveConsciousnessPoint[] {
  const days = getEventsByDay();
  return days.map((d) => ({
    date: d.date,
    pathStarts: d.pathStarts,
    taskCompletions: d.taskCompletions,
    nodesAdded: d.nodesAdded,
    moodAvg: d.moodCount > 0 ? Math.round((d.moodSum / d.moodCount) * 10) / 10 : null
  }));
}

/** تنبيهات بسيطة — مثلاً: انسحاب عالي في مسار معين */
export function getAtlasAlerts(): string[] {
  const stats = getAggregateStats();
  const alerts: string[] = [];
  for (const [pathId, row] of Object.entries(stats.byPathId)) {
    if (row.starts < 5) continue;
    const rate = row.completions / row.starts;
    if (rate <= 0.4) {
      const name = PATH_NAMES[pathId as keyof typeof PATH_NAMES] ?? pathId;
      alerts.push(`معدل إكمال منخفض في "${name}" (${Math.round(rate * 100)}%). قد تحتاج مراجعة صعوبة التمارين.`);
    }
  }
  return alerts;
}

