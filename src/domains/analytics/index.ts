/**
 * Domain: Analytics — Public API
 *
 * كل import من analytics يمر هنا فقط.
 */

// ─── Types ─────────────────────────────────────────────
export type {
  EventCategory,
  AnalyticsEvent,
  ConversionEvent,
  TrackingConfig,
  AnalyticsValue,
  AnalyticsParams,
  AnalyticsOptionalParams,
  AnalyticsProvider,
  AnalyticsConsent,
  AnalyticsDiagnostics,
  TrackedEvent,
<<<<<<< HEAD
} from "./types";

export { AnalyticsEvents } from "./types";
=======
  InternalTelemetryContext,
  PageViewTelemetryPayload,
  JourneyFlowTelemetryPayload,
  CtaTelemetryPayload,
  GoalTelemetryPayload,
  AuthTelemetryPayload,
  OnboardingTelemetryPayload,
  WhatsappTelemetryPayload,
  CableTelemetryPayload,
} from "./types";

export { AnalyticsEvents } from "./types";
export {
  buildAnalyticsEnvelope,
  buildPageViewEnvelope,
  buildIdentityLinkedEnvelope,
  buildJourneyFlowEnvelope,
  buildCtaEnvelope,
  buildGoalEnvelope,
  buildAuthEnvelope,
  buildOnboardingEnvelope,
  buildWhatsappEnvelope,
  buildCableEnvelope,
} from "./contracts";
>>>>>>> feat/sovereign-final-stabilization

// ─── Services ──────────────────────────────────────────
export { analyticsService } from "./services/analytics.service";
export { generateUUID } from "@/services/analytics";

// ─── Hook ──────────────────────────────────────────────
export { useAnalytics } from "./hooks/useAnalytics";
