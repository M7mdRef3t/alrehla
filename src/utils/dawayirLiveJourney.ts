import type { JourneyPath, JourneyPathStepKind } from "@/domains/admin/store/admin.store";
import {
  getEnabledJourneySteps,
  getFirstJourneyStepByKind,
  getJourneyPathBySlug
} from "@/utils/journeyPaths";

export const DAWAYIR_LIVE_PATH_SLUG = "dawayir-live";
export const DAWAYIR_LIVE_SURFACE = "dawayir-live";
export const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";

export type DawayirLiveRuntimeStage = "setup" | "live" | "complete" | "return";

const LIVE_STAGE_KIND_MAP: Record<DawayirLiveRuntimeStage, JourneyPathStepKind | "outcome"> = {
  setup: "check",
  live: "intervention",
  complete: "screen",
  return: "outcome"
};

function mapJourneyKindToRuntimeStage(kind: JourneyPathStepKind | undefined): DawayirLiveRuntimeStage {
  if (kind === "check") return "setup";
  if (kind === "intervention") return "live";
  if (kind === "screen") return "complete";
  return "return";
}

export function getDawayirLivePath(paths: JourneyPath[]): JourneyPath | null {
  return getJourneyPathBySlug(paths, DAWAYIR_LIVE_PATH_SLUG);
}

export function getDawayirLiveLaunchHref(
  path: JourneyPath | null,
  params?: {
    surface?: string;
    nodeId?: string;
    nodeLabel?: string;
    goalId?: string;
    note?: string;
  }
): string {
  const setupScreen = getFirstJourneyStepByKind(path, "check")?.screen?.trim();
  const entryHref = setupScreen?.startsWith("/") ? setupScreen : "/dawayir-live";
  const searchParams = new URLSearchParams();

  searchParams.set("surface", params?.surface || DAWAYIR_LIVE_SURFACE);
  if (params?.nodeId) searchParams.set("nodeId", params.nodeId);
  if (params?.nodeLabel) searchParams.set("nodeLabel", params.nodeLabel);
  if (params?.goalId) searchParams.set("goalId", params.goalId);
  if (params?.note) searchParams.set("note", params.note);

  return `${entryHref}?${searchParams.toString()}`;
}

export function getDawayirLiveReturnHref(path: JourneyPath | null): string {
  const outcomeScreen = getFirstJourneyStepByKind(path, "outcome")?.screen?.trim();
  const configuredTarget = outcomeScreen || path?.targetScreen?.trim() || "map";

  if (configuredTarget.startsWith("/")) return configuredTarget;

  return `/dawayir?surface=${DAWAYIR_LIVE_SURFACE}`;
}

export function prepareDawayirLiveReturnNavigation(path: JourneyPath | null): void {
  if (typeof window === "undefined") return;

  const outcomeScreen = getFirstJourneyStepByKind(path, "outcome")?.screen?.trim();
  const configuredTarget = outcomeScreen || path?.targetScreen?.trim() || "map";

  if (!configuredTarget.startsWith("/")) {
    window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, `navigate:${configuredTarget}`);
  }
}

export function getDawayirLivePrimaryLabel(path: JourneyPath | null): string {
  return path?.primaryActionLabel?.trim() || "ابدأ جلسة دواير لايف";
}

export function getDawayirLiveHistoryHref(): string {
  return "/dawayir-live/history";
}

export function getDawayirLiveCoupleHref(): string {
  return "/dawayir-live/couple";
}

export function getDawayirLiveCoachHref(): string {
  return "/coach?tab=dawayir-live";
}

export function getDawayirLiveInitialStage(path: JourneyPath | null): DawayirLiveRuntimeStage {
  const steps = getEnabledJourneySteps(path);
  const entryIndex = steps.findIndex((step) => step.kind === "entry");
  const firstPlayableStep = steps
    .slice(entryIndex >= 0 ? entryIndex + 1 : 0)
    .find((step) => step.kind === "check" || step.kind === "intervention" || step.kind === "screen" || step.kind === "outcome");

  return mapJourneyKindToRuntimeStage(firstPlayableStep?.kind);
}

export function getDawayirLiveNextStage(
  path: JourneyPath | null,
  currentStage: DawayirLiveRuntimeStage
): DawayirLiveRuntimeStage {
  if (currentStage === "return") return "return";

  const currentKind = LIVE_STAGE_KIND_MAP[currentStage];
  const steps = getEnabledJourneySteps(path);
  const currentIndex = steps.findIndex((step) => step.kind === currentKind);

  if (currentIndex === -1) return "return";

  const nextPlayableStep = steps
    .slice(currentIndex + 1)
    .find((step) => step.kind === "check" || step.kind === "intervention" || step.kind === "screen" || step.kind === "outcome");

  return mapJourneyKindToRuntimeStage(nextPlayableStep?.kind);
}
