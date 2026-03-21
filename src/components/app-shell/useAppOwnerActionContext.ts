import { useMemo } from "react";
import type { FeatureFlagKey } from "../../config/features";
import type { OwnerActionExecutionContext } from "../../navigation/ownerActionExecutor";
import { recordFlowEvent } from "../../services/journeyTracking";
import { createCurrentUrl, pushUrl } from "../../services/navigation";
import type { AppScreen } from "../../navigation/navigationMachine";

interface UseAppOwnerActionContextParams {
  canShowAIChatbot: boolean;
  notificationSupported: boolean;
  hasGlobalAtlas: boolean;
  hasInternalBoundaries: boolean;
  navigateToScreen: (screen: AppScreen) => boolean;
  openOverlay: (
    overlay:
      | "consciousnessArchive"
      | "journeyGuideChat"
      | "journeyTimeline"
      | "gym"
      | "baseline"
      | "notificationSettings"
      | "trackingDashboard"
      | "atlasDashboard"
      | "ownerDataTools"
      | "shareStats"
      | "library"
      | "symptomsOverview"
      | "recoveryPlan"
      | "themeSettings"
      | "achievements"
      | "advancedTools"
      | "classicRecovery"
      | "manualPlacement"
      | "feedback"
      | "noiseSilencingPulse"
      | "ambientReality"
      | "timeCapsuleVault"
  ) => void;
  openJourneyTools: () => void;
  openDawayirTool: () => void;
  startJourney: () => void;
  setOwnerInstallRequestNonce: (value: number | ((current: number) => number)) => void;
  setShowBreathing: (show: boolean) => void;
  lockFeature: (feature: FeatureFlagKey) => void;
}

export function useAppOwnerActionContext({
  canShowAIChatbot,
  notificationSupported,
  hasGlobalAtlas,
  hasInternalBoundaries,
  navigateToScreen,
  openOverlay,
  openJourneyTools,
  openDawayirTool,
  startJourney,
  setOwnerInstallRequestNonce,
  setShowBreathing,
  lockFeature
}: UseAppOwnerActionContextParams): OwnerActionExecutionContext {
  return useMemo(
    () => ({
      flags: {
        canShowAIChatbot,
        notificationSupported,
        hasGlobalAtlas,
        hasInternalBoundaries
      },
      callbacks: {
        openAdminDashboard: () => {
          const next = createCurrentUrl();
          if (!next) return;
          next.pathname = "/admin";
          next.search = "";
          next.searchParams.set("tab", "overview");
          pushUrl(next);
        },
        openConsciousnessArchive: () => openOverlay("consciousnessArchive"),
        openJourneyGuideChat: () => openOverlay("journeyGuideChat"),
        openJourneyTools,
        openJourneyTimeline: () => {
          void navigateToScreen("map");
          openOverlay("journeyTimeline");
        },
        openDawayirTool,
        openQuickExperience: () => openOverlay("gym"),
        startJourney,
        openGuidedJourney: () => {
          void navigateToScreen("guided");
        },
        openBaselineCheck: () => openOverlay("baseline"),
        openNotifications: () => openOverlay("notificationSettings"),
        openTrackingDashboard: () => openOverlay("trackingDashboard"),
        openAtlasDashboard: () => openOverlay("atlasDashboard"),
        openDataTools: () => openOverlay("ownerDataTools"),
        openShareStats: () => openOverlay("shareStats"),
        openLibrary: () => openOverlay("library"),
        openSymptoms: () => openOverlay("symptomsOverview"),
        openRecoveryPlan: () => openOverlay("recoveryPlan"),
        openThemeSettings: () => openOverlay("themeSettings"),
        openAchievements: () => openOverlay("achievements"),
        openAdvancedTools: () => openOverlay("advancedTools"),
        openClassicRecovery: () => openOverlay("classicRecovery"),
        openManualPlacement: () => openOverlay("manualPlacement"),
        openFeedbackModal: () => {
          recordFlowEvent("feedback_opened");
          openOverlay("feedback");
        },
        requestInstallApp: () => {
          void navigateToScreen("landing");
          setOwnerInstallRequestNonce((prev) => prev + 1);
        },
        openNoiseSilencing: () => openOverlay("noiseSilencingPulse"),
        openBreathingSession: () => setShowBreathing(true),
        openAmbientReality: () => openOverlay("ambientReality"),
        openWisdomVault: () => openOverlay("timeCapsuleVault"),
        openEnterpriseDashboard: () => void navigateToScreen("enterprise"),
        lockFeature
      }
    }),
    [
      canShowAIChatbot,
      notificationSupported,
      hasGlobalAtlas,
      hasInternalBoundaries,
      navigateToScreen,
      openOverlay,
      openJourneyTools,
      openDawayirTool,
      startJourney,
      setOwnerInstallRequestNonce,
      setShowBreathing,
      lockFeature
    ]
  );
}
