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
  | "diplomacy";

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

  if (isLockedPhaseOne && (target === "guided" || target === "mission" || target === "tools")) {
    return { kind: "redirect", screen: "map" };
  }

  return { kind: "navigate", screen: target };
}
