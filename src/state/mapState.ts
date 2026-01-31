import { create } from "zustand";
import type { MapNode, Ring, PersonNote, SituationLog } from "../modules/map/mapTypes";
import { loadStoredState, saveStoredState } from "../services/localStore";

interface MapState {
  nodes: MapNode[];
  showPlacementTooltip: boolean;
  addNode: (label: string, ring?: Ring, analysis?: { score: number; answers: { q1: boolean; q2: boolean; q3: boolean } }) => string;
  dismissPlacementTooltip: () => void;
  moveNodeToRing: (id: string, ring: Ring) => void;
  analyzeNode: (id: string, result: { score: number; answers: { q1: boolean; q2: boolean; q3: boolean } }) => void;
  addNoteToNode: (nodeId: string, text: string, comment?: string) => void;
  deleteNoteFromNode: (nodeId: string, noteId: string) => void;
  toggleStepCompletion: (nodeId: string, stepId: string) => void;
  toggleFirstStepCompletion: (nodeId: string, stepId: string) => void;
  updateFirstStepInputs: (nodeId: string, stepId: string, inputs: string[]) => void;
  updateDynamicStepInput: (nodeId: string, stepId: string, value: string) => void;
  addSituationLog: (nodeId: string, log: Omit<SituationLog, "id" | "date">) => void;
  deleteSituationLog: (nodeId: string, logId: string) => void;
  deleteNode: (id: string) => void;
  resetMap: () => void;
  updateLastViewedStep: (nodeId: string, step: "result" | "firstStep" | "recoveryPlan") => void;
  updateNodeSymptoms: (nodeId: string, symptomIds: string[]) => void;
  updateStepFeedback: (nodeId: string, stepId: string, value: "hard" | "easy" | "unrealistic") => void;
  markTrainingComplete: (nodeId: string) => void;
}

let nextId = 1;

const initial = loadStoredState();
const initialNodes: MapNode[] = initial?.nodes ?? [];
if (initialNodes.length > 0) {
  const maxId = Math.max(
    ...initialNodes
      .map((node) => Number(node.id))
      .filter((value) => Number.isFinite(value))
  );
  if (Number.isFinite(maxId)) nextId = maxId + 1;
}

export const useMapState = create<MapState>((set, get) => ({
  nodes: initialNodes,
  showPlacementTooltip: false,
  dismissPlacementTooltip: () => set({ showPlacementTooltip: false }),
  addNode: (label: string, ring: Ring = "yellow", analysis) => {
    let processedAnalysis;
    if (analysis) {
      // Calculate recommended ring based on score
      let recommendedRing: Ring;
      if (analysis.score > 2) {
        recommendedRing = "red";
      } else if (analysis.score >= 1) {
        recommendedRing = "yellow";
      } else {
        recommendedRing = "green";
      }
      
      processedAnalysis = {
        ...analysis,
        timestamp: Date.now(),
        recommendedRing
      };
    }

    const nodeId = String(nextId++);
    const newNode: MapNode = {
      id: nodeId,
      label,
      ring,
      x: 0,
      y: 0,
      ...(processedAnalysis && { analysis: processedAnalysis }),
      firstStepProgress: {
        completedFirstSteps: [],
        stepInputs: {}
      },
      recoveryProgress: {
        completedSteps: [],
        situationLogs: []
      },
      notes: [],
      journeyStartDate: Date.now(), // Set journey start date
      hasCompletedTraining: false
    };
    const nextNodes = [...get().nodes, newNode];
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes, showPlacementTooltip: true });
    return nodeId;
  },
  moveNodeToRing: (id, ring) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            ring
          }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  analyzeNode: (id, result) => {
    // Calculate recommended ring based on score
    let recommendedRing: Ring;
    if (result.score > 2) {
      recommendedRing = "red";
    } else if (result.score >= 1) {
      recommendedRing = "yellow";
    } else {
      recommendedRing = "green";
    }

    const nextNodes = get().nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            analysis: {
              ...result,
              timestamp: Date.now(),
              recommendedRing
            }
          }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  deleteNode: (id) => {
    const nextNodes = get().nodes.filter((node) => node.id !== id);
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  addNoteToNode: (nodeId, text, comment) => {
    const newNote: PersonNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      comment,
      timestamp: Date.now()
    };

    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            notes: [...(node.notes || []), newNote]
          }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  deleteNoteFromNode: (nodeId, noteId) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            notes: (node.notes || []).filter((note) => note.id !== noteId)
          }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  toggleStepCompletion: (nodeId, stepId) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      
      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      const isCompleted = progress.completedSteps.includes(stepId);
      
      return {
        ...node,
        recoveryProgress: {
          ...progress,
          completedSteps: isCompleted
            ? progress.completedSteps.filter(id => id !== stepId)
            : [...progress.completedSteps, stepId]
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  addSituationLog: (nodeId, logData) => {
    const newLog: SituationLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: Date.now(),
      ...logData
    };

    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      
      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      
      return {
        ...node,
        recoveryProgress: {
          ...progress,
          situationLogs: [...progress.situationLogs, newLog]
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  deleteSituationLog: (nodeId, logId) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      
      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      
      return {
        ...node,
        recoveryProgress: {
          ...progress,
          situationLogs: progress.situationLogs.filter(log => log.id !== logId)
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  toggleFirstStepCompletion: (nodeId, stepId) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      
      const progress = node.firstStepProgress || { completedFirstSteps: [], stepInputs: {} };
      const isCompleted = progress.completedFirstSteps.includes(stepId);
      
      return {
        ...node,
        firstStepProgress: {
          ...progress,
          completedFirstSteps: isCompleted
            ? progress.completedFirstSteps.filter(id => id !== stepId)
            : [...progress.completedFirstSteps, stepId]
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateFirstStepInputs: (nodeId, stepId, inputs) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      
      const progress = node.firstStepProgress || { completedFirstSteps: [], stepInputs: {} };
      
      return {
        ...node,
        firstStepProgress: {
          ...progress,
          stepInputs: {
            ...progress.stepInputs,
            [stepId]: inputs
          }
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateDynamicStepInput: (nodeId, stepId, value) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      
      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      
      return {
        ...node,
        recoveryProgress: {
          ...progress,
          dynamicStepInputs: {
            ...(progress.dynamicStepInputs || {}),
            [stepId]: value
          }
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  resetMap: () => {
    saveStoredState({ nodes: [] });
    set({ nodes: [] });
    nextId = 1; // Reset ID counter
  },
  updateLastViewedStep: (nodeId, step) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            lastViewedStep: step
          }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateNodeSymptoms: (nodeId, symptomIds) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId && node.analysis
        ? {
            ...node,
            analysis: {
              ...node.analysis,
              selectedSymptoms: symptomIds
            }
          }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateStepFeedback: (nodeId, stepId, value) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      const stepFeedback = { ...(progress.stepFeedback || {}), [stepId]: value };
      return {
        ...node,
        recoveryProgress: { ...progress, stepFeedback }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  markTrainingComplete: (nodeId) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, hasCompletedTraining: true }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  }
}));


