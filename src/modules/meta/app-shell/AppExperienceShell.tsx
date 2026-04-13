"use client";

import { syncMemoryFromSupabase } from "@/services/userMemory";
import { syncSubscription } from "@/services/subscriptionManager";
import { syncLiveSessionsFromSupabase } from "@/modules/dawayir-live/utils/sessionHistory";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isPhaseOneUserFlow, isUserMode, isRevenueMode } from "@/config/appEnv";
import { useAuthState } from "@/domains/auth/store/auth.store";
import {
  getHash,
  getSearch,
  pushUrl,
} from "@/services/navigation";
import { trackingService } from "@/domains/journey";
import { initLanguage } from "@/services/i18n";
import { AppRuntimeControllers } from "./AppRuntimeControllers";
import { AppShellRouteGate } from "./AppShellRouteGate";
import { AppExperienceSurface } from "./AppExperienceSurface";
import { useNextStepRouting } from "./useNextStepRouting";
import { useOwnerActionOrchestration } from "./useOwnerActionOrchestration";
import { useAppMindSignals } from "./useAppMindSignals";
import { useAppJourneyEntryActions } from "./useAppJourneyEntryActions";
import { useAppPulseSanctuaryFlow } from "./useAppPulseSanctuaryFlow";
import { useAppNavigationRuntime } from "./useAppNavigationRuntime";
import { useAppOwnerActionContext } from "./useAppOwnerActionContext";
import { useAppBroadcastState } from "./useAppBroadcastState";
import { useAppExperienceSessionState } from "./useAppExperienceSessionState";
import { useAppBiometricCrisisMonitor } from "./useAppBiometricCrisisMonitor";
import { useAppShellAccessState } from "./useAppShellAccessState";
import { useAppShellBootstrapState } from "./useAppShellBootstrapState";
import { useAppExperienceSurfaceState } from "./useAppExperienceSurfaceState";
import { SanctuaryLockdownExperience } from "@/modules/action/SanctuaryLockdownExperience";
import type { AppShellScreen } from '@/modules/map/dawayirIndex';
import { usePersonalizedBiometrics } from "@/hooks/usePersonalizedBiometrics";
import { useWeatherFunnelBridge } from "@/hooks/useWeatherFunnelBridge";
import { BoardingPassModal } from "../BoardingPassModal";
import { useMapState } from "@/modules/map/store/map.store";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";
import { UserbackWidget } from "@/components/UserbackWidget";

function hasOAuthCallbackParams(): boolean {
  const search = new URLSearchParams(getSearch());
  if (search.has("code") || search.has("state") || search.has("error") || search.has("error_description")) {
    return true;
  }

  const rawHash = getHash();
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  const hashParams = new URLSearchParams(hash);
  return (
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("expires_in") ||
    hashParams.has("token_type") ||
    hashParams.has("type") ||
    hashParams.has("error") ||
    hashParams.has("error_description")
  );
}

interface AppExperienceShellProps {
  onExitToLanding?: () => void;
}

export function AppExperienceShell({ onExitToLanding }: AppExperienceShellProps) {
  const skipExitToLandingOnceRef = useRef(false);

  // تفعيل التدخل الفيزيائي
  usePersonalizedBiometrics();

  // تفعيل جسر طقس العلاقات
  useWeatherFunnelBridge();

  useEffect(() => {
    // Keep language initialization inside the client lifecycle so importing this
    // module stays side-effect free during the first route render.
    initLanguage();
  }, []);

  const {
    screen,
    setScreen,
    isLandingScreen,
    category,
    setCategory,
    goalId,
    setGoalId,
    selectedNodeId,
    setSelectedNodeId,
    missionNodeId,
    setMissionNodeId,
    toolsBackScreen,
    setToolsBackScreen,
    openAppOverlay,
    closeAppOverlay,
    setAppOverlay,
    libraryOpen,
    showBreathing,
    setShowBreathing,
    showCocoon,
    setShowCocoon,
    showAuthModal,
    setShowAuthModal,
    showSystemOverclockPanel,
    setShowSystemOverclockPanel,
    agentModule,
    setAgentModule,
    setLockedFeature,
    ownerInstallRequestNonce,
    setOwnerInstallRequestNonce,
    whatsAppLink,
    notificationSettings,
    notificationPermission,
    notificationSupported,
    isEmergencyOpen,
    storedGoalId,
    consumeLandingIntent,
    storedCategory,
    lastGoalById,
    theme,
    setTheme,
    snoozedUntil,
    logPulse,
    snoozeNotifications,
    setAuthIntent,
    recordActivity,
    completeDailyQuest
  } = useAppShellBootstrapState();


  // ── CONSUME LANDING INTENT (Cross-Shell Navigation) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";
    const APP_SCREEN_BOOT_ACTION_PREFIX = "navigate:";
    const APP_LOGIN_BOOT_ACTION = "open_login";
    
    const action = window.sessionStorage.getItem(APP_BOOT_ACTION_KEY);
    if (!action) return;
    skipExitToLandingOnceRef.current = true;

    // IMPORTANT:
    // `start_recovery` is consumed by `useAppStartupOnboarding` to route into map flow.
    // Do not consume it here, otherwise onboarding skip/complete can fall back to landing.
    if (action.startsWith(APP_SCREEN_BOOT_ACTION_PREFIX)) {
      // Clear intent immediately after reading (screen intents are handled in this effect)
      window.sessionStorage.removeItem(APP_BOOT_ACTION_KEY);
      const targetScreen = action.replace(APP_SCREEN_BOOT_ACTION_PREFIX, "");
      // Navigate to the requested screen (e.g., tools, insights)
      setScreen(targetScreen as AppShellScreen);
      return;
    }

    if (action === APP_LOGIN_BOOT_ACTION) {
      window.sessionStorage.removeItem(APP_BOOT_ACTION_KEY);
      trackingService.recordFlow("auth_gate_opened", { meta: { mode: "login_landing_header" } });
      setAuthIntent({ kind: "login", createdAt: Date.now() });
      setShowAuthModal(true);
    }
  }, [setAuthIntent, setScreen, setShowAuthModal]);

  // ── EXIT TO LANDING ──
  useEffect(() => {
    if (screen !== "landing" || !onExitToLanding) return;
    if (showAuthModal) return;
    if (skipExitToLandingOnceRef.current) {
      skipExitToLandingOnceRef.current = false;
      return;
    }
    onExitToLanding();
  }, [screen, onExitToLanding, showAuthModal]);

  const tier = useAuthState((s) => s.tier);
  const transformationDiagnosis = useMapState((s) => s.transformationDiagnosis);
  const [isBoardingPassOpen, setIsBoardingPassOpen] = useState(false);

  // Goal Guard moved below authStatus declaration to avoid Temporal Dead Zone.

  const {
    adminPrompt,
    authStatus,
    authUser,
    authFirstName,
    authToneGender,
    isOwnerWatcher,
    canPollOwnerAlerts,
    isLockedPhaseOne,
    availableFeatures,
    canUseMap,
    canUseJourneyTools,
    canShowAIChatbot,
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
  } = useAppShellAccessState({
    screen,
    isLandingScreen,
    showAuthModal,
    showBreathing,
    showCocoon,
    isEmergencyOpen,
    hasWhatsAppLink: Boolean(whatsAppLink),
    hasOAuthCallbackParams,
    setScreen,
    setLockedFeature
  });

  // ── DAILY ACTIVITY & QUESTS ──
  useEffect(() => {
    if (authStatus === "ready") {
      const { streakMaintained } = recordActivity();
      // Auto-complete the check-in quest
      completeDailyQuest("dq_checkin", "daily_visit", 20);
    }
  }, [authStatus, recordActivity, completeDailyQuest]);


  // ── BOARDING PASS LOGIC ──
  useEffect(() => {
    if (tier === "pro" && authStatus === "ready" && authUser) {
      const BOARDING_PASS_SHOWN_KEY = `dawayir-boarding-pass-shown-${authUser.id}`;
      const hasSeen = getFromLocalStorage(BOARDING_PASS_SHOWN_KEY) === "true";
      
      if (!hasSeen) {
        // Delay slightly for dramatic effect after session ready
        const t = setTimeout(() => {
          setIsBoardingPassOpen(true);
        }, 1500);
        return () => clearTimeout(t);
      }
    }
  }, [tier, authStatus, authUser]);

  const handleCloseBoardingPass = () => {
    if (authUser) {
      const BOARDING_PASS_SHOWN_KEY = `dawayir-boarding-pass-shown-${authUser.id}`;
      setInLocalStorage(BOARDING_PASS_SHOWN_KEY, "true");
    }
    setIsBoardingPassOpen(false);
  };

  // REVENUE MODE REDIRECTION: Goal Guard — placed here so authStatus is guaranteed to be initialized.
  // In revenue mode, if we are NOT on a whitelisted screen and don't have a goal, force goal pick.
  useEffect(() => {
    if (authStatus === "loading") return;

    const isWhitelisted =
      screen === "landing" ||
      screen === "goal" ||
      screen === "tools" ||
      screen === "insights" ||
      screen === "stories" ||
      screen === "about" ||
      screen === "quizzes" ||
      screen === "behavioral-analysis" ||
      screen === "resources" ||
      screen === "settings" ||
      screen === "life-os";

    if (isRevenueMode && !isWhitelisted && !goalId && !storedGoalId) {
      void setScreen("goal");
    }
  }, [screen, goalId, storedGoalId, setScreen, authStatus]);

  // STRICT CHECKOUT GATE: Guard map access for free tier
  useEffect(() => {
    if (authStatus !== "ready" || !authUser || tier !== "free" || isOwnerWatcher) return;
    
    // If user tries to access map or guided flow while being free, show the mandatory checkout
    if (screen === "map" || screen === "guided") {
      setAppOverlay("premiumBridge", true);
    }
  }, [authStatus, authUser, tier, screen, setAppOverlay, isOwnerWatcher]);

  const {
    activeBroadcast,
    handlePublicBroadcast,
    dismissActiveBroadcast
  } = useAppBroadcastState();

  const { navigateToScreen } = useAppNavigationRuntime({
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
  });

  const {
    openDefaultGoalMap,
    goToGoals,
    openMissionScreen,
    openMissionFromAddPerson,
    openJourneyTools,
    openDawayirTool,
    openDawayirSetup
  } = useAppJourneyEntryActions({
    screen,
    goalId,
    storedGoalId,
    storedCategory,
    lastGoalById,
    authStatus,
    canUseMap,
    canUseJourneyTools,
    isLockedPhaseOne,
    navigateToScreen,
    setScreen,
    setGoalId,
    setCategory,
    setSelectedNodeId,
    setMissionNodeId,
    setToolsBackScreen,
    setLockedFeature,
    skipNextPulseCheck
  });

  const {
    postNoiseSessionMessage,
    postBreathingMessage,
    pulseDeltaToast,
    lastPulseInsights,
    showNoiseSessionToast,
    showBreathingSessionToast,
    capturePulseReflection,
    clearPulseInsights,
    pulseInsight,
    pulseMode,
    challengeTarget,
    challengeLabel,
    startRecovery,
    setStartRecoveryIntent,
    setLoginIntent,
    welcome,
    clearWelcome,
    clearPostAuthState,
    isFeaturePreviewSession,
    previewedFeature,
    forcePulsePreviewOpen,
    goBackToFeatureFlags,
    clearPulseCheckPreview
  } = useAppExperienceSessionState({
    uiPersistence: {
      authStatus,
      userId: authUser?.id,
      screen,
      setScreen
    },
    missionNotifications: {
      notificationSupported,
      notificationPermission,
      notificationSettings,
      snoozedUntil
    },
    startupOnboarding: {
      consumeLandingIntent,
      navigateToScreen,
      setCategory,
      setGoalId,
      setOverlay: setAppOverlay,
      openOverlay: openAppOverlay,
      closeOverlay: closeAppOverlay
    },
    authRecovery: {
      authStatus,
      authUser,
      authFirstName,
      authToneGender,
      isPhaseOneUserFlow,
      logPulse,
      navigateToScreen,
      setPulseCheckContext,
      setShowPulseCheck,
      setCategory,
      setGoalId,
      setSelectedNodeId,
      setShowAuthModal
    },
    metadataScreen: screen,
    featurePreview: {
      isAdminRoute,
      isOwnerWatcher,
      navigateToScreen,
      openJourneyTools,
      skipNextPulseCheck,
      setPulseCheckContext,
      setShowPulseCheck
    }
  });

  const queueStartRecoveryAuthIntent = useCallback((payload: {
    energy: number;
    mood: Parameters<typeof setStartRecoveryIntent>[0]["mood"];
    focus: Parameters<typeof setStartRecoveryIntent>[0]["focus"];
    auto?: boolean;
    notes?: string;
    energyReasons?: string[];
    energyConfidence?: Parameters<typeof setStartRecoveryIntent>[0]["energyConfidence"];
  }) => {
    setAuthIntent({ kind: "start_recovery", pulse: payload, createdAt: Date.now() });
    setStartRecoveryIntent(payload);
  }, [setAuthIntent, setStartRecoveryIntent]);

  const queueLoginAuthIntent = useCallback(() => {
    setAuthIntent({ kind: "login", createdAt: Date.now() });
    setLoginIntent();
  }, [setAuthIntent, setLoginIntent]);

  const {
    openCocoonModal,
    openRegularPulseCheck,
    isLowPulseCocoonSuppressed
  } = useAppPulseSanctuaryFlow({
    goalId,
    currentScreen: screen,
    isLandingScreen,
    showPulseCheck,
    setShowPulseCheck,
    pulseCheckContext,
    setPulseCheckContext,
    previewedFeature,
    forcePulsePreviewOpen,
    clearPulseCheckPreview,
    showBreathing,
    setShowBreathing,
    setShowCocoon,
    theme,
    setTheme,
    authUserId: authUser?.id,
    shouldPromptAuthAfterPulse,
    logPulse,
    capturePulseReflection,
    snoozeNotifications,
    openOverlay: openAppOverlay,
    closeOverlay: closeAppOverlay,
    navigateToScreen,
    openDefaultGoalMap,
    openDawayirSetup,
    goToGoals,
    setStartRecoveryIntent: queueStartRecoveryAuthIntent,
    setLoginIntent: queueLoginAuthIntent,
    setShowAuthModal,
    clearPostAuthState,
    showNoiseSessionToast,
    showBreathingSessionToast,
    skipNextPulseCheck,
    completeDailyQuest
  });

  const {
    activeIntervention,
    clearActiveIntervention,
    handleRefreshNextStep,
    handleTakeNextStep,
    nextStepDecision
  } = useNextStepRouting({
    screen,
    goalId,
    category,
    availableFeatures,
    selectedNodeId,
    navigateToScreen,
    openJourneyTools,
    openMissionScreen,
    openFeedback: () => openAppOverlay("feedback"),
    setSelectedNodeId,
    setShowBreathing
  });

  const {
    presentMirrorInsight
  } = useAppMindSignals({
    storedGoalId,
    goalId,
    showBreathing,
    showCocoon,
    openOverlay: openAppOverlay,
    closeOverlay: closeAppOverlay,
    openCocoonModal
  });

  useAppBiometricCrisisMonitor({
    screen,
    showCocoon,
    showBreathing,
    openCocoonModal
  });

  const ownerActionContext = useAppOwnerActionContext({
    canShowAIChatbot,
    notificationSupported,
    hasGlobalAtlas: availableFeatures.global_atlas,
    hasInternalBoundaries: availableFeatures.internal_boundaries,
    navigateToScreen,
    openOverlay: openAppOverlay,
    openJourneyTools,
    openDawayirTool,
    startJourney: goToGoals,
    setOwnerInstallRequestNonce,
    setShowBreathing,
    lockFeature: setLockedFeature
  });

  useOwnerActionOrchestration({
    isAdminRoute,
    skipNextPulseCheck,
    context: ownerActionContext
  });

  const surfaceActions = useMemo(() => ({
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
    setLoginIntent: queueLoginAuthIntent,
    setShowAuthModal,
    setShowSystemOverclockPanel,
    setLockedFeature,
    skipNextPulseCheck,
    openAppOverlay,
    openCocoonModal,
    navigateToScreen
  }), [
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
    queueLoginAuthIntent,
    setShowAuthModal,
    setShowSystemOverclockPanel,
    setLockedFeature,
    skipNextPulseCheck,
    openAppOverlay,
    openCocoonModal,
    navigateToScreen
  ]);

  const agentExperience = useMemo(() => ({
    availableFeatures,
    screen,
    selectedNodeId,
    goalId,
    category,
    agentModule,
    adminPrompt,
    navigateToScreen,
    openOverlay: openAppOverlay,
    setSelectedNodeId,
    setShowBreathing
  }), [
    availableFeatures,
    screen,
    selectedNodeId,
    goalId,
    category,
    agentModule,
    adminPrompt,
    navigateToScreen,
    openAppOverlay,
    setSelectedNodeId,
    setShowBreathing
  ]);

  const mainSurface = useMemo(() => ({
    showBreathing,
    showCocoon,
    isEmergencyOpen,
    challengeNodeId: challengeTarget?.nodeId ?? null,
    chromeVisibility,
    screen,
    authUserId: authUser?.id,
    authUser,
    whatsAppLink,
    ownerInstallRequestNonce,
    welcome,
    onClearWelcome: clearWelcome,
    category,
    goalId,
    selectedNodeId,
    pulseMode,
    pulseInsight,
    isLowPulseCocoonSuppressed,
    canUseBasicDiagnosis: availableFeatures.basic_diagnosis,
    challengeLabel,
    nextStepDecision,
    toolsBackScreen,
    missionNodeId,
    canUseMap,
    availableFeatures,
    libraryOpen,
    onStartJourney: startRecovery,
    onSelectNode: setSelectedNodeId,
    onFeatureLocked: setLockedFeature,
    openRegularPulseCheck,
    openSurveyScreen: () => {
      void navigateToScreen("survey");
    },
    openLandingScreen: () => {
      void navigateToScreen("landing");
    },
    openMissionScreen,
    openMissionFromAddPerson,
    handleTakeNextStep,
    handleRefreshNextStep,
    openDawayirTool,
    openDawayirSetup,
    presentMirrorInsight
  }), [
    showBreathing,
    showCocoon,
    isEmergencyOpen,
    challengeTarget?.nodeId,
    chromeVisibility,
    screen,
    authUser,
    whatsAppLink,
    ownerInstallRequestNonce,
    welcome,
    clearWelcome,
    category,
    goalId,
    selectedNodeId,
    pulseMode,
    pulseInsight,
    isLowPulseCocoonSuppressed,
    availableFeatures,
    challengeLabel,
    nextStepDecision,
    toolsBackScreen,
    missionNodeId,
    canUseMap,
    libraryOpen,
    startRecovery,
    setSelectedNodeId,
    setLockedFeature,
    openRegularPulseCheck,
    navigateToScreen,
    openMissionScreen,
    openMissionFromAddPerson,
    handleTakeNextStep,
    handleRefreshNextStep,
    openDawayirTool,
    openDawayirSetup,
    presentMirrorInsight
  ]);

  const overlaySurface = useMemo(() => ({
    activeBroadcast,
    onDismissBroadcast: dismissActiveBroadcast,
    postBreathingMessage,
    activeIntervention,
    onStartInterventionBreathing: () => setShowBreathing(true),
    onContinueIntervention: clearActiveIntervention,
    postNoiseSessionMessage,
    pulseDeltaToast,
    lastPulseInsights,
    onClearPulseInsights: clearPulseInsights
  }), [
    activeBroadcast,
    dismissActiveBroadcast,
    postBreathingMessage,
    activeIntervention,
    setShowBreathing,
    clearActiveIntervention,
    postNoiseSessionMessage,
    pulseDeltaToast,
    lastPulseInsights,
    clearPulseInsights
  ]);

  const {
    chromeShellProps,
    mainContentProps,
    transientChromeProps,
    overlayHostProps,
    openConsciousnessArchive,
    openTimeCapsuleVault,
    navigateToMap,
    toggleSystemOverclockPanel,
    openAmbientReality,
    openOracleDashboard
  } = useAppExperienceSurfaceState({
    canShowAIChatbot,
    surfaceActions,
    agentExperience,
    mainSurface,
    overlaySurface
  });
  
  // PAGE VIEW TRACKING
  useEffect(() => {
    const pageNames: Record<string, string> = {
      landing: "Landing",
      goal: "Goal Selection",
      map: "Relationship Map",
      guided: "Guided Journey",
      mission: "Mission",
      tools: "Tools",
      "life-os": "Life Command Center"
    };
    
    const pageTitle = pageNames[screen] || screen;
    import("@/services/analytics").then(({ trackPageView }) => {
      trackPageView(pageTitle);
    });
  }, [screen]);

  const handleExitAdminRoute = useCallback(() => {
    pushUrl("/");
    setIsAdminRoute(false);
  }, [setIsAdminRoute]);

  const handleHeaderLogin = useCallback(() => {
    setPulseCheckContext("regular");
    setShowPulseCheck(false);
    clearWelcome();
    trackingService.recordFlow("auth_gate_opened", { meta: { mode: "login_header" } });
    queueLoginAuthIntent();
    setShowAuthModal(true);
  }, [
    clearWelcome,
    queueLoginAuthIntent,
    setPulseCheckContext,
    setShowAuthModal,
    setShowPulseCheck
  ]);

  return (
    <AppShellRouteGate
      isAdminRoute={isAdminRoute}
      isAnalyticsRoute={isAnalyticsRoute}
      isOwnerWatcher={isOwnerWatcher}
      isFeaturePreviewSession={isFeaturePreviewSession}
      previewedFeature={previewedFeature}
      goBackToFeatureFlags={goBackToFeatureFlags}
      onExitAdminRoute={handleExitAdminRoute}
    >
      <>
        <AppRuntimeControllers
          screen={screen}
          isAdminRoute={isAdminRoute}
          canPollOwnerAlerts={canPollOwnerAlerts}
          canShowAIChatbot={canShowAIChatbot}
          onAgentModuleLoaded={setAgentModule}
          onBroadcast={handlePublicBroadcast}
        />
        <AppExperienceSurface
          screen={screen}
          isLandingScreen={isLandingScreen}
          showPulseCheck={showPulseCheck}
          isFeaturePreviewSession={isFeaturePreviewSession}
          previewedFeature={previewedFeature}
          onBackToFeatureFlags={goBackToFeatureFlags}
          transientChromeProps={transientChromeProps}
          chromeShellProps={chromeShellProps}
          mainContentProps={mainContentProps}
          overlayHostProps={overlayHostProps}
          welcome={welcome}
          onClearWelcome={clearWelcome}
          showSystemOverclockControls={!isUserMode}
          showSystemOverclockPanel={showSystemOverclockPanel}
          onToggleSystemOverclockPanel={toggleSystemOverclockPanel}
          onOpenConsciousnessArchive={openConsciousnessArchive}
          onOpenAmbientReality={openAmbientReality}
          onOpenTimeCapsuleVault={openTimeCapsuleVault}
          onOpenOracleDashboard={openOracleDashboard}
          onNavigateToMap={navigateToMap}
          onOpenLogin={handleHeaderLogin}
        />
        <UserbackWidget />
        <SanctuaryLockdownExperience />
        <BoardingPassModal 
          isOpen={isBoardingPassOpen} 
          onClose={handleCloseBoardingPass}
          userName={authFirstName || (authUser?.user_metadata?.full_name as string) || (authUser?.email as string)}
          userId={authUser?.id}
          joinDate={authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined}
          poeticState={transformationDiagnosis?.state}
        />
      </>
    </AppShellRouteGate>
  );
}
