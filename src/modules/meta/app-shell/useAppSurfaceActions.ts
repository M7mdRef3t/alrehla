import { analyticsService } from '@/domains/analytics';
import { useCallback } from "react";
import { resolveAdviceCategory, type AdviceCategory } from "@/data/adviceScripts";
import type { PulseCheckContext } from "@/hooks/usePulseCheckLogic";
import { type AppScreen } from "@/navigation/navigationMachine";
import { trackEvent } from "@/services/analytics";
import { openInNewTab } from "@/services/clientDom";
import { trackingService } from "@/domains/journey";
import { useEmergencyState } from "@/domains/admin/store/emergency.store";
import { useMapState } from '@/modules/map/dawayirIndex';
import type { FeatureFlagKey } from "@/config/features";

interface UseAppSurfaceActionsParams {
  goalId: string;
  authUser: { id?: string } | null;
  whatsAppLink: string | null;
  showSystemOverclockPanel: boolean;
  clearWelcome: () => void;
  clearActiveIntervention: () => void;
  setOwnerInstallRequestNonce: (value: number | ((current: number) => number)) => void;
  setCategory: (category: AdviceCategory) => void;
  setGoalId: (goalId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setShowBreathing: (show: boolean) => void;
  setShowPulseCheck: (show: boolean) => void;
  setPulseCheckContext: (context: PulseCheckContext) => void;
  setLoginIntent: () => void;
  setShowAuthModal: (show: boolean) => void;
  setShowSystemOverclockPanel: (show: boolean) => void;
  setLockedFeature: (feature: FeatureFlagKey | null) => void;
  skipNextPulseCheck: () => void;
  openAppOverlay: (
    overlay:
      | "noiseSilencingPulse"
      | "library"
      | "consciousnessArchive"
      | "timeCapsuleVault"
      | "gym"
      | "ambientReality"
      | "dataManagement"
  ) => void;
  openCocoonModal: (source?: "auto" | "manual") => void;
  navigateToScreen: (screen: AppScreen) => boolean;
}

export function useAppSurfaceActions({
  goalId,
  authUser,
  whatsAppLink,
  showSystemOverclockPanel,
  clearWelcome,
  clearActiveIntervention,
  setOwnerInstallRequestNonce,
  setCategory,
  setGoalId,
  setSelectedNodeId,
  setShowBreathing,
  setShowPulseCheck,
  setPulseCheckContext,
  setLoginIntent,
  setShowAuthModal,
  setShowSystemOverclockPanel,
  setLockedFeature,
  skipNextPulseCheck,
  openAppOverlay,
  openCocoonModal,
  navigateToScreen
}: UseAppSurfaceActionsParams) {
  const handleEmergencyPowerBankOpen = useCallback((nodeId: string) => {
    const node = useMapState.getState().nodes.find((item) => item.id === nodeId);
    const nextGoalId =
      node?.goalId ?? (node?.treeRelation?.type === "family" ? "family" : goalId === "unknown" ? "family" : goalId);

    useEmergencyState.getState().close();
    setGoalId(nextGoalId);
    setCategory(resolveAdviceCategory(nextGoalId));
    setSelectedNodeId(nodeId);
    void navigateToScreen("map");
  }, [goalId, navigateToScreen, setCategory, setGoalId, setSelectedNodeId]);

  const handleFeedbackSubmit = useCallback(async (payload: {
    category: string;
    rating: number;
    message: string;
  }) => {
    trackingService.recordFlow("feedback_submitted", {
      meta: {
        category: payload.category,
        rating: payload.rating,
        message: payload.message
      }
    });
  }, []);

  const handleOwnerInstallRequestHandled = useCallback(() => {
    setOwnerInstallRequestNonce(0);
  }, [setOwnerInstallRequestNonce]);

  const openSurveyScreen = useCallback(() => {
    void navigateToScreen("survey");
  }, [navigateToScreen]);

  const openLandingScreen = useCallback(() => {
    void navigateToScreen("landing");
  }, [navigateToScreen]);

  const handleGoalSelected = useCallback((nextCategory: AdviceCategory, nextGoalId: string) => {
    setCategory(nextCategory);
    setGoalId(nextGoalId);
    skipNextPulseCheck();
    void navigateToScreen("map");
  }, [navigateToScreen, setCategory, setGoalId, skipNextPulseCheck]);

  const openBreathingOverlay = useCallback(() => {
    setShowBreathing(true);
  }, [setShowBreathing]);

  const openNoiseSilencingPulse = useCallback(() => {
    openAppOverlay("noiseSilencingPulse");
  }, [openAppOverlay]);

  const openLibraryOverlay = useCallback(() => {
    openAppOverlay("library");
  }, [openAppOverlay]);

  const openSettingsScreen = useCallback(() => {
    void navigateToScreen("settings");
  }, [navigateToScreen]);

  const openProfileScreen = useCallback(() => {
    void navigateToScreen("profile");
  }, [navigateToScreen]);

  const handleExperienceNavigate = useCallback((nextScreen: string) => {
    void navigateToScreen(nextScreen as AppScreen);
  }, [navigateToScreen]);

  const handleJourneyGoalOpen = useCallback((nextGoalId: string, nextCategory: string) => {
    setGoalId(nextGoalId);
    setCategory(nextCategory as AdviceCategory);
    void navigateToScreen("map");
  }, [navigateToScreen, setCategory, setGoalId]);

  const openManualCocoon = useCallback(() => {
    openCocoonModal("manual");
  }, [openCocoonModal]);

  const openConsciousnessArchive = useCallback(() => {
    openAppOverlay("consciousnessArchive");
  }, [openAppOverlay]);

  const openTimeCapsuleVault = useCallback(() => {
    openAppOverlay("timeCapsuleVault");
  }, [openAppOverlay]);

  const handleInterventionBreathing = useCallback(() => {
    clearActiveIntervention();
    setShowBreathing(true);
  }, [clearActiveIntervention, setShowBreathing]);

  const handleLockedFeatureClose = useCallback(() => {
    setLockedFeature(null);
  }, [setLockedFeature]);

  const handleAuthOverlayClose = useCallback(() => {
    setShowAuthModal(false);
  }, [setShowAuthModal]);

  const handleEmergencyStartBreathing = useCallback(() => {
    useEmergencyState.getState().close();
    setShowBreathing(true);
  }, [setShowBreathing]);

  const handleEmergencyStartScenario = useCallback(() => {
    useEmergencyState.getState().close();
    openAppOverlay("gym");
  }, [openAppOverlay]);

  const navigateToMap = useCallback(() => {
    void navigateToScreen("map");
  }, [navigateToScreen]);

  const handleChromeProfileOpen = useCallback(() => {
    trackingService.recordFlow("profile_clicked");
    if (authUser) {
      void navigateToScreen("profile");
      return;
    }
    setPulseCheckContext("regular");
    setShowPulseCheck(false);
    clearWelcome();
    trackingService.recordFlow("auth_gate_opened", { meta: { mode: "login_profile" } });
    setLoginIntent();
    setShowAuthModal(true);
  }, [
    authUser,
    clearWelcome,
    setLoginIntent,
    setPulseCheckContext,
    navigateToScreen,
    setShowAuthModal,
    setShowPulseCheck
  ]);

  const handleChromeWhatsAppOpen = useCallback(() => {
    analyticsService.whatsapp({ placement: "app_floating" });
    if (whatsAppLink) openInNewTab(whatsAppLink);
  }, [whatsAppLink]);

  const handleChromeNavigate = useCallback((nextScreen: AppScreen) => {
    void navigateToScreen(nextScreen);
  }, [navigateToScreen]);

  const toggleSystemOverclockPanel = useCallback(() => {
    setShowSystemOverclockPanel(!showSystemOverclockPanel);
  }, [setShowSystemOverclockPanel, showSystemOverclockPanel]);

  const openAmbientReality = useCallback(() => {
    openAppOverlay("ambientReality");
  }, [openAppOverlay]);

  const openOracleDashboard = useCallback(() => {
    void navigateToScreen("oracle-dashboard");
  }, [navigateToScreen]);

  return {
    handleEmergencyPowerBankOpen,
    handleFeedbackSubmit,
    handleOwnerInstallRequestHandled,
    openSurveyScreen,
    openLandingScreen,
    handleGoalSelected,
    openBreathingOverlay,
    openNoiseSilencingPulse,
    openLibraryOverlay,
    openSettingsScreen,
    openProfileScreen,
    handleExperienceNavigate,
    handleJourneyGoalOpen,
    openManualCocoon,
    openConsciousnessArchive,
    openTimeCapsuleVault,
    handleInterventionBreathing,
    handleLockedFeatureClose,
    handleAuthOverlayClose,
    handleEmergencyStartBreathing,
    handleEmergencyStartScenario,
    navigateToMap,
    handleChromeProfileOpen,
    handleChromeWhatsAppOpen,
    handleChromeNavigate,
    toggleSystemOverclockPanel,
    openAmbientReality,
    openOracleDashboard
  };
}
