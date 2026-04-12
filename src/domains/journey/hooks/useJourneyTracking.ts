/**
 * Domain: Journey — useJourneyTracking hook
 *
 * Hook بسيط يوفر trackingService للـ components.
 * لا يحتاج لـ state — خدمة stateless.
 */

"use client";
import { useCallback } from "react";
import { trackingService } from "../services/tracking.service";
import type { FlowStep, JourneyEventType, JourneyEventPayload } from "../types";

export function useJourneyTracking() {
  const record = useCallback(
    <T extends JourneyEventType>(type: T, payload: JourneyEventPayload[T]) =>
      trackingService.record(type, payload),
    []
  );

  const recordFlow = useCallback(
    (step: FlowStep, extra?: { timeToAction?: number; atStep?: string; meta?: Record<string, unknown> }) =>
      trackingService.recordFlow(step, extra),
    []
  );

  const recordPathStarted = useCallback(
    (payload: JourneyEventPayload["path_started"]) =>
      trackingService.recordPathStartedOnce(payload),
    []
  );

  return {
    record,
    recordFlow,
    recordPathStarted,
    getSessionId: trackingService.getSessionId,
    getMode: trackingService.getTrackingMode,
  };
}
