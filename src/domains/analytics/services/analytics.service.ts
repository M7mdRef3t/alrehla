<<<<<<< HEAD
=======
/* eslint-disable @typescript-eslint/no-unused-vars */
>>>>>>> feat/sovereign-final-stabilization
/**
 * Domain: Analytics — Core Tracking Service
 *
 * Facade موحد فوق analytics.ts الضخم.
 * كل مكون يمر من هنا — لا import مباشر من services/analytics.
 */

import {
  trackEvent,
  trackPageView,
  trackLandingView,
  trackLead,
  trackCompleteRegistration,
  trackActivationUnlocked,
  trackCheckoutViewed,
  trackInitiateCheckout,
  trackIdentityLinked,
  initAnalytics,
  setAnalyticsConsent,
  getAnalyticsConsent,
  getAnalyticsDiagnostics,
  logAnalyticsDiagnostics,
  getOrCreateAnonymousId,
  getOrCreateSessionId,
  setStoredClientEventId,
  getStoredClientEventId,
  trackOnboardingCompleted,
  trackAddPaymentInfo,
  AnalyticsEvents,
<<<<<<< HEAD
} from "@/services/analytics";
import type { AnalyticsOptionalParams, AnalyticsDiagnostics } from "../types";

export const analyticsService = {
=======
  generateUUID,
} from "@/services/analytics";
import type {
  AnalyticsOptionalParams,
  AnalyticsDiagnostics,
  PageViewTelemetryPayload,
  JourneyFlowTelemetryPayload,
  CtaTelemetryPayload,
  GoalTelemetryPayload,
  AuthTelemetryPayload,
  OnboardingTelemetryPayload,
  WhatsappTelemetryPayload,
  CableTelemetryPayload
} from "../types";
import {
  buildAuthEnvelope,
  buildCableEnvelope,
  buildCtaEnvelope,
  buildGoalEnvelope,
  buildOnboardingEnvelope,
  buildWhatsappEnvelope
} from "../contracts";

type KnownTrackEvent =
  | typeof AnalyticsEvents.PAGE_VIEW
  | typeof AnalyticsEvents.LANDING_VIEW
  | typeof AnalyticsEvents.CTA_CLICK
  | typeof AnalyticsEvents.SANCTUARY_LOADED
  | typeof AnalyticsEvents.FIRST_PULSE_SUBMITTED
  | typeof AnalyticsEvents.JOURNEY_STARTED
  | typeof AnalyticsEvents.GOAL_SELECTED
  | typeof AnalyticsEvents.PERSON_ADDED
  | typeof AnalyticsEvents.BASELINE_COMPLETED
  | typeof AnalyticsEvents.NODE_ADDED
  | typeof AnalyticsEvents.AI_CHAT_USED
  | typeof AnalyticsEvents.BREATHING_OPENED
  | typeof AnalyticsEvents.EMERGENCY_OPENED
  | typeof AnalyticsEvents.CONSENT_GIVEN
  | typeof AnalyticsEvents.CONSENT_DENIED
  | typeof AnalyticsEvents.AUTH_COMPLETED
  | typeof AnalyticsEvents.ONBOARDING_STARTED
  | typeof AnalyticsEvents.ONBOARDING_COMPLETED
  | typeof AnalyticsEvents.PAYMENT_PROOF_SUBMITTED
  | typeof AnalyticsEvents.ACTIVATION_VIEWED
  | typeof AnalyticsEvents.ACTIVATION_UNLOCKED
  | typeof AnalyticsEvents.PAYMENT_INTENT_SUBMITTED;

export interface AnalyticsService {
  init(): void;
  setConsent(consent: boolean): void;
  hasConsent(): boolean;
  getAnonymousId(): string;
  getSessionId(): string;
  linkIdentity(userId: string): Promise<void>;
  cta(params?: CtaTelemetryPayload): void;
  goal(params?: GoalTelemetryPayload): void;
  auth(eventName:
    | typeof AnalyticsEvents.AUTH_MODAL_SHOWN
    | typeof AnalyticsEvents.AUTH_GOOGLE_CLICKED
    | typeof AnalyticsEvents.AUTH_PHONE_CLICKED
    | typeof AnalyticsEvents.AUTH_PHONE_OTP_SENT
    | typeof AnalyticsEvents.AUTH_PHONE_OTP_VERIFIED
    | typeof AnalyticsEvents.AUTH_COMPLETED,
    params?: AuthTelemetryPayload): void;
  onboarding(eventName:
    | typeof AnalyticsEvents.ONBOARDING_STARTED
    | typeof AnalyticsEvents.ONBOARDING_COMPLETED,
    params?: OnboardingTelemetryPayload): void;
  whatsapp(params?: WhatsappTelemetryPayload): void;
  cable(params?: CableTelemetryPayload): void;
  track(eventName: typeof AnalyticsEvents.PAGE_VIEW, params?: PageViewTelemetryPayload): void;
  track(eventName: typeof AnalyticsEvents.JOURNEY_STARTED, params?: JourneyFlowTelemetryPayload): void;
  track(eventName: typeof AnalyticsEvents.CTA_CLICK, params?: CtaTelemetryPayload): void;
  track(eventName: typeof AnalyticsEvents.GOAL_SELECTED, params?: GoalTelemetryPayload): void;
  track(eventName:
    | typeof AnalyticsEvents.AUTH_MODAL_SHOWN
    | typeof AnalyticsEvents.AUTH_GOOGLE_CLICKED
    | typeof AnalyticsEvents.AUTH_PHONE_CLICKED
    | typeof AnalyticsEvents.AUTH_PHONE_OTP_SENT
    | typeof AnalyticsEvents.AUTH_PHONE_OTP_VERIFIED
    | typeof AnalyticsEvents.AUTH_COMPLETED,
    params?: AuthTelemetryPayload): void;
  track(eventName:
    | typeof AnalyticsEvents.ONBOARDING_STARTED
    | typeof AnalyticsEvents.ONBOARDING_COMPLETED,
    params?: OnboardingTelemetryPayload): void;
  track(eventName: KnownTrackEvent, params?: AnalyticsOptionalParams): void;
  track(eventName: string, params?: AnalyticsOptionalParams): void;
  trackPage(name: string): void;
  trackLanding(params?: AnalyticsOptionalParams): void;
  trackLead(params?: AnalyticsOptionalParams): void;
  trackCompleteRegistration(params?: AnalyticsOptionalParams): void;
  trackCheckoutViewed(params?: AnalyticsOptionalParams): void;
  trackInitiateCheckout(params?: AnalyticsOptionalParams): void;
  getDiagnostics(context?: string): AnalyticsDiagnostics;
  logDiagnostics(context?: string): void;
  setStoredClientEventId(id: string): void;
  getStoredClientEventId(): string | null;
  trackOnboardingCompleted(params?: AnalyticsOptionalParams): void;
  trackAddPaymentInfo(params?: AnalyticsOptionalParams): void;
  Events: typeof AnalyticsEvents;
}

export const analyticsService: AnalyticsService = {
>>>>>>> feat/sovereign-final-stabilization
  // ─── Initialization ────────────────────────────────

  /**
   * تهيئة كل الـ providers (Pixel + Gtag + Clarity)
   */
  init(): void {
    initAnalytics();
  },

  // ─── Consent ──────────────────────────────────────

  setConsent(consent: boolean): void {
    setAnalyticsConsent(consent);
  },

  hasConsent(): boolean {
    return getAnalyticsConsent();
  },

  // ─── Identity ─────────────────────────────────────

  getAnonymousId(): string {
    return getOrCreateAnonymousId();
  },

  getSessionId(): string {
    return getOrCreateSessionId();
  },

  /**
   * ربط الـ anonymous session بمستخدم مسجل
   */
  async linkIdentity(userId: string): Promise<void> {
    return trackIdentityLinked(userId);
  },

<<<<<<< HEAD
=======
  cta(params?: CtaTelemetryPayload): void {
    const envelope = buildCtaEnvelope({
      client_event_id: generateUUID(),
      payload: params ?? {}
    });
    if (envelope) {
      trackEvent(AnalyticsEvents.CTA_CLICK, envelope.payload as AnalyticsOptionalParams);
    }
  },

  goal(params?: GoalTelemetryPayload): void {
    const envelope = buildGoalEnvelope({
      client_event_id: generateUUID(),
      payload: params ?? {}
    });
    if (envelope) {
      trackEvent(AnalyticsEvents.GOAL_SELECTED, envelope.payload as AnalyticsOptionalParams);
    }
  },

  auth(
    eventName:
      | typeof AnalyticsEvents.AUTH_MODAL_SHOWN
      | typeof AnalyticsEvents.AUTH_GOOGLE_CLICKED
      | typeof AnalyticsEvents.AUTH_PHONE_CLICKED
      | typeof AnalyticsEvents.AUTH_PHONE_OTP_SENT
      | typeof AnalyticsEvents.AUTH_PHONE_OTP_VERIFIED
      | typeof AnalyticsEvents.AUTH_COMPLETED,
    params?: AuthTelemetryPayload
  ): void {
    const envelope = buildAuthEnvelope({
      client_event_id: generateUUID(),
      payload: params ?? {}
    });
    if (envelope) {
      trackEvent(eventName, envelope.payload as AnalyticsOptionalParams);
    }
  },

  onboarding(
    eventName:
      | typeof AnalyticsEvents.ONBOARDING_STARTED
      | typeof AnalyticsEvents.ONBOARDING_COMPLETED,
    params?: OnboardingTelemetryPayload
  ): void {
    const envelope = buildOnboardingEnvelope({
      client_event_id: generateUUID(),
      event_type: eventName,
      payload: params ?? {}
    });
    if (envelope) {
      trackEvent(eventName, envelope.payload as AnalyticsOptionalParams);
    }
  },

  whatsapp(params?: WhatsappTelemetryPayload): void {
    const envelope = buildWhatsappEnvelope({
      client_event_id: generateUUID(),
      payload: params ?? {}
    });
    if (envelope) {
      trackEvent("whatsapp_contact_clicked", envelope.payload as AnalyticsOptionalParams);
    }
  },

  cable(params?: CableTelemetryPayload): void {
    const envelope = buildCableEnvelope({
      client_event_id: generateUUID(),
      payload: params ?? {}
    });
    if (envelope) {
      trackEvent("cable_copied", envelope.payload as AnalyticsOptionalParams);
    }
  },

>>>>>>> feat/sovereign-final-stabilization
  // ─── Page Tracking ────────────────────────────────

  trackPage(name: string): void {
    trackPageView(name);
  },

  trackLanding(params?: AnalyticsOptionalParams): void {
    trackLandingView(params);
  },

  // ─── General Events ───────────────────────────────

  /**
   * تسجيل حدث عام — مع GA4 + Internal Telemetry
   */
<<<<<<< HEAD
=======
  // @ts-expect-error - Overload assignment compatibility with union types is complex
>>>>>>> feat/sovereign-final-stabilization
  track(
    eventName: string,
    params?: AnalyticsOptionalParams
  ): void {
    trackEvent(eventName, params);
  },

  // ─── Conversion Events ────────────────────────────

  /**
   * Lead form submitted → Meta Lead + GA4 generate_lead
   */
  trackLead(params?: AnalyticsOptionalParams): void {
    trackLead(params);
  },

  /**
   * Registration completed → Meta CompleteRegistration
   */
  trackCompleteRegistration(params?: AnalyticsOptionalParams): void {
    trackCompleteRegistration(params);
  },

  /**
   * Checkout page viewed → Meta ViewContent
   */
  trackCheckoutViewed(params?: AnalyticsOptionalParams): void {
    trackCheckoutViewed(params);
  },

  /**
   * Payment initiated → Meta InitiateCheckout
   */
  trackInitiateCheckout(params?: AnalyticsOptionalParams): void {
    trackInitiateCheckout(params);
  },

  // ─── Diagnostics ──────────────────────────────────

  getDiagnostics(context?: string): AnalyticsDiagnostics {
    return getAnalyticsDiagnostics(context) as AnalyticsDiagnostics;
  },

  logDiagnostics(context?: string): void {
    logAnalyticsDiagnostics(context);
  },

  // ─── Events Map ───────────────────────────────────

  setStoredClientEventId(id: string): void {
    setStoredClientEventId(id);
  },

  getStoredClientEventId(): string | null {
    return getStoredClientEventId();
  },

  trackOnboardingCompleted(params?: AnalyticsOptionalParams): void {
    trackOnboardingCompleted(params);
  },

  trackAddPaymentInfo(params?: AnalyticsOptionalParams): void {
    trackAddPaymentInfo(params);
  },

  Events: AnalyticsEvents,
};
