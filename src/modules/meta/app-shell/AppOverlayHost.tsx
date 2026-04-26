import { memo, Suspense, useCallback, useMemo, useState, useEffect } from "react";
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
import { OVERLAY_SEVERITY, CRITICAL_SEVERITY_THRESHOLD } from "@/utils/overlayPriorities";
import type { AppOverlayFlag } from "@/domains/consciousness/store/overlay.store";
import { useScrollLock } from "@/hooks/useScrollLock";
import { AnalyticsConsentBanner } from "../AnalyticsConsentBanner";

// Overlay Buckets (Optimized Chunks)
import { CoreExperienceOverlays } from "./overlays/CoreExperienceOverlays";
import { GrowthOverlays } from "./overlays/GrowthOverlays";
import { SocialOverlays } from "./overlays/SocialOverlays";
import { SystemOverlays } from "./overlays/SystemOverlays";
import { AmbientOverlays } from "./overlays/AmbientOverlays";

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
  const setOverlay = useAppOverlayState((state) => state.setOverlay);
  const pulseCheckState = useAppOverlayState((state) => state.pulseCheck);
  const setPulseCheck = useAppOverlayState((state) => state.setPulseCheck);
  const setAuthIntent = useAppOverlayState((state) => state.setAuthIntent);

  const screen = useAppShellNavigationState((s) => s.screen);
  const setScreen = useAppShellNavigationState((s) => s.setScreen);
  const setSelectedNodeId = useAppShellNavigationState((s) => s.setSelectedNodeId);

  const isEmergencyOpen = useEmergencyState((s) => s.isOpen);
  const closeEmergency = useEmergencyState((s) => s.close);

  const achievementToastVisible = useAchievementState((s) => !!s.lastNewAchievementId);
  const theme = useThemeState((s) => s.theme);
  const setTheme = useThemeState((s) => s.setTheme);

  const logPulse = usePulseState((s) => s.logPulse);
  const snoozeNotifications = usePulseState((s) => s.snoozeNotifications);
  const skipNextPulseCheck = usePulseState((s) => s.clearSnooze);

  const featureFlags = useAdminState((s) => s.featureFlags);
  const gamification = useGamification();
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const role = useAuthState(getEffectiveRoleFromState);
  const authUser = useAuthState((s) => s.user);

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

  // Implementation of Layer 3 (Execution): Overlay Mutex & Severity Index
  usePulseCheckLogic(canUsePulseCheck, screen, true);
  
  const activeOverlayItems = useMemo(() => {
    const activeFlags = (Object.keys(flags) as AppOverlayFlag[]).filter((f) => flags[f]);
    const items: Array<{ id: VisibleOverlayId; severity: number }> = activeFlags.map((f) => ({
      id: f,
      severity: (OVERLAY_SEVERITY && OVERLAY_SEVERITY[f]) !== undefined ? OVERLAY_SEVERITY[f] : 0
    }));

    if (isEmergencyOpen && OVERLAY_SEVERITY?.emergency !== undefined) {
      items.push({ id: "emergency", severity: OVERLAY_SEVERITY.emergency });
    }

    if (pulseCheckState.isOpen && OVERLAY_SEVERITY?.pulseCheck !== undefined) {
      items.push({ id: "pulseCheck", severity: OVERLAY_SEVERITY.pulseCheck });
    }

    return items.sort((a, b) => (b.severity || 0) - (a.severity || 0));
  }, [flags, isEmergencyOpen, pulseCheckState.isOpen]);

  const topOverlayId = activeOverlayItems[0]?.id;
  const isLockedByCritical = ((activeOverlayItems[0]?.severity ?? 0) >= (CRITICAL_SEVERITY_THRESHOLD ?? 9));

  const isLivePage = useMemo(() => {
    if (!hasHydrated) return false;
    return typeof window !== "undefined" && window.location.pathname.includes("dawayir-live");
  }, [hasHydrated]);

  const isVisible = useCallback((id: string) => {
    if (!topOverlayId) return false;
    if (isLivePage && id !== "emergency") return false;
    if (isLockedByCritical) return topOverlayId === id;
    return topOverlayId === id;
  }, [topOverlayId, isLivePage, isLockedByCritical]);

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
    clearPulseCheckPreview: () => undefined,
    showBreathing: flags.breathing,
    setShowBreathing: (val) => setOverlay("breathing", val),
    setShowCocoon: (val) => setOverlay("cocoon", val),
    theme,
    setTheme: setTheme,
    authUserId: authUser?.id,
    shouldPromptAuthAfterPulse: false,
    logPulse,
    capturePulseReflection: () => undefined,
    snoozeNotifications,
    openOverlay: (id) => setOverlay(id, true),
    closeOverlay: (id) => setOverlay(id, false),
    navigateToScreen: (s) => { setScreen(s); return true; },
    openDefaultGoalMap: () => setScreen("map"),
    openDawayirSetup: () => setScreen("map"),
    goToGoals: () => setScreen("tools"),
    setStartRecoveryIntent: (p) => setPulseCheck(pulseCheckState.isOpen, pulseCheckState.context, p),
    setLoginIntent: () => setAuthIntent({ kind: "login", createdAt: Date.now() }),
    setShowAuthModal: (val) => setOverlay("authModal", val),
    clearPostAuthState: () => setAuthIntent(null),
    showNoiseSessionToast: () => undefined,
    showBreathingSessionToast: () => undefined,
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
    showBreathing: flags.breathing,
    showCocoon: flags.cocoon,
    activeFlows: flags.onboarding || flags.breathing || flags.cocoon || flags.noiseSilencingPulse || pulseCheckState.isOpen,
    openOverlay: (overlay) => setOverlay(overlay, true),
    closeOverlay: (overlay) => setOverlay(overlay, false),
    openCocoonModal,
    openPulseCheck: () => setPulseCheck(true, "regular"),
    openShareStats: () => setOverlay("shareStats", true),
    openChronicle: () => setOverlay("sovereignChronicle", true)
  });

  const onOnboardingComplete = useCallback((skipped: boolean = false) => {
    if (externalOnboardingComplete) {
      externalOnboardingComplete(skipped);
    } else {
      setOverlay("onboarding", false);
      if (!goalId) setLastGoal("unknown", "general");
      setScreen("map");
    }
  }, [externalOnboardingComplete, goalId, setLastGoal, setOverlay, setScreen]);

  const onJourneyTimelineCardClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setOverlay("journeyTimeline", false);
  }, [setSelectedNodeId, setOverlay]);

  useScrollLock(!!topOverlayId);

  if (!hasHydrated) return null;

  return (
    <>
      {screen === "map" && (
        <JourneyTimeline
          isOpen={flags.journeyTimeline}
          onClose={() => setOverlay("journeyTimeline", false)}
          onCardClick={onJourneyTimelineCardClick}
        />
      )}

      <CoreExperienceOverlays 
        isVisible={isVisible}
        canShowAIChatbot={canShowAIChatbot}
        agentContext={agentContext}
        agentActions={agentActions}
        agentSystemPrompt={agentSystemPrompt}
        onNavigateToMap={() => setScreen("map")}
        onOnboardingComplete={onOnboardingComplete}
        storedMirrorName={storedMirrorName ?? undefined}
        isEmergencyOpen={isEmergencyOpen}
        closeEmergency={closeEmergency}
        setSelectedNodeId={setSelectedNodeId}
        handlePulseOverlaySubmit={handlePulseOverlaySubmit}
        handlePulseOverlayClose={handlePulseOverlayClose}
        handleCocoonStart={handleCocoonStart}
        handleCocoonSkip={handleCocoonSkip}
        handleCocoonClose={handleCocoonClose}
        handleNoiseSessionComplete={handleNoiseSessionComplete}
        handleBreathingOverlayClose={handleBreathingOverlayClose}
        activeNudge={activeNudge}
        handleNudgeToastClose={handleNudgeToastClose}
        handleNudgeCtaAction={handleNudgeCtaAction}
      />

      <GrowthOverlays 
        isVisible={isVisible} 
        achievementToastVisible={achievementToastVisible}
      />

      <SocialOverlays isVisible={isVisible} />

      <SystemOverlays 
        isVisible={isVisible} 
        onFeedbackSubmit={onFeedbackSubmit} 
      />

      <AmbientOverlays 
        isVisible={isVisible} 
        activeNudge={activeNudge}
        activeMirrorInsight={activeMirrorInsight}
        handleNudgeToastClose={handleNudgeToastClose}
        handleNudgeCtaAction={handleNudgeCtaAction}
        handleMirrorResolve={handleMirrorResolve}
      />

      <AnalyticsConsentBanner suppressed={isUserMode || runtimeEnv.isDemoMode} />
    </>
  );
});
