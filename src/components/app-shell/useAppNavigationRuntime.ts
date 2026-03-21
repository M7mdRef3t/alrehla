import { useCallback, useEffect } from "react";
import type { FeatureFlagKey } from "../../config/features";
import { getWindowOrNull } from "../../services/clientRuntime";
import { reloadPage } from "../../services/navigation";
import { type AppScreen, resolveNavigation } from "../../navigation/navigationMachine";
import { runtimeEnv } from "../../config/runtimeEnv";

interface UseAppNavigationRuntimeParams {
  screen: AppScreen;
  toolsBackScreen: AppScreen;
  canUseMap: boolean;
  canUseJourneyTools: boolean;
  isLockedPhaseOne: boolean;
  showAuthModal: boolean;
  showPulseCheck: boolean;
  showBreathing: boolean;
  showCocoon: boolean;
  isEmergencyOpen: boolean;
  setScreen: (screen: AppScreen) => void;
  setLockedFeature: (feature: FeatureFlagKey | null) => void;
}

export function useAppNavigationRuntime({
  screen,
  toolsBackScreen,
  canUseMap,
  canUseJourneyTools,
  isLockedPhaseOne,
  showAuthModal,
  showPulseCheck,
  showBreathing,
  showCocoon,
  isEmergencyOpen,
  setScreen,
  setLockedFeature
}: UseAppNavigationRuntimeParams) {
  const navigateToScreen = useCallback((target: AppScreen): boolean => {
    const result = resolveNavigation({
      target,
      canUseMap,
      canUseJourneyTools,
      isLockedPhaseOne
    });

    if (result.kind === "blocked") {
      setLockedFeature(result.feature);
      return false;
    }

    setScreen(result.screen);
    return result.kind === "navigate";
  }, [canUseJourneyTools, canUseMap, isLockedPhaseOne, setLockedFeature, setScreen]);

  const resolveEdgeSwipeBackTarget = useCallback((): AppScreen | null => {
    if (showAuthModal || showPulseCheck || showBreathing || showCocoon || isEmergencyOpen) return null;

    switch (screen) {
      case "goal":
      case "guided":
        return "landing";
      case "mission":
      case "diplomacy":
      case "guilt-court":
      case "enterprise":
      case "oracle-dashboard":
        return "map";
      case "armory":
      case "survey":
        return "landing";
      case "exit-scripts":
      case "grounding":
        return "tools";
      case "tools":
        return toolsBackScreen;
      case "settings":
        return canUseMap ? "map" : "landing";
      default:
        return null;
    }
  }, [
    canUseMap,
    isEmergencyOpen,
    screen,
    showAuthModal,
    showBreathing,
    showCocoon,
    showPulseCheck,
    toolsBackScreen
  ]);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let startedOnInteractiveElement = false;

    const isSmallScreen = () => windowRef.innerWidth < 768;
    const isInteractive = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest("input, textarea, select, button, [role='slider'], [contenteditable='true']")
      );
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!isSmallScreen()) return;
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.clientX > 24) return;

      startedOnInteractiveElement = isInteractive(event.target);
      tracking = true;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking || startedOnInteractiveElement) {
        tracking = false;
        startedOnInteractiveElement = false;
        return;
      }
      if (!isSmallScreen()) {
        tracking = false;
        startedOnInteractiveElement = false;
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        tracking = false;
        startedOnInteractiveElement = false;
        return;
      }

      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      const isValidBackSwipe = deltaX >= 72 && deltaY <= 40 && deltaX > deltaY * 1.2;

      tracking = false;
      startedOnInteractiveElement = false;
      if (!isValidBackSwipe) return;

      const target = resolveEdgeSwipeBackTarget();
      if (!target) return;
      void navigateToScreen(target);
    };

    windowRef.addEventListener("touchstart", onTouchStart, { passive: true });
    windowRef.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      windowRef.removeEventListener("touchstart", onTouchStart);
      windowRef.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigateToScreen, resolveEdgeSwipeBackTarget]);

  useEffect(() => {
    if (!runtimeEnv.isDev) return;

    import("../../utils/seedStressTestData").then(({ seedStressTestData }) => {
      (window as Window & { __seedStressTest?: () => { nodeCount: number; eventCount: number } }).__seedStressTest =
        () => {
          const result = seedStressTestData();
          console.warn("[Stress Test] تم:", result.nodeCount, "عُقدة،", result.eventCount, "حدث. إعادة تحميل...");
          setTimeout(() => reloadPage(), 500);
          return result;
        };
    });
  }, []);

  return {
    navigateToScreen
  };
}
