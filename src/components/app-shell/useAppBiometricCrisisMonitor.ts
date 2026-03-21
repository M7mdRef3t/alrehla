import { useEffect } from "react";
import { type BiometricPulse, analyzeStressLevels, startBiometricStream } from "../../services/biometricsBridge";
import { trackEvent } from "../../services/analytics";
import { cancelIdleCallback, requestIdleCallback } from "../../utils/performanceOptimizations";

interface UseAppBiometricCrisisMonitorParams {
  screen: string;
  showCocoon: boolean;
  showBreathing: boolean;
  openCocoonModal: (source?: "auto" | "manual") => void;
}

export function useAppBiometricCrisisMonitor({
  screen,
  showCocoon,
  showBreathing,
  openCocoonModal
}: UseAppBiometricCrisisMonitorParams) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (screen === "landing") return;

    let stopStream: (() => void) | null = null;
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
