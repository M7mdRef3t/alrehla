import { useState, useEffect, useRef, useCallback } from "react";
import { usePulseState } from "../state/pulseState";

export type PulseCheckContext = "regular" | "start_recovery";

/**
 * Hook to manage pulse check modal state and logic
 * Handles when to show, how to show, and dependencies
 */
export function usePulseCheckLogic(
  canUsePulseCheck: boolean,
  currentScreen: string,
  shouldGateStartWithAuth: boolean
) {
  const [showPulseCheck, setShowPulseCheck] = useState(false);
  const [pulseCheckContext, setPulseCheckContext] = useState<PulseCheckContext>("regular");
  const skipNextPulseCheckRef = useRef(false);

  const lastPulse = usePulseState((s) => s.lastPulse);
  const pulseCheckMode = usePulseState((s) => s.checkInMode);

  // Auto-show pulse check based on mode and last pulse time
  useEffect(() => {
    if (!canUsePulseCheck) return;
    if (skipNextPulseCheckRef.current) {
      skipNextPulseCheckRef.current = false;
      return;
    }
    // Don't show on landing screen
    if (currentScreen === "landing") return;
    if (pulseCheckMode === "everyOpen") {
      const t = window.setTimeout(() => {
        setPulseCheckContext("regular");
        setShowPulseCheck(true);
      }, 350);
      return () => window.clearTimeout(t);
    }

    const now = new Date();
    const lastPulseDate = lastPulse ? new Date(lastPulse.timestamp) : null;
    const isSameDay =
      lastPulseDate &&
      lastPulseDate.getFullYear() === now.getFullYear() &&
      lastPulseDate.getMonth() === now.getMonth() &&
      lastPulseDate.getDate() === now.getDate();
    if (isSameDay) return;

    const t = window.setTimeout(() => {
      setPulseCheckContext("regular");
      setShowPulseCheck(true);
    }, 350);
    return () => window.clearTimeout(t);
  }, [lastPulse, pulseCheckMode, canUsePulseCheck, currentScreen, shouldGateStartWithAuth]);

  // Hide pulse check if feature becomes unavailable
  useEffect(() => {
    if (canUsePulseCheck) return;
    if (showPulseCheck && pulseCheckContext === "regular") {
      setShowPulseCheck(false);
    }
  }, [canUsePulseCheck, showPulseCheck, pulseCheckContext]);

  const skipNextCheck = useCallback(() => {
    skipNextPulseCheckRef.current = true;
  }, []);

  return {
    showPulseCheck,
    setShowPulseCheck,
    pulseCheckContext,
    setPulseCheckContext,
    skipNextCheck
  };
}
