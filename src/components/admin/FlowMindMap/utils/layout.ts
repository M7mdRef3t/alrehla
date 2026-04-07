import type { FlowNode, Position } from "../types";
import { CARD_W, CARD_H, MAX_ABS_COORD, CANVAS_SIZE, H_GAP, V_GAP, TOP_PAD } from "../constants";

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
  // Keep all positions from current that exist in layout (prefer user-dragged positions)
  for (const [id, pos] of Object.entries(layout)) {
    next[id] = current[id] ?? pos;
  }
  // Also preserve positions NOT in layout (e.g. custom nodes set via setPositions directly)
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

/* ═══════════════════════════════════════════════════
   Bezier connector path
   ═══════════════════════════════════════════════════ */
export function connectorPath(x1: number, y1: number, x2: number, y2: number): string {
  const dy = y2 - y1;
  const cpOffset = Math.min(Math.abs(dy) * 0.45, 80);
  return `M ${x1} ${y1} C ${x1} ${y1 + cpOffset}, ${x2} ${y2 - cpOffset}, ${x2} ${y2}`;
}

/* ═══════════════════════════════════════════════════
   Tree auto-layout
   ═══════════════════════════════════════════════════ */
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

  // Center the tree in the virtual canvas
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

/* ═══════════════════════════════════════════════════
   LocalStorage
   ═══════════════════════════════════════════════════ */
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
