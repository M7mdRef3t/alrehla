import type { JourneyPath, JourneyPathStepKind } from "@/state/adminState";
import {
  getEnabledJourneySteps,
  getFirstJourneyStepByKind,
  getJourneyPathBySlug
} from "@/utils/journeyPaths";

export const MARAYA_STORY_PATH_SLUG = "maraya-story";
export const MARAYA_STORY_SURFACE = "maraya-story";
export const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";

export type MarayaStoryRuntimeStage = "landing" | "story" | "ending" | "return";

const MARAYA_STAGE_KIND_MAP: Record<MarayaStoryRuntimeStage, JourneyPathStepKind | "outcome"> = {
  landing: "check",
  story: "intervention",
  ending: "screen",
  return: "outcome"
};

function mapJourneyKindToRuntimeStage(kind: JourneyPathStepKind | undefined): MarayaStoryRuntimeStage {
  if (kind === "check") return "landing";
  if (kind === "intervention") return "story";
  if (kind === "screen") return "ending";
  return "return";
}

export function getMarayaStoryPath(paths: JourneyPath[]): JourneyPath | null {
  return getJourneyPathBySlug(paths, MARAYA_STORY_PATH_SLUG);
}

export function getMarayaStoryLaunchHref(
  path: JourneyPath | null,
  params?: {
    surface?: string;
    judgeMode?: boolean;
  }
): string {
  const entryScreen = path?.entryScreen?.trim();
  const entryStep = getFirstJourneyStepByKind(path, "entry")?.screen?.trim();
  const baseHref =
    (entryScreen && entryScreen.startsWith("/")) ? entryScreen :
    (entryStep && entryStep.startsWith("/")) ? entryStep :
    "/maraya";

  const searchParams = new URLSearchParams();
  searchParams.set("surface", params?.surface || MARAYA_STORY_SURFACE);
  if (params?.judgeMode) searchParams.set("judge", "1");

  return `${baseHref}?${searchParams.toString()}`;
}

export function getMarayaStoryReturnHref(path: JourneyPath | null): string {
  const outcomeScreen = getFirstJourneyStepByKind(path, "outcome")?.screen?.trim();
  const configuredTarget = outcomeScreen || path?.targetScreen?.trim() || "tools";

  if (configuredTarget.startsWith("/")) return configuredTarget;
  return "/";
}

export function prepareMarayaStoryReturnNavigation(path: JourneyPath | null): void {
  if (typeof window === "undefined") return;

  const outcomeScreen = getFirstJourneyStepByKind(path, "outcome")?.screen?.trim();
  const configuredTarget = outcomeScreen || path?.targetScreen?.trim() || "tools";

  if (!configuredTarget.startsWith("/")) {
    window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, `navigate:${configuredTarget}`);
  }
}

export function launchMarayaStoryReturn(path: JourneyPath | null): void {
  if (typeof window === "undefined") return;
  prepareMarayaStoryReturnNavigation(path);
  window.location.assign(getMarayaStoryReturnHref(path));
}

export function getMarayaStoryTargetLabel(path: JourneyPath | null): string {
  const outcomeScreen = getFirstJourneyStepByKind(path, "outcome")?.screen?.trim();
  const configuredTarget = outcomeScreen || path?.targetScreen?.trim() || "tools";

  if (configuredTarget.startsWith("/")) {
    if (configuredTarget.startsWith("/")) return "الوجهة التالية";
  }

  const labelMap: Record<string, string> = {
    tools: "الأدوات",
    map: "الخريطة",
    insights: "الرؤى",
    sanctuary: "الملاذ الآمن",
    armory: "الترسانة"
  };

  return labelMap[configuredTarget] ?? configuredTarget;
}

export function getMarayaStoryReturnLabel(path: JourneyPath | null): string {
  const configured = path?.primaryActionLabel?.trim();
  return configured || `احمل الأثر إلى ${getMarayaStoryTargetLabel(path)}`;
}

export function getMarayaStoryRestartLabel(path: JourneyPath | null): string {
  return path?.secondaryActionLabel?.trim() || "ابدأ مرايا جديدة";
}

export function getMarayaStoryInitialStage(path: JourneyPath | null): MarayaStoryRuntimeStage {
  const steps = getEnabledJourneySteps(path);
  const entryIndex = steps.findIndex((step) => step.kind === "entry");
  const firstPlayableStep = steps
    .slice(entryIndex >= 0 ? entryIndex + 1 : 0)
    .find((step) => step.kind === "check" || step.kind === "intervention" || step.kind === "screen" || step.kind === "outcome");

  return mapJourneyKindToRuntimeStage(firstPlayableStep?.kind);
}

export function getMarayaStoryNextStage(
  path: JourneyPath | null,
  currentStage: MarayaStoryRuntimeStage
): MarayaStoryRuntimeStage {
  if (currentStage === "return") return "return";

  const currentKind = MARAYA_STAGE_KIND_MAP[currentStage];
  const steps = getEnabledJourneySteps(path);
  const currentIndex = steps.findIndex((step) => step.kind === currentKind);

  if (currentIndex === -1) return "return";

  const nextPlayableStep = steps
    .slice(currentIndex + 1)
    .find((step) => step.kind === "check" || step.kind === "intervention" || step.kind === "screen" || step.kind === "outcome");

  return mapJourneyKindToRuntimeStage(nextPlayableStep?.kind);
}
