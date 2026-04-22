import { logger } from "@/services/logger";
import type { MapNode, MapType, FeelingCheckResult } from "@/modules/map/mapTypes";
import type { TransformationDiagnosis } from "@/modules/transformationEngine/interpretationEngine";
import { getJSON, setJSON } from "./secureStore";
import { queueMapSync } from "./mapSync";
import { sanitizeMapNodes } from "@/utils/mapNodeSchema";
import { runtimeEnv } from "@/config/runtimeEnv";

const STORAGE_KEY = "dawayir-map-nodes";

export interface StoredState {
  nodes: MapNode[];
  mapType?: MapType;
  feelingResults?: FeelingCheckResult | null;
  transformationDiagnosis?: TransformationDiagnosis | null;
  aiInterpretation?: string | null;
}

const isBrowser = typeof window !== "undefined";

let saveTimeout: NodeJS.Timeout | null = null;

export const loadStoredState = async (): Promise<StoredState | null> => {
  if (!isBrowser) return null;
  try {
    let parsed = await getJSON<StoredState>(STORAGE_KEY);
    
    // Fallback to alrehla-dawayir-storage if main key is empty
    if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      const altRaw = localStorage.getItem("alrehla-dawayir-storage");
      if (altRaw) {
        try {
          const altParsed = JSON.parse(altRaw);
          const graphNodes = altParsed?.state?.graph?.nodes;
          if (Array.isArray(graphNodes) && graphNodes.length > 0) {
            // Map domain nodes to MapNode structure if needed
            // For now, assume they are compatible or at least have enough data
            parsed = {
              nodes: graphNodes.map(n => ({
                ...n,
                ring: n.ring || "green",
                isNodeArchived: n.archived || false
              }))
            } as StoredState;
          }
        } catch (e) {
          // Ignore parse errors from fallback
        }
      }
    }

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
    return { 
      nodes: migratedNodes,
      mapType: parsed.mapType,
      feelingResults: parsed.feelingResults,
      transformationDiagnosis: parsed.transformationDiagnosis,
      aiInterpretation: parsed.aiInterpretation
    };
  } catch (error) {
    if (runtimeEnv.isDev) logger.error("Error loading from localStorage:", error);
    return null;
  }
};

export const saveStoredState = (state: StoredState) => {
  if (!isBrowser) return;
  const safeState: StoredState = { 
    nodes: sanitizeMapNodes(state.nodes),
    mapType: state.mapType,
    feelingResults: state.feelingResults,
    transformationDiagnosis: state.transformationDiagnosis,
    aiInterpretation: state.aiInterpretation
  };

  // Debounce saves to prevent race conditions
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    void setJSON(STORAGE_KEY, safeState);
    queueMapSync(safeState);
  }, 100); // 100ms debounce
};
