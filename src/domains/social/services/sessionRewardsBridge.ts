/**
 * SessionOS ↔ Tajmeed Rewards Bridge
 *
 * Reactive bridge that listens for SessionOS domain events
 * and triggers gamification rewards.
 *
 * Events:
 * - session:intake_completed  → onIntelligenceDeepDive (self-disclosure)
 * - session:session_completed → onBoundarySet + onNodeFrozen (transformation)
 */

import { eventBus } from "@/shared/events/bus";
import { freezeRewardsService } from "../../gamification/services/freezeRewards";

let initialized = false;

export function initSessionRewardsBridge(): void {
  if (initialized) return;
  initialized = true;

  // Intake form completed — user opened up about their situation
  eventBus.on("session:intake_completed", () => {
    freezeRewardsService.onIntelligenceDeepDive();
  });

  // Session completed — transformative milestone
  eventBus.on("session:session_completed", () => {
    freezeRewardsService.onBoundarySet("session-completed");
    freezeRewardsService.onNodeFrozen("session-transformation-complete");
  });
}

export function destroySessionRewardsBridge(): void {
  eventBus.off("session:intake_completed");
  eventBus.off("session:session_completed");
  initialized = false;
}
