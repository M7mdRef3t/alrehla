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
} from "@/services/analytics";
import type { AnalyticsOptionalParams, AnalyticsDiagnostics } from "../types";

export const analyticsService = {
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
