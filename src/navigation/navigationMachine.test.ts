import { describe, expect, it } from "vitest";
import { resolveNavigation } from "./navigationMachine";

describe("resolveNavigation", () => {
  it("blocks map when map feature is disabled", () => {
    const result = resolveNavigation({
      target: "map",
      canUseMap: false,
      canUseJourneyTools: true,
      isLockedPhaseOne: false
    });
    expect(result).toEqual({ kind: "blocked", feature: "dawayir_map" });
  });

  it("blocks tools when tools feature is disabled", () => {
    const result = resolveNavigation({
      target: "tools",
      canUseMap: true,
      canUseJourneyTools: false,
      isLockedPhaseOne: false
    });
    expect(result).toEqual({ kind: "blocked", feature: "journey_tools" });
  });

  it("redirects guided/mission/tools to map in phase-one lock", () => {
    const guided = resolveNavigation({
      target: "guided",
      canUseMap: true,
      canUseJourneyTools: true,
      isLockedPhaseOne: true
    });
    expect(guided).toEqual({ kind: "redirect", screen: "map" });
  });

  it("navigates normally when guards pass", () => {
    const result = resolveNavigation({
      target: "goal",
      canUseMap: true,
      canUseJourneyTools: true,
      isLockedPhaseOne: false
    });
    expect(result).toEqual({ kind: "navigate", screen: "goal" });
  });
});
