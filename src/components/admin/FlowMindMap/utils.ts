import { FlowNode, Position, FlowNodeOverride, FlowSnapshot } from "./types";
import { CARD_W, CARD_H, H_GAP, V_GAP, TOP_PAD, CANVAS_SIZE } from "./constants";

export interface CardStyle {
  bg: string;
  border: string;
  borderHover: string;
  labelColor: string;
  titleColor: string;
  actionColor: string;
  countColor: string;
  glow: string;
  stripe: string;
}

export const variantConfig: Record<string, CardStyle> = {
  root: {
    bg: "#1e293b",
    border: "#334155",
    borderHover: "#475569",
    labelColor: "#94a3b8",
    titleColor: "#f8fafc",
    actionColor: "#94a3b8",
    countColor: "#5eead4",
    glow: "rgba(30,41,59,0.25)",
    stripe: "#3b82f6"
  },
  branch: {
    bg: "#ffffff",
    border: "#e2e8f0",
    borderHover: "#cbd5e1",
    labelColor: "#64748b",
    titleColor: "#1e293b",
    actionColor: "#64748b",
    countColor: "#0d9488",
    glow: "rgba(148,163,184,0.15)",
    stripe: "#64748b"
  },
  "branch-amber": {
    bg: "#fffbeb",
    border: "#fcd34d",
    borderHover: "#f59e0b",
    labelColor: "#b45309",
    titleColor: "#78350f",
    actionColor: "#b45309",
    countColor: "#d97706",
    glow: "rgba(251,191,36,0.15)",
    stripe: "#f59e0b"
  },
  "sub-rose": {
    bg: "#fff1f2",
    border: "#fda4af",
    borderHover: "#fb7185",
    labelColor: "#e11d48",
    titleColor: "#881337",
    actionColor: "#e11d48",
    countColor: "#e11d48",
    glow: "rgba(251,113,133,0.15)",
    stripe: "#f43f5e"
  },
  "sub-teal": {
    bg: "#f0fdfa",
    border: "#5eead4",
    borderHover: "#2dd4bf",
    labelColor: "#0f766e",
    titleColor: "#134e4a",
    actionColor: "#0f766e",
    countColor: "#0d9488",
    glow: "rgba(94,234,212,0.15)",
    stripe: "#14b8a6"
  },
  "sub-slate": {
    bg: "#f8fafc",
    border: "#cbd5e1",
    borderHover: "#94a3b8",
    labelColor: "#64748b",
    titleColor: "#475569",
    actionColor: "#64748b",
    countColor: "#64748b",
    glow: "rgba(148,163,184,0.12)",
    stripe: "#94a3b8"
  }
};

export function getVariantKey(node: FlowNode): string {
  if (node.variant === "root") return "root";
  if (node.variant === "branch" && node.accent === "amber") return "branch-amber";
  if (node.variant === "branch") return "branch";
  if (node.accent === "rose") return "sub-rose";
  if (node.accent === "teal") return "sub-teal";
  if (node.accent === "slate") return "sub-slate";
  return "branch";
}

export function getStyle(node: FlowNode): CardStyle {
  return variantConfig[getVariantKey(node)] || variantConfig.branch;
}

export function getDecisionOutcome(node: FlowNode): "success" | "failure" | "neutral" {
  if (node.accent === "teal") return "success";
  if (node.accent === "rose") return "failure";
  return "neutral";
}

export const PHASE_LANE_META: Record<string, { fill: string; border: string; text: string }> = {
  "phase-pre-auth-v2": {
    fill: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.38)",
    text: "#b45309"
  },
  "phase-auth-v2": {
    fill: "rgba(20, 184, 166, 0.07)",
    border: "rgba(20, 184, 166, 0.34)",
    text: "#0f766e"
  },
  "phase-core-v2": {
    fill: "rgba(59, 130, 246, 0.07)",
    border: "rgba(59, 130, 246, 0.32)",
    text: "#1d4ed8"
  }
};

export function isValidAccent(value: unknown): value is NonNullable<FlowNode["accent"]> {
  return value === "teal" || value === "amber" || value === "rose" || value === "slate";
}

export function isValidVariant(value: unknown): value is FlowNode["variant"] {
  return value === "root" || value === "branch" || value === "sub";
}

export function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Position>;
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
}

export function mergePositionsWithLayout(
  current: Record<string, Position>,
  layout: Record<string, Position>
): Record<string, Position> {
  const next: Record<string, Position> = {};
  for (const [id, pos] of Object.entries(layout)) {
    next[id] = current[id] ?? pos;
  }
  for (const [id, pos] of Object.entries(current)) {
    if (!(id in next)) {
      next[id] = pos;
    }
  }
  return next;
}

export function arePositionsEqual(a: Record<string, Position>, b: Record<string, Position>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    const posA = a[key];
    const posB = b[key];
    if (!posB) return false;
    if (posA.x !== posB.x || posA.y !== posB.y) return false;
  }
  return true;
}

export function isOverlapping(a: Position, b: Position): boolean {
  return !(
    a.x + CARD_W <= b.x
    || b.x + CARD_W <= a.x
    || a.y + CARD_H <= b.y
    || b.y + CARD_H <= a.y
  );
}

export function connectorPath(x1: number, y1: number, x2: number, y2: number): string {
  const dy = y2 - y1;
  const cpOffset = Math.min(Math.abs(dy) * 0.45, 80);
  return `M ${x1} ${y1} C ${x1} ${y1 + cpOffset}, ${x2} ${y2 - cpOffset}, ${x2} ${y2}`;
}

export function computeTreeLayout(
  nodes: FlowNode[],
  links: Array<[string, string]>
): Record<string, { x: number; y: number }> {
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  for (const [childId, parentId] of links) {
    parentMap.set(childId, parentId);
    const arr = childrenMap.get(parentId) || [];
    arr.push(childId);
    childrenMap.set(parentId, arr);
  }

  const roots = nodes.filter(n => !parentMap.has(n.id));

  const subtreeW = new Map<string, number>();
  function calcWidth(id: string): number {
    const ch = childrenMap.get(id) || [];
    if (ch.length === 0) { subtreeW.set(id, CARD_W); return CARD_W; }
    const total = ch.reduce((s, c) => s + calcWidth(c), 0) + (ch.length - 1) * H_GAP;
    const w = Math.max(CARD_W, total);
    subtreeW.set(id, w);
    return w;
  }
  for (const r of roots) calcWidth(r.id);
  for (const n of nodes) { if (!subtreeW.has(n.id)) subtreeW.set(n.id, CARD_W); }

  const pos: Record<string, { x: number; y: number }> = {};

  function layout(id: string, cx: number, y: number) {
    pos[id] = { x: cx - CARD_W / 2, y };
    const ch = childrenMap.get(id) || [];
    if (ch.length === 0) return;
    const totalW = ch.reduce((s, c) => s + (subtreeW.get(c) || CARD_W), 0) + (ch.length - 1) * H_GAP;
    let sx = cx - totalW / 2;
    const childY = y + CARD_H + V_GAP;
    for (const c of ch) {
      const w = subtreeW.get(c) || CARD_W;
      layout(c, sx + w / 2, childY);
      sx += w + H_GAP;
    }
  }

  const rootWidths = roots.map(r => subtreeW.get(r.id) || CARD_W);
  const totalRootW = rootWidths.reduce((s, w) => s + w, 0) + Math.max(0, roots.length - 1) * H_GAP;
  const centerX = CANVAS_SIZE / 2;
  let rx = centerX - totalRootW / 2;
  for (let i = 0; i < roots.length; i++) {
    const w = rootWidths[i];
    layout(roots[i].id, rx + w / 2, CANVAS_SIZE / 2 - 150 + TOP_PAD);
    rx += w + H_GAP;
  }

  return pos;
}

export function areLinksEqual(a: Array<[string, string]>, b: Array<[string, string]>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

export function applyPresetToLayout(
  preset: Record<string, Position> | null,
  layout: Record<string, Position>
): Record<string, Position> {
  if (!preset) return layout;
  const next: Record<string, Position> = {};
  for (const [id, fallback] of Object.entries(layout)) {
    next[id] = preset[id] ?? fallback;
  }
  return next;
}

export function cloneSnapshot(snapshot: FlowSnapshot): FlowSnapshot {
  return {
    customNodes: snapshot.customNodes.map((node) => ({ ...node })),
    customLinks: snapshot.customLinks.map(([childId, parentId]) => [childId, parentId] as [string, string]),
    positions: Object.fromEntries(
      Object.entries(snapshot.positions).map(([id, pos]) => [id, { x: pos.x, y: pos.y }])
    ),
    baseOverrides: Object.fromEntries(
      Object.entries(snapshot.baseOverrides).map(([id, override]) => [id, { ...override }])
    ),
    hiddenBaseNodeIds: new Set(snapshot.hiddenBaseNodeIds),
    lockedNodeIds: new Set(snapshot.lockedNodeIds)
  };
}
