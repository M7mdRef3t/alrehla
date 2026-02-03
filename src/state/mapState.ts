import { create } from "zustand";
import type { MapNode, Ring, PersonNote, SituationLog, HealthAnswers, TreeRelation, DailyPathProgress } from "../modules/map/mapTypes";
import { loadStoredState, saveStoredState } from "../services/localStore";
import { resolvePathId } from "../modules/pathEngine/pathResolver";
import type { ContactLevel } from "../modules/pathEngine/pathTypes";

export interface RecoveryPlanOpenWith {
  focusTraumaInheritance?: boolean;
  preselectedNodeId?: string;
}

interface MapState {
  nodes: MapNode[];
  showPlacementTooltip: boolean;
  recoveryPlanOpenWith: RecoveryPlanOpenWith | null;
  setRecoveryPlanOpenWith: (v: RecoveryPlanOpenWith | null) => void;
  addNode: (label: string, ring?: Ring, analysis?: { score: number; answers: HealthAnswers }, goalId?: string, treeRelation?: TreeRelation, detachmentMode?: boolean, contact?: ContactLevel, isSOS?: boolean) => string;
  updateDetachmentReasons: (nodeId: string, reasons: string[]) => void;
  incrementRuminationLog: (nodeId: string) => void;
  dismissPlacementTooltip: () => void;
  moveNodeToRing: (id: string, ring: Ring) => void;
  setDetached: (nodeId: string, value: boolean) => void;
  analyzeNode: (id: string, result: { score: number; answers: HealthAnswers }) => void;
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
  updateTreeRelation: (nodeId: string, treeRelation: TreeRelation | null) => void;
  /** محرك المسارات: تخزين لقطة المسار من Gemini */
  updateRecoveryPathSnapshot: (nodeId: string, snapshot: unknown) => void;
  /** إضافة تقدّم يومي (لوحة القياس) */
  addDailyPathProgress: (nodeId: string, entry: DailyPathProgress) => void;
  /** مؤشر شرعية الحدود (0–100) — لمسار الصيام الشعوري */
  updateBoundaryLegitimacyScore: (nodeId: string, score: number) => void;
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
  recoveryPlanOpenWith: null,
  setRecoveryPlanOpenWith: (v) => set({ recoveryPlanOpenWith: v }),
  dismissPlacementTooltip: () => set({ showPlacementTooltip: false }),
  addNode: (label: string, ring: Ring = "yellow", analysis, goalId?, treeRelation?, detachmentMode?, contact?, isSOS?) => {
    let processedAnalysis;
    if (analysis) {
      // Score 0–6 (غالبًا=2، أحيانًا=1، نادراً=0). عالي = تأثير سلبي
      let recommendedRing: Ring;
      if (analysis.score >= 5) {
        recommendedRing = "red";
      } else if (analysis.score >= 2) {
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

    const pathIdFromResolver = resolvePathId({
      zone: ring,
      isGreyPath: detachmentMode === true,
      contact: contact ?? "medium",
      isSOS: isSOS === true
    });

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
        situationLogs: [],
        pathId: pathIdFromResolver,
        pathStage: "awareness"
      },
      notes: [],
      journeyStartDate: Date.now(), // Set journey start date
      hasCompletedTraining: false,
      ...(goalId != null && goalId !== "" && { goalId }),
      ...(treeRelation != null && { treeRelation }),
      ...(detachmentMode === true && { detachmentMode: true })
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
  setDetached: (nodeId, value) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, isDetached: value } : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  analyzeNode: (id, result) => {
    let recommendedRing: Ring;
    if (result.score >= 5) {
      recommendedRing = "red";
    } else if (result.score >= 2) {
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
  },
  updateTreeRelation: (nodeId, treeRelation) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, treeRelation: treeRelation ?? undefined }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateRecoveryPathSnapshot: (nodeId, snapshot) => {
    const now = Date.now();
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            recoveryProgress: {
              ...node.recoveryProgress,
              completedSteps: node.recoveryProgress?.completedSteps ?? [],
              situationLogs: node.recoveryProgress?.situationLogs ?? [],
              recoveryPathSnapshot: snapshot,
              lastPathGeneratedAt: now
            }
          }
        : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  addDailyPathProgress: (nodeId, entry) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const list = node.recoveryProgress?.dailyPathProgress ?? [];
      const filtered = list.filter((e) => e.date !== entry.date);
      return {
        ...node,
        recoveryProgress: {
          ...node.recoveryProgress,
          completedSteps: node.recoveryProgress?.completedSteps ?? [],
          situationLogs: node.recoveryProgress?.situationLogs ?? [],
          dailyPathProgress: [...filtered, entry]
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateDetachmentReasons: (nodeId, reasons) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      return {
        ...node,
        recoveryProgress: { ...progress, detachmentReasons: reasons }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  incrementRuminationLog: (nodeId) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      const count = (progress.ruminationLogCount ?? 0) + 1;
      return {
        ...node,
        recoveryProgress: { ...progress, ruminationLogCount: count }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateBoundaryLegitimacyScore: (nodeId, score) => {
    const value = Math.max(0, Math.min(100, Math.round(score)));
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      return {
        ...node,
        recoveryProgress: { ...progress, boundaryLegitimacyScore: value }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  }
}));


