export type AppScreen =
  | "landing"
  | "goal"
  | "map"
  | "guided"
  | "mission"
  | "tools"
  | "settings"
  | "enterprise"
  | "guilt-court"
  | "diplomacy"
  | "oracle-dashboard"
  | "armory"
  | "survey"
  | "exit-scripts"
  | "grounding"
  | "stories"
  | "about"
  | "insights"
  | "quizzes"
  | "behavioral-analysis"
  | "resources"
  | "profile"
  | "sanctuary"
  | "life-os"
  | "dawayir"
  | "maraya"
  | "session-intake"
  | "session-console"
  | "atmosfera"
  | "masarat"
  | "baseera"
  | "watheeqa"
  | "mizan"
  | "rifaq"
  | "murshid"
  | "protocol"
  | "diagnosis";

export type LockedFeatureKey = "dawayir_map" | "journey_tools";

interface NavigationGuards {
  canUseMap: boolean;
  canUseJourneyTools: boolean;
  isLockedPhaseOne: boolean;
}

interface NavigationInput extends NavigationGuards {
  target: AppScreen;
}

type NavigationResult =
  | { kind: "navigate"; screen: AppScreen }
  | { kind: "blocked"; feature: LockedFeatureKey }
  | { kind: "redirect"; screen: AppScreen };

export function resolveNavigation(input: NavigationInput): NavigationResult {
  const { target, canUseMap, canUseJourneyTools, isLockedPhaseOne } = input;

  if (target === "map" && !canUseMap) {
    return { kind: "blocked", feature: "dawayir_map" };
  }

  if (target === "tools" && (isLockedPhaseOne || !canUseJourneyTools)) {
    return { kind: "blocked", feature: "journey_tools" };
  }

  if (isLockedPhaseOne && (target === "guided" || target === "mission")) {
    return { kind: "redirect", screen: "map" };
  }

  if (target === "oracle-dashboard" && input.isLockedPhaseOne) {
    return { kind: "redirect", screen: "map" };
  }

  return { kind: "navigate", screen: target };
}
