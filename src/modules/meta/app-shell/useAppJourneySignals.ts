import { useMemo } from "react";
import type { MapNode } from "@/modules/map/mapTypes";
import { useMapState } from '@/modules/map/dawayirIndex';
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useJourneyProgress } from "@/domains/journey";
import { useAppShellNavigationState } from '@/modules/map/dawayirIndex';
import { getWeeklyPulseInsight } from "@/utils/pulseInsights";
import { getIncompleteMissionSteps } from "@/utils/missionProgress";

type PulseMode = "angry" | "low" | "high" | "normal";

export function useAppJourneySignals() {
  const nodes = useMapState((s) => s.nodes);
  const pulseLogs = usePulseState((s) => s.logs);
  const weekdayLabels = usePulseState((s) => s.weekdayLabels);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const storedGoalId = useJourneyProgress().goalId;
  const goalId = useAppShellNavigationState((s) => s.goalId);

  const pulseInsight = useMemo(
    () => getWeeklyPulseInsight(pulseLogs, weekdayLabels),
    [pulseLogs, weekdayLabels]
  );

  const pulseMode = useMemo<PulseMode>(() => {
    if (!lastPulse) return "normal";
    const ageMs = Date.now() - (lastPulse.timestamp ?? 0);
    if (ageMs > 24 * 60 * 60 * 1000) return "normal";
    if (lastPulse.mood === "angry") return "angry";
    if (lastPulse.energy <= 3) return "low";
    if (lastPulse.energy >= 8) return "high";
    return "normal";
  }, [lastPulse]);

  const challengeTarget = useMemo(() => {
    const candidates = nodes
      .map((node) => {
        const incomplete = getIncompleteMissionSteps(node);
        if (!incomplete || !incomplete.steps.length) return null;
        return { node, incomplete };
      })
      .filter(
        (item): item is { node: MapNode; incomplete: NonNullable<ReturnType<typeof getIncompleteMissionSteps>> } =>
          Boolean(item)
      );

    if (!candidates.length) return null;

    candidates.sort((a, b) => {
      const remainingDiff = b.incomplete.steps.length - a.incomplete.steps.length;
      if (remainingDiff !== 0) return remainingDiff;
      return (b.incomplete.startedAt ?? 0) - (a.incomplete.startedAt ?? 0);
    });

    const target = candidates[0];
    const nextStep = target.incomplete.steps[0];
    return {
      nodeId: target.node.id,
      label: target.node.label,
      step: nextStep.step,
      stepIndex: nextStep.index,
      total: target.incomplete.total,
      missionLabel: target.incomplete.missionLabel
    };
  }, [nodes]);

  const challengeLabel = challengeTarget
    ? `مع ${challengeTarget.label} — ${challengeTarget.missionLabel} (خطوة ${challengeTarget.stepIndex + 1}/${challengeTarget.total})`
    : null;

  const canSkipCocoonBreathing = useMemo(
    () => nodes.length === 0 && !storedGoalId && goalId === "unknown",
    [goalId, nodes.length, storedGoalId]
  );

  const hasActiveMission = useMemo(
    () => nodes.some((node) => node.missionProgress?.startedAt && !node.missionProgress?.isCompleted),
    [nodes]
  );

  return {
    pulseInsight,
    pulseMode,
    challengeTarget,
    challengeLabel,
    canSkipCocoonBreathing,
    hasActiveMission
  };
}
