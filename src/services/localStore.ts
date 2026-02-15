import type { MapNode } from "../modules/map/mapTypes";
import { getJSON, setJSON } from "./secureStore";
import { queueMapSync } from "./mapSync";
import { sanitizeMapNodes } from "../utils/mapNodeSchema";

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

    const migratedNodes = sanitizeMapNodes(parsed.nodes).map((node) => {
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
    if (runtimeEnv.isDev) console.error("Error loading from localStorage:", error);
    return null;
  }
};

export const saveStoredState = (state: StoredState) => {
  if (!isBrowser) return;
  const safeState: StoredState = { nodes: sanitizeMapNodes(state.nodes) };

  // Debounce saves to prevent race conditions
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    void setJSON(STORAGE_KEY, safeState);
    queueMapSync(safeState.nodes);
  }, 100); // 100ms debounce
};
import { runtimeEnv } from "../config/runtimeEnv";
