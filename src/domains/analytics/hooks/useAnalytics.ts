/**
 * Domain: Analytics — useAnalytics hook
 *
 * Hook بسيط يوفر analyticsService للـ components
 * مع memoized callbacks لتجنب unnecessary re-renders.
 */

"use client";
import { useCallback } from "react";
import { analyticsService } from "../services/analytics.service";
import type { AnalyticsOptionalParams } from "../types";
import { AnalyticsEvents } from "../types";

export function useAnalytics() {
  const track = useCallback(
    (eventName: string, params?: AnalyticsOptionalParams) =>
      analyticsService.track(eventName, params),
    []
  );

  const trackPage = useCallback(
    (name: string) => analyticsService.trackPage(name),
    []
  );

  const trackLead = useCallback(
    (params?: AnalyticsOptionalParams) => analyticsService.trackLead(params),
    []
  );

  const trackCompleteRegistration = useCallback(
    (params?: AnalyticsOptionalParams) =>
      analyticsService.trackCompleteRegistration(params),
    []
  );

  const trackCheckoutViewed = useCallback(
    (params?: AnalyticsOptionalParams) =>
      analyticsService.trackCheckoutViewed(params),
    []
  );

  const setConsent = useCallback(
    (consent: boolean) => analyticsService.setConsent(consent),
    []
  );

  return {
    track,
    trackPage,
    trackLead,
    trackCompleteRegistration,
    trackCheckoutViewed,
    setConsent,
    hasConsent: analyticsService.hasConsent,
    getSessionId: analyticsService.getSessionId,
    getAnonymousId: analyticsService.getAnonymousId,
    Events: AnalyticsEvents,
  };
}
