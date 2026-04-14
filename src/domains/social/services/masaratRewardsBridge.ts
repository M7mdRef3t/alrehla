/**
 * Masarat ↔ Tajmeed Rewards Bridge
 *
 * Reactive bridge that listens for Masarat domain events
 * and triggers gamification rewards via the freeze rewards service.
 *
 * Events:
 * - masarat:quick_path_used  → onBoundarySet (crisis navigation)
 * - masarat:path_resolved    → onIntelligenceDeepDive (self-awareness)
 * - masarat:path_activated   → onNodeFrozen (commitment milestone)
 */

import { eventBus } from "@/shared/events/bus";
import { freezeRewardsService } from "../../gamification/services/freezeRewards";

let initialized = false;

export function initMasaratRewardsBridge(): void {
  if (initialized) return;
  initialized = true;

  // Quick path used — navigating a real crisis moment
  eventBus.on("masarat:quick_path_used", (_payload) => {
    freezeRewardsService.onBoundarySet("masarat-quick-path");
  });

  // Path resolved — self-diagnosed their relationship pattern
  eventBus.on("masarat:path_resolved", (_payload) => {
    freezeRewardsService.onIntelligenceDeepDive();
  });

  // Path activated — committed to a recovery path
  eventBus.on("masarat:path_activated", (_payload) => {
    freezeRewardsService.onNodeFrozen("masarat-path-commitment");
  });
}

export function destroyMasaratRewardsBridge(): void {
  eventBus.off("masarat:quick_path_used");
  eventBus.off("masarat:path_resolved");
  eventBus.off("masarat:path_activated");
  initialized = false;
}
