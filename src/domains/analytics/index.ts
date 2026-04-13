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
} from "./types";

export { AnalyticsEvents } from "./types";

// ─── Services ──────────────────────────────────────────
export { analyticsService } from "./services/analytics.service";
export { generateUUID } from "@/services/analytics";

// ─── Hook ──────────────────────────────────────────────
export { useAnalytics } from "./hooks/useAnalytics";
