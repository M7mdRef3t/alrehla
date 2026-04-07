import { getFromLocalStorage, removeFromLocalStorage, setInLocalStorage } from "../../../services/browserStorage";
import { FlowNode, Position, FlowNodeOverride } from "./types";
import {
  STORAGE_KEY, POS_STORAGE_KEY, DEFAULT_POS_STORAGE_KEY, ZOOM_STORAGE_KEY,
  OVERRIDES_STORAGE_KEY, HIDDEN_BASE_STORAGE_KEY, LOCKED_NODE_STORAGE_KEY,
  MAX_ABS_COORD, MAX_ABS_PAN, MIN_ZOOM, MAX_ZOOM
} from "./constants";
import { isValidVariant, isValidAccent, isPosition } from "./utils";

export function loadCustom(): { nodes: FlowNode[]; links: Array<[string, string]> } {
  try {
    const raw = getFromLocalStorage(STORAGE_KEY);
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
      if (!nodeIds.has(childId)) continue;
      const key = `${childId}->${parentId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push([childId, parentId]);
    }
    return { nodes, links };
  } catch { return { nodes: [], links: [] }; }
}

export function saveCustom(nodes: FlowNode[], links: Array<[string, string]>) {
  try { setInLocalStorage(STORAGE_KEY, JSON.stringify({ nodes, links })); } catch { /* */ }
}

export function loadPositions(): Record<string, Position> | null {
  try {
    const raw = getFromLocalStorage(POS_STORAGE_KEY);
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

export function savePositions(pos: Record<string, Position>) {
  try { setInLocalStorage(POS_STORAGE_KEY, JSON.stringify(pos)); } catch { /* */ }
}

export function loadDefaultPositions(): Record<string, Position> | null {
  try {
    const raw = getFromLocalStorage(DEFAULT_POS_STORAGE_KEY);
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
  } catch {
    return null;
  }
}

export function saveDefaultPositions(pos: Record<string, Position> | null) {
  try {
    if (!pos || Object.keys(pos).length === 0) {
      removeFromLocalStorage(DEFAULT_POS_STORAGE_KEY);
      return;
    }
    setInLocalStorage(DEFAULT_POS_STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // ignore write errors
  }
}

export function loadZoom(): { zoom: number; panX: number; panY: number } | null {
  try {
    const raw = getFromLocalStorage(ZOOM_STORAGE_KEY);
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

export function saveZoom(z: { zoom: number; panX: number; panY: number }) {
  try { setInLocalStorage(ZOOM_STORAGE_KEY, JSON.stringify(z)); } catch { /* */ }
}

export function loadOverrides(): Record<string, FlowNodeOverride> {
  try {
    const raw = getFromLocalStorage(OVERRIDES_STORAGE_KEY);
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

export function saveOverrides(overrides: Record<string, FlowNodeOverride>) {
  try { setInLocalStorage(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides)); } catch { /* */ }
}

export function loadHiddenBaseIds(allowedIds: Set<string>): Set<string> {
  try {
    const raw = getFromLocalStorage(HIDDEN_BASE_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<string>();
    const result = new Set<string>();
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      if (!allowedIds.has(item)) continue;
      result.add(item);
    }
    return result;
  } catch {
    return new Set<string>();
  }
}

export function saveHiddenBaseIds(hiddenIds: Set<string>) {
  try {
    if (hiddenIds.size === 0) {
      removeFromLocalStorage(HIDDEN_BASE_STORAGE_KEY);
      return;
    }
    setInLocalStorage(HIDDEN_BASE_STORAGE_KEY, JSON.stringify(Array.from(hiddenIds)));
  } catch {
    // ignore write errors
  }
}

export function loadLockedNodeIds(): Set<string> {
  try {
    const raw = getFromLocalStorage(LOCKED_NODE_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<string>();
    const result = new Set<string>();
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      result.add(item);
    }
    return result;
  } catch {
    return new Set<string>();
  }
}

export function saveLockedNodeIds(lockedIds: Set<string>) {
  try {
    if (lockedIds.size === 0) {
      removeFromLocalStorage(LOCKED_NODE_STORAGE_KEY);
      return;
    }
    setInLocalStorage(LOCKED_NODE_STORAGE_KEY, JSON.stringify(Array.from(lockedIds)));
  } catch {
    // ignore write errors
  }
}
