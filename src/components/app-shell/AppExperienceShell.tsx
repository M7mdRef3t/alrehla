import { useCallback, useEffect, useMemo } from "react";
import { isPhaseOneUserFlow, isUserMode } from "../../config/appEnv";
import {
  getHash,
  getSearch,
  pushUrl,
} from "../../services/navigation";
import { initLanguage } from "../../services/i18n";
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

// Initialize language on app start
initLanguage();

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

export function AppExperienceShell() {
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
    snoozeNotifications
  } = useAppShellBootstrapState();

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
    showStartup,
    handleStartupComplete,
    startRecovery,
    handleOnboardingComplete,
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
  const {
    openCocoonModal,
    openRegularPulseCheck,
    isLowPulseCocoonSuppressed
  } = useAppPulseSanctuaryFlow({
    goalId,
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
    setStartRecoveryIntent,
    setLoginIntent,
    setShowAuthModal,
    clearPostAuthState,
    showNoiseSessionToast,
    showBreathingSessionToast,
    skipNextPulseCheck
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
    setShowBreathing,
    isInterventionSuppressed: showPulseCheck || showCocoon || showBreathing || screen === "map"
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
    setLoginIntent,
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
    setLoginIntent,
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
    openSurveyScreen: () => {
      void navigateToScreen("survey");
    },
    openLandingScreen: () => {
      void navigateToScreen("landing");
    },
    openMissionScreen,
    openMissionFromAddPerson,
    openRegularPulseCheck,
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
    navigateToWeeklySummary,
    toggleSystemOverclockPanel,
    openAmbientReality,
    openOracleDashboard
  } = useAppExperienceSurfaceState({
    canShowAIChatbot,
    surfaceActions,
    agentExperience,
    mainSurface,
    overlaySurface,
    onOnboardingComplete: handleOnboardingComplete
  });
  
  // PAGE VIEW TRACKING
  useEffect(() => {
    const pageNames: Record<string, string> = {
      landing: "Landing",
      goal: "Goal Selection",
      map: "Relationship Map",
      guided: "Guided Journey",
      mission: "Mission",
      tools: "Tools"
    };
    
    const pageTitle = pageNames[screen] || screen;
    import("../../services/analytics").then(({ trackPageView }) => {
      trackPageView(pageTitle);
    });
  }, [screen]);

  const handleExitAdminRoute = useCallback(() => {
    pushUrl("/");
    setIsAdminRoute(false);
  }, [setIsAdminRoute]);
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
          showStartup={showStartup}
          onStartupComplete={handleStartupComplete}
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
          onNavigateToWeeklySummary={navigateToWeeklySummary}
        />
      </>
    </AppShellRouteGate>
  );
}
