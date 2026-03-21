import { useMemo } from "react";
import type { FeatureFlagKey } from "../../config/features";
import type { AppScreen } from "../../navigation/navigationMachine";
import { useAdminState } from "../../state/adminState";
import { getEffectiveRoleFromState, useAuthState } from "../../state/authState";
import { usePulseCheckLogic } from "../../hooks/usePulseCheckLogic";
import { isPhaseOneUserFlow, isUserMode } from "../../config/appEnv";
import { runtimeEnv } from "../../config/runtimeEnv";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "../../utils/featureFlags";
import { isSupabaseReady } from "../../services/supabaseClient";
import { resolveLandingChromeVisibility } from "../../app/orchestration/chromeVisibility";
import { useAppRouteSync } from "./useAppRouteSync";

interface UseAppShellAccessStateParams {
  screen: AppScreen;
  isLandingScreen: boolean;
  showAuthModal: boolean;
  showBreathing: boolean;
  showCocoon: boolean;
  isEmergencyOpen: boolean;
  hasWhatsAppLink: boolean;
  hasOAuthCallbackParams: () => boolean;
  setScreen: (screen: AppScreen) => void;
  setLockedFeature: (feature: FeatureFlagKey | null) => void;
}

export function useAppShellAccessState({
  screen,
  isLandingScreen,
  showAuthModal,
  showBreathing,
  showCocoon,
  isEmergencyOpen,
  hasWhatsAppLink,
  hasOAuthCallbackParams,
  setScreen,
  setLockedFeature
}: UseAppShellAccessStateParams) {
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminPrompt = useAdminState((s) => s.systemPrompt);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const authStatus = useAuthState((s) => s.status);
  const authUser = useAuthState((s) => s.user);
  const authFirstName = useAuthState((s) => s.firstName);
  const authToneGender = useAuthState((s) => s.toneGender);
  const role = useAuthState(getEffectiveRoleFromState);

  const isPrivilegedUser = isPrivilegedRole(role);
  const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
  const isOwnerWatcher = normalizedRole === "owner" || normalizedRole === "superadmin" || adminAccess;
  const canPollOwnerAlerts = Boolean(authUser) && (normalizedRole === "owner" || normalizedRole === "superadmin");
  const isLockedPhaseOne = isPhaseOneUserFlow && !isOwnerWatcher;

  const availableFeatures = useMemo(
    () =>
      getEffectiveFeatureAccess({
        featureFlags,
        betaAccess,
        role,
        adminAccess,
        isDev: !isUserMode && runtimeEnv.isDev
      }),
    [featureFlags, betaAccess, role, adminAccess]
  );

  const canUseMap = availableFeatures.dawayir_map;
  const canUseJourneyTools = availableFeatures.journey_tools && !isLockedPhaseOne;
  const canUseAIField = availableFeatures.ai_field && !isLockedPhaseOne;
  const canShowAIChatbot = canUseAIField && isPrivilegedUser;
  const canUsePulseCheck = availableFeatures.pulse_check;
  const shouldPromptAuthAfterPulse = !authUser && !isPrivilegedUser;
  const shouldGateStartWithAuth = isSupabaseReady && !authUser && !isPrivilegedUser;

  const {
    showPulseCheck,
    setShowPulseCheck,
    pulseCheckContext,
    setPulseCheckContext,
    skipNextCheck: skipNextPulseCheck
  } = usePulseCheckLogic(canUsePulseCheck, screen, shouldGateStartWithAuth);

  const { isAdminRoute, isAnalyticsRoute, setIsAdminRoute } = useAppRouteSync({
    screen,
    authStatus,
    canUseMap,
    canUseJourneyTools,
    isLockedPhaseOne,
    hasOAuthCallbackParams,
    setScreen,
    setLockedFeature
  });

  const chromeVisibility = useMemo(
    () =>
      resolveLandingChromeVisibility({
        isAdminRoute,
        showAuthModal,
        showPulseCheck,
        isLandingScreen,
        hasWhatsAppLink,
        isSanctuaryActive: showBreathing || showCocoon || isEmergencyOpen
      }),
    [
      isAdminRoute,
      isEmergencyOpen,
      isLandingScreen,
      showAuthModal,
      showBreathing,
      showCocoon,
      showPulseCheck,
      hasWhatsAppLink
    ]
  );

  return {
    adminPrompt,
    authStatus,
    authUser,
    authFirstName,
    authToneGender,
    role,
    isPrivilegedUser,
    isOwnerWatcher,
    canPollOwnerAlerts,
    isLockedPhaseOne,
    availableFeatures,
    canUseMap,
    canUseJourneyTools,
    canShowAIChatbot,
    canUsePulseCheck,
    shouldPromptAuthAfterPulse,
    showPulseCheck,
    setShowPulseCheck,
    pulseCheckContext,
    setPulseCheckContext,
    skipNextPulseCheck,
    isAdminRoute,
    isAnalyticsRoute,
    setIsAdminRoute,
    chromeVisibility
  };
}
