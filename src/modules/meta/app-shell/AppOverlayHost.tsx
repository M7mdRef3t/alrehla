import { lazy, memo, Suspense, useCallback, useMemo, useState, useEffect } from "react";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getEffectiveRoleFromState, useAuthState } from "@/domains/auth/store/auth.store";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "@/utils/featureFlags";
import { isUserMode } from "@/config/appEnv";
import type { AgentActions, AgentContext } from '@/agent/types';
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { useAppShellNavigationState, type AppShellScreen } from '@/modules/map/dawayirIndex';
import { useEmergencyState } from "@/domains/admin/store/emergency.store";
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { useThemeState } from "@/domains/consciousness/store/theme.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useJourneyProgress } from "@/domains/journey";
import { useAppPulseSanctuaryFlow } from "./useAppPulseSanctuaryFlow";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { JourneyTimeline } from '@/modules/action/JourneyTimeline';
import type { FeedbackSubmission } from "../FeedbackModal";
import { usePulseCheckLogic } from "@/hooks/usePulseCheckLogic";
import { useGamificationSignals } from "@/domains/gamification/hooks/useGamificationSignals";
import { useGamification } from "@/domains/gamification";
import { useAppMindSignals } from "./useAppMindSignals";
import { runtimeEnv } from "@/config/runtimeEnv";
import { SafePulseCheckModal, SafeAIChatbot } from "../WrappedComponents";
import { OVERLAY_SEVERITY, CRITICAL_SEVERITY_THRESHOLD } from "@/utils/overlayPriorities";
import type { AppOverlayFlag } from "@/domains/consciousness/store/overlay.store";
import type { PostAuthIntent } from "@/utils/postAuthIntent";
import { Z_LAYERS } from "@/config/zIndices";
import { useScrollLock } from "@/hooks/useScrollLock";

const GoogleAuthModal = lazy(() => import('@/modules/exploration/GoogleAuthModal').then((m) => ({ default: m.GoogleAuthModal })));
const AnalyticsConsentBanner = lazy(() =>
  import("../AnalyticsConsentBanner").then((m) => ({ default: m.AnalyticsConsentBanner }))
);
const FaqScreen = lazy(() => import("../FaqScreen").then((m) => ({ default: m.FaqScreen })));
const MirrorOverlay = lazy(() => import('@/modules/exploration/MirrorOverlay').then((m) => ({ default: m.MirrorOverlay })));
const RelationshipGym = lazy(() => import('@/modules/exploration/RelationshipGym').then((m) => ({ default: m.RelationshipGym })));
const CocoonModeModal = lazy(() => import('@/modules/action/CocoonModeModal').then((m) => ({ default: m.CocoonModeModal })));
const AchievementToast = lazy(() => import('@/modules/growth/AchievementToast').then((m) => ({ default: m.AchievementToast })));
const MuteProtocol = lazy(() => import('@/modules/action/MuteProtocol').then((m) => ({ default: m.MuteProtocol })));
const FeatureLockedModal = lazy(() => import("../FeatureLockedModal").then((m) => ({ default: m.FeatureLockedModal })));
const BreathingOverlay = lazy(() => import('@/modules/exploration/BreathingOverlay').then((m) => ({ default: m.BreathingOverlay })));
const ConsciousnessArchiveModal = lazy(
  () => import('@/modules/action/ConsciousnessArchiveModal').then((m) => ({ default: m.ConsciousnessArchiveModal }))
);
const EmergencyOverlay = lazy(() => import('@/modules/action/EmergencyOverlay').then((m) => ({ default: m.EmergencyOverlay })));
const DataManagement = lazy(() => import("../DataManagement").then((m) => ({ default: m.DataManagement })));
const NotificationSettings = lazy(() =>
  import("../NotificationSettings").then((m) => ({ default: m.NotificationSettings }))
);
const TrackingDashboard = lazy(() =>
  import("../TrackingDashboard").then((m) => ({ default: m.TrackingDashboard }))
);
const AtlasDashboard = lazy(() => import("../AtlasDashboard").then((m) => ({ default: m.AtlasDashboard })));
const ShareStats = lazy(() => import('@/modules/growth/ShareStats').then((m) => ({ default: m.ShareStats })));
const EducationalLibrary = lazy(() =>
  import('@/modules/growth/EducationalLibrary').then((m) => ({ default: m.EducationalLibrary }))
);
const InsightsLibrary = lazy(() =>
  import('@/modules/growth/InsightsLibrary').then((m) => ({ default: m.InsightsLibrary }))
);
const Goals2025Dashboard = lazy(() =>
  import('@/modules/growth/Goals2025Dashboard').then((m) => ({ default: m.Goals2025Dashboard }))
);
const PersonalProgressDashboard = lazy(() =>
  import('@/modules/exploration/PersonalProgressDashboard').then((m) => ({ default: m.PersonalProgressDashboard }))
);
const WeeklyActionPlanModal = lazy(() =>
  import('@/modules/action/WeeklyActionPlanModal').then((m) => ({ default: m.WeeklyActionPlanModal }))
);
const MonthlyReadingPlanModal = lazy(() =>
  import('@/modules/action/MonthlyReadingPlanModal').then((m) => ({ default: m.MonthlyReadingPlanModal }))
);
const AwarenessGrowthDashboard = lazy(() =>
  import("../AwarenessGrowthDashboard").then((m) => ({ default: m.AwarenessGrowthDashboard }))
);
const CommunityImpactDashboard = lazy(() =>
  import('@/modules/growth/CommunityImpactDashboard').then((m) => ({ default: m.CommunityImpactDashboard }))
);
const RelationshipAnalysisModal = lazy(() =>
  import('@/modules/exploration/RelationshipAnalysisModal').then((m) => ({ default: m.RelationshipAnalysisModal }))
);
const CircleGrowthDashboard = lazy(() =>
  import("../CircleGrowthDashboard").then((m) => ({ default: m.CircleGrowthDashboard }))
);
const RecoveryPathwaysModal = lazy(() => import('@/modules/growth/RecoveryPathwaysModal').then(m => ({ default: m.RecoveryPathwaysModal })));
const PrivateCircleInvitationModal = lazy(() => import('@/modules/meta/PrivateCircleInvitationModal').then(m => ({ default: m.PrivateCircleInvitationModal })));
const DuoCommunityDashboard = lazy(() => import('@/modules/growth/DuoCommunityDashboard').then(m => ({ default: m.DuoCommunityDashboard })));
const PastSessionsLogModal = lazy(() => import("../PastSessionsLogModal").then(m => ({ default: m.PastSessionsLogModal })));
const RewardStoreModal = lazy(() => import('@/modules/growth/RewardStoreDashboard').then(m => ({ default: m.RewardStoreModal })));
const GamificationNudgeToast = lazy(() => import('@/modules/growth/GamificationNudgeToast').then(m => ({ default: m.GamificationNudgeToast })));
const SymptomsOverviewModal = lazy(() =>
  import('@/modules/action/SymptomsOverviewModal').then((m) => ({ default: m.SymptomsOverviewModal }))
);
const ThemeSettings = lazy(() => import("../ThemeSettings").then((m) => ({ default: m.ThemeSettings })));
const Achievements = lazy(() => import('@/modules/growth/Achievements').then((m) => ({ default: m.Achievements })));
const RecoveryPlanModal = lazy(() =>
  import('@/modules/action/RecoveryPlanModal').then((m) => ({ default: m.RecoveryPlanModal }))
);
const PremiumBridgeModal = lazy(() =>
  import("../PremiumBridgeModal").then((m) => ({ default: m.PremiumBridgeModal }))
);
const AdvancedToolsModal = lazy(() =>
  import('@/modules/action/AdvancedToolsModal').then((m) => ({ default: m.AdvancedToolsModal }))
);
const ClassicRecoveryModal = lazy(() =>
  import('@/modules/action/ClassicRecoveryModal').then((m) => ({ default: m.ClassicRecoveryModal }))
);
const ManualPlacementModal = lazy(() =>
  import('@/modules/action/ManualPlacementModal').then((m) => ({ default: m.ManualPlacementModal }))
);
const FeedbackModal = lazy(() => import("../FeedbackModal").then((m) => ({ default: m.FeedbackModal })));
const AmbientRealityMode = lazy(() => import('@/modules/exploration/AmbientRealityMode').then((m) => ({ default: m.AmbientRealityMode })));
const TimeCapsuleVault = lazy(() => import('@/modules/action/TimeCapsuleVault').then((m) => ({ default: m.TimeCapsuleVault })));
const OnboardingFlow = lazy(() => import("../OnboardingFlow").then((m) => ({ default: m.OnboardingFlow })));
const JourneyToast = lazy(() => import('@/modules/action/JourneyToast').then((m) => ({ default: m.JourneyToast })));
const BlindCapsuleOpener = lazy(() => import('@/modules/action/BlindCapsuleOpener').then((m) => ({ default: m.BlindCapsuleOpener })));
const WisdomMatrixHub = lazy(() => import('@/modules/growth/WisdomMatrixHub').then(m => ({ default: m.WisdomMatrixHub })));
const ImmersionPathDetails = lazy(() => import('@/modules/growth/ImmersionPathDetails').then(m => ({ default: m.ImmersionPathDetails })));
const TajmeedHub = lazy(() => import('@/modules/gamification/EvolutionHub').then(m => ({ default: m.TajmeedHub })));
const VanguardCollective = lazy(() => import('@/modules/growth/VanguardCollective').then(m => ({ default: m.VanguardCollective })));
const ChronicleOverlay = lazy(() => import('@/modules/gamification/ChronicleOverlay').then(m => ({ default: m.ChronicleOverlay })));
const SanctuaryLockdownExperience = lazy(() => import('@/modules/action/SanctuaryLockdownExperience').then(m => ({ default: m.SanctuaryLockdownExperience })));

interface AppOverlayHostProps {
  canShowAIChatbot: boolean;
  agentContext: AgentContext;
  agentActions?: AgentActions;
  agentSystemPrompt?: string;
  onFeedbackSubmit: (payload: FeedbackSubmission) => Promise<void> | void;
  onOnboardingComplete?: (skipped?: boolean) => void;
}

type VisibleOverlayId = AppOverlayFlag | "emergency" | "pulseCheck";
type MindSignalOverlay = "nudgeToast" | "mirrorOverlay" | "journeyGuideChat" | "evolutionHub";

export const AppOverlayHost = memo(function AppOverlayHost({
  canShowAIChatbot,
  agentContext,
  agentActions,
  agentSystemPrompt,
  onFeedbackSubmit,
  onOnboardingComplete: externalOnboardingComplete
}: AppOverlayHostProps) {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const flags = useAppOverlayState((state) => state.flags);
  const circleGrowthOpen = useAppOverlayState((state) => state.flags.circleGrowth);
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
  const gamification = useGamification();
  const gamificationSignals = useGamificationSignals();
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const role = useAuthState(getEffectiveRoleFromState);
  const rawRole = useAuthState((s) => s.role);
  const tier = useAuthState((s) => s.tier);
  const isOwner = isPrivilegedRole(rawRole) || isPrivilegedRole(role) || adminAccess;

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
  const journey = useJourneyProgress();
  const goalId = journey.goalId;
  const storedMirrorName = journey.mirrorName;
  const setLastGoal = journey.setLastGoal;

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
    insightsLibrary: showInsightsLibrary,
    goals2025: showGoals2025,
    personalProgress: showPersonalProgress,
    weeklyActionPlan: showWeeklyActionPlan,
    readingPlan: showReadingPlan,
    awarenessGrowth: showAwarenessGrowth,
    communityImpact: showCommunityImpact,
    relationshipAnalysis: showRelationshipAnalysis,
    circleGrowth: showCircleGrowth,
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
    premiumBridge: showPremiumBridge,
    recoveryPathways: showRecoveryPathways,
    privateCircleInvitation: showPrivateCircleInvitation,
    duoCommunity: showDuoCommunity,
    pastSessionsLog: showPastSessionsLog,
    rewardStore: showRewardStore,
    evolutionHub: showEvolutionHub,
    wisdomMatrix: showWisdomMatrix,
    immersionPath: showImmersionPath,
    vanguardCollective: showVanguardCollective,
    sovereignChronicle: showSovereignChronicle,
  } = flags;

  // Debug: Track EvolutionHub overlay state
  useEffect(() => {
    console.log("[AppOverlayHost] showEvolutionHub changed:", showEvolutionHub);
  }, [showEvolutionHub]);

  // Implementation of Layer 3 (Execution): Overlay Mutex & Severity Index
  // Auto-trigger pulse check logic
  usePulseCheckLogic(canUsePulseCheck, screen, true);
  const activeFlags = (Object.keys(flags) as AppOverlayFlag[]).filter((f) => flags[f]);
  const activeOverlayItems: Array<{ id: VisibleOverlayId; severity: number }> = activeFlags.map((f) => ({
    id: f,
    severity: (OVERLAY_SEVERITY && OVERLAY_SEVERITY[f]) !== undefined ? OVERLAY_SEVERITY[f] : 0
  }));

  if (isEmergencyOpen && OVERLAY_SEVERITY?.emergency !== undefined) {
    activeOverlayItems.push({ id: "emergency", severity: OVERLAY_SEVERITY.emergency });
  }

  // Also include Pulse Check if it's open (it has its own state)
  if (pulseCheckState.isOpen && OVERLAY_SEVERITY?.pulseCheck !== undefined) {
    activeOverlayItems.push({ id: "pulseCheck", severity: OVERLAY_SEVERITY.pulseCheck });
  }

  activeOverlayItems.sort((a, b) => (b.severity || 0) - (a.severity || 0));
  const topOverlayId = activeOverlayItems[0]?.id;
  const isLockedByCritical = ((activeOverlayItems[0]?.severity ?? 0) >= (CRITICAL_SEVERITY_THRESHOLD ?? 9));

  const isLivePage = useMemo(() => {
    if (!hasHydrated) return false;
    return typeof window !== "undefined" && window.location.pathname.includes("dawayir-live");
  }, [hasHydrated]);

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

  const closeOverlay = useCallback((id: AppOverlayFlag) => {
    setOverlay(id, false);
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

  // Unified Scroll Lock Strategy
  useScrollLock(!!topOverlayId);

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
    currentScreen: screen,
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
    skipNextPulseCheck,
    completeDailyQuest: gamification.completeDailyQuest
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
    openShareStats: () => setOverlay("shareStats", true),
    openChronicle: () => setOverlay("sovereignChronicle", true)
  });

  const onOnboardingComplete = useCallback((skipped: boolean = false) => {
    if (externalOnboardingComplete) {
      externalOnboardingComplete(skipped);
    } else {
      setOverlay("onboarding", false);
      if (!goalId) {
        setLastGoal("unknown", "general");
      }
      setScreen("map");
    }
  }, [externalOnboardingComplete, goalId, setLastGoal, setOverlay, setScreen]);

  const onJourneyTimelineCardClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setOverlay("journeyTimeline", false);
  }, [setSelectedNodeId, setOverlay]);

  const onNavigateToMap = useCallback(() => {
    setScreen("map");
  }, [setScreen]);

  const showConsentBanner = !isUserMode && !runtimeEnv.isDemoMode;

  if (!hasHydrated) {
    return null;
  }

  return (
    <>
      {flags.sanctuary && isVisible("sanctuary") && (
        <div 
          className="fixed inset-0 pointer-events-none" 
          style={{ zIndex: Z_LAYERS.TACTICAL_BACKDROP }}
        >
          <SanctuaryLockdownExperience 
            onExit={() => setOverlay("sanctuary", false)} 
          />
        </div>
      )}

      {screen === "map" ? (
        <JourneyTimeline
          isOpen={showJourneyTimeline}
          onClose={() => setOverlay("journeyTimeline", false)}
          onCardClick={onJourneyTimelineCardClick}
        />
      ) : null}

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

        {showConsciousnessArchive && isVisible("consciousnessArchive") && (
          <ConsciousnessArchiveModal
            isOpen={true}
            onClose={() => setOverlay("consciousnessArchive", false)}
          />
        )}

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

        {flags.blindCapsuleOpener && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <BlindCapsuleOpener />
          </Suspense>
        )}

        {postAuthIntent && isVisible("authModal") && (
          <GoogleAuthModal
            isOpen={showAuthModal}
            intent={postAuthIntent}
            onClose={() => {
              setOverlay("authModal", false);
              setAuthIntent(null);
            }}
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

        {showInsightsLibrary && isVisible("insightsLibrary") && (
          <InsightsLibrary isOpen={showInsightsLibrary} onClose={() => setOverlay("insightsLibrary", false)} />
        )}

        {showGoals2025 && isVisible("goals2025") && (
          <Goals2025Dashboard isOpen={showGoals2025} onClose={() => setOverlay("goals2025", false)} />
        )}

        {showPersonalProgress && isVisible("personalProgress") && (
          <PersonalProgressDashboard isOpen={showPersonalProgress} onClose={() => setOverlay("personalProgress", false)} />
        )}

        {showWeeklyActionPlan && isVisible("weeklyActionPlan") && (
          <WeeklyActionPlanModal isOpen={showWeeklyActionPlan} onClose={() => setOverlay("weeklyActionPlan", false)} />
        )}

        {showReadingPlan && isVisible("readingPlan") && (
          <MonthlyReadingPlanModal isOpen={showReadingPlan} onClose={() => setOverlay("readingPlan", false)} />
        )}

        {showAwarenessGrowth && isVisible("awarenessGrowth") && (
          <AwarenessGrowthDashboard isOpen={showAwarenessGrowth} onClose={() => setOverlay("awarenessGrowth", false)} />
        )}

        {showCommunityImpact && isVisible("communityImpact") && (
          <CommunityImpactDashboard isOpen={showCommunityImpact} onClose={() => setOverlay("communityImpact", false)} />
        )}

        {showRelationshipAnalysis && isVisible("relationshipAnalysis") && (
          <RelationshipAnalysisModal isOpen={showRelationshipAnalysis} onClose={() => setOverlay("relationshipAnalysis", false)} />
        )}

        {showCircleGrowth && isVisible("circleGrowth") && (
          <CircleGrowthDashboard 
            isOpen={circleGrowthOpen}
            onClose={() => closeOverlay("circleGrowth")}
          />
        )}
        
        {showRecoveryPathways && isVisible("recoveryPathways") && (
          <RecoveryPathwaysModal 
            isOpen={showRecoveryPathways}
            onClose={() => closeOverlay("recoveryPathways")}
          />
        )}

        {showPrivateCircleInvitation && isVisible("privateCircleInvitation") && (
          <PrivateCircleInvitationModal 
            isOpen={showPrivateCircleInvitation}
            onClose={() => closeOverlay("privateCircleInvitation")}
          />
        )}

        {showDuoCommunity && isVisible("duoCommunity") && (
          <DuoCommunityDashboard 
            isOpen={showDuoCommunity}
            onClose={() => closeOverlay("duoCommunity")}
          />
        )}

        {showWisdomMatrix && isVisible("wisdomMatrix") && (
          <WisdomMatrixHub />
        )}

        {showImmersionPath && isVisible("immersionPath") && (
          <ImmersionPathDetails />
        )}

        {showVanguardCollective && isVisible("vanguardCollective") && (
          <VanguardCollective />
        )}

        {showPastSessionsLog && isVisible("pastSessionsLog") && (
          <PastSessionsLogModal 
            isOpen={showPastSessionsLog}
            onClose={() => closeOverlay("pastSessionsLog")}
          />
        )}

        {showRewardStore && isVisible("rewardStore") && (
          <RewardStoreModal 
            isOpen={showRewardStore}
            onClose={() => closeOverlay("rewardStore")}
          />
        )}

        {showEvolutionHub && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(12px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) closeOverlay("evolutionHub"); }}
          >
            <TajmeedHub 
              onClose={() => closeOverlay("evolutionHub")}
            />
          </div>
        )}

        {showSovereignChronicle && isVisible("sovereignChronicle") && (
          <ChronicleOverlay />
        )}

        {showSymptomsOverview && isVisible("symptomsOverview") && (
          <SymptomsOverviewModal
            isOpen={showSymptomsOverview}
            onClose={() => closeOverlay("symptomsOverview")}
          />
        )}
        
        {showNudgeToast && activeNudge && isVisible("nudgeToast") && (
          <Suspense fallback={null}>
            <GamificationNudgeToast />
          </Suspense>
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

        {showOnboarding && isVisible("onboarding") && <OnboardingFlow onComplete={onOnboardingComplete} initialMirrorName={storedMirrorName} />}

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
