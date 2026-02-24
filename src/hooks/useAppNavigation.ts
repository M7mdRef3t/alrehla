/**
 * useAppNavigation Hook
 * hook للتنقل بين الشاشات
 */

import { useCallback } from "react";
import { resolveNavigation, type AppScreen } from "../navigation/navigationMachine";

interface UseAppNavigationProps {
  canUseMap: boolean;
  canUseJourneyTools: boolean;
  isLockedPhaseOne: boolean;
  setLockedFeature: (feature: string | null) => void;
  setScreen: (screen: AppScreen) => void;
}

export function useAppNavigation({
  canUseMap,
  canUseJourneyTools,
  isLockedPhaseOne,
  setLockedFeature,
  setScreen
}: UseAppNavigationProps) {
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
  }, [canUseMap, canUseJourneyTools, isLockedPhaseOne, setLockedFeature, setScreen]);

  return { navigateToScreen };
}
