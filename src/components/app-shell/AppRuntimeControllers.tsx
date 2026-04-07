import { useEffect, useRef } from "react";
import { hasCompletedJourneyOnboarding } from "../OnboardingFlow";
import { initThemePalette } from "../../services/themePalette";
import { useAchievementState, getLibraryOpenedAt, getBreathingUsedAt } from "../../state/achievementState";
import { useMapState } from "../../state/mapState";
import { useJourneyState } from "../../state/journeyState";
import {
  fetchPublicBroadcasts,
  doesBroadcastMatchAudience,
  isAppInstalledMode,
  type PublicBroadcast
} from "../../services/broadcasts";
import { useNotificationState } from "../../state/notificationState";
import { sendNotification } from "../../services/notifications";
import { getFromLocalStorage, setInLocalStorage } from "../../services/browserStorage";
import { useAuthState } from "../../state/authState";
import { runtimeEnv } from "../../config/runtimeEnv";
import { requestIdleCallback, cancelIdleCallback } from "../../utils/performanceOptimizations";
import { startAutonomousStartupJobs } from "../../app/orchestration/startupJobs";
import { isUserMode } from "../../config/appEnv";
import { initAppContentRealtime } from "../../state/appContentState";
import { fetchAdminConfig, fetchOwnerAlerts } from "../../services/adminApi";
import { useAdminState } from "../../state/adminState";
import { usePulseState } from "../../state/pulseState";
import { useAppOverlayState } from "../../state/appOverlayState";
import { syncGamificationOnLoad } from "../../services/gamificationSync";
import { syncSubscription } from "../../services/subscriptionManager";
import { useGamificationState } from "../../state/gamificationState";
import { useToastState } from "../../state/toastState";
import { captureUtmFromCurrentUrl, captureLeadAttributionFromCurrentUrl } from "../../services/marketingAttribution";
import type { AppShellScreen } from "../../state/appShellNavigationState";

type AgentModule = typeof import("../../agent");

const LAST_SEEN_BROADCAST_KEY = "dawayir-last-seen-broadcast-id";
const OWNER_ALERTS_LAST_CHECK_KEY = "dawayir-owner-alerts-last-check";
const OWNER_ALERTS_MILESTONES_KEY = "dawayir-owner-alerts-milestones";
const hasSupabaseEnv = Boolean(runtimeEnv.supabaseUrl && runtimeEnv.supabaseAnonKey);

type OwnerMilestonesState = {
  registeredReached: boolean;
  installedReached: boolean;
  addedReached: boolean;
  fullyCompleted: boolean;
};

function loadOwnerMilestonesState(): OwnerMilestonesState {
  if (typeof window === "undefined") {
    return { registeredReached: false, installedReached: false, addedReached: false, fullyCompleted: false };
  }
  try {
    const raw = getFromLocalStorage(OWNER_ALERTS_MILESTONES_KEY);
    if (!raw) return { registeredReached: false, installedReached: false, addedReached: false, fullyCompleted: false };
    const parsed = JSON.parse(raw) as Partial<OwnerMilestonesState>;
    return {
      registeredReached: Boolean(parsed.registeredReached),
      installedReached: Boolean(parsed.installedReached),
      addedReached: Boolean(parsed.addedReached),
      fullyCompleted: Boolean(parsed.fullyCompleted)
    };
  } catch {
    return { registeredReached: false, installedReached: false, addedReached: false, fullyCompleted: false };
  }
}

function saveOwnerMilestonesState(value: OwnerMilestonesState): void {
  setInLocalStorage(OWNER_ALERTS_MILESTONES_KEY, JSON.stringify(value));
}

interface AppRuntimeControllersProps {
  screen: AppShellScreen;
  isAdminRoute: boolean;
  canPollOwnerAlerts: boolean;
  canShowAIChatbot: boolean;
  onAgentModuleLoaded: (module: AgentModule) => void;
  onBroadcast: (broadcast: PublicBroadcast) => void;
}

export function AppRuntimeControllers({
  screen,
  isAdminRoute,
  canPollOwnerAlerts,
  canShowAIChatbot,
  onAgentModuleLoaded,
  onBroadcast
}: AppRuntimeControllersProps) {
  const checkAndUnlock = useAchievementState((state) => state.checkAndUnlock);
  const openAchievementsRequest = useAchievementState((state) => state.openAchievementsRequest);
  const clearOpenAchievementsRequest = useAchievementState((state) => state.clearOpenAchievementsRequest);

  const baselineCompletedAt = useJourneyState((state) => state.baselineCompletedAt);
  const recordUserActivity = useNotificationState((state) => state.recordUserActivity);
  const notificationSettings = useNotificationState((state) => state.settings);
  const notificationPermission = useNotificationState((state) => state.permission);
  const notificationSupported = useNotificationState((state) => state.isSupported);
  const authUser = useAuthState((state) => state.user);
  const openOverlay = useAppOverlayState((state) => state.openOverlay);

  // P0: Capture UTM + lead attribution from URL on very first render
  // This ensures users arriving from ad campaigns are tracked before any navigation
  const utmCapturedRef = useRef(false);
  useEffect(() => {
    if (utmCapturedRef.current || typeof window === "undefined") return;
    utmCapturedRef.current = true;
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();
  }, []);

  useEffect(() => {
    void initThemePalette();
    if (isUserMode || typeof window === "undefined") return;

    const idleHandle = requestIdleCallback(() => {
      startAutonomousStartupJobs({ enabled: true });
    }, { timeout: 2500 });

    return () => {
      cancelIdleCallback(idleHandle);
    };
  }, []);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (!canShowAIChatbot) return;
    if (screen === "landing") return;

    let cancelled = false;
    const idleHandle = requestIdleCallback(() => {
      import("../../agent")
        .then((mod) => {
          if (!cancelled) onAgentModuleLoaded(mod);
        })
        .catch(() => {
          // keep chatbot available in fallback mode
        });
    }, { timeout: 1500 });

    return () => {
      cancelled = true;
      cancelIdleCallback(idleHandle);
    };
  }, [canShowAIChatbot, onAgentModuleLoaded, screen]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (screen !== "map") return;

    const nodes = useMapState.getState().nodes;
    checkAndUnlock({
      nodes,
      baselineCompletedAt: baselineCompletedAt ?? null,
      libraryOpenedAt: getLibraryOpenedAt(),
      breathingUsedAt: getBreathingUsedAt()
    });
  }, [baselineCompletedAt, checkAndUnlock, screen]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (!openAchievementsRequest) return;
    openOverlay("achievements");
    clearOpenAchievementsRequest();
  }, [clearOpenAchievementsRequest, openAchievementsRequest, openOverlay]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (screen !== "landing") {
      recordUserActivity();
    }
  }, [recordUserActivity, screen]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (typeof window === "undefined" || isAdminRoute) return;
    let cancelled = false;
    let initialTimer: ReturnType<typeof setTimeout> | null = null;

    const checkBroadcasts = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const list = await fetchPublicBroadcasts();
      if (cancelled || !list || list.length === 0) return;

      const candidate = list.find((item) =>
        doesBroadcastMatchAudience(item.audience, {
          isLoggedIn: Boolean(authUser),
          isInstalled: isAppInstalledMode()
        })
      );
      if (!candidate) return;

      const seenId = getFromLocalStorage(LAST_SEEN_BROADCAST_KEY);
      if (seenId === candidate.id) return;

      setInLocalStorage(LAST_SEEN_BROADCAST_KEY, candidate.id);
      onBroadcast(candidate);

      if (notificationSupported && notificationPermission === "granted" && notificationSettings.enabled) {
        void sendNotification({
          title: candidate.title,
          body: candidate.body,
          tag: `broadcast-${candidate.id}`
        });
      }
    };

    initialTimer = setTimeout(() => {
      void checkBroadcasts();
    }, 4_000);

    const timer = setInterval(() => {
      void checkBroadcasts();
    }, 5 * 60_000);

    return () => {
      cancelled = true;
      if (initialTimer) clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [
    authUser,
    isAdminRoute,
    notificationPermission,
    notificationSettings.enabled,
    notificationSupported,
    onBroadcast
  ]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (screen === "landing") return;

    let stop: (() => void) | null = null;
    const idleHandle = requestIdleCallback(() => {
      stop = initAppContentRealtime();
    }, { timeout: 2500 });

    return () => {
      cancelIdleCallback(idleHandle);
      stop?.();
    };
  }, [screen]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (!hasSupabaseEnv) return;
    if (screen === "landing") return;

    let cancelled = false;
    const idleHandle = requestIdleCallback(() => {
      fetchAdminConfig()
        .then((config) => {
          if (!config || cancelled) return;

          const adminState = useAdminState.getState();
          const pulseState = usePulseState.getState();

          if (config.featureFlags) adminState.setFeatureFlags(config.featureFlags);
          if (config.systemPrompt) adminState.setSystemPrompt(config.systemPrompt);
          if (config.scoringWeights) adminState.setScoringWeights(config.scoringWeights);
          if (config.scoringThresholds) adminState.setScoringThresholds(config.scoringThresholds);
          if (config.pulseCheckMode) pulseState.setCheckInMode(config.pulseCheckMode);
        })
        .catch(() => {
          // ignore remote errors, fallback to local
        });
    }, { timeout: 2000 });

    return () => {
      cancelled = true;
      cancelIdleCallback(idleHandle);
    };
  }, [screen]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (screen === "landing" || screen === "enterprise") return;
    if (hasCompletedJourneyOnboarding()) return;
    openOverlay("onboarding");
  }, [openOverlay, screen]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (typeof window === "undefined") return;
    if (!canPollOwnerAlerts) return;
    let cancelled = false;

    const sendOwnerNotification = async (title: string, body: string, tag: string) => {
      if (!notificationSupported || notificationPermission !== "granted" || !notificationSettings.enabled) return;
      await sendNotification({ title, body, tag });
    };

    const pollOwnerAlerts = async () => {
      const since = getFromLocalStorage(OWNER_ALERTS_LAST_CHECK_KEY) ?? new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const alerts = await fetchOwnerAlerts({ since, phaseTarget: 10 });
      if (!alerts || cancelled) return;

      const notificationPromises: Promise<void>[] = [];

      for (const sessionId of alerts.newVisitors.sessionIds) {
        notificationPromises.push(
          sendOwnerNotification(
            "زائر جديد دخل المنصة",
            `Session: ${sessionId.slice(0, 14)}…`,
            `owner-visitor-${sessionId}`
          )
        );
      }

      for (const sessionId of alerts.logins.sessionIds) {
        notificationPromises.push(
          sendOwnerNotification(
            "زائر أكمل تسجيل الدخول",
            `Session: ${sessionId.slice(0, 14)}…`,
            `owner-login-${sessionId}`
          )
        );
      }

      for (const sessionId of alerts.installs.sessionIds) {
        notificationPromises.push(
          sendOwnerNotification(
            "زائر ثبّت التطبيق",
            `Session: ${sessionId.slice(0, 14)}…`,
            `owner-install-${sessionId}`
          )
        );
      }

      await Promise.all(notificationPromises);

      const prevMilestones = loadOwnerMilestonesState();
      const nextMilestones: OwnerMilestonesState = {
        registeredReached: alerts.phaseOne.registeredReached,
        installedReached: alerts.phaseOne.installedReached,
        addedReached: alerts.phaseOne.addedReached,
        fullyCompleted: alerts.phaseOne.fullyCompleted
      };

      if (!prevMilestones.registeredReached && nextMilestones.registeredReached) {
        await sendOwnerNotification(
          "تحقق الهدف: 10 تسجيلات",
          `تم الوصول إلى ${alerts.phaseOne.registeredUsers} مستخدمين مسجلين.`,
          "owner-goal-registered"
        );
      }
      if (!prevMilestones.installedReached && nextMilestones.installedReached) {
        await sendOwnerNotification(
          "تحقق الهدف: 10 تثبيتات",
          `تم الوصول إلى ${alerts.phaseOne.installedUsers} مستخدمين ثبّتوا التطبيق.`,
          "owner-goal-installed"
        );
      }
      if (!prevMilestones.addedReached && nextMilestones.addedReached) {
        await sendOwnerNotification(
          "تحقق الهدف: 10 أشخاص مضافين",
          `تم الوصول إلى ${alerts.phaseOne.addedPeople} أشخاص مضافين على الخرائط.`,
          "owner-goal-added"
        );
      }
      if (!prevMilestones.fullyCompleted && nextMilestones.fullyCompleted) {
        await sendOwnerNotification(
          "اكتمل هدف المرحلة الأولى",
          "10 تسجيلات + 10 تثبيتات + 10 أشخاص مضافين تحققوا بالكامل.",
          "owner-goal-phase-one-complete"
        );
      }

      saveOwnerMilestonesState(nextMilestones);
      setInLocalStorage(OWNER_ALERTS_LAST_CHECK_KEY, alerts.generatedAt || new Date().toISOString());
    };

    void pollOwnerAlerts();
    const timer = setInterval(() => {
      void pollOwnerAlerts();
    }, 45_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    canPollOwnerAlerts,
    notificationPermission,
    notificationSettings.enabled,
    notificationSupported
  ]);

  useEffect(() => {
    if (runtimeEnv.isDev) return;
    if (!authUser) return;

    // Fast local-only operation — run immediately
    const { xpLost, streakMaintained } = useGamificationState.getState().recordActivity();
    if (xpLost > 0) {
      useToastState.getState().showToast(
        `فقدت ${xpLost} XP بسبب انقطاعك عن تسجيل الدخول. العزم يتجدد كل يوم!`,
        "error"
      );
    } else if (streakMaintained) {
      const currentStreak = useGamificationState.getState().streak;
      if (currentStreak > 1) {
        useToastState.getState().showToast(
          `أبقيت على شعلة الوعي! سلسلة الحضور: ${currentStreak} يوم 🔥`,
          "success"
        );
      }
    }

    // Defer network calls to idle time — prevents blocking main thread at mount
    const idleHandle = requestIdleCallback(() => {
      void syncGamificationOnLoad();
      void syncSubscription();
    }, { timeout: 2000 });

    return () => {
      cancelIdleCallback(idleHandle);
    };
  }, [authUser]);

  return null;
}
