import type { MapNode } from "../modules/map/mapTypes";
import { getJSON, setJSON } from "./secureStore";
import { queueMapSync } from "./mapSync";

const STORAGE_KEY = "dawayir-map-nodes";

export interface StoredState {
  nodes: MapNode[];
}

const isBrowser = typeof window !== "undefined";

let saveTimeout: NodeJS.Timeout | null = null;

export const loadStoredState = async (): Promise<StoredState | null> => {
  if (!isBrowser) return null;
  try {
    const parsed = await getJSON<StoredState>(STORAGE_KEY);
    if (!parsed || !Array.isArray(parsed.nodes)) return null;

    const migratedNodes = parsed.nodes.map((node) => {
      if (node.firstStepProgress && !node.firstStepProgress.stepInputs) {
        return {
          ...node,
          firstStepProgress: {
            ...node.firstStepProgress,
            stepInputs: {}
          }
        };
      }
      if (node.missionProgress) {
        const checkedSteps = Array.isArray(node.missionProgress.checkedSteps)
          ? node.missionProgress.checkedSteps
          : [];
        return {
          ...node,
          missionProgress: {
            ...node.missionProgress,
            checkedSteps,
            isArchived: node.missionProgress.isArchived ?? false
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
    void setJSON(STORAGE_KEY, state);
    queueMapSync(state.nodes);
  }, 100); // 100ms debounce
};
