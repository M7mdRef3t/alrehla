import type { FC } from "react";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus, RotateCcw, ZoomIn, ZoomOut, Maximize2,
  GripVertical, MousePointer2, Hand, Trash2, Save,
  Undo2, Redo2, Copy, Search, Download, Upload, ArrowRightLeft,
  CheckCircle2, XCircle, Grid3X3, Lock, Unlock
} from "lucide-react";

import {
  FlowNode, FlowMapActionEvent, FlowMindMapProps, Position, FlowNodeOverride, EditorMode, FlowSnapshot
} from "./types";
import {
  STORAGE_KEY, POS_STORAGE_KEY, ZOOM_STORAGE_KEY, OVERRIDES_STORAGE_KEY,
  HIDDEN_BASE_STORAGE_KEY, DEFAULT_POS_STORAGE_KEY, LOCKED_NODE_STORAGE_KEY,
  CARD_W, CARD_H, H_GAP, V_GAP, TOP_PAD, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP,
  CANVAS_SIZE, MINIMAP_SIZE, MAX_ABS_COORD, MAX_ABS_PAN
} from "./constants";
import {
  variantConfig, getVariantKey, getStyle, getDecisionOutcome, PHASE_LANE_META,
  isValidAccent, isValidVariant, isPosition, mergePositionsWithLayout,
  arePositionsEqual, isOverlapping, connectorPath, computeTreeLayout,
  areLinksEqual, applyPresetToLayout, cloneSnapshot
} from "./utils";
import {
  loadCustom, saveCustom, loadPositions, savePositions, loadDefaultPositions,
  saveDefaultPositions, loadZoom, saveZoom, loadOverrides, saveOverrides,
  loadHiddenBaseIds, saveHiddenBaseIds, loadLockedNodeIds, saveLockedNodeIds
} from "./storage";
import { kbdStyle, ToolbarBtn } from "./components";

import { removeFromLocalStorage } from "../../../services/browserStorage";

export type { FlowNode, FlowMapActionEvent, FlowMindMapProps, Position, FlowNodeOverride, EditorMode, FlowSnapshot } from "./types";



import { downloadBlobFile } from "../../../services/clientDom";

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
export const FlowMindMap: FC<FlowMindMapProps> = ({
  nodes: baseNodes,
  links: baseLinks,
  showReset = true,
  allowAddCards = true,
  nodeMetrics = null,
  onAction
}) => {
  /* ── Data ── */
  const initialCustom = useMemo(() => loadCustom(), []);
  const [baseOverrides, setBaseOverrides] = useState<Record<string, FlowNodeOverride>>(() => loadOverrides());
  const [customNodes, setCustomNodes] = useState<FlowNode[]>(initialCustom.nodes);
  const [customLinks, setCustomLinks] = useState<Array<[string, string]>>(initialCustom.links);
  const [defaultPositions, setDefaultPositions] = useState<Record<string, Position> | null>(() => loadDefaultPositions());
  const [historyPast, setHistoryPast] = useState<FlowSnapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<FlowSnapshot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [decisionFilter, setDecisionFilter] = useState<"all" | "success" | "failure">("all");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [lockedNodeIds, setLockedNodeIds] = useState<Set<string>>(() => loadLockedNodeIds());
  const [reparentState, setReparentState] = useState<{ nodeId: string; parentId: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const baseNodeById = useMemo(() => new Map(baseNodes.map((node) => [node.id, node])), [baseNodes]);
  const baseNodeIds = useMemo(() => new Set(baseNodes.map((node) => node.id)), [baseNodes]);
  const [hiddenBaseNodeIds, setHiddenBaseNodeIds] = useState<Set<string>>(() => loadHiddenBaseIds(baseNodeIds));
  useEffect(() => {
    setHiddenBaseNodeIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (baseNodeIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [baseNodeIds]);
  const customNodeIds = useMemo(() => new Set(customNodes.map((node) => node.id)), [customNodes]);
  const effectiveBaseNodes = useMemo(
    () =>
      baseNodes
        .filter((node) => !hiddenBaseNodeIds.has(node.id))
        .map((node) => {
          const override = baseOverrides[node.id];
          if (!override) return node;
          return {
            ...node,
            scenarioLabel: override.scenarioLabel ?? node.scenarioLabel,
            title: override.title ?? node.title,
            action: override.action ?? node.action
          };
        }),
    [baseNodes, baseOverrides, hiddenBaseNodeIds]
  );
  const allParentIds = useMemo(
    () => new Set([...effectiveBaseNodes.map((node) => node.id), ...customNodes.map((node) => node.id)]),
    [effectiveBaseNodes, customNodes]
  );
  const validCustomLinks = useMemo(
    () =>
      customLinks.filter(
        ([childId, parentId]) => customNodeIds.has(childId) && allParentIds.has(parentId) && childId !== parentId
      ),
    [allParentIds, customLinks, customNodeIds]
  );
  const nodes = useMemo(() => [...effectiveBaseNodes, ...customNodes], [effectiveBaseNodes, customNodes]);
  const rootNodeIds = useMemo(
    () => new Set(nodes.filter((node) => node.variant === "root").map((node) => node.id)),
    [nodes]
  );
  const visibleNodeIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);
  const links = useMemo(
    () => [
      ...baseLinks.filter(([childId, parentId]) => visibleNodeIds.has(childId) && visibleNodeIds.has(parentId)),
      ...validCustomLinks
    ],
    [baseLinks, validCustomLinks, visibleNodeIds]
  );
  const hierarchyLinks = useMemo(
    // Exclude feedback links targeting root from tree/hierarchy operations
    () => links.filter(([childId]) => !rootNodeIds.has(childId)),
    [links, rootNodeIds]
  );
  const renderedNodeIds = useMemo(() => {
    if (decisionFilter === "all") return new Set(nodes.map((node) => node.id));
    const ids = new Set<string>();
    const rootIds = new Set(nodes.filter((node) => node.variant === "root").map((node) => node.id));
    rootIds.forEach((id) => ids.add(id));

    const parentByChild = new Map<string, string>();
    for (const [childId, parentId] of hierarchyLinks) {
      if (!parentByChild.has(childId)) parentByChild.set(childId, parentId);
    }

    for (const node of nodes) {
      const outcome = getDecisionOutcome(node);
      if (decisionFilter === "success" && outcome !== "success") continue;
      if (decisionFilter === "failure" && outcome !== "failure") continue;
      let cur: string | undefined = node.id;
      while (cur) {
        ids.add(cur);
        cur = parentByChild.get(cur);
      }
    }
    return ids;
  }, [decisionFilter, hierarchyLinks, nodes]);
  const renderedNodes = useMemo(
    () => nodes.filter((node) => renderedNodeIds.has(node.id)),
    [nodes, renderedNodeIds]
  );
  const renderedLinks = useMemo(
    () => links.filter(([childId, parentId]) => renderedNodeIds.has(childId) && renderedNodeIds.has(parentId)),
    [links, renderedNodeIds]
  );

  /* ── Tree layout ── */
  const autoLayout = useMemo(() => computeTreeLayout(nodes, hierarchyLinks), [nodes, hierarchyLinks]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const canUndo = historyPast.length > 0;
  const canRedo = historyFuture.length > 0;

  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    const stored = loadPositions();
    if (stored) {
      // Detect old-format positions (from pre-Miro version with small coords)
      const vals = Object.values(stored);
      const maxCoord = Math.max(...vals.map(p => Math.max(p.x, p.y)), 0);
      if (vals.length > 0 && maxCoord < 500) {
        // Old format — discard and use fresh auto-layout
        try { removeFromLocalStorage(POS_STORAGE_KEY); } catch { /* */ }
        return autoLayout;
      }
      return mergePositionsWithLayout(stored, autoLayout);
    }
    return autoLayout;
  });

  const visiblePositions = useMemo(() => {
    const next: Record<string, Position> = {};
    for (const node of renderedNodes) {
      const pos = positions[node.id] ?? autoLayout[node.id];
      if (pos) next[node.id] = pos;
    }
    return next;
  }, [autoLayout, renderedNodes, positions]);

  useEffect(() => {
    setPositions(prev => {
      const next = mergePositionsWithLayout(prev, autoLayout);
      return arePositionsEqual(prev, next) ? prev : next;
    });
  }, [autoLayout]);

  // Auto-fix old persisted positions that can stack cards after structural flow changes.
  const didFixOverlapRef = useRef(false);
  useEffect(() => {
    if (didFixOverlapRef.current) return;
    const baseEntries = effectiveBaseNodes
      .map((node) => ({ id: node.id, pos: positions[node.id] ?? autoLayout[node.id] }))
      .filter((entry): entry is { id: string; pos: Position } => Boolean(entry.pos));
    if (baseEntries.length < 2) return;

    let hasOverlap = false;
    for (let i = 0; i < baseEntries.length && !hasOverlap; i += 1) {
      for (let j = i + 1; j < baseEntries.length; j += 1) {
        if (isOverlapping(baseEntries[i].pos, baseEntries[j].pos)) {
          hasOverlap = true;
          break;
        }
      }
    }
    if (!hasOverlap) return;

    didFixOverlapRef.current = true;
    setPositions((prev) => {
      const next = { ...prev };
      for (const node of effectiveBaseNodes) {
        const autoPos = autoLayout[node.id];
        if (autoPos) next[node.id] = { x: autoPos.x, y: autoPos.y };
      }
      return next;
    });
  }, [autoLayout, effectiveBaseNodes, positions]);

  useEffect(() => {
    if (areLinksEqual(customLinks, validCustomLinks)) return;
    setCustomLinks(validCustomLinks);
  }, [customLinks, validCustomLinks]);

  useEffect(() => { saveOverrides(baseOverrides); }, [baseOverrides]);
  useEffect(() => { saveCustom(customNodes, validCustomLinks); }, [customNodes, validCustomLinks]);
  useEffect(() => { saveHiddenBaseIds(hiddenBaseNodeIds); }, [hiddenBaseNodeIds]);
  useEffect(() => { saveDefaultPositions(defaultPositions); }, [defaultPositions]);
  useEffect(() => { saveLockedNodeIds(lockedNodeIds); }, [lockedNodeIds]);
  useEffect(() => { savePositions(positions); }, [positions]);
  useEffect(() => {
    setLockedNodeIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visibleNodeIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [visibleNodeIds]);

  const makeSnapshot = useCallback((): FlowSnapshot => ({
    customNodes: customNodes.map((node) => ({ ...node })),
    customLinks: customLinks.map(([childId, parentId]) => [childId, parentId] as [string, string]),
    positions: Object.fromEntries(
      Object.entries(positions).map(([id, pos]) => [id, { x: pos.x, y: pos.y }])
    ),
    baseOverrides: Object.fromEntries(
      Object.entries(baseOverrides).map(([id, override]) => [id, { ...override }])
    ),
    hiddenBaseNodeIds: new Set(hiddenBaseNodeIds),
    lockedNodeIds: new Set(lockedNodeIds)
  }), [baseOverrides, customLinks, customNodes, hiddenBaseNodeIds, lockedNodeIds, positions]);

  const applySnapshot = useCallback((snapshot: FlowSnapshot) => {
    const snap = cloneSnapshot(snapshot);
    setCustomNodes(snap.customNodes);
    setCustomLinks(snap.customLinks);
    setPositions(snap.positions);
    setBaseOverrides(snap.baseOverrides);
    setHiddenBaseNodeIds(snap.hiddenBaseNodeIds);
    setLockedNodeIds(snap.lockedNodeIds);
    setSelectedId(null);
    setSelectedIds(new Set());
    setContextMenu(null);
    setEditorState(null);
  }, []);

  const pushHistory = useCallback(() => {
    const snap = makeSnapshot();
    setHistoryPast((prev) => [...prev.slice(-39), snap]);
    setHistoryFuture([]);
  }, [makeSnapshot]);

  /* ── Zoom & Pan (infinite canvas) ── */
  const containerRef = useRef<HTMLDivElement>(null);

  const initialZoomState = useMemo(() => loadZoom(), []);
  const hadStoredZoomAtInit = useRef(Boolean(initialZoomState));
  const [zoom, setZoom] = useState(() => initialZoomState?.zoom ?? 0.85);
  const safeZoom = Number.isFinite(zoom) ? zoom : 0.85;
  const [panX, setPanX] = useState(() => initialZoomState?.panX ?? -(CANVAS_SIZE / 2 - 400));
  const [panY, setPanY] = useState(() => initialZoomState?.panY ?? -(CANVAS_SIZE / 2 - 200));

  useEffect(() => { saveZoom({ zoom: safeZoom, panX, panY }); }, [safeZoom, panX, panY]);

  // Refs that always hold latest values — eliminates stale closures in callbacks
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const linksRef = useRef(hierarchyLinks);
  linksRef.current = hierarchyLinks;
  const zoomRef = useRef(zoom);
  zoomRef.current = safeZoom;

  /* ── Interaction mode ── */
  type Tool = "select" | "pan";
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    if (renderedNodeIds.has(selectedId)) return;
    setSelectedId(null);
  }, [renderedNodeIds, selectedId]);
  useEffect(() => {
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (renderedNodeIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [renderedNodeIds]);

  const emitAction = useCallback((event: FlowMapActionEvent) => {
    onAction?.(event);
  }, [onAction]);

  const focusNode = useCallback((nodeId: string) => {
    const container = containerRef.current;
    const pos = positionsRef.current[nodeId] ?? autoLayout[nodeId];
    if (!container || !pos) return;
    const rect = container.getBoundingClientRect();
    const currentZoom = zoomRef.current;
    setSelectedId(nodeId);
    setSelectedIds(new Set([nodeId]));
    setPanX(rect.width / 2 - (pos.x + CARD_W / 2) * currentZoom);
    setPanY(rect.height / 2 - (pos.y + CARD_H / 2) * currentZoom);
  }, [autoLayout]);

  /* ── Canvas panning ── */
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-card]") || target.closest("[data-toolbar]") || target.closest("[data-modal]")) return;

    // Deselect
    setSelectedId(null);
    setSelectedIds(new Set());

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
      const worldX = (mx - panX) / safeZoom;
      const worldY = (my - panY) / safeZoom;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, safeZoom + delta));

      // Adjust pan so the point under mouse stays fixed
      setPanX(mx - worldX * newZoom);
      setPanY(my - worldY * newZoom);
      setZoom(newZoom);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [safeZoom, panX, panY]);

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
    if (lockedNodeIds.has(id)) return;
    const target = e.target as HTMLElement;
    if (target.closest("input") || target.closest("button")) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pos = positions[id];
    if (!pos) return;
    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        if (next.size === 0) setSelectedId(null);
        else setSelectedId(id);
        return next;
      });
    } else {
      setSelectedId(id);
      setSelectedIds(new Set([id]));
    }
    setDraggingId(id);
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, startLeft: pos.x, startTop: pos.y };
  }, [tool, lockedNodeIds, positions]);

  const handleNodePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / zoom;
    const dy = (e.clientY - d.startY) / zoom;
    const nextX = d.startLeft + dx;
    const nextY = d.startTop + dy;
    const x = snapToGrid ? Math.round(nextX / 20) * 20 : nextX;
    const y = snapToGrid ? Math.round(nextY / 20) * 20 : nextY;
    setPositions(prev => ({
      ...prev,
      [d.id]: { x, y }
    }));
  }, [snapToGrid, zoom]);

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
    pushHistory();
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
    setSelectedIds(new Set([newId]));
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

    emitAction({
      action: "create_node",
      nodeId: newId,
      nodeTitle: newNode.title,
      payload: { parentId }
    });

    return newNode;
  }, [emitAction, pushHistory]);

  const handleSaveEditor = useCallback(() => {
    if (!editorState) return;
    const scenarioLabel = editorScenarioLabel.trim();
    const title = editorTitle.trim();
    const action = editorAction.trim();
    if (!title) return;
    pushHistory();

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
    emitAction({
      action: "edit_node",
      nodeId: editorState.nodeId,
      nodeTitle: title,
      payload: { isCustom: editorState.isCustom }
    });
    setEditorState(null);
  }, [baseNodeById, editorAction, editorScenarioLabel, editorState, editorTitle, emitAction, pushHistory]);

  /* ── Actions ── */
  const handleReset = () => {
    pushHistory();
    // Clear ALL custom data and reset to base layout
    setCustomNodes([]);
    setCustomLinks([]);
    setBaseOverrides({});
    setHiddenBaseNodeIds(new Set());
    setLockedNodeIds(new Set());
    setNewlyCreatedId(null);
    setSelectedId(null);
    setSelectedIds(new Set());
    setContextMenu(null);
    setEditorState(null);
    try {
      removeFromLocalStorage(POS_STORAGE_KEY);
      removeFromLocalStorage(STORAGE_KEY);
      removeFromLocalStorage(ZOOM_STORAGE_KEY);
      removeFromLocalStorage(OVERRIDES_STORAGE_KEY);
      removeFromLocalStorage(HIDDEN_BASE_STORAGE_KEY);
      removeFromLocalStorage(LOCKED_NODE_STORAGE_KEY);
    } catch { /* */ }
    // Recompute fresh layout from base nodes only
    const freshLayout = applyPresetToLayout(defaultPositions, computeTreeLayout(baseNodes, baseLinks));
    setPositions(freshLayout);
    emitAction({
      action: "reset_map",
      payload: {
        hiddenBaseCount: hiddenBaseNodeIds.size,
        customCount: customNodes.length
      }
    });
    // Fit view after reset
    requestAnimationFrame(() => fitToView());
  };

  const handleSaveCurrentAsDefault = useCallback(() => {
    const snapshot: Record<string, Position> = {};
    for (const [id, pos] of Object.entries(positions)) {
      snapshot[id] = { x: pos.x, y: pos.y };
    }
    setDefaultPositions(snapshot);
    emitAction({
      action: "save_default_layout",
      payload: { count: Object.keys(snapshot).length }
    });
  }, [emitAction, positions]);

  const handleUndo = useCallback(() => {
    const current = makeSnapshot();
    let prevSnapshot: FlowSnapshot | null = null;
    setHistoryPast((prev) => {
      if (prev.length === 0) return prev;
      prevSnapshot = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    if (!prevSnapshot) return;
    setHistoryFuture((prev) => [current, ...prev].slice(0, 40));
    applySnapshot(prevSnapshot);
    emitAction({ action: "undo" });
  }, [applySnapshot, emitAction, makeSnapshot]);

  const handleRedo = useCallback(() => {
    const current = makeSnapshot();
    let nextSnapshot: FlowSnapshot | null = null;
    setHistoryFuture((prev) => {
      if (prev.length === 0) return prev;
      nextSnapshot = prev[0];
      return prev.slice(1);
    });
    if (!nextSnapshot) return;
    setHistoryPast((prev) => [...prev.slice(-39), current]);
    applySnapshot(nextSnapshot);
    emitAction({ action: "redo" });
  }, [applySnapshot, emitAction, makeSnapshot]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const source = nodeById.get(nodeId);
    if (!source || nodeId === "root") return;
    pushHistory();
    const parentId = linksRef.current.find(([childId]) => childId === nodeId)?.[1] ?? "root";
    const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sourcePos = positionsRef.current[nodeId] ?? autoLayout[nodeId];
    const duplicate: FlowNode = {
      id: newId,
      scenarioLabel: source.scenarioLabel,
      title: `${source.title} (نسخة)`,
      action: source.action,
      variant: source.variant === "root" ? "sub" : source.variant,
      accent: source.accent
    };
    setCustomNodes((prev) => [...prev, duplicate]);
    setCustomLinks((prev) => [...prev, [newId, parentId] as [string, string]]);
    if (sourcePos) {
      setPositions((prev) => ({ ...prev, [newId]: { x: sourcePos.x + 26, y: sourcePos.y + 26 } }));
    }
    setSelectedId(newId);
    setSelectedIds(new Set([newId]));
    setContextMenu(null);
    setNewlyCreatedId(newId);
    setTimeout(() => setNewlyCreatedId(null), 1200);
    emitAction({
      action: "duplicate_node",
      nodeId: newId,
      nodeTitle: duplicate.title,
      payload: { sourceNodeId: nodeId, parentId }
    });
  }, [autoLayout, emitAction, nodeById, pushHistory]);

  const handleExportJson = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        customNodes,
        customLinks,
        positions,
        baseOverrides,
        hiddenBaseNodeIds: Array.from(hiddenBaseNodeIds),
        lockedNodeIds: Array.from(lockedNodeIds),
        defaultPositions
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlobFile(blob, `flow-map-${new Date().toISOString().slice(0, 10)}.json`);
    emitAction({
      action: "export_json",
      payload: { customCount: customNodes.length, hiddenBaseCount: hiddenBaseNodeIds.size }
    });
  }, [baseOverrides, customLinks, customNodes, defaultPositions, emitAction, hiddenBaseNodeIds, lockedNodeIds, positions]);

  const handleImportJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result ?? "{}")) as {
          data?: {
            customNodes?: unknown;
            customLinks?: unknown;
            positions?: unknown;
            baseOverrides?: unknown;
            hiddenBaseNodeIds?: unknown;
            lockedNodeIds?: unknown;
            defaultPositions?: unknown;
          };
        };
        const data = raw.data ?? {};
        const importedNodes = Array.isArray(data.customNodes) ? data.customNodes : [];
        const nextNodes: FlowNode[] = [];
        for (const item of importedNodes) {
          if (!item || typeof item !== "object") continue;
          const node = item as Partial<FlowNode>;
          const id = typeof node.id === "string" ? node.id.trim() : "";
          if (!id || !id.startsWith("custom-")) continue;
          nextNodes.push({
            id,
            scenarioLabel: typeof node.scenarioLabel === "string" ? node.scenarioLabel : "",
            title: typeof node.title === "string" ? node.title : "كارت",
            action: typeof node.action === "string" ? node.action : "",
            variant: isValidVariant(node.variant) ? node.variant : "sub",
            accent: isValidAccent(node.accent) ? node.accent : undefined,
            count: typeof node.count === "number" ? node.count : undefined
          });
        }

        const nodeIds = new Set(nextNodes.map((node) => node.id));
        const importedLinks = Array.isArray(data.customLinks) ? data.customLinks : [];
        const nextLinks: Array<[string, string]> = [];
        for (const item of importedLinks) {
          if (!Array.isArray(item) || item.length < 2) continue;
          const childId = typeof item[0] === "string" ? item[0] : "";
          const parentId = typeof item[1] === "string" ? item[1] : "";
          if (!nodeIds.has(childId) || !parentId) continue;
          nextLinks.push([childId, parentId]);
        }

        const importedPos = (data.positions && typeof data.positions === "object") ? data.positions as Record<string, unknown> : {};
        const nextPositions: Record<string, Position> = {};
        for (const [id, value] of Object.entries(importedPos)) {
          if (!isPosition(value)) continue;
          nextPositions[id] = { x: value.x, y: value.y };
        }

        const importedOverrides = (data.baseOverrides && typeof data.baseOverrides === "object")
          ? data.baseOverrides as Record<string, unknown>
          : {};
        const nextOverrides: Record<string, FlowNodeOverride> = {};
        for (const [id, value] of Object.entries(importedOverrides)) {
          if (!value || typeof value !== "object") continue;
          const candidate = value as Partial<FlowNodeOverride>;
          const override: FlowNodeOverride = {};
          if (typeof candidate.scenarioLabel === "string") override.scenarioLabel = candidate.scenarioLabel;
          if (typeof candidate.title === "string") override.title = candidate.title;
          if (typeof candidate.action === "string") override.action = candidate.action;
          if (Object.keys(override).length > 0) nextOverrides[id] = override;
        }

        const importedHidden = Array.isArray(data.hiddenBaseNodeIds) ? data.hiddenBaseNodeIds : [];
        const nextHidden = new Set<string>();
        for (const item of importedHidden) {
          if (typeof item !== "string") continue;
          if (!baseNodeById.has(item)) continue;
          if (item === "root") continue;
          nextHidden.add(item);
        }

        const importedLocked = Array.isArray(data.lockedNodeIds) ? data.lockedNodeIds : [];
        const nextLocked = new Set<string>();
        for (const item of importedLocked) {
          if (typeof item !== "string") continue;
          if (item === "root") continue;
          nextLocked.add(item);
        }

        const importedDefaults = (data.defaultPositions && typeof data.defaultPositions === "object")
          ? data.defaultPositions as Record<string, unknown>
          : null;
        const nextDefaults: Record<string, Position> | null = importedDefaults
          ? Object.fromEntries(
            Object.entries(importedDefaults)
              .filter(([, value]) => isPosition(value))
              .map(([id, value]) => [id, { x: (value as Position).x, y: (value as Position).y }])
          )
          : null;

        pushHistory();
        setCustomNodes(nextNodes);
        setCustomLinks(nextLinks);
        setPositions((prev) => ({ ...prev, ...nextPositions }));
        setBaseOverrides(nextOverrides);
        setHiddenBaseNodeIds(nextHidden);
        setLockedNodeIds(nextLocked);
        setDefaultPositions(nextDefaults);
        setSelectedId(null);
        setSelectedIds(new Set());
        emitAction({
          action: "import_json",
          payload: {
            customCount: nextNodes.length,
            linksCount: nextLinks.length,
            hiddenBaseCount: nextHidden.size
          }
        });
      } catch {
        // ignore invalid file
      }
    };
    reader.readAsText(file);
  }, [baseNodeById, emitAction, pushHistory]);

  const handleReparentCustomNode = useCallback((nodeId: string, parentId: string) => {
    if (!nodeId.startsWith("custom-")) return;
    if (nodeId === parentId) return;
    const allLinks = linksRef.current;
    const descendants = new Set<string>();
    const walk = (id: string) => {
      descendants.add(id);
      for (const [childId, pid] of allLinks) {
        if (pid === id && !descendants.has(childId)) walk(childId);
      }
    };
    walk(nodeId);
    if (descendants.has(parentId)) return;
    pushHistory();
    setCustomLinks((prev) =>
      prev.map(([childId, pid]) => (childId === nodeId ? [childId, parentId] as [string, string] : [childId, pid]))
    );
    emitAction({
      action: "reparent_node",
      nodeId,
      nodeTitle: nodeById.get(nodeId)?.title ?? null,
      payload: { parentId }
    });
    setReparentState(null);
    setContextMenu(null);
  }, [emitAction, nodeById, pushHistory]);

  const handleDeleteNodes = useCallback((nodeIds: Iterable<string>) => {
    const initialTargets = Array.from(new Set(nodeIds))
      .filter((nodeId) => nodeId !== "root" && !lockedNodeIds.has(nodeId) && nodeById.has(nodeId));
    if (initialTargets.length === 0) return;

    const allLinks = linksRef.current;
    const toDelete = new Set<string>();
    const collect = (id: string) => {
      if (lockedNodeIds.has(id)) return;
      toDelete.add(id);
      for (const [childId, parentId] of allLinks) {
        if (parentId === id && !toDelete.has(childId)) collect(childId);
      }
    };
    initialTargets.forEach((id) => collect(id));
    if (toDelete.size === 0) return;

    pushHistory();
    setHiddenBaseNodeIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of toDelete) {
        if (!baseNodeById.has(id) || next.has(id)) continue;
        next.add(id);
        changed = true;
      }
      return changed ? next : prev;
    });
    setBaseOverrides((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of toDelete) {
        if (!(id in next)) continue;
        delete next[id];
        changed = true;
      }
      return changed ? next : prev;
    });
    setCustomNodes(p => p.filter(n => !toDelete.has(n.id)));
    setCustomLinks(p => p.filter(([childId, parentId]) => !toDelete.has(childId) && !toDelete.has(parentId)));
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
    setSelectedIds(new Set());
    setLockedNodeIds((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (toDelete.has(id)) {
          changed = true;
          continue;
        }
        next.add(id);
      }
      return changed ? next : prev;
    });
    emitAction({
      action: "delete_nodes",
      payload: { count: toDelete.size }
    });
  }, [baseNodeById, emitAction, lockedNodeIds, nodeById, pushHistory]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    handleDeleteNodes([nodeId]);
  }, [handleDeleteNodes]);

  const handleRestoreHiddenBase = useCallback(() => {
    if (hiddenBaseNodeIds.size === 0) return;
    pushHistory();
    setHiddenBaseNodeIds(new Set());
    emitAction({
      action: "restore_base_nodes",
      payload: { count: hiddenBaseNodeIds.size }
    });
  }, [emitAction, hiddenBaseNodeIds.size, pushHistory]);

  const toggleLockByIds = useCallback((nodeIds: Iterable<string>) => {
    const targets = Array.from(new Set(nodeIds))
      .filter((id) => id !== "root" && nodeById.has(id));
    if (targets.length === 0) return;
    const allLocked = targets.every((id) => lockedNodeIds.has(id));
    pushHistory();
    setLockedNodeIds((prev) => {
      const next = new Set(prev);
      for (const id of targets) {
        if (allLocked) next.delete(id);
        else next.add(id);
      }
      return next;
    });
    emitAction({
      action: allLocked ? "unlock_nodes" : "lock_nodes",
      payload: { count: targets.length }
    });
  }, [emitAction, lockedNodeIds, nodeById, pushHistory]);

  const toggleLockSelection = useCallback(() => {
    if (selectedIds.size > 0) {
      toggleLockByIds(selectedIds);
      return;
    }
    if (selectedId) toggleLockByIds([selectedId]);
  }, [selectedId, selectedIds, toggleLockByIds]);

  const applySelectionPositions = useCallback((transform: (current: Record<string, Position>) => Record<string, Position>) => {
    if (selectedIds.size < 2) return;
    pushHistory();
    setPositions((prev) => {
      const selectedPos: Record<string, Position> = {};
      for (const id of selectedIds) {
        if (lockedNodeIds.has(id)) continue;
        const pos = prev[id] ?? autoLayout[id];
        if (!pos) continue;
        selectedPos[id] = pos;
      }
      if (Object.keys(selectedPos).length < 2) return prev;
      const patched = transform(selectedPos);
      return { ...prev, ...patched };
    });
  }, [autoLayout, lockedNodeIds, pushHistory, selectedIds]);

  const alignSelectionLeft = useCallback(() => {
    applySelectionPositions((selectedPos) => {
      const minX = Math.min(...Object.values(selectedPos).map((p) => p.x));
      const next: Record<string, Position> = {};
      for (const [id, pos] of Object.entries(selectedPos)) next[id] = { x: minX, y: pos.y };
      return next;
    });
    emitAction({ action: "align_left", payload: { count: selectedIds.size } });
  }, [applySelectionPositions, emitAction, selectedIds.size]);

  const alignSelectionTop = useCallback(() => {
    applySelectionPositions((selectedPos) => {
      const minY = Math.min(...Object.values(selectedPos).map((p) => p.y));
      const next: Record<string, Position> = {};
      for (const [id, pos] of Object.entries(selectedPos)) next[id] = { x: pos.x, y: minY };
      return next;
    });
    emitAction({ action: "align_top", payload: { count: selectedIds.size } });
  }, [applySelectionPositions, emitAction, selectedIds.size]);

  const alignSelectionRight = useCallback(() => {
    applySelectionPositions((selectedPos) => {
      const maxX = Math.max(...Object.values(selectedPos).map((p) => p.x));
      const next: Record<string, Position> = {};
      for (const [id, pos] of Object.entries(selectedPos)) next[id] = { x: maxX, y: pos.y };
      return next;
    });
    emitAction({ action: "align_right", payload: { count: selectedIds.size } });
  }, [applySelectionPositions, emitAction, selectedIds.size]);

  const alignSelectionBottom = useCallback(() => {
    applySelectionPositions((selectedPos) => {
      const maxY = Math.max(...Object.values(selectedPos).map((p) => p.y));
      const next: Record<string, Position> = {};
      for (const [id, pos] of Object.entries(selectedPos)) next[id] = { x: pos.x, y: maxY };
      return next;
    });
    emitAction({ action: "align_bottom", payload: { count: selectedIds.size } });
  }, [applySelectionPositions, emitAction, selectedIds.size]);

  const distributeSelectionHorizontally = useCallback(() => {
    applySelectionPositions((selectedPos) => {
      const entries = Object.entries(selectedPos).sort((a, b) => a[1].x - b[1].x);
      if (entries.length < 3) return selectedPos;
      const first = entries[0][1].x;
      const last = entries[entries.length - 1][1].x;
      const step = (last - first) / (entries.length - 1);
      const next: Record<string, Position> = {};
      entries.forEach(([id, pos], index) => {
        next[id] = { x: Math.round(first + step * index), y: pos.y };
      });
      return next;
    });
    emitAction({ action: "distribute_horizontal", payload: { count: selectedIds.size } });
  }, [applySelectionPositions, emitAction, selectedIds.size]);

  const distributeSelectionVertically = useCallback(() => {
    applySelectionPositions((selectedPos) => {
      const entries = Object.entries(selectedPos).sort((a, b) => a[1].y - b[1].y);
      if (entries.length < 3) return selectedPos;
      const first = entries[0][1].y;
      const last = entries[entries.length - 1][1].y;
      const step = (last - first) / (entries.length - 1);
      const next: Record<string, Position> = {};
      entries.forEach(([id, pos], index) => {
        next[id] = { x: pos.x, y: Math.round(first + step * index) };
      });
      return next;
    });
    emitAction({ action: "distribute_vertical", payload: { count: selectedIds.size } });
  }, [applySelectionPositions, emitAction, selectedIds.size]);

  const handleResetBaseText = useCallback((nodeId: string) => {
    pushHistory();
    setBaseOverrides((prev) => {
      if (!prev[nodeId]) return prev;
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
    setContextMenu(null);
  }, [pushHistory]);

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

    const entries = renderedNodes
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
  }, [autoLayout, fitToView, panX, panY, positions, renderedNodes, zoom]);

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
      if (e.key === "?" && !(e.target as HTMLElement).closest("input,textarea")) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (
        (e.key === "Delete" || e.key === "Backspace")
        && selectedIds.size > 0
        && !(e.target as HTMLElement).closest("input,textarea")
      ) {
        handleDeleteNodes(selectedIds);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDeleteNodes, handleRedo, handleUndo, selectedIds]);

  /* ── SVG paths ── */
  const svgPaths = useMemo(() => {
    const result: Array<{ d: string; color: string }> = [];
    for (const [childId, parentId] of renderedLinks) {
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
  }, [renderedLinks, positions, autoLayout, nodeById]);

  const phaseSwimlanes = useMemo(() => {
    const phaseIds = Object.keys(PHASE_LANE_META);
    const childrenByParent = new Map<string, string[]>();
    for (const [childId, parentId] of renderedLinks) {
      const arr = childrenByParent.get(parentId) ?? [];
      arr.push(childId);
      childrenByParent.set(parentId, arr);
    }

    const collectDescendants = (rootId: string): Set<string> => {
      const visited = new Set<string>();
      const queue = [...(childrenByParent.get(rootId) ?? [])];
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current)) continue;
        visited.add(current);
        const next = childrenByParent.get(current) ?? [];
        for (const childId of next) queue.push(childId);
      }
      return visited;
    };

    const lanes: Array<{
      id: string;
      title: string;
      x: number;
      y: number;
      w: number;
      h: number;
      fill: string;
      border: string;
      text: string;
    }> = [];

    for (const phaseId of phaseIds) {
      if (!renderedNodeIds.has(phaseId)) continue;
      const descendants = Array.from(collectDescendants(phaseId)).filter((id) => id !== phaseId);
      const boundingNodeIds = descendants.length > 0 ? descendants : [phaseId];
      const rects = boundingNodeIds
        .map((id) => positions[id] ?? autoLayout[id])
        .filter((pos): pos is Position => Boolean(pos))
        .map((pos) => ({
          minX: pos.x,
          minY: pos.y,
          maxX: pos.x + CARD_W,
          maxY: pos.y + CARD_H
        }));
      if (rects.length === 0) continue;

      const padX = 40;
      const padY = 34;
      const minX = Math.min(...rects.map((item) => item.minX)) - padX;
      const minY = Math.min(...rects.map((item) => item.minY)) - padY;
      const maxX = Math.max(...rects.map((item) => item.maxX)) + padX;
      const maxY = Math.max(...rects.map((item) => item.maxY)) + padY;
      const laneStyle = PHASE_LANE_META[phaseId];
      const phaseNode = nodeById.get(phaseId);

      lanes.push({
        id: phaseId,
        title: phaseNode?.title || "Phase",
        x: minX,
        y: minY,
        w: Math.max(260, maxX - minX),
        h: Math.max(150, maxY - minY),
        fill: laneStyle.fill,
        border: laneStyle.border,
        text: laneStyle.text
      });
    }

    return lanes.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  }, [autoLayout, nodeById, positions, renderedLinks, renderedNodeIds]);

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
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return nodes.filter((node) => {
      return (
        node.title.toLowerCase().includes(q)
        || node.scenarioLabel.toLowerCase().includes(q)
        || node.action.toLowerCase().includes(q)
      );
    });
  }, [nodes, searchQuery]);
  const contextNode = contextMenu ? nodeById.get(contextMenu.nodeId) ?? null : null;
  const contextIsCustom = Boolean(contextNode?.id.startsWith("custom-"));
  const contextCanDelete = Boolean(contextNode && contextNode.id !== "root");
  const contextHasBaseOverride = Boolean(contextNode && !contextIsCustom && baseOverrides[contextNode.id]);
  const selectedCount = selectedIds.size;
  const canAlignSelection = selectedCount >= 2;
  const canDistributeSelection = selectedCount >= 3;
  const selectedAllLocked = selectedCount > 0 && Array.from(selectedIds).every((id) => lockedNodeIds.has(id));
  const handleDecisionFilterToggle = useCallback((target: "success" | "failure") => {
    setDecisionFilter((prev) => {
      const next = prev === target ? "all" : target;
      emitAction({ action: `filter_${next}` });
      return next;
    });
  }, [emitAction]);

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
              width={20 * safeZoom} height={20 * safeZoom}
              patternUnits="userSpaceOnUse"
              x={panX % (20 * safeZoom)} y={panY % (20 * safeZoom)}
            >
              <circle cx="1" cy="1" r={Math.max(0.4, 0.5 * safeZoom)} fill="#cbd5e1" opacity={safeZoom > 0.5 ? 0.4 : 0} />
            </pattern>
            <pattern
              id="miro-grid-large"
              width={100 * safeZoom} height={100 * safeZoom}
              patternUnits="userSpaceOnUse"
              x={panX % (100 * safeZoom)} y={panY % (100 * safeZoom)}
            >
              <circle cx="1" cy="1" r={Math.max(0.8, 1.2 * safeZoom)} fill="#94a3b8" opacity="0.35" />
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
            transform: `translate(${panX}px, ${panY}px) scale(${safeZoom})`,
            width: CANVAS_SIZE,
            height: CANVAS_SIZE
          }}
        >
          {phaseSwimlanes.map((lane) => (
            <div
              key={lane.id}
              style={{
                position: "absolute",
                left: lane.x,
                top: lane.y,
                width: lane.w,
                height: lane.h,
                borderRadius: 22,
                border: `1.5px dashed ${lane.border}`,
                background: lane.fill,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
                pointerEvents: "none",
                zIndex: 1
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: lane.text,
                  background: "rgba(255,255,255,0.72)",
                  border: `1px solid ${lane.border}`,
                  borderRadius: 999,
                  padding: "4px 10px"
                }}
              >
                {lane.title}
              </span>
            </div>
          ))}

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
          {renderedNodes.map(node => {
            const pos = positions[node.id] ?? autoLayout[node.id];
            if (!pos) return null;
            const s = getStyle(node);
            const metric = nodeMetrics?.[node.id] ?? null;
            const outcome = getDecisionOutcome(node);
            const isDragging = draggingId === node.id;
            const isSelected = selectedIds.has(node.id);
            const isHovered = hoveredId === node.id;
            const isNewlyCreated = newlyCreatedId === node.id;
            const isLocked = lockedNodeIds.has(node.id);

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
                  cursor: tool === "select" ? (isLocked ? "not-allowed" : isDragging ? "grabbing" : "grab") : undefined,
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
                  setSelectedIds(new Set([node.id]));
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
                {isLocked && (
                  <div style={{ marginBottom: 4, fontSize: 10, fontWeight: 700, color: "#64748b" }}>مقفول</div>
                )}
                {outcome !== "neutral" && (
                  <div style={{ marginBottom: 5, fontSize: 10, fontWeight: 700, color: outcome === "success" ? "#0f766e" : "#be123c" }}>
                    {outcome === "success" ? "نجاح" : "فشل"}
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
                {metric?.conversionRate != null && (
                  <div style={{ color: "#64748b", fontSize: 10, marginTop: 4 }}>
                    تحويل من الأب: {metric.conversionRate}%
                    {metric.dropOffCount != null && metric.dropOffCount > 0
                      ? ` • تسرب ${metric.dropOffCount}`
                      : ""}
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
        <ToolbarBtn onClick={handleUndo} disabled={!canUndo} title="تراجع">
          <Undo2 size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleRedo} disabled={!canRedo} title="إعادة">
          <Redo2 size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            if (!selectedId) return;
            handleDuplicateNode(selectedId);
          }}
          disabled={!selectedId || selectedId === "root"}
          title="نسخ الكارت المحدد"
        >
          <Copy size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={toggleLockSelection}
          disabled={selectedCount === 0}
          title={selectedAllLocked ? "فك قفل المحدد" : "قفل المحدد"}
        >
          {selectedAllLocked ? <Unlock size={16} /> : <Lock size={16} />}
        </ToolbarBtn>
        <ToolbarBtn
          onClick={alignSelectionLeft}
          disabled={!canAlignSelection}
          title="محاذاة يسار للمحدد"
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>L</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={alignSelectionTop}
          disabled={!canAlignSelection}
          title="محاذاة أعلى للمحدد"
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>T</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={alignSelectionRight}
          disabled={!canAlignSelection}
          title="محاذاة يمين للمحدد"
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>R</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={alignSelectionBottom}
          disabled={!canAlignSelection}
          title="محاذاة أسفل للمحدد"
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>B</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={distributeSelectionHorizontally}
          disabled={!canDistributeSelection}
          title="توزيع أفقي للمحدد"
        >
          <span style={{ fontSize: 11, fontWeight: 700 }}>≡</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={distributeSelectionVertically}
          disabled={!canDistributeSelection}
          title="توزيع رأسي للمحدد"
        >
          <span style={{ fontSize: 11, fontWeight: 700 }}>⋮</span>
        </ToolbarBtn>

        <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 4px" }} />

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
          <ToolbarBtn onClick={handleReset} title="إعادة ضبط كاملة">
            <RotateCcw size={16} />
          </ToolbarBtn>
        )}
        <ToolbarBtn
          onClick={handleSaveCurrentAsDefault}
          active={Boolean(defaultPositions)}
          title="تثبيت الترتيب الحالي كافتراضي"
        >
          <Save size={16} />
        </ToolbarBtn>
        {hiddenBaseNodeIds.size > 0 && (
          <ToolbarBtn
            onClick={handleRestoreHiddenBase}
            title="استرجاع الكروت الأساسية"
          >
            <RotateCcw size={16} />
          </ToolbarBtn>
        )}

        <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 4px" }} />

        <ToolbarBtn onClick={handleExportJson} title="تصدير JSON">
          <Download size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => importInputRef.current?.click()}
          title="استيراد JSON"
        >
          <Upload size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={searchOpen}
          onClick={() => setSearchOpen((prev) => !prev)}
          title="بحث عن كارت"
        >
          <Search size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={shortcutsOpen}
          onClick={() => setShortcutsOpen((prev) => !prev)}
          title="لوحة الاختصارات"
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>?</span>
        </ToolbarBtn>
        <ToolbarBtn
          active={decisionFilter === "success"}
          onClick={() => handleDecisionFilterToggle("success")}
          title="إظهار مسارات النجاح"
        >
          <CheckCircle2 size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={decisionFilter === "failure"}
          onClick={() => handleDecisionFilterToggle("failure")}
          title="إظهار مسارات الفشل"
        >
          <XCircle size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={snapToGrid}
          onClick={() => setSnapToGrid((prev) => !prev)}
          title="تثبيت السحب على شبكة"
        >
          <Grid3X3 size={16} />
        </ToolbarBtn>

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
      {searchOpen && (
        <div
          data-toolbar
          style={{
            position: "absolute",
            bottom: 66,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 31,
            background: "white",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 280,
            direction: "rtl"
          }}
        >
          <input
            type="text"
            placeholder="ابحث بالعنوان أو السيناريو أو الإجراء"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (searchMatches.length === 0) return;
              focusNode(searchMatches[0].id);
            }}
            style={{
              width: "100%",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              outline: "none",
              background: "#f8fafc"
            }}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
            <span>{searchMatches.length} نتيجة</span>
            {searchMatches[0] && (
              <button
                type="button"
                onClick={() => focusNode(searchMatches[0].id)}
                style={{ border: "none", background: "transparent", color: "#0f766e", cursor: "pointer", fontWeight: 600 }}
              >
                تركيز أول نتيجة
              </button>
            )}
          </div>
        </div>
      )}
      {shortcutsOpen && (
        <div
          data-toolbar
          style={{
            position: "absolute",
            bottom: 66,
            left: 16,
            zIndex: 31,
            background: "white",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: "10px 12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 260,
            direction: "rtl"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
            اختصارات وأدوات الخريطة
          </div>
          <div style={{ fontSize: 11, color: "#475569", display: "grid", gap: 4, lineHeight: 1.5 }}>
            <div>Shift+Click: تحديد متعدد</div>
            <div>Delete / Backspace: حذف المحدد</div>
            <div>Ctrl/Cmd+Z: تراجع</div>
            <div>Ctrl/Cmd+Y أو Shift+Ctrl/Cmd+Z: إعادة</div>
            <div>Space + سحب: تحريك الكانفس</div>
            <div>?: فتح/إغلاق لوحة الاختصارات</div>
          </div>
        </div>
      )}
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportJson(file);
          e.currentTarget.value = "";
        }}
        style={{ display: "none" }}
      />

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
                opacity={selectedIds.has(n.id) ? 1 : 0.5}
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

          {contextNode && contextNode.id !== "root" && (
            <button
              type="button"
              data-cm-duplicate
              onClick={() => handleDuplicateNode(contextNode.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 14px",
                fontSize: 13, color: "#334155",
                border: "none", background: "transparent", cursor: "pointer"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Copy size={14} />
              عمل نسخة
            </button>
          )}
          {contextNode && contextNode.id !== "root" && (
            <button
              type="button"
              data-cm-lock
              onClick={() => {
                setSelectedId(contextNode.id);
                setSelectedIds(new Set([contextNode.id]));
                toggleLockByIds([contextNode.id]);
                setContextMenu(null);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 14px",
                fontSize: 13, color: "#475569",
                border: "none", background: "transparent", cursor: "pointer"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {lockedNodeIds.has(contextNode.id) ? <Unlock size={14} /> : <Lock size={14} />}
              {lockedNodeIds.has(contextNode.id) ? "فك القفل" : "قفل الكارت"}
            </button>
          )}

          {contextIsCustom && (
            <button
              type="button"
              data-cm-reparent
              onClick={() => {
                const currentParentId = links.find(([childId]) => childId === contextNode.id)?.[1] ?? "root";
                setReparentState({ nodeId: contextNode.id, parentId: currentParentId });
                setContextMenu(null);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 14px",
                fontSize: 13, color: "#0f766e",
                border: "none", background: "transparent", cursor: "pointer"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f0fdfa")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <ArrowRightLeft size={14} />
              نقل تحت كارت آخر
            </button>
          )}

          {contextCanDelete && (
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

      {/* ═══ Re-parent modal ═══ */}
      {reparentState && (
        <div
          data-modal
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)"
          }}
          onClick={() => setReparentState(null)}
        >
          <div
            style={{
              width: 360, background: "white",
              borderRadius: 16, padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              direction: "rtl"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
              نقل الكارت تحت أب جديد
            </h3>
            <select
              value={reparentState.parentId}
              onChange={(e) => setReparentState((prev) => (prev ? { ...prev, parentId: e.target.value } : prev))}
              style={{
                width: "100%",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 14,
                fontSize: 14,
                background: "#f8fafc",
                outline: "none"
              }}
            >
              {nodes
                .filter((node) => node.id !== reparentState.nodeId)
                .map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => handleReparentCustomNode(reparentState.nodeId, reparentState.parentId)}
                style={{
                  padding: "8px 20px", borderRadius: 10,
                  border: "none", background: "#0f766e",
                  color: "white", fontSize: 13, fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => setReparentState(null)}
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
        <kbd style={kbdStyle}>Ctrl/Cmd+Z = تراجع</kbd>
      </div>
      <div
        style={{
          position: "absolute", top: 42, left: 12, zIndex: 20,
          background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0",
          borderRadius: 8, padding: "6px 8px", fontSize: 10, color: "#475569", direction: "rtl"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6" }} />
          <span>نجاح</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f43f5e", marginRight: 6 }} />
          <span>فشل</span>
        </div>
      </div>
    </div>
  );
};

