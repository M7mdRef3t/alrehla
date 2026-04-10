import type { JourneyPath, JourneyPathStep, JourneyPathStepKind } from "@/state/adminState";

export function getJourneyPathBySlug(paths: JourneyPath[], slug: string): JourneyPath | null {
  return paths.find((path) => path.slug === slug) ?? null;
}

export function getEnabledJourneySteps(path: JourneyPath | null): JourneyPathStep[] {
  if (!path) return [];
  return path.steps.filter((step) => step.enabled);
}

export function getFirstJourneyStepByKind(
  path: JourneyPath | null,
  kind: JourneyPathStepKind
): JourneyPathStep | null {
  return getEnabledJourneySteps(path).find((step) => step.kind === kind) ?? null;
}

export function getJourneyStepAfterKind(
  path: JourneyPath | null,
  kind: JourneyPathStepKind
): JourneyPathStep | null {
  const steps = getEnabledJourneySteps(path);
  const startIndex = steps.findIndex((step) => step.kind === kind);
  if (startIndex === -1) return null;
  return steps[startIndex + 1] ?? null;
}

export function hasEnabledJourneyStepKind(
  path: JourneyPath | null,
  kind: JourneyPathStepKind
): boolean {
  return getEnabledJourneySteps(path).some((step) => step.kind === kind);
}

export function isJourneyScreenEnabled(path: JourneyPath | null, screen: string): boolean {
  return getEnabledJourneySteps(path).some((step) => step.screen === screen);
}
