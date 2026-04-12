/**
 * Domain: Journey — useJourneyProgress hook
 *
 * Hook رئيسي لقراءة حالة الرحلة والتنقل بين خطواتها.
 * يحل محل الاستيراد المباشر من useJourneyState في الـ components.
 */

"use client";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { journeyProgressService } from "../services/journeyProgress.service";
import type { JourneyStepId } from "../types";
import type { BaselineAnswers } from "@/data/baselineQuestions";
import type { PostStepAnswers } from "@/data/postStepQuestions";

export function useJourneyProgress() {
  // Selectors — reactive reads من Zustand
  const currentStepId = useJourneyState((s) => s.currentStepId);
  const completedStepIds = useJourneyState((s) => s.completedStepIds);
  const baselineScore = useJourneyState((s) => s.baselineScore);
  const baselineAnswers = useJourneyState((s) => s.baselineAnswers);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const postStepScore = useJourneyState((s) => s.postStepScore);
  const goalId = useJourneyState((s) => s.goalId);
  const category = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const mirrorName = useJourneyState((s) => s.mirrorName);
  const landingIntent = useJourneyState((s) => s.landingIntent);
  const isSoundEnabled = useJourneyState((s) => s.isSoundEnabled);
  const isSensoryDepthEnabled = useJourneyState((s) => s.isSensoryDepthEnabled);
  const journeyStartedAt = useJourneyState((s) => s.journeyStartedAt);
  const canGoNext = useJourneyState((s) => s.canGoNext());
  const canGoBack = useJourneyState((s) => s.canGoBack());
  const gateSessionId = useJourneyState((s) => s.gateSessionId);
  const isGateConverted = useJourneyState((s) => s.isGateConverted);
  const getCurrentStepIndex = useJourneyState((s) => s.getCurrentStepIndex);

  // Derived
  const summary = journeyProgressService.getSummary();
  const steps = journeyProgressService.getSteps();
  const isComplete = journeyProgressService.isJourneyComplete();

  return {
    // State
    currentStepId,
    completedStepIds,
    baselineScore,
    baselineAnswers,
    baselineCompletedAt,
    postStepScore,
    goalId,
    category,
    lastGoalById,
    mirrorName,
    landingIntent,
    isSoundEnabled,
    isSensoryDepthEnabled,
    journeyStartedAt,
    gateSessionId,
    isGateConverted,
    getCurrentStepIndex,

    // Derived
    summary,
    steps,
    isComplete,
    canGoNext,
    canGoBack,

    // Actions
    goToStep: (id: JourneyStepId) => journeyProgressService.goToStep(id),
    goNext: () => journeyProgressService.goNext(),
    goBack: () => journeyProgressService.goBack(),
    completeBaseline: (answers: BaselineAnswers, score: number) =>
      journeyProgressService.completeBaseline(answers, score),
    completeGoal: (goalId: string, category: string) =>
      journeyProgressService.completeGoal(goalId, category),
    completePostStep: (answers: PostStepAnswers, score: number) =>
      journeyProgressService.completePostStep(answers, score),
    resetJourney: () => journeyProgressService.resetJourney(),

    // Passthrough for less-common actions
    setLandingIntent: useJourneyState.getState().setLandingIntent,
    consumeLandingIntent: useJourneyState.getState().consumeLandingIntent,
    setMirrorName: useJourneyState.getState().setMirrorName,
    consumeMirrorName: useJourneyState.getState().consumeMirrorName,
    setSoundEnabled: useJourneyState.getState().setSoundEnabled,
    setSensoryDepthEnabled: useJourneyState.getState().setSensoryDepthEnabled,
    setGateSessionId: useJourneyState.getState().setGateSessionId,
    setGateConverted: useJourneyState.getState().setGateConverted,
    setLastGoal: useJourneyState.getState().setLastGoal,
  };
}
