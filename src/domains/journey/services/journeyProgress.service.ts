/**
 * Domain: Journey — Journey Progress Service
 *
 * Facade نظيف فوق useJourneyState
 * يوفر API موحدة لقراءة/تحديث تقدم الرحلة.
 */

import { useJourneyState } from "@/domains/journey/store/journey.store";
import { eventBus } from "@/shared/events";
import type { JourneyProgressSummary, JourneyStep, GateStatus } from "../types";
import type { BaselineAnswers } from "@/data/baselineQuestions";
import type { PostStepAnswers } from "@/data/postStepQuestions";

const STEP_LABELS: Record<string, { label: string; labelAr: string }> = {
  baseline: { label: "Baseline Assessment", labelAr: "تقييم الوضع الحالي" },
  goal: { label: "Goal Selection", labelAr: "اختيار الهدف" },
  map: { label: "Relationship Map", labelAr: "خريطة العلاقات" },
  measurement: { label: "Measurement", labelAr: "القياس" },
  celebration: { label: "Celebration", labelAr: "الاحتفال" },
};

export const journeyProgressService = {
  /**
   * ملخص شامل لحالة الرحلة — للـ UI
   */
  getSummary(): JourneyProgressSummary {
    const state = useJourneyState.getState();
    const stepIds = state.getStepIds();
    const currentIndex = state.getCurrentStepIndex();
    const completedCount = state.completedStepIds.length;
    const daysSinceStart = state.journeyStartedAt
      ? Math.floor((Date.now() - state.journeyStartedAt) / 86_400_000)
      : null;

    return {
      currentStepId: state.currentStepId,
      currentStepIndex: currentIndex,
      completedCount,
      totalSteps: stepIds.length,
      percentComplete: Math.round((completedCount / stepIds.length) * 100),
      hasBaseline: state.baselineCompletedAt !== null,
      hasGoal: state.goalId !== null,
      daysSinceStart,
    };
  },

  /**
   * جلب خطوات الرحلة مع حالة كل واحدة
   */
  getSteps(): JourneyStep[] {
    const state = useJourneyState.getState();
    return state.getStepIds().map((id) => ({
      id,
      label: STEP_LABELS[id]?.label ?? id,
      labelAr: STEP_LABELS[id]?.labelAr ?? id,
      isCompleted: state.completedStepIds.includes(id),
      isActive: state.currentStepId === id,
    }));
  },

  /**
   * الانتقال لخطوة معينة
   */
  goToStep(stepId: import("@/domains/journey/store/journey.store").JourneyStepId): void {
    const from = useJourneyState.getState().currentStepId;
    useJourneyState.getState().goToStep(stepId);
    eventBus.emit("journey:step-changed", { from, to: stepId });
  },

  /**
   * الانتقال للأمام
   */
  goNext(): void {
    const from = useJourneyState.getState().currentStepId;
    useJourneyState.getState().goNext();
    const to = useJourneyState.getState().currentStepId;
    if (from !== to) {
      eventBus.emit("journey:step-changed", { from, to });
    }
  },

  /**
   * الرجوع للخلف
   */
  goBack(): void {
    const from = useJourneyState.getState().currentStepId;
    useJourneyState.getState().goBack();
    const to = useJourneyState.getState().currentStepId;
    if (from !== to) {
      eventBus.emit("journey:step-changed", { from, to });
    }
  },

  /**
   * إتمام الـ baseline assessment
   */
  completeBaseline(answers: BaselineAnswers, score: number): void {
    useJourneyState.getState().completeBaseline(answers, score);
    eventBus.emit("journey:baseline-completed", { score });
  },

  /**
   * اختيار هدف
   */
  completeGoal(goalId: string, category: string): void {
    useJourneyState.getState().completeGoal(goalId, category);
    eventBus.emit("journey:goal-selected", { goalId, category });
  },

  /**
   * إتمام الـ post step
   */
  completePostStep(answers: PostStepAnswers, score: number): void {
    useJourneyState.getState().completePostStep(answers, score);
  },

  /**
   * إعادة ضبط الرحلة
   */
  resetJourney(): void {
    useJourneyState.getState().resetJourney();
    eventBus.emit("journey:reset", undefined);
  },

  /**
   * Gate (Funnel) status
   */
  getGateStatus(): GateStatus {
    const state = useJourneyState.getState();
    return {
      sessionId: state.gateSessionId ?? null,
      isConverted: state.isGateConverted ?? false,
      landingIntent: state.landingIntent ?? null,
    };
  },

  /**
   * هل الرحلة مكتملة؟
   */
  isJourneyComplete(): boolean {
    const state = useJourneyState.getState();
    return state.completedStepIds.includes("celebration");
  },
};
