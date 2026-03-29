import { lazy, memo, Suspense, useCallback, useMemo } from "react";
import { useAdminState } from "../../state/adminState";
import { getEffectiveRoleFromState, useAuthState } from "../../state/authState";
import { getEffectiveFeatureAccess } from "../../utils/featureFlags";
import { isUserMode } from "../../config/appEnv";
import type { AgentActions, AgentContext } from "../../agent/types";
import { useAppOverlayState } from "../../state/appOverlayState";
import { useAppShellNavigationState, type AppShellScreen } from "../../state/appShellNavigationState";
import { useEmergencyState } from "../../state/emergencyState";
import { useAchievementState } from "../../state/achievementState";
import { useThemeState } from "../../state/themeState";
import { usePulseState } from "../../state/pulseState";
import { useJourneyState } from "../../state/journeyState";
import { useAppPulseSanctuaryFlow } from "./useAppPulseSanctuaryFlow";
import { AwarenessSkeleton } from "../AwarenessSkeleton";
import { JourneyTimeline } from "../JourneyTimeline";
import type { FeedbackSubmission } from "../FeedbackModal";
import { usePulseCheckLogic } from "../../hooks/usePulseCheckLogic";
import { useAppMindSignals } from "./useAppMindSignals";
import { runtimeEnv } from "../../config/runtimeEnv";
import { SafePulseCheckModal, SafeAIChatbot } from "../WrappedComponents";
import { OVERLAY_SEVERITY, CRITICAL_SEVERITY_THRESHOLD } from "../../utils/overlayPriorities";
import type { AppOverlayFlag } from "../../state/appOverlayState";
import type { PostAuthIntent } from "../../utils/postAuthIntent";

const GoogleAuthModal = lazy(() => import("../GoogleAuthModal").then((m) => ({ default: m.GoogleAuthModal })));
const AnalyticsConsentBanner = lazy(() =>
  import("../AnalyticsConsentBanner").then((m) => ({ default: m.AnalyticsConsentBanner }))
);
const FaqScreen = lazy(() => import("../FaqScreen").then((m) => ({ default: m.FaqScreen })));
const MirrorOverlay = lazy(() => import("../MirrorOverlay").then((m) => ({ default: m.MirrorOverlay })));
const RelationshipGym = lazy(() => import("../RelationshipGym").then((m) => ({ default: m.RelationshipGym })));
const CocoonModeModal = lazy(() => import("../CocoonModeModal").then((m) => ({ default: m.CocoonModeModal })));
const AchievementToast = lazy(() => import("../AchievementToast").then((m) => ({ default: m.AchievementToast })));
const MuteProtocol = lazy(() => import("../MuteProtocol").then((m) => ({ default: m.NoiseSilencingModal })));
const FeatureLockedModal = lazy(() => import("../FeatureLockedModal").then((m) => ({ default: m.FeatureLockedModal })));
const BreathingOverlay = lazy(() => import("../BreathingOverlay").then((m) => ({ default: m.BreathingOverlay })));
const ConsciousnessArchiveModal = lazy(
  () => import("../ConsciousnessArchiveModal").then((m) => ({ default: m.ConsciousnessArchiveModal }))
);
const EmergencyOverlay = lazy(() => import("../EmergencyOverlay").then((m) => ({ default: m.EmergencyOverlay })));
const DataManagement = lazy(() => import("../DataManagement").then((m) => ({ default: m.DataManagement })));
const NotificationSettings = lazy(() =>
  import("../NotificationSettings").then((m) => ({ default: m.NotificationSettings }))
);
const TrackingDashboard = lazy(() =>
  import("../TrackingDashboard").then((m) => ({ default: m.TrackingDashboard }))
);
const AtlasDashboard = lazy(() => import("../AtlasDashboard").then((m) => ({ default: m.AtlasDashboard })));
const ShareStats = lazy(() => import("../ShareStats").then((m) => ({ default: m.ShareStats })));
const EducationalLibrary = lazy(() =>
  import("../EducationalLibrary").then((m) => ({ default: m.EducationalLibrary }))
);
const SymptomsOverviewModal = lazy(() =>
  import("../SymptomsOverviewModal").then((m) => ({ default: m.SymptomsOverviewModal }))
);
const ThemeSettings = lazy(() => import("../ThemeSettings").then((m) => ({ default: m.ThemeSettings })));
const Achievements = lazy(() => import("../Achievements").then((m) => ({ default: m.Achievements })));
const RecoveryPlanModal = lazy(() =>
  import("../RecoveryPlanModal").then((m) => ({ default: m.RecoveryPlanModal }))
);
const PremiumBridgeModal = lazy(() =>
  import("../PremiumBridgeModal").then((m) => ({ default: m.PremiumBridgeModal }))
);
const AdvancedToolsModal = lazy(() =>
  import("../AdvancedToolsModal").then((m) => ({ default: m.AdvancedToolsModal }))
);
const ClassicRecoveryModal = lazy(() =>
  import("../ClassicRecoveryModal").then((m) => ({ default: m.ClassicRecoveryModal }))
);
const ManualPlacementModal = lazy(() =>
  import("../ManualPlacementModal").then((m) => ({ default: m.ManualPlacementModal }))
);
const FeedbackModal = lazy(() => import("../FeedbackModal").then((m) => ({ default: m.FeedbackModal })));
const AmbientRealityMode = lazy(() => import("../AmbientRealityMode").then((m) => ({ default: m.AmbientRealityMode })));
const TimeCapsuleVault = lazy(() => import("../TimeCapsuleVault").then((m) => ({ default: m.TimeCapsuleVault })));
const OnboardingFlow = lazy(() => import("../OnboardingFlow").then((m) => ({ default: m.OnboardingFlow })));
const JourneyToast = lazy(() => import("../JourneyToast").then((m) => ({ default: m.JourneyToast })));

interface AppOverlayHostProps {
  canShowAIChatbot: boolean;
  agentContext: AgentContext;
  agentActions?: AgentActions;
  agentSystemPrompt?: string;
  onFeedbackSubmit: (payload: FeedbackSubmission) => Promise<void> | void;
  onOnboardingComplete?: () => void;
}

type VisibleOverlayId = AppOverlayFlag | "emergency" | "pulseCheck";
type MindSignalOverlay = "nudgeToast" | "mirrorOverlay" | "journeyGuideChat";

export const AppOverlayHost = memo(function AppOverlayHost({
  canShowAIChatbot,
  agentContext,
  agentActions,
  agentSystemPrompt,
  onFeedbackSubmit,
  onOnboardingComplete: externalOnboardingComplete
}: AppOverlayHostProps) {
  const flags = useAppOverlayState((state) => state.flags);
  const lockedFeature = useAppOverlayState((state) => state.lockedFeature);
  const setLockedFeature = useAppOverlayState((state) => state.setLockedFeature);
  const postAuthIntent = useAppOverlayState((state) => state.postAuthIntent);
  const setAuthIntent = useAppOverlayState((state) => state.setAuthIntent);
  const pulseCheckState = useAppOverlayState((state) => state.pulseCheck);
  const setPulseCheck = useAppOverlayState((state) => state.setPulseCheck);
  const setOverlay = useAppOverlayState((state) => state.setOverlay);

  const screen = useAppShellNavigationState((s) => s.screen);
  const setScreen = useAppShellNavigationState((s) => s.setScreen);
  const setSelectedNodeId = useAppShellNavigationState((s) => s.setSelectedNodeId);

  const isEmergencyOpen = useEmergencyState((s) => s.isOpen);
  const closeEmergency = useEmergencyState((s) => s.close);

  const achievementToastVisible = useAchievementState((s) => !!s.lastNewAchievementId);
  const theme = useThemeState((s) => s.theme);
  const setTheme = useThemeState((s) => s.setTheme);
  type ThemePreference = Parameters<typeof setTheme>[0];

  const logPulse = usePulseState((s) => s.logPulse);
  const snoozeNotifications = usePulseState((s) => s.snoozeNotifications);
  const skipNextPulseCheck = usePulseState((s) => s.clearSnooze);

  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const role = useAuthState(getEffectiveRoleFromState);

  const canUsePulseCheck = useMemo(
    () =>
      getEffectiveFeatureAccess({
        featureFlags,
        betaAccess,
        role,
        adminAccess,
        isDev: !isUserMode && runtimeEnv.isDev
      }).pulse_check,
    [featureFlags, betaAccess, role, adminAccess]
  );
  const goalId = useJourneyState((s) => s.goalId);

  const {
    gym: showGym,
    breathing: showBreathing,
    cocoon: showCocoon,
    noiseSilencingPulse: showNoiseSilencingPulse,
    consciousnessArchive: showConsciousnessArchive,
    authModal: showAuthModal,
    dataManagement: showDataManagement,
    ownerDataTools: showOwnerDataTools,
    ambientReality: showAmbientReality,
    timeCapsuleVault: showTimeCapsuleVault,
    notificationSettings: showNotificationSettings,
    trackingDashboard: showTrackingDashboard,
    atlasDashboard: showAtlasDashboard,
    shareStats: showShareStats,
    library: showLibrary,
    symptomsOverview: showSymptomsOverview,
    recoveryPlan: showRecoveryPlan,
    themeSettings: showThemeSettings,
    achievements: showAchievements,
    advancedTools: showAdvancedTools,
    classicRecovery: showClassicRecovery,
    manualPlacement: showManualPlacement,
    feedback: showFeedback,
    onboarding: showOnboarding,
    welcomeToast: showWelcomeToast,
    faq: showFaq,
    journeyGuideChat: showJourneyGuideChat,
    journeyTimeline: showJourneyTimeline,
    nudgeToast: showNudgeToast,
    mirrorOverlay: showMirrorOverlay,
    premiumBridge: showPremiumBridge
  } = flags;

  // Implementation of Layer 3 (Execution): Overlay Mutex & Severity Index
  // Auto-trigger pulse check logic
  usePulseCheckLogic(canUsePulseCheck, screen, true);
  const activeFlags = (Object.keys(flags) as AppOverlayFlag[]).filter((f) => flags[f]);
  const activeOverlayItems: Array<{ id: VisibleOverlayId; severity: number }> = activeFlags.map((f) => ({
    id: f,
    severity: OVERLAY_SEVERITY[f] ?? 0
  }));

  if (isEmergencyOpen) {
    activeOverlayItems.push({ id: "emergency", severity: OVERLAY_SEVERITY.emergency });
  }

  // Also include Pulse Check if it's open (it has its own state)
  if (pulseCheckState.isOpen) {
    activeOverlayItems.push({ id: "pulseCheck", severity: OVERLAY_SEVERITY.pulseCheck });
  }

  activeOverlayItems.sort((a, b) => b.severity - a.severity);
  const topOverlayId = activeOverlayItems[0]?.id;
  const isLockedByCritical = (activeOverlayItems[0]?.severity ?? 0) >= CRITICAL_SEVERITY_THRESHOLD;

  const isLivePage = typeof window !== "undefined" && window.location.pathname.includes("dawayir-live");

  const setThemePreference = useCallback((nextTheme: ThemePreference) => {
    setTheme(nextTheme);
  }, [setTheme]);

  const setScreenSafe = useCallback((nextScreen: AppShellScreen) => {
    setScreen(nextScreen);
    return true;
  }, [setScreen]);

  const openNoiseOverlay = useCallback(() => {
    setOverlay("noiseSilencingPulse", true);
  }, [setOverlay]);

  const closeNoiseOverlay = useCallback(() => {
    setOverlay("noiseSilencingPulse", false);
  }, [setOverlay]);

  const openMindSignalOverlay = useCallback((overlay: MindSignalOverlay) => {
    setOverlay(overlay, true);
  }, [setOverlay]);

  const closeMindSignalOverlay = useCallback((overlay: "nudgeToast" | "mirrorOverlay") => {
    setOverlay(overlay, false);
  }, [setOverlay]);

  const setLoginIntentSafe = useCallback(() => {
    const loginIntent: PostAuthIntent = { kind: "login", createdAt: Date.now() };
    setAuthIntent(loginIntent);
  }, [setAuthIntent]);

  // Helper to determine if an overlay is allowed to render
  const isVisible = (id: AppOverlayFlag | "emergency" | "pulseCheck") => {
    if (!topOverlayId) return false;

    // If we're on a live page, suppress everything except emergency (it might be a panic button)
    if (isLivePage && id !== "emergency") {
      return false;
    }

    // Critical overlays (9+) always lock out everything else
    if (isLockedByCritical) return topOverlayId === id;
    // For non-critical, we currently show only the highest priority to prevent "cognitive choking"
    return topOverlayId === id;
  };

  const {
    openCocoonModal,
    handlePulseOverlaySubmit,
    handlePulseOverlayClose,
    handleCocoonStart,
    handleCocoonSkip,
    handleCocoonClose,
    handleNoiseSessionComplete,
    handleBreathingOverlayClose,
    handleAuthModalNotNow
  } = useAppPulseSanctuaryFlow({
    goalId: goalId ?? "unknown",
    isLandingScreen: screen === "landing",
    showPulseCheck: pulseCheckState.isOpen,
    setShowPulseCheck: (val) => setPulseCheck(val, pulseCheckState.context),
    pulseCheckContext: pulseCheckState.context,
    setPulseCheckContext: (ctx) => setPulseCheck(pulseCheckState.isOpen, ctx),
    previewedFeature: null,
    forcePulsePreviewOpen: false,
    clearPulseCheckPreview: () => {},
    showBreathing,
    setShowBreathing: (val) => setOverlay("breathing", val),
    setShowCocoon: (val) => setOverlay("cocoon", val),
    theme,
    setTheme: setThemePreference,
    authUserId: undefined,
    shouldPromptAuthAfterPulse: true,
    logPulse,
    capturePulseReflection: () => {},
    snoozeNotifications,
    openOverlay: openNoiseOverlay,
    closeOverlay: closeNoiseOverlay,
    navigateToScreen: setScreenSafe,
    openDefaultGoalMap: () => setScreen("map"),
    openDawayirSetup: () => {},
    goToGoals: () => setScreen("tools"),
    setStartRecoveryIntent: (p) => setPulseCheck(pulseCheckState.isOpen, pulseCheckState.context, p),
    setLoginIntent: setLoginIntentSafe,
    setShowAuthModal: (val) => setOverlay("authModal", val),
    clearPostAuthState: () => setAuthIntent(null),
    showNoiseSessionToast: () => {},
    showBreathingSessionToast: () => {},
    skipNextPulseCheck
  });

  const {
    activeNudge,
    activeMirrorInsight,
    handleNudgeToastClose,
    handleNudgeCtaAction,
    handleMirrorResolve
  } = useAppMindSignals({
    storedGoalId: goalId,
    goalId: goalId ?? "unknown",
    showBreathing,
    showCocoon,
    // لو أي flow نشط، لا تُطلق أي nudge أو mirrorOverlay
    activeFlows: showOnboarding || showBreathing || showCocoon || showNoiseSilencingPulse || pulseCheckState.isOpen,
    openOverlay: openMindSignalOverlay,
    closeOverlay: closeMindSignalOverlay,
    openCocoonModal,
    // يفتح pulse check باستخدام setPulseCheck الصحيح لا setOverlay
    openPulseCheck: () => setPulseCheck(true, "regular"),
    // يفتح ShareStats overlay للمشاركة عند milestone
    openShareStats: () => setOverlay("shareStats", true)
  });

  const onOnboardingComplete = useCallback(() => {
    if (externalOnboardingComplete) {
      // Use the proper handler from useAppStartupOnboarding
      // which calls startRecovery() + navigateToScreen("map") + handleStartupComplete()
      externalOnboardingComplete();
    } else {
      // Fallback: close overlay and open the warm bridge (PremiumBridgeModal)
      setOverlay("onboarding", false);
      setOverlay("premiumBridge", true);
    }
  }, [externalOnboardingComplete, setOverlay]);

  const onJourneyTimelineCardClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setOverlay("journeyTimeline", false);
  }, [setSelectedNodeId, setOverlay]);

  const onNavigateToMap = useCallback(() => {
    setScreen("map");
  }, [setScreen]);

  const showConsentBanner = !runtimeEnv.isDemoMode;

  return (
    <>
      {screen === "map" && (
        <JourneyTimeline
          isOpen={showJourneyTimeline}
          onClose={() => setOverlay("journeyTimeline", false)}
          onCardClick={onJourneyTimelineCardClick}
        />
      )}

      <Suspense fallback={<AwarenessSkeleton />}>
        {showGym && isVisible("gym") && (
          <RelationshipGym
            onClose={() => setOverlay("gym", false)}
            onStartJourney={() => {
              setOverlay("gym", false);
              setScreen("tools");
            }}
          />
        )}


        {showJourneyGuideChat && canShowAIChatbot && agentActions && isVisible("journeyGuideChat") && (
          <SafeAIChatbot
            agentContext={agentContext}
            agentActions={agentActions}
            systemPromptOverride={agentSystemPrompt}
            onOpenBreathing={() => setOverlay("breathing", true)}
            onNavigateToMap={onNavigateToMap}
            showLauncher={false}
            defaultOpen
            onRequestClose={() => setOverlay("journeyGuideChat", false)}
          />
        )}

        <ConsciousnessArchiveModal
          isOpen={showConsciousnessArchive && isVisible("consciousnessArchive")}
          onClose={() => setOverlay("consciousnessArchive", false)}
        />

        {achievementToastVisible && isVisible("achievements") && <AchievementToast />}

        {pulseCheckState.isOpen && isVisible("pulseCheck") && (
          <SafePulseCheckModal
            isOpen={pulseCheckState.isOpen}
            context={pulseCheckState.context}
            onSubmit={handlePulseOverlaySubmit}
            onClose={handlePulseOverlayClose}
          />
        )}

        {showCocoon && isVisible("cocoon") && (
          <CocoonModeModal
            isOpen={showCocoon}
            onStart={handleCocoonStart}
            canSkip={true}
            onSkip={handleCocoonSkip}
            onClose={handleCocoonClose}
          />
        )}

        {showNoiseSilencingPulse && isVisible("noiseSilencingPulse") && (
          <MuteProtocol
            isOpen={showNoiseSilencingPulse}
            onClose={() => setOverlay("noiseSilencingPulse", false)}
            onSessionComplete={handleNoiseSessionComplete}
          />
        )}

        {lockedFeature != null && (
          <FeatureLockedModal
            isOpen={lockedFeature != null}
            featureKey={lockedFeature}
            onClose={() => setLockedFeature(null)}
          />
        )}

        {showBreathing && isVisible("breathing") && <BreathingOverlay onClose={handleBreathingOverlayClose} />}

        {isEmergencyOpen && isVisible("emergency") && (
          <EmergencyOverlay
            onStartBreathing={() => setOverlay("breathing", true)}
            onStartScenario={() => {}}
            onOpenPowerBank={(nodeId: string) => {
              setSelectedNodeId(nodeId);
              closeEmergency();
            }}
          />
        )}

        {postAuthIntent && isVisible("authModal") && (
          <GoogleAuthModal
            isOpen={showAuthModal}
            intent={postAuthIntent}
            onClose={() => setAuthIntent(null)}
            onNotNow={handleAuthModalNotNow}
          />
        )}

        {showDataManagement && isVisible("dataManagement") && (
          <DataManagement
            isOpen={showDataManagement}
            onClose={() => setOverlay("dataManagement", false)}
            accountOnly
          />
        )}

        {showOwnerDataTools && isVisible("ownerDataTools") && (
          <DataManagement
            isOpen={showOwnerDataTools}
            onClose={() => setOverlay("ownerDataTools", false)}
            accountOnly={false}
          />
        )}

        {showNotificationSettings && isVisible("notificationSettings") && (
          <NotificationSettings
            isOpen={showNotificationSettings}
            onClose={() => setOverlay("notificationSettings", false)}
          />
        )}

        {showTrackingDashboard && isVisible("trackingDashboard") && (
          <TrackingDashboard
            isOpen={showTrackingDashboard}
            onClose={() => setOverlay("trackingDashboard", false)}
          />
        )}

        {showAtlasDashboard && isVisible("atlasDashboard") && (
          <AtlasDashboard
            isOpen={showAtlasDashboard}
            onClose={() => setOverlay("atlasDashboard", false)}
          />
        )}

        {showShareStats && isVisible("shareStats") && (
          <ShareStats isOpen={showShareStats} onClose={() => setOverlay("shareStats", false)} />
        )}

        {showLibrary && isVisible("library") && (
          <EducationalLibrary isOpen={showLibrary} onClose={() => setOverlay("library", false)} />
        )}

        {showSymptomsOverview && isVisible("symptomsOverview") && (
          <SymptomsOverviewModal
            isOpen={showSymptomsOverview}
            onClose={() => setOverlay("symptomsOverview", false)}
          />
        )}

        {showRecoveryPlan && isVisible("recoveryPlan") && (
          <RecoveryPlanModal
            isOpen={showRecoveryPlan}
            onClose={() => setOverlay("recoveryPlan", false)}
          />
        )}

        {showPremiumBridge && isVisible("premiumBridge") && (
          <PremiumBridgeModal />
        )}

        {showThemeSettings && isVisible("themeSettings") && (
          <ThemeSettings
            isOpen={showThemeSettings}
            onClose={() => setOverlay("themeSettings", false)}
          />
        )}

        {showAchievements && isVisible("achievements") && <Achievements onClose={() => setOverlay("achievements", false)} />}

        {showAdvancedTools && isVisible("advancedTools") && (
          <AdvancedToolsModal
            isOpen={showAdvancedTools}
            onClose={() => setOverlay("advancedTools", false)}
          />
        )}

        {showClassicRecovery && isVisible("classicRecovery") && (
          <ClassicRecoveryModal
            isOpen={showClassicRecovery}
            onClose={() => setOverlay("classicRecovery", false)}
          />
        )}

        {showManualPlacement && isVisible("manualPlacement") && (
          <ManualPlacementModal
            isOpen={showManualPlacement}
            onClose={() => setOverlay("manualPlacement", false)}
          />
        )}

        {showFeedback && isVisible("feedback") && (
          <FeedbackModal
            isOpen={showFeedback}
            onClose={() => setOverlay("feedback", false)}
            onSubmit={onFeedbackSubmit}
          />
        )}

        {showAmbientReality && isVisible("ambientReality") && <AmbientRealityMode onClose={() => setOverlay("ambientReality", false)} />}

        {showTimeCapsuleVault && isVisible("timeCapsuleVault") && <TimeCapsuleVault onClose={() => setOverlay("timeCapsuleVault", false)} />}

        {showOnboarding && isVisible("onboarding") && <OnboardingFlow onComplete={onOnboardingComplete} />}

        {showFaq && isVisible("faq") && <FaqScreen onClose={() => setOverlay("faq", false)} />}

        <JourneyToast
          variant="onboarding_complete"
          visible={showWelcomeToast && isVisible("welcomeToast")}
          onClose={() => setOverlay("welcomeToast", false)}
        />

        <JourneyToast
          variant="nudge"
          visible={showNudgeToast && !!activeNudge && isVisible("nudgeToast")}
          nudgeData={activeNudge ?? undefined}
          onClose={handleNudgeToastClose}
          onCtaAction={handleNudgeCtaAction}
        />

        <AnalyticsConsentBanner suppressed={!showConsentBanner} />

        {showMirrorOverlay && isVisible("mirrorOverlay") && (
          <MirrorOverlay
            insight={activeMirrorInsight}
            onConfront={handleMirrorResolve}
            onDeny={handleMirrorResolve}
          />
        )}
      </Suspense>

      {/* بصيرة الوعي — تُعرض الآن داخل المسار (narrative tab) عبر ConsciousnessThread */}
    </>
  );
});
