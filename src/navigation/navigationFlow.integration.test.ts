import { describe, expect, it } from "vitest";
import { resolveNavigation, type AppScreen } from "./navigationMachine";

interface GuardState {
  canUseMap: boolean;
  canUseJourneyTools: boolean;
  isLockedPhaseOne: boolean;
}

function step(target: AppScreen, guards: GuardState) {
  return resolveNavigation({
    target,
    canUseMap: guards.canUseMap,
    canUseJourneyTools: guards.canUseJourneyTools,
    isLockedPhaseOne: guards.isLockedPhaseOne
  });
}

describe("navigation flow integration (top 5 journeys)", () => {
  it("journey 1: landing -> goal -> map with open flags", () => {
    const guards: GuardState = {
      canUseMap: true,
      canUseJourneyTools: true,
      isLockedPhaseOne: false
    };
    expect(step("goal", guards)).toEqual({ kind: "navigate", screen: "goal" });
    expect(step("map", guards)).toEqual({ kind: "navigate", screen: "map" });
  });

  it("journey 2: map is blocked from time control", () => {
    const guards: GuardState = {
      canUseMap: false,
      canUseJourneyTools: true,
      isLockedPhaseOne: false
    };
    expect(step("map", guards)).toEqual({ kind: "blocked", feature: "dawayir_map" });
  });

  it("journey 3: tools is blocked from time control", () => {
    const guards: GuardState = {
      canUseMap: true,
      canUseJourneyTools: false,
      isLockedPhaseOne: false
    };
    expect(step("tools", guards)).toEqual({ kind: "blocked", feature: "journey_tools" });
  });

  it("journey 4: phase-one lock redirects advanced flows to map", () => {
    const guards: GuardState = {
      canUseMap: true,
      canUseJourneyTools: true,
      isLockedPhaseOne: true
    };
    expect(step("guided", guards)).toEqual({ kind: "redirect", screen: "map" });
    expect(step("mission", guards)).toEqual({ kind: "redirect", screen: "map" });
    expect(step("tools", guards)).toEqual({ kind: "blocked", feature: "journey_tools" });
  });

  it("journey 5: stable navigation for non-blocked utility screens", () => {
    const guards: GuardState = {
      canUseMap: true,
      canUseJourneyTools: true,
      isLockedPhaseOne: false
    };
    expect(step("landing", guards)).toEqual({ kind: "navigate", screen: "landing" });
    expect(step("settings", guards)).toEqual({ kind: "navigate", screen: "settings" });
    expect(step("enterprise", guards)).toEqual({ kind: "navigate", screen: "enterprise" });
  });
});

