import { useMemo } from "react";
import type { FeatureFlagKey } from "@/config/features";
import type { AppScreen } from "@/navigation/navigationMachine";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getEffectiveRoleFromState, useAuthState } from "@/domains/auth/store/auth.store";
import { usePulseCheckLogic } from "@/hooks/usePulseCheckLogic";
import { isPhaseOneUserFlow, isUserMode } from "@/config/appEnv";
import { runtimeEnv } from "@/config/runtimeEnv";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "@/utils/featureFlags";
import { isSupabaseReady } from "@/services/supabaseClient";
import { resolveLandingChromeVisibility } from '@/orchestration/chromeVisibility';
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
  const rawRole = useAuthState((s) => s.role);

  // Always check the raw (database) role for owner-level privileges
  // so that the owner's admin UI isn't blocked when previewing as a user
  const isPrivilegedUser = isPrivilegedRole(rawRole) || isPrivilegedRole(role) || adminAccess;
  const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
  const normalizedRawRole = typeof rawRole === "string" ? rawRole.trim().toLowerCase() : "";
  const isOwnerWatcher = normalizedRole === "owner" || normalizedRole === "superadmin" || normalizedRole === "admin" || normalizedRole === "developer" ||
    normalizedRawRole === "owner" || normalizedRawRole === "superadmin" || normalizedRawRole === "admin" || normalizedRawRole === "developer" || adminAccess;
  const canPollOwnerAlerts = Boolean(authUser) && (normalizedRole === "owner" || normalizedRole === "superadmin" || normalizedRawRole === "owner" || normalizedRawRole === "superadmin");
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
