import { useMapState } from "../../state/mapState";
import { usePulseState } from "../../state/pulseState";
import { calculateEntropy } from "../../services/predictiveEngine";
import { getDawayirSignalHistory } from "./recommendationBus";
import { getRecentJourneyEvents, type JourneyEvent } from "../../services/journeyTracking";
import type { FeatureVectorV1, JourneyPhaseV1 } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function deriveDominantRing(): "green" | "yellow" | "red" | "mixed" {
  const activeNodes = useMapState.getState().nodes.filter((node) => !node.isNodeArchived);
  if (activeNodes.length === 0) return "mixed";
  const counts = activeNodes.reduce<Record<string, number>>((acc, node) => {
    acc[node.ring] = (acc[node.ring] ?? 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return (entries[0]?.[0] as "green" | "yellow" | "red") ?? "mixed";
  const [top, second] = entries;
  return top[1] === second[1] ? "mixed" : (top[0] as "green" | "yellow" | "red");
}

function computePulseInstability7d(): number {
  const now = Date.now();
  const logs = usePulseState
    .getState()
    .logs.filter((entry) => now - entry.timestamp <= 7 * DAY_MS)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (logs.length < 2) return 0;

  const unstableMoods = new Set(["anxious", "angry", "sad", "tense", "overwhelmed"]);
  let instabilityPoints = 0;
  for (let i = 0; i < logs.length; i += 1) {
    const current = logs[i];
    if (unstableMoods.has(current.mood)) instabilityPoints += 1;
    if (i > 0) {
      const previous = logs[i - 1];
      if (Math.abs(current.energy - previous.energy) >= 3) instabilityPoints += 1;
      if (current.mood !== previous.mood) instabilityPoints += 0.5;
    }
  }

  const maxPoints = logs.length * 2;
  return clamp(instabilityPoints / maxPoints, 0, 1);
}

function computeTaskCompletion7d(events: JourneyEvent[]): number {
  const taskStarted = events.filter((event) => event.type === "task_started").length;
  const taskCompleted = events.filter((event) => event.type === "task_completed").length;
  if (taskStarted === 0) return taskCompleted > 0 ? 1 : 0;
  return clamp(taskCompleted / taskStarted, 0, 1);
}

function computeSessionHesitation(events: JourneyEvent[]): number {
  const flowEvents = events.filter((event) => event.type === "flow_event");
  if (flowEvents.length === 0) return 0;

  let abandoned = 0;
  let longDwells = 0;
  let dwellSamples = 0;
  for (const event of flowEvents) {
    const payload = event.payload as {
      step?: string;
      extra?: { dwellTime?: number };
    };
    if (payload?.step === "pulse_abandoned") abandoned += 1;
    const dwell = payload?.extra?.dwellTime;
    if (typeof dwell === "number") {
      dwellSamples += 1;
      if (dwell >= 45_000) longDwells += 1;
    }
  }

  const abandonmentRatio = abandoned / flowEvents.length;
  const longDwellRatio = dwellSamples === 0 ? 0 : longDwells / dwellSamples;
  return clamp(abandonmentRatio * 0.7 + longDwellRatio * 0.3, 0, 1);
}

function computeRuminationVelocity7d(): number {
  const now = Date.now();
  const nodes = useMapState.getState().nodes.filter((node) => !node.isNodeArchived);
  const recentSituationLogs = nodes.reduce((sum, node) => {
    const logs = node.recoveryProgress?.situationLogs ?? [];
    return sum + logs.filter((log) => now - log.date <= 7 * DAY_MS).length;
  }, 0);

  const ruminationCount = nodes.reduce(
    (sum, node) => sum + (node.recoveryProgress?.ruminationLogCount ?? 0),
    0
  );

  return Math.round((recentSituationLogs + ruminationCount) * 10) / 10;
}

function computeRiskRatio(): { ratio: number; focusNodeId?: string } {
  const activeNodes = useMapState.getState().nodes.filter((node) => !node.isNodeArchived);
  if (activeNodes.length === 0) return { ratio: 0 };

  const riskNodes = activeNodes.filter((node) => node.ring === "red" || node.detachmentMode);
  const sortedByRisk = [...riskNodes].sort((a, b) => {
    const scoreA = (a.analysis?.score ?? 0) + (a.recoveryProgress?.ruminationLogCount ?? 0);
    const scoreB = (b.analysis?.score ?? 0) + (b.recoveryProgress?.ruminationLogCount ?? 0);
    return scoreB - scoreA;
  });

  return {
    ratio: clamp(riskNodes.length / activeNodes.length, 0, 1),
    focusNodeId: sortedByRisk[0]?.id
  };
}

export interface BuildFeatureVectorInput {
  now?: number;
}

export function buildFeatureVectorV1(_: BuildFeatureVectorInput = {}): FeatureVectorV1 {
  const now = Date.now();
  const sevenDaysEvents = getRecentJourneyEvents(600).filter((event) => now - event.timestamp <= 7 * DAY_MS);
  const signals7d = getDawayirSignalHistory(7 * DAY_MS);
  const entropy = calculateEntropy();
  const { ratio: riskRatio, focusNodeId } = computeRiskRatio();

  return {
    entropyScore: entropy.entropyScore,
    riskRatio,
    ringVolatility7d: signals7d.filter((signal) => signal.type === "ring_changed").length,
    pulseInstability7d: computePulseInstability7d(),
    ruminationVelocity7d: computeRuminationVelocity7d(),
    taskCompletion7d: computeTaskCompletion7d(sevenDaysEvents),
    sessionHesitation: computeSessionHesitation(sevenDaysEvents),
    dominantRing: deriveDominantRing(),
    focusNodeId
  };
}

export interface JourneyPhaseInputV1 {
  goalId: string;
  features: FeatureVectorV1;
}

export function deriveJourneyPhaseV1(input: JourneyPhaseInputV1): JourneyPhaseV1 {
  const nodes = useMapState.getState().nodes.filter((node) => !node.isNodeArchived);
  const goalMissing = !input.goalId || input.goalId === "unknown";
  if (goalMissing && nodes.length === 0) return "lost";
  if (nodes.length === 0) return "lost";

  const completedSteps = nodes.reduce(
    (sum, node) => sum + (node.recoveryProgress?.completedSteps?.length ?? 0),
    0
  );
  if (completedSteps === 0) return "mapping";

  const stageCounts = nodes.reduce<Record<string, number>>((acc, node) => {
    const stage = node.recoveryProgress?.pathStage ?? "awareness";
    acc[stage] = (acc[stage] ?? 0) + 1;
    return acc;
  }, {});
  const dominantStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "awareness";

  if (input.features.sessionHesitation >= 0.65 || input.features.pulseInstability7d >= 0.6) {
    return "resistance";
  }

  if (dominantStage === "integration") return "integration";
  if (dominantStage === "acceptance") return "acceptance";
  if (dominantStage === "resistance") return "resistance";
  if (dominantStage === "awareness") return "awareness";

  return "mapping";
}
