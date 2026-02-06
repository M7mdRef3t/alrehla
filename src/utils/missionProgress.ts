import type { MapNode } from "../modules/map/mapTypes";
import { buildResultTemplateFromAnswers } from "./resultScreenTemplates";
import type { FeelingAnswers } from "../components/FeelingCheck";
import type { RealityAnswers } from "../components/RealityCheck";

export interface MissionProgressSummary {
  completed: number;
  total: number;
  isStarted: boolean;
  isCompleted: boolean;
  label: string;
  tone: "progress" | "done";
  missionLabel: string;
  missionGoal: string;
}

export interface NextMissionStep {
  step: string;
  stepIndex: number;
  total: number;
  missionLabel: string;
  missionGoal: string;
}

export interface IncompleteMissionSteps {
  steps: Array<{ step: string; index: number }>;
  allSteps: Array<{ step: string; index: number; completed: boolean }>;
  total: number;
  missionLabel: string;
  missionGoal: string;
  startedAt: number;
}

export function getMissionProgressSummary(
  node: MapNode,
  options?: { includeArchived?: boolean }
): MissionProgressSummary | null {
  const mission = node.missionProgress;
  const isStarted = Boolean(mission?.startedAt);
  const isCompleted = Boolean(mission?.isCompleted);
  if (mission?.isArchived && !options?.includeArchived) return null;
  if (!isStarted && !isCompleted) return null;
  if (!node.analysis) return null;

  const result = buildResultTemplateFromAnswers({
    score: node.analysis.score ?? 0,
    feelingAnswers: node.analysis.answers as FeelingAnswers | undefined,
    realityAnswers: node.realityAnswers as RealityAnswers | undefined,
    isEmergency: node.isEmergency,
    safetyAnswer: node.safetyAnswer,
    personGender: "unknown"
  });

  const total = result.steps.length;
  if (total === 0) return null;
  const checked = new Set(mission?.checkedSteps ?? []);
  const completed = result.steps.reduce(
    (acc, _step, index) => acc + (checked.has(index) ? 1 : 0),
    0
  );

  if (isCompleted) {
    return {
      completed,
      total,
      isStarted,
      isCompleted,
      label: "تمت المهمة",
      tone: "done",
      missionLabel: result.mission_label,
      missionGoal: result.mission_goal
    };
  }

  return {
    completed,
    total,
    isStarted,
    isCompleted,
    label: `مهمة ${completed}/${total}`,
    tone: "progress",
    missionLabel: result.mission_label,
    missionGoal: result.mission_goal
  };
}

export function getNextMissionStep(
  node: MapNode,
  options?: { includeArchived?: boolean }
): NextMissionStep | null {
  const incomplete = getIncompleteMissionSteps(node, options);
  if (!incomplete || incomplete.steps.length === 0) return null;
  const next = incomplete.steps[0];
  return {
    step: next.step,
    stepIndex: next.index,
    total: incomplete.total,
    missionLabel: incomplete.missionLabel,
    missionGoal: incomplete.missionGoal
  };
}

export function getIncompleteMissionSteps(
  node: MapNode,
  options?: { includeArchived?: boolean }
): IncompleteMissionSteps | null {
  const mission = node.missionProgress;
  if (mission?.isArchived && !options?.includeArchived) return null;
  if (mission?.isCompleted) return null;
  if (!mission?.startedAt) return null;
  if (!node.analysis) return null;

  const result = buildResultTemplateFromAnswers({
    score: node.analysis.score ?? 0,
    feelingAnswers: node.analysis.answers as FeelingAnswers | undefined,
    realityAnswers: node.realityAnswers as RealityAnswers | undefined,
    isEmergency: node.isEmergency,
    safetyAnswer: node.safetyAnswer,
    personGender: "unknown"
  });

  const total = result.steps.length;
  if (total === 0) return null;
  const checked = new Set(mission?.checkedSteps ?? []);
  const allSteps = result.steps.map((step, index) => ({
    step,
    index,
    completed: checked.has(index)
  }));
  const steps = allSteps.filter((item) => !item.completed).map(({ step, index }) => ({ step, index }));

  return {
    steps,
    allSteps,
    total,
    missionLabel: result.mission_label,
    missionGoal: result.mission_goal,
    startedAt: mission.startedAt
  };
}
