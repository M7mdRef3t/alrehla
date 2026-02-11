import type { FC } from "react";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus, RotateCcw, ZoomIn, ZoomOut, Maximize2,
  GripVertical, MousePointer2, Hand, Trash2
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
export interface FlowNode {
  id: string;
  scenarioLabel: string;
  title: string;
  action: string;
  count?: number;
  variant: "root" | "branch" | "sub";
  accent?: "teal" | "amber" | "rose" | "slate";
}

interface FlowMindMapProps {
  nodes: FlowNode[];
  links: Array<[string, string]>;
  showReset?: boolean;
  allowAddCards?: boolean;
}

type Position = { x: number; y: number };
type FlowNodeOverride = {
  scenarioLabel?: string;
  title?: string;
  action?: string;
};
type EditorMode = "add" | "edit";

/* ═══════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════ */
const STORAGE_KEY = "flow-map-custom";
const POS_STORAGE_KEY = "flow-map-positions";
const ZOOM_STORAGE_KEY = "flow-map-zoom";
const OVERRIDES_STORAGE_KEY = "flow-map-overrides";

const CARD_W = 200;
const CARD_H = 100;
const H_GAP = 50;
const V_GAP = 70;
const TOP_PAD = 80;

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;
const CANVAS_SIZE = 4000; // virtual infinite canvas size
const MINIMAP_SIZE = { w: 140, h: 100 } as const;
const MAX_ABS_COORD = CANVAS_SIZE * 3;
const MAX_ABS_PAN = CANVAS_SIZE * 4;

/* ═══════════════════════════════════════════════════
   Variant styling — Miro-inspired clean cards
   ═══════════════════════════════════════════════════ */
interface CardStyle {
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

const variantConfig: Record<string, CardStyle> = {
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

function getVariantKey(node: FlowNode): string {
  if (node.variant === "root") return "root";
  if (node.variant === "branch" && node.accent === "amber") return "branch-amber";
  if (node.variant === "branch") return "branch";
  if (node.accent === "rose") return "sub-rose";
  if (node.accent === "teal") return "sub-teal";
  if (node.accent === "slate") return "sub-slate";
  return "branch";
}

function getStyle(node: FlowNode): CardStyle {
  return variantConfig[getVariantKey(node)] || variantConfig.branch;
}

function isValidAccent(value: unknown): value is NonNullable<FlowNode["accent"]> {
  return value === "teal" || value === "amber" || value === "rose" || value === "slate";
}

function isValidVariant(value: unknown): value is FlowNode["variant"] {
  return value === "root" || value === "branch" || value === "sub";
}

function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Position>;
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
}

function mergePositionsWithLayout(
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

function arePositionsEqual(a: Record<string, Position>, b: Record<string, Position>): boolean {
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

/* ═══════════════════════════════════════════════════
   Bezier connector path
   ═══════════════════════════════════════════════════ */
function connectorPath(x1: number, y1: number, x2: number, y2: number): string {
  const dy = y2 - y1;
  const cpOffset = Math.min(Math.abs(dy) * 0.45, 80);
  return `M ${x1} ${y1} C ${x1} ${y1 + cpOffset}, ${x2} ${y2 - cpOffset}, ${x2} ${y2}`;
}

/* ═══════════════════════════════════════════════════
   Tree auto-layout
   ═══════════════════════════════════════════════════ */
function computeTreeLayout(
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
function loadCustom(): { nodes: FlowNode[]; links: Array<[string, string]> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { nodes: [], links: [] };
    const parsed = JSON.parse(raw) as { nodes?: unknown; links?: unknown };
    const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const nodes: FlowNode[] = [];
    const nodeIds = new Set<string>();
    for (const item of rawNodes) {
      if (!item || typeof item !== "object") continue;
      const node = item as Partial<FlowNode>;
      const id = typeof node.id === "string" ? node.id.trim() : "";
      if (!id || nodeIds.has(id)) continue;
      nodeIds.add(id);
      nodes.push({
        id,
        scenarioLabel: typeof node.scenarioLabel === "string" ? node.scenarioLabel : "",
        title: typeof node.title === "string" ? node.title : "",
        action: typeof node.action === "string" ? node.action : "",
        count: typeof node.count === "number" && Number.isFinite(node.count) ? node.count : undefined,
        variant: isValidVariant(node.variant) ? node.variant : "sub",
        accent: isValidAccent(node.accent) ? node.accent : undefined
      });
    }

    const rawLinks = Array.isArray(parsed.links) ? parsed.links : [];
    const links: Array<[string, string]> = [];
    const seen = new Set<string>();
    for (const item of rawLinks) {
      if (!Array.isArray(item) || item.length < 2) continue;
      const childId = typeof item[0] === "string" ? item[0] : "";
      const parentId = typeof item[1] === "string" ? item[1] : "";
      if (!childId || !parentId || childId === parentId) continue;
      // child must be a custom node; parent can be any node (base or custom)
      if (!nodeIds.has(childId)) continue;
      const key = `${childId}->${parentId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push([childId, parentId]);
    }
    return { nodes, links };
  } catch { return { nodes: [], links: [] }; }
}
function saveCustom(nodes: FlowNode[], links: Array<[string, string]>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, links })); } catch { /* */ }
}
function loadPositions(): Record<string, Position> | null {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    const positions: Record<string, Position> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!isPosition(value)) continue;
      if (Math.abs(value.x) > MAX_ABS_COORD || Math.abs(value.y) > MAX_ABS_COORD) continue;
      positions[id] = { x: value.x, y: value.y };
    }
    return positions;
  } catch { return null; }
}
function savePositions(pos: Record<string, Position>) {
  try { localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos)); } catch { /* */ }
}
function loadZoom(): { zoom: number; panX: number; panY: number } | null {
  try {
    const raw = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { zoom?: unknown; panX?: unknown; panY?: unknown };
    const rawZoom = typeof parsed.zoom === "number" && Number.isFinite(parsed.zoom) ? parsed.zoom : 0.85;
    const rawPanX = typeof parsed.panX === "number" && Number.isFinite(parsed.panX) ? parsed.panX : 0;
    const rawPanY = typeof parsed.panY === "number" && Number.isFinite(parsed.panY) ? parsed.panY : 0;
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rawZoom));
    const panX = Math.abs(rawPanX) > MAX_ABS_PAN ? 0 : rawPanX;
    const panY = Math.abs(rawPanY) > MAX_ABS_PAN ? 0 : rawPanY;
    return { zoom, panX, panY };
  } catch { return null; }
}
function saveZoom(z: { zoom: number; panX: number; panY: number }) {
  try { localStorage.setItem(ZOOM_STORAGE_KEY, JSON.stringify(z)); } catch { /* */ }
}

function loadOverrides(): Record<string, FlowNodeOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const result: Record<string, FlowNodeOverride> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const candidate = value as Partial<FlowNodeOverride>;
      const override: FlowNodeOverride = {};
      if (typeof candidate.scenarioLabel === "string") override.scenarioLabel = candidate.scenarioLabel;
      if (typeof candidate.title === "string") override.title = candidate.title;
      if (typeof candidate.action === "string") override.action = candidate.action;
      if (Object.keys(override).length > 0) result[id] = override;
    }
    return result;
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, FlowNodeOverride>) {
  try { localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides)); } catch { /* */ }
}

function areLinksEqual(a: Array<[string, string]>, b: Array<[string, string]>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
export const FlowMindMap: FC<FlowMindMapProps> = ({
  nodes: baseNodes,
  links: baseLinks,
  showReset = true,
  allowAddCards = true
}) => {
  /* ── Data ── */
  const initialCustom = useMemo(() => loadCustom(), []);
  const [baseOverrides, setBaseOverrides] = useState<Record<string, FlowNodeOverride>>(() => loadOverrides());
  const [customNodes, setCustomNodes] = useState<FlowNode[]>(initialCustom.nodes);
  const [customLinks, setCustomLinks] = useState<Array<[string, string]>>(initialCustom.links);
  const customNodeIds = useMemo(() => new Set(customNodes.map((node) => node.id)), [customNodes]);
  const allParentIds = useMemo(
    () => new Set([...baseNodes.map((node) => node.id), ...customNodes.map((node) => node.id)]),
    [baseNodes, customNodes]
  );
  const validCustomLinks = useMemo(
    () =>
      customLinks.filter(
        ([childId, parentId]) => customNodeIds.has(childId) && allParentIds.has(parentId) && childId !== parentId
      ),
    [allParentIds, customLinks, customNodeIds]
  );
  const baseNodeById = useMemo(() => new Map(baseNodes.map((node) => [node.id, node])), [baseNodes]);
  const effectiveBaseNodes = useMemo(
    () =>
      baseNodes.map((node) => {
        const override = baseOverrides[node.id];
        if (!override) return node;
        return {
          ...node,
          scenarioLabel: override.scenarioLabel ?? node.scenarioLabel,
          title: override.title ?? node.title,
          action: override.action ?? node.action
        };
      }),
    [baseNodes, baseOverrides]
  );
  const nodes = useMemo(() => [...effectiveBaseNodes, ...customNodes], [effectiveBaseNodes, customNodes]);
  const links = useMemo(() => [...baseLinks, ...validCustomLinks], [baseLinks, validCustomLinks]);

  /* ── Tree layout ── */
  const autoLayout = useMemo(() => computeTreeLayout(nodes, links), [nodes, links]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    const stored = loadPositions();
    if (stored) {
      // Detect old-format positions (from pre-Miro version with small coords)
      const vals = Object.values(stored);
      const maxCoord = Math.max(...vals.map(p => Math.max(p.x, p.y)), 0);
      if (vals.length > 0 && maxCoord < 500) {
        // Old format — discard and use fresh auto-layout
        try { localStorage.removeItem(POS_STORAGE_KEY); } catch { /* */ }
        return autoLayout;
      }
      return mergePositionsWithLayout(stored, autoLayout);
    }
    return autoLayout;
  });

  const visiblePositions = useMemo(() => {
    const next: Record<string, Position> = {};
    for (const node of nodes) {
      const pos = positions[node.id] ?? autoLayout[node.id];
      if (pos) next[node.id] = pos;
    }
    return next;
  }, [autoLayout, nodes, positions]);

  useEffect(() => {
    setPositions(prev => {
      const next = mergePositionsWithLayout(prev, autoLayout);
      return arePositionsEqual(prev, next) ? prev : next;
    });
  }, [autoLayout]);

  useEffect(() => {
    if (areLinksEqual(customLinks, validCustomLinks)) return;
    setCustomLinks(validCustomLinks);
  }, [customLinks, validCustomLinks]);

  useEffect(() => { saveOverrides(baseOverrides); }, [baseOverrides]);
  useEffect(() => { saveCustom(customNodes, validCustomLinks); }, [customNodes, validCustomLinks]);
  useEffect(() => { savePositions(positions); }, [positions]);

  /* ── Zoom & Pan (infinite canvas) ── */
  const containerRef = useRef<HTMLDivElement>(null);

  const initialZoomState = useMemo(() => loadZoom(), []);
  const hadStoredZoomAtInit = useRef(Boolean(initialZoomState));
  const [zoom, setZoom] = useState(() => initialZoomState?.zoom ?? 0.85);
  const [panX, setPanX] = useState(() => initialZoomState?.panX ?? -(CANVAS_SIZE / 2 - 400));
  const [panY, setPanY] = useState(() => initialZoomState?.panY ?? -(CANVAS_SIZE / 2 - 200));

  useEffect(() => { saveZoom({ zoom, panX, panY }); }, [zoom, panX, panY]);

  // Refs that always hold latest values — eliminates stale closures in callbacks
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const linksRef = useRef(links);
  linksRef.current = links;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  /* ── Interaction mode ── */
  type Tool = "select" | "pan";
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /* ── Canvas panning ── */
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-card]") || target.closest("[data-toolbar]") || target.closest("[data-modal]")) return;

    // Deselect
    setSelectedId(null);

    // Pan with middle button, or in pan tool mode, or with space held
    if (e.button === 1 || tool === "pan" || spaceHeld.current) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, panX, panY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, [tool, panX, panY]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPanX(panStart.current.panX + dx);
    setPanY(panStart.current.panY + dy);
  }, []);

  const handleCanvasPointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  /* ── Wheel zoom ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Get mouse position relative to container
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Canvas position under mouse before zoom
      const worldX = (mx - panX) / zoom;
      const worldY = (my - panY) / zoom;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));

      // Adjust pan so the point under mouse stays fixed
      setPanX(mx - worldX * newZoom);
      setPanY(my - worldY * newZoom);
      setZoom(newZoom);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, panX, panY]);

  /* ── Space key for temporary pan ── */
  const spaceHeld = useRef(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !(e.target as HTMLElement).closest("input,textarea")) {
        e.preventDefault();
        spaceHeld.current = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  /* ── Node dragging ── */
  const dragRef = useRef<{ id: string; startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleNodePointerDown = useCallback((id: string, e: React.PointerEvent) => {
    if (tool !== "select") return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("input") || target.closest("button")) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pos = positions[id];
    if (!pos) return;
    setSelectedId(id);
    setDraggingId(id);
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, startLeft: pos.x, startTop: pos.y };
  }, [tool, positions]);

  const handleNodePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / zoom;
    const dy = (e.clientY - d.startY) / zoom;
    setPositions(prev => ({
      ...prev,
      [d.id]: { x: d.startLeft + dx, y: d.startTop + dy }
    }));
  }, [zoom]);

  const handleNodePointerUp = useCallback(() => {
    setDraggingId(null);
    dragRef.current = null;
  }, []);

  /* ── Context menu ── */
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!contextMenu) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-context-menu]")) return;
      setContextMenu(null);
    };
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [contextMenu]);

  /* ── Add / Edit card ── */
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [editorState, setEditorState] = useState<{ nodeId: string; isCustom: boolean; mode: EditorMode } | null>(null);
  const [editorScenarioLabel, setEditorScenarioLabel] = useState("");
  const [editorTitle, setEditorTitle] = useState("");
  const [editorAction, setEditorAction] = useState("");
  const editorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-toolbar]")) setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [addMenuOpen]);

  useEffect(() => {
    if (!editorState) return;
    requestAnimationFrame(() => editorInputRef.current?.focus());
  }, [editorState]);

  const openEditorFromNode = useCallback((nodeId: string, mode: EditorMode = "edit") => {
    const node = nodeById.get(nodeId);
    if (!node) return;
    setEditorState({ nodeId, isCustom: nodeId.startsWith("custom-"), mode });
    setEditorScenarioLabel(node.scenarioLabel ?? "");
    setEditorTitle(node.title ?? "");
    setEditorAction(node.action ?? "");
  }, [nodeById]);

  const createCustomNode = useCallback((parentId: string): FlowNode | null => {
    // Read latest values from refs to avoid stale closures
    const latestPositions = positionsRef.current;
    const latestLinks = linksRef.current;
    const currentZoom = zoomRef.current;

    const parentPos = latestPositions[parentId];
    const siblingsCount = latestLinks.filter(([, p]) => p === parentId).length;
    const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newNode: FlowNode = {
      id: newId,
      scenarioLabel: "مخصص",
      title: "كارت جديد",
      action: "",
      variant: "sub",
      accent: "slate"
    };
    const newX = (parentPos?.x ?? CANVAS_SIZE / 2) + siblingsCount * (CARD_W + 20);
    const newY = (parentPos?.y ?? CANVAS_SIZE / 2) + CARD_H + V_GAP;

    // Batch all state updates together
    setCustomNodes(prev => [...prev, newNode]);
    setCustomLinks(prev => [...prev, [newId, parentId] as [string, string]]);
    setPositions(prev => ({ ...prev, [newId]: { x: newX, y: newY } }));
    setSelectedId(newId);
    setNewlyCreatedId(newId);

    // Pan camera to center on the new card (synchronous — React batches all together)
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setPanX(rect.width / 2 - (newX + CARD_W / 2) * currentZoom);
      setPanY(rect.height / 2 - (newY + CARD_H / 2) * currentZoom);
    }

    // Clear the "newly created" highlight after animation
    setTimeout(() => setNewlyCreatedId(null), 1200);

    return newNode;
  }, []);

  const handleSaveEditor = useCallback(() => {
    if (!editorState) return;
    const scenarioLabel = editorScenarioLabel.trim();
    const title = editorTitle.trim();
    const action = editorAction.trim();
    if (!title) return;

    if (editorState.isCustom) {
      setCustomNodes((prev) =>
        prev.map((node) =>
          node.id === editorState.nodeId
            ? { ...node, scenarioLabel, title, action }
            : node
        )
      );
    } else {
      const base = baseNodeById.get(editorState.nodeId);
      if (base) {
        setBaseOverrides((prev) => {
          const sameAsBase =
            scenarioLabel === (base.scenarioLabel ?? "") &&
            title === (base.title ?? "") &&
            action === (base.action ?? "");
          if (sameAsBase) {
            if (!prev[editorState.nodeId]) return prev;
            const next = { ...prev };
            delete next[editorState.nodeId];
            return next;
          }
          return {
            ...prev,
            [editorState.nodeId]: { scenarioLabel, title, action }
          };
        });
      }
    }
    setEditorState(null);
  }, [baseNodeById, editorAction, editorScenarioLabel, editorState, editorTitle]);

  /* ── Actions ── */
  const handleReset = () => {
    // Clear ALL custom data and reset to base layout
    setCustomNodes([]);
    setCustomLinks([]);
    setBaseOverrides({});
    setNewlyCreatedId(null);
    setSelectedId(null);
    setContextMenu(null);
    setEditorState(null);
    try {
      localStorage.removeItem(POS_STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ZOOM_STORAGE_KEY);
      localStorage.removeItem(OVERRIDES_STORAGE_KEY);
    } catch { /* */ }
    // Recompute fresh layout from base nodes only
    const freshLayout = computeTreeLayout(baseNodes, baseLinks);
    setPositions(freshLayout);
    // Fit view after reset
    requestAnimationFrame(() => fitToView());
  };

  const handleDeleteNode = useCallback((nodeId: string) => {
    // Use ref to get latest links
    const allLinks = linksRef.current;
    const toDelete = new Set<string>();
    function collect(id: string) {
      toDelete.add(id);
      for (const [childId, parentId] of allLinks) {
        if (parentId === id && !toDelete.has(childId)) collect(childId);
      }
    }
    collect(nodeId);
    setCustomNodes(p => p.filter(n => !toDelete.has(n.id)));
    setCustomLinks(p => p.filter(([c]) => !toDelete.has(c)));
    setPositions((prev) => {
      let changed = false;
      const next: Record<string, Position> = {};
      for (const [id, pos] of Object.entries(prev)) {
        if (toDelete.has(id)) {
          changed = true;
          continue;
        }
        next[id] = pos;
      }
      return changed ? next : prev;
    });
    setContextMenu(null);
    setSelectedId(null);
  }, []);

  const handleResetBaseText = useCallback((nodeId: string) => {
    setBaseOverrides((prev) => {
      if (!prev[nodeId]) return prev;
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
    setContextMenu(null);
  }, []);

  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const allPos = Object.values(visiblePositions);
    if (allPos.length === 0) return;

    const minX = Math.min(...allPos.map(p => p.x));
    const maxX = Math.max(...allPos.map(p => p.x)) + CARD_W;
    const minY = Math.min(...allPos.map(p => p.y));
    const maxY = Math.max(...allPos.map(p => p.y)) + CARD_H;

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const rect = container.getBoundingClientRect();

    const padding = 80;
    const scaleX = (rect.width - padding * 2) / contentW;
    const scaleY = (rect.height - padding * 2) / contentH;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_ZOOM), 1.2);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    setPanX(rect.width / 2 - cx * newZoom);
    setPanY(rect.height / 2 - cy * newZoom);
    setZoom(newZoom);
  }, [visiblePositions]);

  // Recovery: if cards exist but none is visible in viewport, auto-center once.
  const lastRecoverAtRef = useRef(0);
  const recoverViewportIfNeeded = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const entries = nodes
      .map((node) => ({ id: node.id, pos: positions[node.id] ?? autoLayout[node.id] }))
      .filter((entry): entry is { id: string; pos: Position } => Boolean(entry.pos));
    if (!entries.length) return;

    const hasVisibleCard = entries.some(({ pos }) => {
      const left = pos.x * zoom + panX;
      const top = pos.y * zoom + panY;
      const right = left + CARD_W * zoom;
      const bottom = top + CARD_H * zoom;
      return right > 0 && bottom > 0 && left < rect.width && top < rect.height;
    });
    if (hasVisibleCard) return;

    const now = Date.now();
    if (now - lastRecoverAtRef.current < 800) return;
    lastRecoverAtRef.current = now;
    fitToView();
  }, [autoLayout, fitToView, nodes, panX, panY, positions, zoom]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => recoverViewportIfNeeded());
    return () => cancelAnimationFrame(raf);
  }, [recoverViewportIfNeeded]);

  // Fit/recover on first mount.
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current) return;
    didFit.current = true;

    if (!hadStoredZoomAtInit.current) {
      const raf = requestAnimationFrame(() => fitToView());
      return () => cancelAnimationFrame(raf);
    }

    const raf = requestAnimationFrame(() => recoverViewportIfNeeded());
    const t1 = window.setTimeout(() => recoverViewportIfNeeded(), 250);
    const t2 = window.setTimeout(() => recoverViewportIfNeeded(), 900);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [fitToView, recoverViewportIfNeeded]);

  /* ── Delete key ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId?.startsWith("custom-") && !(e.target as HTMLElement).closest("input,textarea")) {
        handleDeleteNode(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDeleteNode, selectedId]);

  /* ── SVG paths ── */
  const svgPaths = useMemo(() => {
    const result: Array<{ d: string; color: string }> = [];
    for (const [childId, parentId] of links) {
      const from = positions[parentId] ?? autoLayout[parentId];
      const to = positions[childId] ?? autoLayout[childId];
      if (!from || !to) continue;
      const x1 = from.x + CARD_W / 2;
      const y1 = from.y + CARD_H;
      const x2 = to.x + CARD_W / 2;
      const y2 = to.y;

      // Find child node to color the connection
      const childNode = nodeById.get(childId);
      const style = childNode ? getStyle(childNode) : variantConfig.branch;

      result.push({ d: connectorPath(x1, y1, x2, y2), color: style.stripe });
    }
    return result;
  }, [links, positions, autoLayout, nodeById]);

  /* ── Minimap ── */
  const minimap = useMemo(() => {
    const entries = Object.entries(visiblePositions);
    const allPos = entries.map(([, pos]) => pos);
    if (allPos.length === 0) return null;
    const minX = Math.min(...allPos.map(p => p.x)) - 50;
    const maxX = Math.max(...allPos.map(p => p.x)) + CARD_W + 50;
    const minY = Math.min(...allPos.map(p => p.y)) - 50;
    const maxY = Math.max(...allPos.map(p => p.y)) + CARD_H + 50;
    const contentW = maxX - minX || 1;
    const contentH = maxY - minY || 1;
    const scale = Math.min(MINIMAP_SIZE.w / contentW, MINIMAP_SIZE.h / contentH);

    return {
      minX, minY, scale, contentW, contentH,
      nodes: entries.map(([id, p]) => {
        const node = nodeById.get(id);
        const style = node ? getStyle(node) : variantConfig.branch;
        return {
          id,
          x: (p.x - minX) * scale,
          y: (p.y - minY) * scale,
          w: CARD_W * scale,
          h: CARD_H * scale,
          color: style.stripe
        };
      })
    };
  }, [visiblePositions, nodeById]);

  // Viewport rect on minimap
  const viewportRect = useMemo(() => {
    if (!minimap || !containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (-panX / zoom - minimap.minX) * minimap.scale;
    const y = (-panY / zoom - minimap.minY) * minimap.scale;
    const w = (rect.width / zoom) * minimap.scale;
    const h = (rect.height / zoom) * minimap.scale;
    return { x, y, w, h };
  }, [minimap, panX, panY, zoom]);

  /* ── Render ── */
  const cursorStyle = tool === "pan" || spaceHeld.current || isPanning.current
    ? "cursor-grab active:cursor-grabbing"
    : "cursor-default";
  const contextNode = contextMenu ? nodeById.get(contextMenu.nodeId) ?? null : null;
  const contextIsCustom = Boolean(contextNode?.id.startsWith("custom-"));
  const contextHasBaseOverride = Boolean(contextNode && !contextIsCustom && baseOverrides[contextNode.id]);

  return (
    <div className="flow-miro-root" style={{ position: "relative", width: "100%", height: "550px" }}>
      {/* ═══ Main Canvas ═══ */}
      <div
        ref={containerRef}
        className={`flow-miro-canvas ${cursorStyle}`}
        style={{
          position: "absolute", inset: 0, overflow: "hidden",
          borderRadius: 12, border: "1px solid #e2e8f0",
          background: "#f8fafc"
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      >
        {/* ── Grid background ── */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <pattern
              id="miro-grid-small"
              width={20 * zoom} height={20 * zoom}
              patternUnits="userSpaceOnUse"
              x={panX % (20 * zoom)} y={panY % (20 * zoom)}
            >
              <circle cx="1" cy="1" r={Math.max(0.4, 0.5 * zoom)} fill="#cbd5e1" opacity={zoom > 0.5 ? 0.4 : 0} />
            </pattern>
            <pattern
              id="miro-grid-large"
              width={100 * zoom} height={100 * zoom}
              patternUnits="userSpaceOnUse"
              x={panX % (100 * zoom)} y={panY % (100 * zoom)}
            >
              <circle cx="1" cy="1" r={Math.max(0.8, 1.2 * zoom)} fill="#94a3b8" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#miro-grid-small)" />
          <rect width="100%" height="100%" fill="url(#miro-grid-large)" />
        </svg>

        {/* ── Transformed layer ── */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            width: CANVAS_SIZE,
            height: CANVAS_SIZE
          }}
        >
          {/* Connector SVG */}
          <svg
            style={{ position: "absolute", inset: 0, width: CANVAS_SIZE, height: CANVAS_SIZE, pointerEvents: "none" }}
          >
            <defs>
              <marker id="miro-arrow" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 4 L 0 8 Z" fill="#94a3b8" opacity="0.7" />
              </marker>
            </defs>
            {svgPaths.map((p, i) => (
              <g key={i}>
                {/* Shadow */}
                <path d={p.d} fill="none" stroke={p.color} strokeWidth="4" strokeLinecap="round" opacity="0.08" />
                {/* Main line */}
                <path
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={draggingId ? "6 4" : "none"}
                  markerEnd="url(#miro-arrow)"
                  opacity="0.6"
                  style={{ transition: "stroke-dasharray 0.3s" }}
                />
              </g>
            ))}
          </svg>

          {/* Cards */}
          {nodes.map(node => {
            const pos = positions[node.id] ?? autoLayout[node.id];
            if (!pos) return null;
            const s = getStyle(node);
            const isDragging = draggingId === node.id;
            const isSelected = selectedId === node.id;
            const isHovered = hoveredId === node.id;
            const isNewlyCreated = newlyCreatedId === node.id;

            return (
              <div
                key={node.id}
                data-card
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: CARD_W,
                  minHeight: CARD_H - 10,
                  background: s.bg,
                  border: `2px solid ${isSelected ? "#3b82f6" : isHovered ? s.borderHover : s.border}`,
                  borderRadius: 16,
                  padding: "12px 16px",
                  direction: "rtl",
                  textAlign: "right",
                  boxShadow: isNewlyCreated
                    ? `0 0 0 4px rgba(59,130,246,0.4), 0 12px 35px rgba(59,130,246,0.2)`
                    : isSelected
                      ? `0 0 0 3px rgba(59,130,246,0.25), 0 8px 25px ${s.glow}`
                      : isDragging
                        ? `0 12px 35px ${s.glow}, 0 0 0 2px ${s.stripe}40`
                        : `0 2px 8px ${s.glow}`,
                  transform: isDragging ? "scale(1.04)" : isNewlyCreated ? "scale(1.08)" : isHovered ? "scale(1.01)" : "scale(1)",
                  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                  cursor: tool === "select" ? (isDragging ? "grabbing" : "grab") : undefined,
                  zIndex: isDragging ? 100 : isSelected ? 50 : 10,
                  touchAction: "none",
                  userSelect: isDragging ? "none" : undefined,
                  borderLeft: `4px solid ${s.stripe}`
                }}
                onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onPointerCancel={handleNodePointerUp}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onDoubleClick={() => openEditorFromNode(node.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedId(node.id);
                  setContextMenu({ nodeId: node.id, x: e.clientX, y: e.clientY });
                }}
              >
                {/* Drag grip */}
                <div style={{
                  position: "absolute", top: 4, left: 4,
                  opacity: isHovered || isDragging ? 0.5 : 0.15,
                  transition: "opacity 0.2s"
                }}>
                  <GripVertical size={14} color="#94a3b8" />
                </div>

                {node.scenarioLabel && (
                  <div style={{
                    color: s.labelColor, fontSize: 11, fontWeight: 600,
                    marginBottom: 3, letterSpacing: "0.02em",
                    textTransform: "uppercase"
                  }}>
                    {node.scenarioLabel}
                  </div>
                )}

                <div style={{ color: s.titleColor, fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                  {node.title}
                </div>

                {node.action && (
                  <div style={{ color: s.actionColor, fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
                    {node.action}
                  </div>
                )}

                {node.count != null && (
                  <div style={{
                    color: s.countColor, fontSize: 11, fontWeight: 700,
                    marginTop: 6, display: "flex", alignItems: "center",
                    gap: 4, justifyContent: "flex-end"
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: s.countColor, opacity: 0.6
                    }} />
                    {node.count} زائر
                  </div>
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <div style={{
                    position: "absolute", top: -4, right: -4,
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#3b82f6", border: "2px solid white"
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Floating Bottom Toolbar (Miro-style) ═══ */}
      <div
        data-toolbar
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "white",
          borderRadius: 12,
          padding: "4px 6px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)",
          zIndex: 30
        }}
      >
        {/* Tool: Select */}
        <ToolbarBtn
          active={tool === "select"}
          onClick={() => setTool("select")}
          title="تحديد (V)"
        >
          <MousePointer2 size={16} />
        </ToolbarBtn>

        {/* Tool: Pan */}
        <ToolbarBtn
          active={tool === "pan"}
          onClick={() => setTool("pan")}
          title="تحريك (Space)"
        >
          <Hand size={16} />
        </ToolbarBtn>

        <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 4px" }} />

        {/* Zoom out */}
        <ToolbarBtn onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))} title="تصغير">
          <ZoomOut size={16} />
        </ToolbarBtn>

        {/* Zoom display */}
        <button
          type="button"
          onClick={fitToView}
          style={{
            fontSize: 11, fontWeight: 600, color: "#475569",
            padding: "4px 8px", borderRadius: 6, border: "none",
            background: "transparent", cursor: "pointer",
            minWidth: 48, textAlign: "center"
          }}
          title="ملائمة الشاشة"
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* Zoom in */}
        <ToolbarBtn onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))} title="تكبير">
          <ZoomIn size={16} />
        </ToolbarBtn>

        <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 4px" }} />

        {/* Fit to view */}
        <ToolbarBtn onClick={fitToView} title="ملائمة الكل">
          <Maximize2 size={16} />
        </ToolbarBtn>

        {/* Reset layout */}
        {showReset && (
          <ToolbarBtn onClick={handleReset} title="إعادة ترتيب تلقائي">
            <RotateCcw size={16} />
          </ToolbarBtn>
        )}

        {/* Add card */}
        {allowAddCards && (
          <div style={{ position: "relative" }}>
            <ToolbarBtn
              onClick={() => {
                if (selectedId && nodeById.has(selectedId)) {
                  createCustomNode(selectedId);
                  setAddMenuOpen(false);
                  return;
                }
                setAddMenuOpen(v => !v);
              }}
              title={selectedId ? "إضافة تحت الكارت المحدد" : "إضافة كارت"}
            >
              <Plus size={16} />
            </ToolbarBtn>
            {addMenuOpen && (
              <div
                data-toolbar
                style={{
                  position: "absolute", bottom: "100%", left: "50%",
                  transform: "translateX(-50%)",
                  marginBottom: 8, minWidth: 170,
                  background: "white", borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  padding: "4px 0",
                  direction: "rtl"
                }}
              >
                <div style={{ padding: "6px 12px", fontSize: 11, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>
                  اختر الكارت الأب
                </div>
                {nodes.map(n => {
                  const ns = getStyle(n);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        createCustomNode(n.id);
                        setAddMenuOpen(false);
                      }}
                      style={{
                        width: "100%", textAlign: "right",
                        padding: "8px 12px", fontSize: 12,
                        color: "#334155", border: "none",
                        background: "transparent", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: ns.stripe, flexShrink: 0 }} />
                      {n.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Minimap ═══ */}
      {minimap && (
        <div
          style={{
            position: "absolute", bottom: 16, right: 16,
            width: MINIMAP_SIZE.w, height: MINIMAP_SIZE.h,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
            zIndex: 30
          }}
        >
          <svg width={MINIMAP_SIZE.w} height={MINIMAP_SIZE.h}>
            {minimap.nodes.map(n => (
              <rect
                key={n.id}
                x={n.x} y={n.y}
                width={n.w} height={n.h}
                rx={2}
                fill={n.color}
                opacity={selectedId === n.id ? 1 : 0.5}
              />
            ))}
            {viewportRect && (
              <rect
                x={viewportRect.x} y={viewportRect.y}
                width={viewportRect.w} height={viewportRect.h}
                fill="rgba(59,130,246,0.08)"
                stroke="#3b82f6"
                strokeWidth="1.5"
                rx={2}
              />
            )}
          </svg>
        </div>
      )}

      {/* ═══ Context menu ═══ */}
      {contextMenu && contextNode && (
        <div
          data-context-menu
          style={{
            position: "fixed", left: contextMenu.x, top: contextMenu.y,
            zIndex: 60, background: "white",
            borderRadius: 10, border: "1px solid #e2e8f0",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            padding: "4px 0", minWidth: 170
          }}
        >
          <button
            type="button"
            data-cm-edit
            onClick={() => {
              openEditorFromNode(contextNode.id);
              setContextMenu(null);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "8px 14px",
              fontSize: 13, color: "#334155",
              border: "none", background: "transparent", cursor: "pointer"
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            ✎
            تعديل الكارت
          </button>

          {contextHasBaseOverride && (
            <button
              type="button"
              data-cm-reset
              onClick={() => handleResetBaseText(contextNode.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 14px",
                fontSize: 13, color: "#0f766e",
                border: "none", background: "transparent", cursor: "pointer"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f0fdfa")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              ↺
              رجوع للنص الأصلي
            </button>
          )}

          {contextIsCustom && (
            <button
              type="button"
              data-cm-delete
              onClick={() => handleDeleteNode(contextNode.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 14px",
                fontSize: 13, color: "#e11d48",
                border: "none", background: "transparent", cursor: "pointer"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fff1f2")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
            <Trash2 size={14} />
            حذف الكارت
            </button>
          )}
        </div>
      )}

      {/* ═══ Card editor modal ═══ */}
      {editorState && (
        <div
          data-modal
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)"
          }}
          onClick={() => setEditorState(null)}
        >
          <div
            style={{
              width: 360, background: "white",
              borderRadius: 16, padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              direction: "rtl"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
              {editorState.mode === "add" ? "إضافة كارت جديد" : "تعديل الكارت"}
            </h3>
            <input
              data-editor-scenario
              type="text"
              placeholder="عنوان السيناريو (اختياري)"
              value={editorScenarioLabel}
              onChange={e => setEditorScenarioLabel(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", marginBottom: 10,
                border: "1.5px solid #e2e8f0", borderRadius: 10,
                fontSize: 14, outline: "none", background: "#f8fafc"
              }}
            />
            <input
              data-editor-title
              ref={editorInputRef}
              type="text"
              placeholder="عنوان الكارت"
              value={editorTitle}
              onChange={e => setEditorTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveEditor()}
              style={{
                width: "100%", padding: "10px 14px", marginBottom: 10,
                border: "1.5px solid #e2e8f0", borderRadius: 10,
                fontSize: 14, outline: "none", background: "#f8fafc"
              }}
            />
            <input
              data-editor-action
              type="text"
              placeholder="الإجراء (اختياري)"
              value={editorAction}
              onChange={e => setEditorAction(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveEditor()}
              style={{
                width: "100%", padding: "10px 14px", marginBottom: 16,
                border: "1.5px solid #e2e8f0", borderRadius: 10,
                fontSize: 14, outline: "none", background: "#f8fafc"
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                data-editor-save
                onClick={handleSaveEditor}
                disabled={!editorTitle.trim()}
                style={{
                  padding: "8px 20px", borderRadius: 10,
                  border: "none", background: editorTitle.trim() ? "#1e293b" : "#94a3b8",
                  color: "white", fontSize: 13, fontWeight: 600,
                  cursor: editorTitle.trim() ? "pointer" : "not-allowed",
                  opacity: editorTitle.trim() ? 1 : 0.5
                }}
              >
                حفظ
              </button>
              <button
                type="button"
                data-editor-cancel
                onClick={() => setEditorState(null)}
                style={{
                  padding: "8px 20px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", background: "white",
                  color: "#475569", fontSize: 13, fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Keyboard hints ═══ */}
      <div
        style={{
          position: "absolute", top: 12, right: 12,
          display: "flex", gap: 6, zIndex: 20
        }}
      >
        <kbd style={kbdStyle}>Scroll = تكبير/تصغير</kbd>
        <kbd style={kbdStyle}>Space + سحب = تحريك</kbd>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════ */
const kbdStyle: React.CSSProperties = {
  fontSize: 10, color: "#94a3b8",
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(4px)",
  padding: "3px 8px", borderRadius: 6,
  border: "1px solid #e2e8f0",
  fontFamily: "inherit"
};

const ToolbarBtn: FC<{
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}> = ({ children, onClick, active, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      width: 32, height: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 8, border: "none",
      background: active ? "#e0e7ff" : "transparent",
      color: active ? "#3b82f6" : "#475569",
      cursor: "pointer",
      transition: "all 0.15s"
    }}
    onMouseEnter={e => {
      if (!active) e.currentTarget.style.background = "#f1f5f9";
    }}
    onMouseLeave={e => {
      if (!active) e.currentTarget.style.background = "transparent";
    }}
  >
    {children}
  </button>
);
