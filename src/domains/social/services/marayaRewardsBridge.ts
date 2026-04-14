/**
 * Maraya ↔ Tajmeed Rewards Bridge
 *
 * Reactive bridge that listens for Maraya domain events
 * and triggers gamification rewards via the freeze rewards service.
 *
 * Events:
 * - maraya:story_completed     → onIntelligenceDeepDive (discovery)
 * - maraya:pattern_discovered  → onBoundarySet (self-awareness)
 * - maraya:judge_finale        → onNodeFrozen (transformation milestone)
 */

import { eventBus } from "@/shared/events/bus";
import { freezeRewardsService } from "../../gamification/services/freezeRewards";

let initialized = false;

export function initMarayaRewardsBridge(): void {
  if (initialized) return;
  initialized = true;

  // Story completion — deep dive into self-reflection
  eventBus.on("maraya:story_completed", () => {
    freezeRewardsService.onIntelligenceDeepDive();
  });

  // Pattern discovered — recognizing behavioral patterns
  eventBus.on("maraya:pattern_discovered", () => {
    freezeRewardsService.onBoundarySet("maraya-pattern");
  });

  // Judge mode finale — transformative moment
  eventBus.on("maraya:judge_finale", () => {
    freezeRewardsService.onNodeFrozen("maraya-judge-transformation");
  });
}

export function destroyMarayaRewardsBridge(): void {
  eventBus.off("maraya:story_completed");
  eventBus.off("maraya:pattern_discovered");
  eventBus.off("maraya:judge_finale");
  initialized = false;
}
