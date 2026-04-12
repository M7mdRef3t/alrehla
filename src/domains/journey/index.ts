/**
 * Domain: Journey — Public API
 *
 * كل ما يحتاجه أي component أو domain آخر
 * يُستورد من هنا فقط.
 */

// ─── Types ────────────────────────────────────────────

export type {
  // State types (re-exported from journeyState)
  JourneyStepId,
  LandingIntent,
  // Tracking types (re-exported from journeyTracking)
  TrackingMode,
  JourneyEventType,
  JourneyEventPayload,
  JourneyEvent,
  FlowStep,
  AggregateStats,
  DayAggregate,
  SessionSummary,
  SessionTimelineEvent,
  LastTaskForNode,
  // Domain types
  JourneyStep,
  JourneyProgressSummary,
  GateStatus,
  JourneyDomainEvent,
} from "./types";

// ─── Services ─────────────────────────────────────────

export { journeyProgressService } from "./services/journeyProgress.service";
export { trackingService } from "./services/tracking.service";
export { ritualsService } from "./services/rituals.service";

// Rituals service sub-types
export type {
  RitualStreak,
  RitualWithStatus,
  DailyCompletionStats,
  QuickAction,
} from "./services/rituals.service";

// ─── Hooks ────────────────────────────────────────────

import { useJourneyState } from "./store/journey.store";
export const useJourneyStore = useJourneyState;
export { useJourneyProgress } from "./hooks/useJourneyProgress";
export { useJourneyTracking } from "./hooks/useJourneyTracking";
