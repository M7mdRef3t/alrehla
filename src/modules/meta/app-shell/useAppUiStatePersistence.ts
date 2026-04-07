import { useEffect, useRef } from "react";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";
import type { AppScreen } from "@/navigation/navigationMachine";
import { type AppOverlayFlags, useAppOverlayState } from "@/state/appOverlayState";

type AuthStatus = "loading" | "ready";

const LAST_UI_STATE_STORAGE_KEY_PREFIX = "dawayir-last-ui-state";
const LAST_SCREEN_STORAGE_KEY_PREFIX = "dawayir-last-screen";

type PersistedModalState = {
  showJourneyGuideChat: boolean;
  showOwnerDataTools: boolean;
  showNotificationSettings: boolean;
  showTrackingDashboard: boolean;
  showAtlasDashboard: boolean;
  showShareStats: boolean;
  showLibrary: boolean;
  showSymptomsOverview: boolean;
  showRecoveryPlan: boolean;
  showThemeSettings: boolean;
  showAchievements: boolean;
  showAdvancedTools: boolean;
  showClassicRecovery: boolean;
  showManualPlacement: boolean;
  showFeedback: boolean;
};

type PersistedUiState = {
  version: 1;
  screen: AppScreen;
  modals: PersistedModalState;
};

interface UseAppUiStatePersistenceParams {
  authStatus: AuthStatus;
  userId: string | null | undefined;
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
}

function toPersistedModalState(flags: AppOverlayFlags): PersistedModalState {
  return {
    showJourneyGuideChat: flags.journeyGuideChat,
    showOwnerDataTools: flags.ownerDataTools,
    showNotificationSettings: flags.notificationSettings,
    showTrackingDashboard: flags.trackingDashboard,
    showAtlasDashboard: flags.atlasDashboard,
    showShareStats: flags.shareStats,
    showLibrary: flags.library,
    showSymptomsOverview: flags.symptomsOverview,
    showRecoveryPlan: flags.recoveryPlan,
    showThemeSettings: flags.themeSettings,
    showAchievements: flags.achievements,
    showAdvancedTools: flags.advancedTools,
    showClassicRecovery: flags.classicRecovery,
    showManualPlacement: flags.manualPlacement,
    showFeedback: flags.feedback
  };
}

function toPersistedModalOverlayPatch(modals: PersistedModalState): Partial<AppOverlayFlags> {
  return {
    journeyGuideChat: modals.showJourneyGuideChat,
    ownerDataTools: modals.showOwnerDataTools,
    notificationSettings: modals.showNotificationSettings,
    trackingDashboard: modals.showTrackingDashboard,
    atlasDashboard: modals.showAtlasDashboard,
    shareStats: modals.showShareStats,
    library: modals.showLibrary,
    symptomsOverview: modals.showSymptomsOverview,
    recoveryPlan: modals.showRecoveryPlan,
    themeSettings: modals.showThemeSettings,
    achievements: modals.showAchievements,
    advancedTools: modals.showAdvancedTools,
    classicRecovery: modals.showClassicRecovery,
    manualPlacement: modals.showManualPlacement,
    feedback: modals.showFeedback
  };
}

function getUserLastScreenStorageKey(userId: string): string {
  return `${LAST_SCREEN_STORAGE_KEY_PREFIX}:${userId}`;
}

function getUserLastUiStateStorageKey(userId: string): string {
  return `${LAST_UI_STATE_STORAGE_KEY_PREFIX}:${userId}`;
}

function normalizeRestorableScreen(value: string | null): AppScreen | null {
  if (
    value === "landing" ||
    value === "goal" ||
    value === "map" ||
    value === "guided" ||
    value === "tools" ||
    value === "enterprise" ||
    value === "oracle-dashboard" ||
    value === "armory" ||
    value === "survey"
  ) {
    return value as AppScreen;
  }
  return null;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function normalizePersistedModals(input: unknown): PersistedModalState {
  const value = (input ?? {}) as Partial<PersistedModalState>;
  return {
    showJourneyGuideChat: toBoolean(value.showJourneyGuideChat),
    showOwnerDataTools: toBoolean(value.showOwnerDataTools),
    showNotificationSettings: toBoolean(value.showNotificationSettings),
    showTrackingDashboard: toBoolean(value.showTrackingDashboard),
    showAtlasDashboard: toBoolean(value.showAtlasDashboard),
    showShareStats: toBoolean(value.showShareStats),
    showLibrary: toBoolean(value.showLibrary),
    showSymptomsOverview: toBoolean(value.showSymptomsOverview),
    showRecoveryPlan: toBoolean(value.showRecoveryPlan),
    showThemeSettings: toBoolean(value.showThemeSettings),
    showAchievements: toBoolean(value.showAchievements),
    showAdvancedTools: toBoolean(value.showAdvancedTools),
    showClassicRecovery: toBoolean(value.showClassicRecovery),
    showManualPlacement: toBoolean(value.showManualPlacement),
    showFeedback: toBoolean(value.showFeedback)
  };
}

export function useAppUiStatePersistence({
  authStatus,
  userId,
  screen,
  setScreen
}: UseAppUiStatePersistenceParams) {
  const patchAppOverlays = useAppOverlayState((state) => state.patchOverlays);
  const restoredLastScreenForUserRef = useRef<string | null>(null);
  const hasHydratedUiStateRef = useRef(false);
  const hasBootActionRef = useRef<boolean>(false);

  if (typeof window !== "undefined" && !hasBootActionRef.current) {
    if (window.sessionStorage.getItem("dawayir-app-boot-action")) {
      hasBootActionRef.current = true;
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authStatus !== "ready") return;
    if (!userId) {
      hasHydratedUiStateRef.current = false;
      return;
    }
    if (restoredLastScreenForUserRef.current === userId) return;

    restoredLastScreenForUserRef.current = userId;
    const savedUiState = getFromLocalStorage(getUserLastUiStateStorageKey(userId));
    if (savedUiState) {
      try {
        const parsed = JSON.parse(savedUiState) as Partial<PersistedUiState>;
        const restoredScreen = normalizeRestorableScreen(typeof parsed.screen === "string" ? parsed.screen : null);
        const restoredModals = normalizePersistedModals(parsed.modals);
        if (restoredScreen && !hasBootActionRef.current) setScreen(restoredScreen);
        patchAppOverlays(toPersistedModalOverlayPatch(restoredModals));
        hasHydratedUiStateRef.current = true;
        return;
      } catch {
        // Fall back to legacy screen-only persistence below.
      }
    }

    const legacySavedScreen = getFromLocalStorage(getUserLastScreenStorageKey(userId));
    const restored = normalizeRestorableScreen(legacySavedScreen);
    if (restored && !hasBootActionRef.current) setScreen(restored);
    hasHydratedUiStateRef.current = true;
  }, [authStatus, patchAppOverlays, setScreen, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userId) return;
    if (!hasHydratedUiStateRef.current) return;

    const persistUiState = (flags = useAppOverlayState.getState().flags) => {
      const restorable = normalizeRestorableScreen(screen);
      if (!restorable) return;

      const payload: PersistedUiState = {
        version: 1,
        screen: restorable,
        modals: toPersistedModalState(flags)
      };

      setInLocalStorage(getUserLastUiStateStorageKey(userId), JSON.stringify(payload));
      setInLocalStorage(getUserLastScreenStorageKey(userId), restorable);
    };

    persistUiState();
    const unsubscribe = useAppOverlayState.subscribe((state) => {
      persistUiState(state.flags);
    });

    return unsubscribe;
  }, [screen, userId]);
}
