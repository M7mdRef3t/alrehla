/* ═══════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════ */
export const STORAGE_KEY = "flow-map-custom";
export const POS_STORAGE_KEY = "flow-map-positions";
export const ZOOM_STORAGE_KEY = "flow-map-zoom";
export const OVERRIDES_STORAGE_KEY = "flow-map-overrides";
export const HIDDEN_BASE_STORAGE_KEY = "flow-map-hidden-base";
export const DEFAULT_POS_STORAGE_KEY = "flow-map-default-positions";
export const LOCKED_NODE_STORAGE_KEY = "flow-map-locked-nodes";

export const CARD_W = 200;
export const CARD_H = 100;
export const H_GAP = 50;
export const V_GAP = 70;
export const TOP_PAD = 80;

export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 2.5;
export const ZOOM_STEP = 0.15;
export const CANVAS_SIZE = 4000; // virtual infinite canvas size
export const MINIMAP_SIZE = { w: 140, h: 100 } as const;
export const MAX_ABS_COORD = CANVAS_SIZE * 3;
export const MAX_ABS_PAN = CANVAS_SIZE * 4;
