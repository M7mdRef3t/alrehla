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
<<<<<<< HEAD
=======

export interface InternalTelemetryContext {
  pathname?: string | null;
  page_location?: string | null;
  referrer?: string | null;
  device_type?: "mobile" | "desktop";
  screen_width?: number | null;
  viewport_height?: number | null;
}

export interface PageViewTelemetryPayload extends InternalTelemetryContext {
  page_title?: string | null;
}

export interface JourneyFlowTelemetryPayload {
  mode: "anonymous" | "identified";
  step: string;
  timeToAction?: number;
  extra?: Record<string, unknown>;
}

export interface CtaTelemetryPayload {
  source?: string;
  plan?: string;
  cta_name?: string;
  placement?: string;
  page?: string;
}

export interface GoalTelemetryPayload {
  goal_id?: string;
  category?: string;
}

export interface AuthTelemetryPayload {
  trigger?: string;
  method?: string;
  source?: string;
}

export interface OnboardingTelemetryPayload {
  step?: string;
  source?: string;
  mode?: string;
}

export interface WhatsappTelemetryPayload {
  placement?: string;
}

export interface CableTelemetryPayload {
  cableId?: string;
}
>>>>>>> feat/sovereign-final-stabilization
