import { analyticsService } from '@/domains/analytics';
import { useCallback, useEffect, useRef } from "react";
import { AnalyticsEvents, trackEvent } from "@/services/analytics";
import type { AdviceCategory } from "@/data/adviceScripts";
import { resolveAdviceCategory } from "@/data/adviceScripts";
import { getWindowOrNull } from "@/services/clientRuntime";
import type { AppScreen } from "@/navigation/navigationMachine";
import type { AppOverlayFlag } from "@/domains/consciousness/store/overlay.store";
import type { LandingIntent } from "@/domains/journey/store/journey.store";
import { ensureValidJourneyState } from "@/utils/journeyState";
import { isAdminPath } from "@/services/navigation";

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";
const APP_SCREEN_BOOT_ACTION_PREFIX = "navigate:";
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
      analyticsService.cta({
        source: "landing_intent",
        cta_name: intent,
        placement: mappedGoalId
      });
    }

    analyticsService.track("journey_started_frictionless", { source: "landing" });
    void navigateToScreen("map");
  }, [consumeLandingIntent, navigateToScreen, setCategory, setGoalId]);

  const handleOnboardingComplete = useCallback((skipped: boolean = false) => {
    setOverlay("onboarding", false);
    if (skipped) {
      const validJourney = ensureValidJourneyState();
      setGoalId(validJourney.goalId);
      setCategory(validJourney.category);
      void navigateToScreen("sanctuary");
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
  }, [clearWelcomeToastTimer, closeOverlay, navigateToScreen, openOverlay, setCategory, setGoalId, setOverlay, startRecovery]);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;

    if (isAdminPath()) return;

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
    startRecovery,
    handleOnboardingComplete
  };
}
