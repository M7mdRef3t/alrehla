import type { MapNode } from "../modules/map/mapTypes";

const STORAGE_KEY = "dawayir-map-nodes";

export interface StoredState {
  nodes: MapNode[];
}

const isBrowser = typeof window !== "undefined";

let saveTimeout: NodeJS.Timeout | null = null;

export const loadStoredState = (): StoredState | null => {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (!Array.isArray(parsed.nodes)) return null;

    const migratedNodes = parsed.nodes.map(node => {
      if (node.firstStepProgress && !node.firstStepProgress.stepInputs) {
        return {
          ...node,
          firstStepProgress: {
            ...node.firstStepProgress,
            stepInputs: {}
          }
        };
      }
      return node;
    });
    return { nodes: migratedNodes };
  } catch (error) {
    if (import.meta.env.DEV) console.error("Error loading from localStorage:", error);
    return null;
  }
};

export const saveStoredState = (state: StoredState) => {
  if (!isBrowser) return;
  
  // Debounce saves to prevent race conditions
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error saving to localStorage:", error);
    }
  }, 100); // 100ms debounce
};

