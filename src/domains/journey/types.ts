/**
 * Domain: Journey — Types
 *
 * Re-exports من المصادر الأصلية + types جديدة خاصة بالـ domain.
 * لا تكرار — نُعيد التصدير فقط.
 */

// ─── Re-exports from journeyState ──────────────────────
export type { JourneyStepId, LandingIntent } from "@/domains/journey/store/journey.store";

// ─── Re-exports from journeyTracking ───────────────────
export type {
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
} from "@/services/journeyTracking";

// ─── Journey Step Definition ────────────────────────────

export interface JourneyStep {
  id: import("@/domains/journey/store/journey.store").JourneyStepId;
  label: string;
  labelAr: string;
  isCompleted: boolean;
  isActive: boolean;
}

// ─── Journey Progress Summary ───────────────────────────

export interface JourneyProgressSummary {
  currentStepId: import("@/domains/journey/store/journey.store").JourneyStepId;
  currentStepIndex: number;
  completedCount: number;
  totalSteps: number;
  percentComplete: number;
  hasBaseline: boolean;
  hasGoal: boolean;
  daysSinceStart: number | null;
}

// ─── Gate (Funnel) ──────────────────────────────────────

export interface GateStatus {
  sessionId: string | null;
  isConverted: boolean;
  landingIntent: import("@/domains/journey/store/journey.store").LandingIntent;
}

// ─── Domain Events ──────────────────────────────────────

export type JourneyDomainEvent =
  | { type: "journey:baseline-completed"; score: number }
  | { type: "journey:goal-selected"; goalId: string; category: string }
  | { type: "journey:step-changed"; from: string; to: string }
  | { type: "journey:reset" }
  | { type: "journey:path-started"; pathId: string; nodeId?: string }
  | { type: "journey:task-completed"; pathId: string; taskId: string };
