import { useEffect, useRef, useCallback } from "react";
import { usePulseState } from "../state/pulseState";
import { useAppOverlayState } from "../state/appOverlayState";

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
  const pulseCheck = useAppOverlayState((s) => s.pulseCheck);
  const setPulseCheck = useAppOverlayState((s) => s.setPulseCheck);

  const skipNextPulseCheckRef = useRef(false);
  const prevScreenRef = useRef<string>("landing");

  const lastPulse = usePulseState((s) => s.lastPulse);
  const pulseCheckMode = usePulseState((s) => s.checkInMode);

  // Auto-show pulse check based on mode and last pulse time
  useEffect(() => {
    if (!canUsePulseCheck) return;
    if (skipNextPulseCheckRef.current) {
      skipNextPulseCheckRef.current = false;
      prevScreenRef.current = currentScreen;
      return;
    }
    if (currentScreen === "landing") {
      prevScreenRef.current = "landing";
      return;
    }

    if (pulseCheckMode === "everyOpen") {
      // Show only when navigating out from landing, not on every in-app screen change.
      if (prevScreenRef.current !== "landing") {
        prevScreenRef.current = currentScreen;
        return;
      }
      prevScreenRef.current = currentScreen;
      const t = window.setTimeout(() => {
        setPulseCheck(true, "regular");
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
    if (isSameDay) {
      prevScreenRef.current = currentScreen;
      return;
    }

    prevScreenRef.current = currentScreen;
    const t = window.setTimeout(() => {
      setPulseCheck(true, "regular");
    }, 350);
    return () => window.clearTimeout(t);
  }, [lastPulse, pulseCheckMode, canUsePulseCheck, currentScreen, shouldGateStartWithAuth, setPulseCheck]);

  // Hide pulse check if feature becomes unavailable
  useEffect(() => {
    if (canUsePulseCheck) return;
    if (pulseCheck.isOpen) setPulseCheck(false, "regular");
  }, [canUsePulseCheck, pulseCheck.isOpen, setPulseCheck]);

  const skipNextCheck = useCallback(() => {
    skipNextPulseCheckRef.current = true;
  }, []);

  return {
    showPulseCheck: pulseCheck.isOpen,
    setShowPulseCheck: (val: boolean) => setPulseCheck(val, pulseCheck.context),
    pulseCheckContext: pulseCheck.context,
    setPulseCheckContext: (ctx: PulseCheckContext) => setPulseCheck(pulseCheck.isOpen, ctx),
    skipNextCheck
  };
}
