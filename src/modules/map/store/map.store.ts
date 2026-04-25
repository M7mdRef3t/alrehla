import { create } from "zustand";
import type {
  MapNode,
  Ring,
  PersonNote,
  SituationLog,
  HealthAnswers,
  TreeRelation,
  DailyPathProgress,
  RealityAnswers,
  QuickAnswerValue,
  MissionProgress,
  PersonViewInsights,
  OrbitHistoryEntry,
  MapType,
  FeelingCheckResult
} from "@/modules/map/mapTypes";
import type { TransformationDiagnosis } from "@/modules/transformationEngine/interpretationEngine";
import { loadStoredState, saveStoredState } from "@/services/localStore";
import { fetchCloudMap } from "@/services/mapSync";
import { resolvePathId, symptomIdsToSymptomType } from "@/modules/pathEngine/pathResolver";
import type { ContactLevel } from "@/modules/pathEngine/pathTypes";
import { emitDawayirSignal } from "@/modules/recommendation/recommendationBus";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { supabase } from "@/services/supabaseClient";

export interface RecoveryPlanOpenWith {
  focusTraumaInheritance?: boolean;
  preselectedNodeId?: string;
}

interface MapState {
  nodes: MapNode[];
  isHydrated: boolean;
  mapType: MapType;
  feelingResults: FeelingCheckResult | null;
  transformationDiagnosis: TransformationDiagnosis | null;
  aiInterpretation: string | null;
  setMapType: (type: MapType) => void;
  updateFeelingResults: (results: Partial<FeelingCheckResult>) => void;
  setTransformationDiagnosis: (diagnosis: TransformationDiagnosis) => void;
  setAiInterpretation: (interpretation: string | null) => void;
  showPlacementTooltip: boolean;
  lastAddedNodeId: string | null;
  recoveryPlanOpenWith: RecoveryPlanOpenWith | null;
  setRecoveryPlanOpenWith: (v: RecoveryPlanOpenWith | null) => void;
  addNode: (
    label: string,
    ring?: Ring,
    analysis?: { score: number; answers: HealthAnswers },
    goalId?: string,
    treeRelation?: TreeRelation,
    detachmentMode?: boolean,
    contact?: ContactLevel,
    isSOS?: boolean,
    realityAnswers?: RealityAnswers,
    safetyAnswer?: QuickAnswerValue,
    isAnalyzing?: boolean,
    isMirrorNode?: boolean,
    symptomIds?: string[]
  ) => string;
  updateDetachmentReasons: (nodeId: string, reasons: string[]) => void;
  incrementRuminationLog: (nodeId: string) => void;
  dismissPlacementTooltip: () => void;
  moveNodeToRing: (id: string, ring: Ring, realityAnswers?: RealityAnswers) => void;
  updateNode: (id: string, updates: Partial<MapNode>) => void;
  updateNodeRing: (id: string, newRing: MapNode["ring"]) => void;
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
  /** أرشفة شخص بدل حذفه نهائياً — يختفي من الخريطة بس يفضل محفوظ */
  archiveNode: (id: string) => void;
  /** استعادة شخص من الأرشيف للخريطة */
  unarchiveNode: (id: string) => void;
  /** اختياري: تحديث صورة الشخص في الخريطة */
  updateNodeAvatar: (nodeId: string, avatarUrl: string | null) => void;
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
  /** تغذية نافذة الشخص من الذكاء الاصطناعي (تشخيص/أعراض/حل/خطة) */
  updateNodeInsights: (nodeId: string, insights: PersonViewInsights) => void;
  /** بدء المهمة */
  startMission: (nodeId: string) => void;
  /** تحديث خطوة في المهمة */
  toggleMissionStep: (nodeId: string, stepIndex: number) => void;
  /** إنهاء المهمة */
  completeMission: (nodeId: string) => void;
  /** إعادة ضبط المهمة */
  resetMission: (nodeId: string) => void;
  /** أرشفة المهمة */
  archiveMission: (nodeId: string) => void;
  /** استعادة المهمة */
  unarchiveMission: (nodeId: string) => void;
  /** إضافة شحن أو استنزاف لطاقة هذه العلاقة (Energy P&L) */
  addEnergyTransaction: (nodeId: string, amount: number, note?: string) => void;
  /** تحويل العلاقة إلى بطارية بشرية للطوارئ */
  togglePowerBank: (nodeId: string) => void;
  /** مزامنة الحالة الكاملة للتخزين المحلي */
  syncMapStorage: () => void;
}

let nextId = 1;

function deriveNextId(nodes: MapNode[]) {
  if (nodes.length === 0) {
    nextId = 1;
    return;
  }
  const maxId = Math.max(
    ...nodes
      .map((node) => Number(node.id))
      .filter((value) => Number.isFinite(value))
  );
  if (Number.isFinite(maxId)) nextId = maxId + 1;
}

function derivePathStageFromCompletion(completedStepsCount: number): "awareness" | "resistance" | "acceptance" | "integration" {
  if (completedStepsCount >= 6) return "integration";
  if (completedStepsCount >= 4) return "acceptance";
  if (completedStepsCount >= 2) return "resistance";
  return "awareness";
}

function createOrbitHistoryEntry(
  nodeId: string,
  type: OrbitHistoryEntry["type"],
  ring: Ring,
  timestamp: number,
  fromRing?: Ring
): OrbitHistoryEntry {
  return {
    id: `orbit-${nodeId}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    timestamp,
    ring,
    ...(fromRing ? { fromRing } : {})
  };
}

function seedOrbitHistory(node: MapNode): OrbitHistoryEntry[] {
  const createdAt =
    node.analysis?.timestamp ??
    node.journeyStartDate ??
    node.lastRingChangeAt ??
    node.archivedAt ??
    Date.now();

  const history: OrbitHistoryEntry[] = [
    createOrbitHistoryEntry(node.id, "created", node.ring, createdAt)
  ];

  if (node.isNodeArchived && node.archivedAt && node.archivedAt > createdAt) {
    history.push(createOrbitHistoryEntry(node.id, "archived", node.ring, node.archivedAt, node.ring));
  }

  return history.sort((a, b) => a.timestamp - b.timestamp);
}

function getOrbitHistory(node: MapNode): OrbitHistoryEntry[] {
  return node.orbitHistory && node.orbitHistory.length > 0
    ? [...node.orbitHistory].sort((a, b) => a.timestamp - b.timestamp)
    : seedOrbitHistory(node);
}

function withOrbitEvent(
  node: MapNode,
  type: OrbitHistoryEntry["type"],
  ring: Ring,
  timestamp: number,
  fromRing?: Ring
): MapNode {
  const nextHistory = [...getOrbitHistory(node), createOrbitHistoryEntry(node.id, type, ring, timestamp, fromRing)]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-12);

  return {
    ...node,
    lastRingChangeAt: timestamp,
    orbitHistory: nextHistory
  };
}

function normalizeNodeOrbitHistory(node: MapNode): MapNode {
  if (node.orbitHistory && node.orbitHistory.length > 0) return node;
  return {
    ...node,
    orbitHistory: seedOrbitHistory(node)
  };
}

export const useMapState = create<MapState>((set, get) => ({
  nodes: [],
  isHydrated: false,
  mapType: "masafaty",
  feelingResults: null,
  transformationDiagnosis: null,
  aiInterpretation: null,
  setMapType: (mapType) => {
    set({ mapType });
    get().syncMapStorage();
  },
  updateFeelingResults: (results) => {
    const next = { ...(get().feelingResults || { body: 50, time: 50, energy: 50, money: 50, space: 50 }), ...results };
    set({ feelingResults: next });
    get().syncMapStorage();
  },
  setTransformationDiagnosis: (transformationDiagnosis) => {
    set({ transformationDiagnosis, aiInterpretation: null });
    get().syncMapStorage();
  },
  setAiInterpretation: (aiInterpretation) => {
    set({ aiInterpretation });
    get().syncMapStorage();
  },
  showPlacementTooltip: false,
  lastAddedNodeId: null,
  recoveryPlanOpenWith: null,
  setRecoveryPlanOpenWith: (v) => set({ recoveryPlanOpenWith: v }),
  dismissPlacementTooltip: () => set({ showPlacementTooltip: false, lastAddedNodeId: null }),
  addNode: (
    label: string,
    ring: Ring = "yellow",
    analysis,
    goalId?,
    treeRelation?,
    detachmentMode?,
    contact?,
    isSOS?,
    realityAnswers?,
    safetyAnswer?,
    isAnalyzing = false,
    isMirrorNode = false,
    symptomIds = []
  ) => {
    let processedAnalysis;
    if (analysis || symptomIds.length > 0) {
      // Score 0–6 (غالبًا=2، أحيانًا=1، نادراً=0). عالي = تأثير سلبي
      let recommendedRing: Ring;
      const score = analysis?.score ?? 0;
      if (score >= 5) {
        recommendedRing = "red";
      } else if (score >= 2) {
        recommendedRing = "yellow";
      } else {
        recommendedRing = "green";
      }

      processedAnalysis = {
        score,
        answers: analysis?.answers ?? { q1: "never", q2: "never", q3: "never" } as HealthAnswers,
        timestamp: Date.now(),
        recommendedRing,
        selectedSymptoms: symptomIds
      };
    }

    const symptomType = symptomIdsToSymptomType(symptomIds);

    const pathIdFromResolver = resolvePathId({
      zone: ring,
      isGreyPath: detachmentMode === true,
      contact: contact ?? "medium",
      isSOS: isSOS === true,
      symptomType
    });

    const nodeId = String(nextId++);
    const createdAt = Date.now();
    const missionProgress: MissionProgress = {
      checkedSteps: [],
      isArchived: false
    };
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
      missionProgress,
      notes: [],
      journeyStartDate: createdAt, // Set journey start date
      lastRingChangeAt: createdAt,
      orbitHistory: [createOrbitHistoryEntry(nodeId, "created", ring, createdAt)],
      hasCompletedTraining: false,
      ...(goalId != null && goalId !== "" && { goalId }),
      ...(treeRelation != null && { treeRelation }),
      ...(detachmentMode === true && { detachmentMode: true }),
      ...(realityAnswers != null && { realityAnswers }),
      ...(isSOS === true && { isEmergency: true }),
      ...(safetyAnswer != null && { safetyAnswer }),
      isAnalyzing,
      isMirrorNode
    };
    const nextNodes = [...get().nodes, newNode];
    console.log("[MapStore Debug] Node added:", newNode.label, "goalId:", newNode.goalId, "totalNodes:", nextNodes.length);
    set({ nodes: nextNodes, showPlacementTooltip: true, lastAddedNodeId: nodeId });

    get().syncMapStorage();
    emitDawayirSignal({
      type: "node_added",
      nodeId,
      payload: {
        ring,
        detachmentMode: detachmentMode === true,
        isEmergency: isSOS === true,
        pathStage: "awareness"
      }
    });
    useGamificationState.getState().addXP(50, "إضافة شخص جديد للخريطة");
    return nodeId;
  },
  moveNodeToRing: (id, ring, realityAnswers) => {
    const previous = get().nodes.find((node) => node.id === id);
    const isLowContact = (a: RealityAnswers) =>
      [a.q1, a.q2, a.q3].filter((q) => q === "rarely" || q === "never").length >= 2;
    const changedAt = Date.now();
    const nextNodes = get().nodes.map((node) =>
      node.id !== id
        ? node
        : (() => {
          const updatedNode: MapNode = {
            ...node,
            ring,
            ...(realityAnswers != null && ring === "red" && isLowContact(realityAnswers)
              ? { detachmentMode: true as const, realityAnswers }
              : {})
          };

          if (node.ring === ring) {
            return {
              ...updatedNode,
              lastRingChangeAt: changedAt,
              orbitHistory: getOrbitHistory(node)
            };
          }

          return withOrbitEvent(updatedNode, "ring_changed", ring, changedAt, node.ring);
        })()
    );
    set({ nodes: nextNodes });
    get().syncMapStorage();
    useGamificationState.getState().addXP(20, "تعديل مدار شخص");
    const next = nextNodes.find((node) => node.id === id);
    if (previous && next && previous.ring !== next.ring) {
      emitDawayirSignal({
        type: "ring_changed",
        nodeId: id,
        payload: {
          fromRing: previous.ring,
          toRing: next.ring
        }
      });
    }
    if (previous && next && Boolean(previous.detachmentMode) !== Boolean(next.detachmentMode)) {
      emitDawayirSignal({
        type: "detachment_toggled",
        nodeId: id,
        payload: {
          value: Boolean(next.detachmentMode)
        }
      });
    }

    // Expose undo payload via CustomEvent for the UI toast
    if (previous && previous.ring !== ring) {
      if (typeof window !== "undefined") {
        const undoEvent = new CustomEvent("dawayir-undo-ring", {
          detail: {
            nodeId: id,
            nodeLabel: previous.label,
            fromRing: previous.ring,
            toRing: ring,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(undoEvent);
      }
    }
  },
  updateNode: (id: string, updates: Partial<MapNode>) => {
    const changedAt = Date.now();
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== id) return node;

      const baseNode: MapNode = { ...node, ...updates };
      let nextNode: MapNode = baseNode;

      if (updates.ring && updates.ring !== node.ring) {
        nextNode = withOrbitEvent(nextNode, "ring_changed", updates.ring, changedAt, node.ring);
      } else if ("isNodeArchived" in updates && updates.isNodeArchived !== node.isNodeArchived) {
        nextNode = withOrbitEvent(
          nextNode,
          updates.isNodeArchived ? "archived" : "restored",
          nextNode.ring,
          changedAt,
          node.ring
        );
      } else {
        nextNode = {
          ...nextNode,
          orbitHistory: getOrbitHistory(node)
        };
      }

      return nextNode;
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateNodeRing: (id: string, newRing: MapNode["ring"]) => {
    const changedAt = Date.now();
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== id) return node;
      if (node.ring === newRing) {
        return { ...node, lastRingChangeAt: changedAt, orbitHistory: getOrbitHistory(node) };
      }
      return withOrbitEvent({ ...node, ring: newRing }, "ring_changed", newRing, changedAt, node.ring);
    });
    set({ nodes: nextNodes });
    get().syncMapStorage();
  },
  setDetached: (nodeId, value) => {
    const previous = get().nodes.find((node) => node.id === nodeId);
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, isDetached: value } : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
    if (value) {
      useGamificationState.getState().addXP(30, "تفعيل العزل/التجميد لشخص");
    }
    if (previous && Boolean(previous.isDetached) !== Boolean(value)) {
      emitDawayirSignal({
        type: "detachment_toggled",
        nodeId,
        payload: { value }
      });
    }
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
    useGamificationState.getState().addXP(40, "تحليل بيانات شخص");
  },
  deleteNode: (id) => {
    const nextNodes = get().nodes.filter((node) => node.id !== id);
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  archiveNode: (id) => {
    const changedAt = Date.now();
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== id) return node;
      if (node.isNodeArchived) {
        return { ...node, archivedAt: node.archivedAt ?? changedAt, orbitHistory: getOrbitHistory(node) };
      }
      return withOrbitEvent(
        { ...node, isNodeArchived: true, archivedAt: changedAt },
        "archived",
        node.ring,
        changedAt,
        node.ring
      );
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
    useGamificationState.getState().addXP(20, "أرشفة وتجميد علاقة");
  },
  unarchiveNode: (id) => {
    const changedAt = Date.now();
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== id) return node;
      if (!node.isNodeArchived) {
        return { ...node, orbitHistory: getOrbitHistory(node) };
      }
      return withOrbitEvent(
        { ...node, isNodeArchived: false, archivedAt: undefined },
        "restored",
        node.ring,
        changedAt,
        node.ring
      );
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  updateNodeAvatar: (nodeId, avatarUrl) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, avatarUrl: avatarUrl ?? undefined } : node
    );
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
    set({ nodes: nextNodes });
    get().syncMapStorage();
  },
  toggleStepCompletion: (nodeId, stepId) => {
    const previousNodes = get().nodes;
    const nextNodes = previousNodes.map((node) => {
      if (node.id !== nodeId) return node;

      const progress = node.recoveryProgress || { completedSteps: [], situationLogs: [] };
      const isCompleted = progress.completedSteps.includes(stepId);
      const completedSteps = isCompleted
        ? progress.completedSteps.filter(id => id !== stepId)
        : [...progress.completedSteps, stepId];
      const nextPathStage = derivePathStageFromCompletion(completedSteps.length);

      return {
        ...node,
        recoveryProgress: {
          ...progress,
          completedSteps,
          pathStage: nextPathStage
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
    const previousNode = previousNodes.find((node) => node.id === nodeId);
    const updatedNode = nextNodes.find((node) => node.id === nodeId);
    const previousStage = previousNode?.recoveryProgress?.pathStage ?? "awareness";
    const nextStage = updatedNode?.recoveryProgress?.pathStage ?? "awareness";
    if (previousNode && updatedNode && previousStage !== nextStage) {
      emitDawayirSignal({
        type: "path_stage_changed",
        nodeId,
        payload: {
          fromStage: previousStage,
          toStage: nextStage
        }
      });
    }
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
    emitDawayirSignal({
      type: "situation_logged",
      nodeId,
      payload: {
        feeling: logData.feeling
      }
    });
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
    const previous = get().nodes.find((node) => node.id === nodeId)?.analysis?.selectedSymptoms ?? [];
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
    const changed = previous.join("|") !== symptomIds.join("|");
    if (changed) {
      emitDawayirSignal({
        type: "symptoms_updated",
        nodeId,
        payload: {
          count: symptomIds.length
        }
      });
    }
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
  markTrainingComplete: (nodeId: string) => {
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
    set({ nodes: nextNodes });
    get().syncMapStorage();
  },
  incrementRuminationLog: (nodeId: string) => {
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
  updateNodeInsights: (nodeId, insights) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId || !node.analysis) return node;
      return {
        ...node,
        analysis: {
          ...node.analysis,
          insights: {
            ...(node.analysis.insights ?? {}),
            ...insights
          }
        }
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
  },
  startMission: (nodeId: string) => {
    const now = Date.now();
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.missionProgress ?? { checkedSteps: [] };
      return {
        ...node,
        missionProgress: {
          ...progress,
          startedAt: progress.startedAt ?? now,
          isCompleted: false,
          completedAt: undefined
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  toggleMissionStep: (nodeId: string, stepIndex: number) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.missionProgress ?? { checkedSteps: [] };
      const checked = new Set(progress.checkedSteps ?? []);
      if (checked.has(stepIndex)) checked.delete(stepIndex);
      else checked.add(stepIndex);
      return {
        ...node,
        missionProgress: {
          ...progress,
          checkedSteps: Array.from(checked),
          startedAt: progress.startedAt ?? Date.now()
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  completeMission: (nodeId: string) => {
    const now = Date.now();
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.missionProgress ?? { checkedSteps: [] };
      return {
        ...node,
        missionProgress: {
          ...progress,
          isCompleted: true,
          completedAt: now,
          startedAt: progress.startedAt ?? now
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  resetMission: (nodeId: string) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        missionProgress: {
          checkedSteps: [],
          startedAt: undefined,
          completedAt: undefined,
          isCompleted: false,
          isArchived: false,
          archivedAt: undefined
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  archiveMission: (nodeId: string) => {
    const now = Date.now();
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.missionProgress ?? { checkedSteps: [] };
      return {
        ...node,
        missionProgress: {
          ...progress,
          isArchived: true,
          archivedAt: now
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  unarchiveMission: (nodeId: string) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const progress = node.missionProgress ?? { checkedSteps: [] };
      return {
        ...node,
        missionProgress: {
          ...progress,
          isArchived: false,
          archivedAt: undefined
        }
      };
    });
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
  },
  addEnergyTransaction: (nodeId: string, amount: number, note?: string) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) return node;

      const prevBalance = node.energyBalance ?? {
        totalCharge: 0,
        totalDrain: 0,
        netEnergy: 0,
        transactions: []
      };

      const newTransaction = {
        id: `energy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount,
        timestamp: Date.now(),
        note
      };

      const newTotalCharge = prevBalance.totalCharge + (amount > 0 ? amount : 0);
      const newTotalDrain = prevBalance.totalDrain + (amount < 0 ? Math.abs(amount) : 0);

      return {
        ...node,
        energyBalance: {
          totalCharge: newTotalCharge,
          totalDrain: newTotalDrain,
          netEnergy: newTotalCharge - newTotalDrain,
          transactions: [newTransaction, ...prevBalance.transactions]
        }
      };
    });

    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });

    useGamificationState.getState().addXP(10, amount > 0 ? "اكتساب طاقة" : "استنزاف وتحليل طاقة");

    emitDawayirSignal({
      type: "energy_transaction",
      nodeId,
      payload: { amount }
    });
  },
  togglePowerBank: (nodeId: string) => {
    const nextNodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, isPowerBank: !node.isPowerBank } : node
    );
    saveStoredState({ nodes: nextNodes });
    set({ nodes: nextNodes });
    const isNowPowerBank = nextNodes.find((n) => n.id === nodeId)?.isPowerBank;
    if (isNowPowerBank) {
      useGamificationState.getState().addXP(15, "تفعيل بطارية الطوارئ");
    }
  },
  syncMapStorage: () => {
    const s = get();
    saveStoredState({
      nodes: s.nodes,
      mapType: s.mapType,
      feelingResults: s.feelingResults,
      transformationDiagnosis: s.transformationDiagnosis,
      aiInterpretation: s.aiInterpretation
    });
  }
}));

async function hydrateMapState() {
  try {
    const initial =
      typeof loadStoredState === "function" ? await loadStoredState() : null;
    
    let localNodes = initial?.nodes ?? [];
    let mapType = initial?.mapType ?? "masafaty";
    let feelingResults = initial?.feelingResults ?? null;
    let transformationDiagnosis = initial?.transformationDiagnosis ?? null;
    let aiInterpretation = initial?.aiInterpretation ?? null;

    // Always attempt cloud recovery and merge with local
    const cloudState = await fetchCloudMap();
    if (cloudState && Array.isArray(cloudState.nodes) && cloudState.nodes.length > 0) {
      // Merge: local nodes take priority (they may be more up-to-date)
      const nodesByLabel = new Map<string, MapNode>();
      
      // First, add cloud nodes (lower priority)
      for (const node of cloudState.nodes) {
        if (node?.label) {
          nodesByLabel.set(String(node.label).trim(), node);
        }
      }
      // Then, overlay local nodes (higher priority — overwrites cloud version)
      for (const node of localNodes) {
        if (node?.label) {
          nodesByLabel.set(String(node.label).trim(), node);
        }
      }

      localNodes = Array.from(nodesByLabel.values()).map((node, idx) => ({
        ...node,
        id: String(idx + 1)
      }));

      // Use cloud metadata if local is missing
      if (!transformationDiagnosis && cloudState.transformationDiagnosis) {
        transformationDiagnosis = cloudState.transformationDiagnosis;
      }
      if (!feelingResults && cloudState.feelingResults) {
        feelingResults = cloudState.feelingResults;
      }
      if (!aiInterpretation && cloudState.aiInterpretation) {
        aiInterpretation = cloudState.aiInterpretation;
      }
      mapType = initial?.mapType ?? cloudState.mapType ?? "masafaty";
    }

    const normalizedNodes = localNodes.map(normalizeNodeOrbitHistory);
    
    useMapState.setState({ 
      nodes: normalizedNodes,
      mapType,
      feelingResults,
      transformationDiagnosis,
      aiInterpretation,
      isHydrated: true 
    });

    if (normalizedNodes.length > 0) {
      deriveNextId(normalizedNodes);
      // Persist the merged state locally
      saveStoredState({
        nodes: normalizedNodes,
        mapType,
        feelingResults,
        transformationDiagnosis,
        aiInterpretation
      });
    }
  } catch {
    useMapState.setState({ isHydrated: true });
  }
}

if (typeof window !== "undefined") {
  void hydrateMapState();

  // Re-hydrate from cloud when user signs in after initial page load
  if (supabase) {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        const current = useMapState.getState();
        // Only re-fetch if local store is empty (no nodes loaded yet)
        if (current.nodes.length === 0) {
          void hydrateMapState();
        }
      }
    });
  }
}
