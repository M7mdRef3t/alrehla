import { useEffect } from "react";
import { type BiometricPulse, analyzeStressLevels, startBiometricStream } from "@/services/biometricsBridge";
import { trackEvent } from "@/services/analytics";
import { cancelIdleCallback, requestIdleCallback } from "@/utils/performanceOptimizations";

interface UseAppBiometricCrisisMonitorParams {
  screen: string;
  showCocoon: boolean;
  showBreathing: boolean;
  openCocoonModal: (source?: "auto" | "manual") => void;
  enabled?: boolean;
}

export function useAppBiometricCrisisMonitor({
  screen,
  showCocoon,
  showBreathing,
  openCocoonModal,
  enabled = true
}: UseAppBiometricCrisisMonitorParams) {
  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;
    if (screen === "landing" || screen === "onboarding") return;

    let stopStream: (() => void) | void;
    // We expect startBiometricHeartbeat to return a cleanup function, or void in mock mode
    const idleHandle = requestIdleCallback(() => {
      stopStream = startBiometricStream((pulse: BiometricPulse) => {
        const result = analyzeStressLevels(pulse);
        if (result.isCrisis && !showCocoon && !showBreathing) {
          trackEvent("biometric_crisis_triggered", { hr: pulse.heartRate, reason: result.reason || "unknown" });
          openCocoonModal("auto");
        }
      });
    }, { timeout: 3000 });

    return () => {
      cancelIdleCallback(idleHandle);
      stopStream?.();
    };
  }, [openCocoonModal, screen, showCocoon, showBreathing]);
}
