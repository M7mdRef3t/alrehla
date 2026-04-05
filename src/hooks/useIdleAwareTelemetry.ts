import { useCallback, useEffect, useRef, useMemo } from "react";

type TelemetrySession = {
  decisionId: string;
  startedAtMs: number;
  firstInteractionAtMs: number | null;
  lastInteractionAtMs: number;
  activeMs: number;
  idleMs: number;
  interactionCount: number;
  lastTickAtMs: number;
  isVisible: boolean;
  cognitiveLoadRequired: number;
  hesitationThresholdSec: number;
  interventionFired: boolean;
  onIntervention?: (snapshot: IdleAwareTelemetrySnapshot) => void;
};

export interface IdleAwareTelemetrySnapshot {
  decisionId: string;
  activeElapsedSec: number;
  idleElapsedSec: number;
  rawElapsedSec: number;
  hesitationSec: number;
  interactionCount: number;
}

const IDLE_THRESHOLD_MS = 30_000;
const DEFAULT_INTERVENTION_HESITATION_SEC = 120;

function nowMs(): number {
  return Date.now();
}

function roundSec(ms: number): number {
  return Math.max(0, Math.round(ms / 1000));
}

export function useIdleAwareTelemetry() {
  const sessionRef = useRef<TelemetrySession | null>(null);

  const tick = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;

    const now = nowMs();
    const delta = Math.max(0, now - session.lastTickAtMs);
    session.lastTickAtMs = now;

    const inactiveForMs = Math.max(0, now - session.lastInteractionAtMs);
    const isIdle = !session.isVisible || inactiveForMs >= IDLE_THRESHOLD_MS;
    if (isIdle) {
      session.idleMs += delta;
    } else {
      session.activeMs += delta;
    }

    const shouldEvaluateIntervention =
      !session.interventionFired &&
      session.cognitiveLoadRequired >= 4 &&
      session.firstInteractionAtMs == null &&
      session.isVisible;
    if (!shouldEvaluateIntervention) return;

    const hesitationSec = roundSec(Math.max(0, now - session.startedAtMs));
    if (hesitationSec < session.hesitationThresholdSec) return;

    session.interventionFired = true;
    session.onIntervention?.({
      decisionId: session.decisionId,
      activeElapsedSec: roundSec(session.activeMs),
      idleElapsedSec: roundSec(session.idleMs),
      rawElapsedSec: roundSec(Math.max(0, now - session.startedAtMs)),
      hesitationSec,
      interactionCount: session.interactionCount
    });
  }, []);

  const startSession = useCallback((
    decisionId: string,
    startedAtMs?: number,
    options?: {
      cognitiveLoadRequired?: number;
      hesitationThresholdSec?: number;
      onIntervention?: (snapshot: IdleAwareTelemetrySnapshot) => void;
    }
  ) => {
    const now = nowMs();
    sessionRef.current = {
      decisionId,
      startedAtMs: typeof startedAtMs === "number" ? startedAtMs : now,
      firstInteractionAtMs: null,
      lastInteractionAtMs: now,
      activeMs: 0,
      idleMs: 0,
      interactionCount: 0,
      lastTickAtMs: now,
      isVisible: typeof document !== "undefined" ? !document.hidden : true,
      cognitiveLoadRequired: Number(options?.cognitiveLoadRequired ?? 3),
      hesitationThresholdSec: Number(options?.hesitationThresholdSec ?? DEFAULT_INTERVENTION_HESITATION_SEC),
      interventionFired: false,
      onIntervention: options?.onIntervention
    };
  }, []);

  const clearSession = useCallback((decisionId?: string) => {
    if (!sessionRef.current) return;
    if (decisionId && sessionRef.current.decisionId !== decisionId) return;
    sessionRef.current = null;
  }, []);

  const markInteraction = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const now = nowMs();
    session.lastInteractionAtMs = now;
    session.interactionCount += 1;
    if (session.firstInteractionAtMs == null) {
      session.firstInteractionAtMs = now;
    }
  }, []);

  const capture = useCallback((decisionId?: string): IdleAwareTelemetrySnapshot | null => {
    const session = sessionRef.current;
    if (!session) return null;
    if (decisionId && session.decisionId !== decisionId) return null;

    tick();
    const activeElapsedSec = roundSec(session.activeMs);
    const idleElapsedSec = roundSec(session.idleMs);
    const rawElapsedSec = roundSec(Math.max(0, nowMs() - session.startedAtMs));
    const hesitationMs =
      session.firstInteractionAtMs == null
        ? Math.max(0, nowMs() - session.startedAtMs)
        : Math.max(0, session.firstInteractionAtMs - session.startedAtMs);

    return {
      decisionId: session.decisionId,
      activeElapsedSec,
      idleElapsedSec,
      rawElapsedSec,
      hesitationSec: roundSec(hesitationMs),
      interactionCount: session.interactionCount
    };
  }, [tick]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const onVisibilityChange = () => {
      const session = sessionRef.current;
      if (!session) return;
      tick();
      session.isVisible = !document.hidden;
      if (session.isVisible) {
        session.lastInteractionAtMs = nowMs();
      }
    };

    const onInteraction = () => {
      markInteraction();
    };

    const interval = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pointerdown", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);
    window.addEventListener("touchstart", onInteraction, { passive: true });
    window.addEventListener("scroll", onInteraction, { passive: true });

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("scroll", onInteraction);
    };
  }, [markInteraction, tick]);

  return useMemo(() => ({
    startSession,
    clearSession,
    markInteraction,
    capture
  }), [startSession, clearSession, markInteraction, capture]);
}
