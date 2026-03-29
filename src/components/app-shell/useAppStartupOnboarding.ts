import { useCallback, useEffect, useRef, useState } from "react";
import { AnalyticsEvents, trackEvent } from "../../services/analytics";
import type { AdviceCategory } from "../../data/adviceScripts";
import { resolveAdviceCategory } from "../../data/adviceScripts";
import { getWindowOrNull } from "../../services/clientRuntime";
import type { AppScreen } from "../../navigation/navigationMachine";
import type { AppOverlayFlag } from "../../state/appOverlayState";
import type { LandingIntent } from "../../state/journeyState";

import { isUserMode, isRevenueMode } from "../../config/appEnv";

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";
const APP_SCREEN_BOOT_ACTION_PREFIX = "navigate:";
const STARTUP_SEEN_KEY = "dawayir-startup-seen";
const LANDING_BOOT_SCREENS: AppScreen[] = [
  "landing",
  "tools",
  "stories",
  "about",
  "insights",
  "resources",
  "quizzes",
  "behavioral-analysis",
  "settings"
];

interface UseAppStartupOnboardingParams {
  consumeLandingIntent: () => LandingIntent;
  navigateToScreen: (screen: AppScreen) => boolean;
  setCategory: (category: AdviceCategory) => void;
  setGoalId: (goalId: string) => void;
  setOverlay: (flag: AppOverlayFlag, value: boolean) => void;
  openOverlay: (flag: AppOverlayFlag) => void;
  closeOverlay: (flag: AppOverlayFlag) => void;
}

export function useAppStartupOnboarding({
  consumeLandingIntent,
  navigateToScreen,
  setCategory,
  setGoalId,
  setOverlay,
  openOverlay,
  closeOverlay
}: UseAppStartupOnboardingParams) {
  // Skip boot sequence in user mode — go straight to platform
  const [showStartup, setShowStartup] = useState(() => {
    if (isUserMode) return false;
    const windowRef = getWindowOrNull();
    if (!windowRef) return false;
    const seen = windowRef.sessionStorage.getItem(STARTUP_SEEN_KEY);
    return !seen;
  });
  const welcomeToastTimerRef = useRef<number | null>(null);

  const clearWelcomeToastTimer = useCallback(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef || welcomeToastTimerRef.current == null) return;
    windowRef.clearTimeout(welcomeToastTimerRef.current);
    welcomeToastTimerRef.current = null;
  }, []);

  const startRecovery = useCallback(() => {
    const intent = consumeLandingIntent();
    if (intent) {
      const mappedGoalId =
        intent === "boundaries"
          ? "family"
          : intent === "calm"
            ? "self"
            : "general";
      setGoalId(mappedGoalId);
      setCategory(resolveAdviceCategory(mappedGoalId));
      trackEvent(AnalyticsEvents.CTA_CLICK, {
        source: "landing_intent",
        intent,
        mappedGoalId
      });
    }

    trackEvent("journey_started_frictionless", { source: "landing" });
    
    if (isRevenueMode) {
      openOverlay("premiumBridge");
      return;
    }

    void navigateToScreen("map");
  }, [consumeLandingIntent, navigateToScreen, setCategory, setGoalId]);

  const handleStartupComplete = useCallback(() => {
    const windowRef = getWindowOrNull();
    if (windowRef) {
      windowRef.sessionStorage.setItem(STARTUP_SEEN_KEY, "1");
    }
    setShowStartup(false);
  }, []);

  const handleOnboardingComplete = useCallback((skipped: boolean = false) => {
    setOverlay("onboarding", false);
    if (skipped) {
      void navigateToScreen("map");
      return;
    }

    openOverlay("welcomeToast");
    clearWelcomeToastTimer();
    const windowRef = getWindowOrNull();
    if (windowRef) {
      welcomeToastTimerRef.current = windowRef.setTimeout(() => {
        closeOverlay("welcomeToast");
        welcomeToastTimerRef.current = null;
      }, 6000);
    }
    startRecovery();
  }, [clearWelcomeToastTimer, closeOverlay, navigateToScreen, openOverlay, setOverlay, startRecovery]);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;

    const bootAction = windowRef.sessionStorage.getItem(APP_BOOT_ACTION_KEY);
    if (!bootAction) return;

    windowRef.sessionStorage.removeItem(APP_BOOT_ACTION_KEY);
    if (bootAction === "start_recovery") {
      startRecovery();
      return;
    }

    if (bootAction.startsWith(APP_SCREEN_BOOT_ACTION_PREFIX)) {
      const targetScreen = bootAction.slice(APP_SCREEN_BOOT_ACTION_PREFIX.length) as AppScreen;
      if (LANDING_BOOT_SCREENS.includes(targetScreen)) {
        void navigateToScreen(targetScreen);
      }
    }
  }, [navigateToScreen, startRecovery]);

  useEffect(() => clearWelcomeToastTimer, [clearWelcomeToastTimer]);

  return {
    showStartup,
    handleStartupComplete,
    startRecovery,
    handleOnboardingComplete
  };
}
