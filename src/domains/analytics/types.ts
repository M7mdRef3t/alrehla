/**
 * Domain: Analytics — Types
 *
 * يدمج الـ scaffold الموجود مع re-exports من analytics.ts
 */

// ─── Re-export AnalyticsEvents const map ───────────────
export { AnalyticsEvents } from "@/services/analytics";

// ─── Core Types ────────────────────────────────────────

export type AnalyticsValue = string | number | boolean;
export type AnalyticsParams = Record<string, AnalyticsValue>;
export type AnalyticsOptionalParams = Record<string, AnalyticsValue | null | undefined>;

export type AnalyticsProvider = "internal" | "ga4" | "meta" | "clarity" | "contentsquare";

// ─── Kept from scaffold ────────────────────────────────

export type EventCategory =
  | "page_view"
  | "user_action"
  | "conversion"
  | "engagement"
  | "session"
  | "ai_interaction"
  | "error";

export interface AnalyticsEvent {
  name: string;
  category: EventCategory;
  properties?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface ConversionEvent {
  eventName: string;
  value?: number;
  currency?: string;
  contentCategory?: string;
  contentName?: string;
}

export interface TrackingConfig {
  metaPixelId?: string;
  metaConversionToken?: string;
  vercelAnalytics: boolean;
  sentryDsn?: string;
}

// ─── New Domain Types ──────────────────────────────────

export interface AnalyticsConsent {
  given: boolean;
  timestamp?: number;
}

export interface AnalyticsDiagnostics {
  context: string;
  userMode: boolean;
  analyticsConsent: boolean;
  metaPixelIdPresent: boolean;
  metaEventsEnabled: boolean;
  fbqPresent: boolean;
  fbqInitialized: boolean;
  fbqScriptLoaded: boolean;
  gtagPresent: boolean;
}

export interface TrackedEvent {
  name: string;
  params?: AnalyticsOptionalParams;
  clientEventId?: string;
}
