import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PathId, Ring, ContactLevel } from "@alrehla/masarat";
import { emitJourneyEvent } from "../platformBridge";

// ─── Journey Step Types ──────────────────────────────────────
export type StageId = "muwajaha" | "tajalli" | "qiyada";

/** أداة مقترحة مرتبطة بخطوة في المسار */
export interface RecommendedTool {
  toolId: string;           // screen id: "baseera" | "nadhir" | "dawayir" | etc.
  label: string;            // اسم الأداة بالعربي
  reason: string;           // ليه مفيدة في اللحظة دي
  icon: string;             // أيقونة
  timing: "before" | "after"; // تظهر قبل ولا بعد الإجابة
}

export interface JourneyStep {
  id: string;
  stageId: StageId;
  stageIndex: number;   // 0=مواجهة, 1=تجلي, 2=قيادة
  stepIndex: number;    // index داخل المرحلة
  question: string;
  deeperQuestion?: string;  // سؤال تعمق إذا الرد كان سريع
  insight?: string;         // لحظة التجلي بعد إتمام المرحلة
  quranicAnchor?: string;   // نص قرآني (اختياري)
  recommendedTool?: RecommendedTool; // أداة مقترحة في هذه الخطوة
}

export type ResponseDepth = "surface" | "medium" | "deep";

export interface StepResponse {
  stepId: string;
  answer: string;
  depth: ResponseDepth;
  durationMs: number;
  recordedAt: number;
}

export type JourneyStatus =
  | "idle"          // لم يبدأ بعد
  | "active"        // جارٍ
  | "stage_insight" // لحظة تجلي بعد مرحلة
  | "checkpoint"    // 7 أيام checkpoint
  | "complete";     // اكتمل

// ─── Main State ───────────────────────────────────────────────
export interface MasaratState {
  // === Path selection (الموجود) ===
  activePathId: PathId | null;
  history: Array<{ pathId: PathId; timestamp: number; ring?: Ring; contact?: ContactLevel }>;

  // === Journey Flow (الجديد) ===
  journeyStatus: JourneyStatus;
  journeySteps: JourneyStep[];         // كل الخطوات للمسار المختار
  currentStepIndex: number;            // الخطوة الحالية
  stepResponses: StepResponse[];       // إجابات المستخدم
  adaptiveDepth: ResponseDepth;        // مستوى التعمق المحسوب تلقائياً
  checkpointDueAt: number | null;      // timestamp لـ checkpoint الـ 7 أيام
  checkpointAnswer: string | null;     // إجابة checkpoint
  startedAt: number | null;            // وقت بدء الرحلة

  actions: {
    // Path selection
    setActivePath: (pathId: PathId, ring?: Ring, contact?: ContactLevel) => void;
    clearActivePath: () => void;

    // Journey flow
    startJourney: (steps: JourneyStep[]) => void;
    advanceStep: (response: Omit<StepResponse, "recordedAt">) => void;
    skipStep: (stepId: string) => void;
    completeStageInsight: () => void;
    recordCheckpoint: (answer: string) => void;
    resetJourney: () => void;
  };
}

// ─── Helpers ──────────────────────────────────────────────────
function calcDepth(durationMs: number): ResponseDepth {
  if (durationMs < 5_000)  return "surface";
  if (durationMs < 30_000) return "medium";
  return "deep";
}

function calcAdaptiveDepth(responses: StepResponse[]): ResponseDepth {
  if (responses.length === 0) return "medium";
  const depths = responses.map((r) => r.depth);
  const deepCount   = depths.filter((d) => d === "deep").length;
  const surfaceCount = depths.filter((d) => d === "surface").length;
  if (deepCount > surfaceCount) return "deep";
  if (surfaceCount > deepCount) return "surface";
  return "medium";
}

// ─── Store ────────────────────────────────────────────────────
export const useMasaratStore = create<MasaratState>()(
  persist(
    (set, get) => ({
      // === Initial state ===
      activePathId: null,
      history: [],
      journeyStatus: "idle",
      journeySteps: [],
      currentStepIndex: 0,
      stepResponses: [],
      adaptiveDepth: "medium",
      checkpointDueAt: null,
      checkpointAnswer: null,
      startedAt: null,

      actions: {
        // ── Path selection ──────────────────────────────────
        setActivePath: (pathId, ring, contact) =>
          set((state) => {
            const newHistory = [...state.history];
            newHistory.unshift({ pathId, timestamp: Date.now(), ring, contact });
            return {
              activePathId: pathId,
              history: newHistory.slice(0, 10),
            };
          }),

        clearActivePath: () =>
          set({
            activePathId: null,
            journeyStatus: "idle",
            journeySteps: [],
            currentStepIndex: 0,
            stepResponses: [],
          }),

        // ── Journey flow ─────────────────────────────────────
        startJourney: (steps) => {
          const pathId = get().activePathId;
          set({
            journeyStatus: "active",
            journeySteps: steps,
            currentStepIndex: 0,
            stepResponses: [],
            adaptiveDepth: "medium",
            checkpointDueAt: null,
            checkpointAnswer: null,
            startedAt: Date.now(),
          });
          if (pathId) {
            emitJourneyEvent({ type: "journey_started", pathId, timestamp: Date.now() });
          }
        },

        advanceStep: (response) =>
          set((state) => {
            const depth = response.depth === undefined
              ? calcDepth(response.durationMs)
              : response.depth;

            const fullResponse: StepResponse = {
              ...response,
              depth,
              recordedAt: Date.now(),
            };

            const newResponses = [...state.stepResponses, fullResponse];
            const newAdaptive  = calcAdaptiveDepth(newResponses);
            const nextIndex    = state.currentStepIndex + 1;
            const totalSteps   = state.journeySteps.length;

            // تحقق: هل انتهت مرحلة؟
            const currentStep = state.journeySteps[state.currentStepIndex];
            const nextStep    = state.journeySteps[nextIndex];
            const stageEnded  = nextStep
              ? nextStep.stageId !== currentStep.stageId
              : true;

            // هل اكتملت الرحلة كلها؟
            if (nextIndex >= totalSteps) {
              const pathId = state.activePathId || "unknown";
              emitJourneyEvent({ type: "journey_completed", pathId, timestamp: Date.now() });
              return {
                stepResponses: newResponses,
                adaptiveDepth: newAdaptive,
                currentStepIndex: nextIndex,
                journeyStatus: "complete",
                checkpointDueAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
              };
            }

            // هل انتهت مرحلة؟ → لحظة تجلي
            if (stageEnded && currentStep.insight) {
              const pathId = state.activePathId || "unknown";
              emitJourneyEvent({ type: "stage_completed", pathId, stageId: currentStep.stageId, timestamp: Date.now() });
              return {
                stepResponses: newResponses,
                adaptiveDepth: newAdaptive,
                currentStepIndex: nextIndex,
                journeyStatus: "stage_insight",
              };
            }

            // Emit step completed
            {
              const pathId = state.activePathId || "unknown";
              emitJourneyEvent({ type: "step_completed", pathId, stepId: currentStep.id, timestamp: Date.now() });
            }

            return {
              stepResponses: newResponses,
              adaptiveDepth: newAdaptive,
              currentStepIndex: nextIndex,
            };
          }),

        skipStep: (stepId) =>
          set((state) => {
            const skippedResponse: StepResponse = {
              stepId,
              answer: "",
              depth: "surface",
              durationMs: 0,
              recordedAt: Date.now(),
            };
            const newResponses = [...state.stepResponses, skippedResponse];
            const nextIndex    = state.currentStepIndex + 1;

            if (nextIndex >= state.journeySteps.length) {
              return {
                stepResponses: newResponses,
                currentStepIndex: nextIndex,
                journeyStatus: "complete",
                checkpointDueAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
              };
            }

            return { stepResponses: newResponses, currentStepIndex: nextIndex };
          }),

        completeStageInsight: () =>
          set({ journeyStatus: "active" }),

        recordCheckpoint: (answer) =>
          set({
            checkpointAnswer: answer,
            checkpointDueAt: null,
            journeyStatus: "idle",
          }),

        resetJourney: () =>
          set({
            journeyStatus: "idle",
            journeySteps: [],
            currentStepIndex: 0,
            stepResponses: [],
            adaptiveDepth: "medium",
            checkpointDueAt: null,
            checkpointAnswer: null,
            startedAt: null,
          }),
      },
    }),
    {
      name: "alrehla-masarat-storage",
      partialize: (state) => ({
        activePathId: state.activePathId,
        history: state.history,
        // persist journey progress
        journeyStatus: state.journeyStatus,
        journeySteps: state.journeySteps,
        currentStepIndex: state.currentStepIndex,
        stepResponses: state.stepResponses,
        adaptiveDepth: state.adaptiveDepth,
        checkpointDueAt: state.checkpointDueAt,
        checkpointAnswer: state.checkpointAnswer,
        startedAt: state.startedAt,
      }),
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────
export const selectCurrentStep = (state: MasaratState) =>
  state.journeySteps[state.currentStepIndex] ?? null;

export const selectJourneyProgress = (state: MasaratState) => {
  const total = state.journeySteps.length;
  if (total === 0) return 0;
  return Math.round((state.currentStepIndex / total) * 100);
};

export const selectCompletedStageIds = (state: MasaratState): StageId[] => {
  const current = state.journeySteps[state.currentStepIndex];
  if (!current) return ["muwajaha", "tajalli", "qiyada"];
  const stages: StageId[] = ["muwajaha", "tajalli", "qiyada"];
  const currentStageIdx = stages.indexOf(current.stageId);
  return stages.slice(0, currentStageIdx) as StageId[];
};
