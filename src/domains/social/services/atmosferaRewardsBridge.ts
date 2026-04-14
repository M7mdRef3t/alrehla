/**
 * Atmosfera ↔ Tajmeed Rewards Bridge
 *
 * Reactive bridge that listens for Atmosfera domain events
 * and triggers gamification rewards via the freeze rewards service.
 *
 * Events:
 * - atmosfera:mood_explored      → onIntelligenceDeepDive (self-awareness)
 * - atmosfera:state_changed      → onBoundarySet (conscious state shift)
 * - atmosfera:soundscape_toggled → logging only (no reward)
 */

import { eventBus } from "@/shared/events/bus";
import { freezeRewardsService } from "../../gamification/services/freezeRewards";

let initialized = false;

export function initAtmosferaRewardsBridge(): void {
  if (initialized) return;
  initialized = true;

  // Mood exploration — user actively exploring their emotional state
  eventBus.on("atmosfera:mood_explored", () => {
    freezeRewardsService.onIntelligenceDeepDive();
  });

  // State changed — consciousness shifted between emotional states
  eventBus.on("atmosfera:state_changed", () => {
    freezeRewardsService.onBoundarySet("atmosfera-state-shift");
  });

  // Soundscape toggle — informational, no reward
  eventBus.on("atmosfera:soundscape_toggled", (_payload) => {
    // No reward — just logging for analytics
  });
}

export function destroyAtmosferaRewardsBridge(): void {
  eventBus.off("atmosfera:mood_explored");
  eventBus.off("atmosfera:state_changed");
  eventBus.off("atmosfera:soundscape_toggled");
  initialized = false;
}
