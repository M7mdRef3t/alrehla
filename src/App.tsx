import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MessageCircle } from "lucide-react";
import { Landing } from "./components/Landing";
import { useNotificationState } from "./state/notificationState";
import { useEmergencyState } from "./state/emergencyState";
import { useMapState } from "./state/mapState";
import { useJourneyState } from "./state/journeyState";
import { useAchievementState, getLibraryOpenedAt, getBreathingUsedAt } from "./state/achievementState";
import { useThemeState } from "./state/themeState";
import { initThemePalette } from "./services/themePalette";
import { usePulseState } from "./state/pulseState";
import type { PulseFocus, PulseMood } from "./state/pulseState";
import { trackPageView, trackEvent, AnalyticsEvents } from "./services/analytics";
import { recordFlowEvent } from "./services/journeyTracking";
import { sendNotification, sendPresetNotification, NOTIFICATION_TYPES } from "./services/notifications";
import {
  fetchPublicBroadcasts,
  doesBroadcastMatchAudience,
  isAppInstalledMode,
  type PublicBroadcast
} from "./services/broadcasts";
import type { AdviceCategory } from "./data/adviceScripts";
import type { AgentActions, AgentContext } from "./agent/types";
import { getIncompleteMissionSteps } from "./utils/missionProgress";
import { getLastGoalMeta } from "./utils/goalLabel";
import { getWeeklyPulseInsight } from "./utils/pulseInsights";
import { useAdminState } from "./state/adminState";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "./utils/featureFlags";
import type { FeatureFlagKey } from "./config/features";
import { getEffectiveRoleFromState, useAuthState, type UserToneGender } from "./state/authState";
import { consciousnessService, type ConsciousnessInsight, type MemoryMatch } from "./services/consciousnessService";
import { initAppContentRealtime } from "./state/appContentState";
import { PWAInstallProvider } from "./contexts/PWAInstallContext";
import { GoogleAuthModal } from "./components/GoogleAuthModal";
import { OnboardingWelcomeBubble, type WelcomeSource } from "./components/OnboardingWelcomeBubble";
import { clearPostAuthIntent, getPostAuthIntent, type PostAuthIntent } from "./utils/postAuthIntent";
import { geminiClient } from "./services/geminiClient";
import { isSupabaseReady } from "./services/supabaseClient";
import { usePulseCheckLogic } from "./hooks/usePulseCheckLogic";
import { isPhaseOneUserFlow } from "./config/appEnv";

type Screen = "landing" | "goal" | "map" | "guided" | "mission" | "tools";

/** مسافة للمينيو — تاب صغير ظاهر (الشريط يظهر عند التحريك) */
const SIDEBAR_TAB_MARGIN = "2.5rem"; // w-10

const CoreMapScreen = lazy(() => import("./components/CoreMapScreen").then((m) => ({ default: m.CoreMapScreen })));
const GoalPicker = lazy(() => import("./components/GoalPicker").then((m) => ({ default: m.GoalPicker })));
const RelationshipGym = lazy(() => import("./components/RelationshipGym").then((m) => ({ default: m.RelationshipGym })));
const BaselineAssessment = lazy(() => import("./components/BaselineAssessment").then((m) => ({ default: m.BaselineAssessment })));
const PulseCheckModal = lazy(() => import("./components/PulseCheckModal").then((m) => ({ default: m.PulseCheckModal })));
const CocoonModeModal = lazy(() => import("./components/CocoonModeModal").then((m) => ({ default: m.CocoonModeModal })));
const NoiseSilencingModal = lazy(() =>
  import("./components/NoiseSilencingModal").then((m) => ({ default: m.NoiseSilencingModal }))
);
const BreathingOverlay = lazy(() => import("./components/BreathingOverlay").then((m) => ({ default: m.BreathingOverlay })));
const FeatureLockedModal = lazy(() =>
  import("./components/FeatureLockedModal").then((m) => ({ default: m.FeatureLockedModal }))
);
const AchievementToast = lazy(() =>
  import("./components/AchievementToast").then((m) => ({ default: m.AchievementToast }))
);
const AIChatbot = lazy(() => import("./components/AIChatbot").then((m) => ({ default: m.AIChatbot })));
const ConsciousnessArchiveModal = lazy(
  () => import("./components/ConsciousnessArchiveModal").then((m) => ({ default: m.ConsciousnessArchiveModal }))
);
const EmergencyOverlay = lazy(() => import("./components/EmergencyOverlay").then((m) => ({ default: m.EmergencyOverlay })));
const GuidedJourneyFlow = lazy(() => import("./components/GuidedJourneyFlow").then((m) => ({ default: m.GuidedJourneyFlow })));
const MissionScreen = lazy(() => import("./components/MissionScreen").then((m) => ({ default: m.MissionScreen })));
const JourneyToolsScreen = lazy(() => import("./components/JourneyToolsScreen").then((m) => ({ default: m.JourneyToolsScreen })));
const AppSidebar = lazy(() => import("./components/AppSidebar").then((m) => ({ default: m.AppSidebar })));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const DataManagement = lazy(() => import("./components/DataManagement").then((m) => ({ default: m.DataManagement })));

const preloadCoreMap = () => import("./components/CoreMapScreen");
const preloadChatbot = () => import("./components/AIChatbot");
const preloadGym = () => import("./components/RelationshipGym");
const hasSupabaseEnv = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
type AgentModule = typeof import("./agent");
const LAST_SEEN_BROADCAST_KEY = "dawayir-last-seen-broadcast-id";
const DEFAULT_WHATSAPP_CONTACT = "0201023050092";
const OWNER_ALERTS_LAST_CHECK_KEY = "dawayir-owner-alerts-last-check";
const OWNER_ALERTS_MILESTONES_KEY = "dawayir-owner-alerts-milestones";

function buildStartRecoveryWelcome(firstName: string | null, toneGender: UserToneGender): string {
  const prefix = firstName ? `أهلاً يا ${firstName}` : "أهلاً";
  if (toneGender === "female") return `${prefix}، هل أنتِ مستعدة لبدء الرحلة؟`;
  if (toneGender === "male") return `${prefix}، هل أنت مستعد لبدء الرحلة؟`;
  return `${prefix}، هل أنت مستعد لبدء الرحلة؟`;
}

function buildWelcomePrompt(firstName: string | null, toneGender: UserToneGender): string {
  const toneLabel = toneGender === "female" ? "مؤنث دافئ" : toneGender === "male" ? "مذكر دافئ" : "محايد ودود";
  const namePart = firstName ? ` لمستخدم اسمه "${firstName}"` : "";
  const tonePart = toneGender === "neutral" ? "بدون تذكير/تأنيث مباشر" : `بصيغة مخاطبة ${toneLabel}`;
  return `اكتب ترحيب قصير ودود باللهجة المصرية${namePart}. جملة واحدة بشكل طبيعي (بدون سؤال منفصل). بدون إيموجي. بدون علامات اقتباس. أقل من 15 كلمة. ${tonePart}. لا تكرر الاسم كثيراً.`;
}

function cleanSingleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanWelcomeMessage(text: string | null): string | null {
  if (!text) return null;
  const oneLine = cleanSingleLine(text);
  if (!oneLine) return null;
  const unquoted = oneLine.replace(/^["“]+|["”]+$/g, "").trim();
  if (!unquoted) return null;
  return unquoted.length > 140 ? `${unquoted.slice(0, 140).trim()}...` : unquoted;
}

function hasOAuthCallbackParams(): boolean {
  if (typeof window === "undefined") return false;

  const search = new URLSearchParams(window.location.search);
  if (search.has("code") || search.has("state") || search.has("error") || search.has("error_description")) {
    return true;
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
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

function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

function normalizeWhatsAppPhone(rawPhone: string): string {
  let digits = normalizeArabicDigits(rawPhone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("020")) digits = digits.slice(1);
  if (digits.startsWith("0") && digits.length === 11) digits = `20${digits.slice(1)}`;
  if (digits.startsWith("2") && digits.length === 12) return digits;
  if (digits.startsWith("20")) return digits;
  return digits;
}

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
    const raw = window.localStorage.getItem(OWNER_ALERTS_MILESTONES_KEY);
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
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OWNER_ALERTS_MILESTONES_KEY, JSON.stringify(value));
}

import { ConsciousnessHistoryMap } from "./components/ConsciousnessHistoryMap";
import { JourneyTimeline } from "./components/JourneyTimeline";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [category, setCategory] = useState<AdviceCategory>("general");
  const [goalId, setGoalId] = useState<string>("unknown");
  const [showGym, setShowGym] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [missionNodeId, setMissionNodeId] = useState<string | null>(null);
  const [toolsBackScreen, setToolsBackScreen] = useState<Screen>("landing");
  const [showCocoon, setShowCocoon] = useState(false);
  /** عند إغلاق التنفس: لو فُتح من مسار دقيقة شحن نرجع لشاشة الخريطة */
  const [returnToGoalOnBreathingClose, setReturnToGoalOnBreathingClose] = useState(false);
  const [suppressCocoonReopen, setSuppressCocoonReopen] = useState(false);
  const cocoonSuppressTimerRef = useRef<number | null>(null);
  const [showNoiseSilencingPulse, setShowNoiseSilencingPulse] = useState(false);
  const [pendingCocoonAfterNoise, setPendingCocoonAfterNoise] = useState(false);
  const [postNoiseSessionMessage, setPostNoiseSessionMessage] = useState(false);
  const [lastPulseInsights, setLastPulseInsights] = useState<MemoryMatch[]>([]);
  const [showConsciousnessArchive, setShowConsciousnessArchive] = useState(false);
  const [themeBeforePulse, setThemeBeforePulse] = useState<"light" | "dark" | "system" | null>(null);
  const [agentModule, setAgentModule] = useState<AgentModule | null>(null);
  const [lockedFeature, setLockedFeature] = useState<FeatureFlagKey | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname.startsWith("/admin") : false
  );
  const [postAuthIntent, setPostAuthIntentState] = useState<PostAuthIntent | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  /** ربط الرجوع بالتاتش/زر الرجوع بالشاشة السابقة بدل إغلاق التطبيق */
  const fromPopStateRef = useRef(false);
  const hasHistorySyncedRef = useRef(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [welcome, setWelcome] = useState<{ message: string; source: WelcomeSource } | null>(null);
  const [consciousnessInsight, setConsciousnessInsight] = useState<ConsciousnessInsight | null>(null);
  const [showJourneyTimeline, setShowJourneyTimeline] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<PublicBroadcast | null>(null);
  const whatsAppNumber = import.meta.env.VITE_WHATSAPP_CONTACT_NUMBER || DEFAULT_WHATSAPP_CONTACT;
  const whatsAppLink = useMemo(() => {
    const normalized = normalizeWhatsAppPhone(whatsAppNumber);
    return normalized ? `https://wa.me/${normalized}` : null;
  }, [whatsAppNumber]);

  const recordUserActivity = useNotificationState((s) => s.recordUserActivity);
  const notificationSettings = useNotificationState((s) => s.settings);
  const notificationPermission = useNotificationState((s) => s.permission);
  const notificationSupported = useNotificationState((s) => s.isSupported);
  const isEmergencyOpen = useEmergencyState((s) => s.isOpen);
  const nodes = useMapState((s) => s.nodes);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const storedGoalId = useJourneyState((s) => s.goalId);
  const storedCategory = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const checkAndUnlock = useAchievementState((s) => s.checkAndUnlock);
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const theme = useThemeState((s) => s.theme);
  const setTheme = useThemeState((s) => s.setTheme);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const pulseLogs = usePulseState((s) => s.logs);
  const weekdayLabels = usePulseState((s) => s.weekdayLabels);
  const snoozedUntil = usePulseState((s) => s.snoozedUntil);
  const logPulse = usePulseState((s) => s.logPulse);
  const snoozeNotifications = usePulseState((s) => s.snoozeNotifications);
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminPrompt = useAdminState((s) => s.systemPrompt);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const setFeatureFlags = useAdminState((s) => s.setFeatureFlags);
  const setSystemPrompt = useAdminState((s) => s.setSystemPrompt);
  const setScoringWeights = useAdminState((s) => s.setScoringWeights);
  const setScoringThresholds = useAdminState((s) => s.setScoringThresholds);
  const setPulseCheckMode = usePulseState((s) => s.setCheckInMode);
  const authStatus = useAuthState((s) => s.status);
  const authUser = useAuthState((s) => s.user);
  const authFirstName = useAuthState((s) => s.firstName);
  const authToneGender = useAuthState((s) => s.toneGender);
  const role = useAuthState(getEffectiveRoleFromState);
  const isPrivilegedUser = isPrivilegedRole(role);
  const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
  const isOwnerWatcher = normalizedRole === "owner" || normalizedRole === "superadmin" || adminAccess;
  const isLockedPhaseOne = isPhaseOneUserFlow;
  const showTopToolsButton = isPrivilegedUser && !isLockedPhaseOne;
  const availableFeatures = useMemo(
    () =>
      getEffectiveFeatureAccess({
        featureFlags,
        betaAccess,
        role,
        adminAccess,
        isDev: import.meta.env.DEV
      }),
    [featureFlags, betaAccess, role, adminAccess]
  );
  const canUseMap = availableFeatures.dawayir_map;
  const canUseJourneyTools = availableFeatures.journey_tools && !isLockedPhaseOne;
  const canUseAIField = availableFeatures.ai_field && !isLockedPhaseOne;
  const canShowAIChatbot = canUseAIField && isPrivilegedUser;
  const canUsePulseCheck = availableFeatures.pulse_check;
  const shouldGateStartWithAuth = isSupabaseReady && !authUser && !isPrivilegedUser;
  const {
    showPulseCheck,
    setShowPulseCheck,
    pulseCheckContext,
    setPulseCheckContext,
    skipNextCheck: skipNextPulseCheck
  } = usePulseCheckLogic(canUsePulseCheck, screen, shouldGateStartWithAuth);

  const openCocoonModal = useCallback(() => {
    if (suppressCocoonReopen) return;
    setShowCocoon(true);
  }, [suppressCocoonReopen]);

  const suppressCocoonFor = useCallback((ms = 2000) => {
    setSuppressCocoonReopen(true);
    if (cocoonSuppressTimerRef.current != null) {
      window.clearTimeout(cocoonSuppressTimerRef.current);
    }
    cocoonSuppressTimerRef.current = window.setTimeout(() => {
      setSuppressCocoonReopen(false);
      cocoonSuppressTimerRef.current = null;
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (cocoonSuppressTimerRef.current != null) {
        window.clearTimeout(cocoonSuppressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void initThemePalette();
  }, []);

  useEffect(() => {
    if (!canShowAIChatbot) return;
    let cancelled = false;
    import("./agent")
      .then((mod) => {
        if (!cancelled) setAgentModule(mod);
      })
      .catch(() => {
        // keep chatbot available in fallback mode
      });
    return () => {
      cancelled = true;
    };
  }, [canShowAIChatbot]);

  useEffect(() => {
    if (screen !== "map") return;
    checkAndUnlock({
      nodes,
      baselineCompletedAt: baselineCompletedAt ?? null,
      libraryOpenedAt: getLibraryOpenedAt(),
      breathingUsedAt: getBreathingUsedAt()
    });
  }, [screen, nodes, baselineCompletedAt, checkAndUnlock]);

  useEffect(() => {
    if (screen !== "landing") {
      recordUserActivity();
    }
  }, [screen, recordUserActivity]);

  useEffect(() => {
    if (typeof window === "undefined" || isAdminRoute) return;
    let cancelled = false;

    const checkBroadcasts = async () => {
      const list = await fetchPublicBroadcasts();
      if (cancelled || !list || list.length === 0) return;

      const candidate = list.find((item) =>
        doesBroadcastMatchAudience(item.audience, {
          isLoggedIn: Boolean(authUser),
          isInstalled: isAppInstalledMode()
        })
      );
      if (!candidate) return;

      const seenId = window.localStorage.getItem(LAST_SEEN_BROADCAST_KEY);
      if (seenId === candidate.id) return;

      setActiveBroadcast(candidate);
      window.localStorage.setItem(LAST_SEEN_BROADCAST_KEY, candidate.id);

      if (notificationSupported && notificationPermission === "granted" && notificationSettings.enabled) {
        void sendNotification({
          title: candidate.title,
          body: candidate.body,
          tag: `broadcast-${candidate.id}`
        });
      }
    };

    void checkBroadcasts();
    const timer = window.setInterval(() => {
      void checkBroadcasts();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    authUser,
    isAdminRoute,
    notificationPermission,
    notificationSettings.enabled,
    notificationSupported
  ]);

  useEffect(() => {
    const handler = () =>
      setIsAdminRoute(window.location.pathname.startsWith("/admin"));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  /** ربط History API بالشاشات — الرجوع بالتاتش/زر الرجوع يرجع للشاشة السابقة بدل إغلاق التطبيق */
  useEffect(() => {
    if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;
    if (hasOAuthCallbackParams()) return;
    if (fromPopStateRef.current) {
      fromPopStateRef.current = false;
      return;
    }
    const state = { screen };
    const url = window.location.pathname || "/";
    if (!hasHistorySyncedRef.current) {
      hasHistorySyncedRef.current = true;
      window.history.replaceState(state, "", url);
      return;
    }
    window.history.pushState(state, "", url);
  }, [screen, authStatus]);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;
    const handler = (e: PopStateEvent) => {
      const next = (e.state as { screen?: Screen } | null)?.screen ?? "landing";
      fromPopStateRef.current = true;
      setScreen(next);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    const stop = initAppContentRealtime();
    return () => stop();
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      import("./utils/seedStressTestData").then(({ seedStressTestData }) => {
        (window as Window & { __seedStressTest?: () => { nodeCount: number; eventCount: number } }).__seedStressTest =
          () => {
            const result = seedStressTestData();
            console.warn("[Stress Test] تم: ", result.nodeCount, "عُقدة،", result.eventCount, "حدث. إعادة تحميل...");
            setTimeout(() => window.location.reload(), 500);
            return result;
          };
      });
    }
  }, []);

  useEffect(() => {
    if (!hasSupabaseEnv) return;
    let cancelled = false;
    import("./services/adminApi")
      .then(({ fetchAdminConfig }) => fetchAdminConfig())
      .then((config) => {
        if (!config || cancelled) return;
        if (config.featureFlags) setFeatureFlags(config.featureFlags);
        if (config.systemPrompt) setSystemPrompt(config.systemPrompt);
        if (config.scoringWeights) setScoringWeights(config.scoringWeights);
        if (config.scoringThresholds) setScoringThresholds(config.scoringThresholds);
        if (config.pulseCheckMode) setPulseCheckMode(config.pulseCheckMode);
      })
      .catch(() => {
        // ignore remote errors, fallback to local
      });
    return () => {
      cancelled = true;
    };
  }, [setFeatureFlags, setSystemPrompt, setScoringWeights, setScoringThresholds, setPulseCheckMode]);

  useEffect(() => {
    const pageNames: Record<Screen, string> = {
      landing: "الرئيسية",
      goal: "اختيار الهدف",
      map: "خريطة العلاقات",
      guided: "الرحلة الموجهة",
      mission: "شاشة المهمة",
      tools: "أدوات الرحلة"
    };
    trackPageView(pageNames[screen]);
  }, [screen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOwnerWatcher) return;
    let cancelled = false;

    const sendOwnerNotification = async (title: string, body: string, tag: string) => {
      if (!notificationSupported || notificationPermission !== "granted" || !notificationSettings.enabled) return;
      await sendNotification({ title, body, tag });
    };

    const pollOwnerAlerts = async () => {
      const since = window.localStorage.getItem(OWNER_ALERTS_LAST_CHECK_KEY) ?? new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { fetchOwnerAlerts } = await import("./services/adminApi");
      const alerts = await fetchOwnerAlerts({ since, phaseTarget: 10 });
      if (!alerts || cancelled) return;

      for (const sessionId of alerts.newVisitors.sessionIds) {
        await sendOwnerNotification(
          "زائر جديد دخل المنصة",
          `Session: ${sessionId.slice(0, 14)}…`,
          `owner-visitor-${sessionId}`
        );
      }

      for (const sessionId of alerts.logins.sessionIds) {
        await sendOwnerNotification(
          "زائر أكمل تسجيل الدخول",
          `Session: ${sessionId.slice(0, 14)}…`,
          `owner-login-${sessionId}`
        );
      }

      for (const sessionId of alerts.installs.sessionIds) {
        await sendOwnerNotification(
          "زائر ثبت التطبيق",
          `Session: ${sessionId.slice(0, 14)}…`,
          `owner-install-${sessionId}`
        );
      }

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
          `تم الوصول إلى ${alerts.phaseOne.installedUsers} مستخدمين ثبتوا التطبيق.`,
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
      window.localStorage.setItem(OWNER_ALERTS_LAST_CHECK_KEY, alerts.generatedAt || new Date().toISOString());
    };

    void pollOwnerAlerts();
    const timer = window.setInterval(() => {
      void pollOwnerAlerts();
    }, 45_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    isOwnerWatcher,
    notificationPermission,
    notificationSettings.enabled,
    notificationSupported
  ]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!authUser) return;
    const intent = getPostAuthIntent();
    if (!intent) return;
    clearPostAuthIntent();
    recordFlowEvent("auth_login_success", { meta: { intent: intent.kind } });
    if (intent.kind === "login") {
      setPulseCheckContext("regular");
      setShowPulseCheck(false);
      setShowAuthModal(false);
      setPostAuthIntentState(null);
      return;
    }
    if (intent.kind !== "start_recovery") return;

    setPulseCheckContext("regular");
    setShowPulseCheck(false);
    setShowAuthModal(false);
    setPostAuthIntentState(null);

    logPulse(intent.pulse);

    setWelcome({ message: buildStartRecoveryWelcome(authFirstName, authToneGender), source: "template" });
    setScreen("goal");

    let cancelled = false;
    void (async () => {
      // تحليل الوعي الأولي عند الدخول
      const insight = await consciousnessService.analyzeConsciousness(`بدأ المستخدم ${authFirstName || ""} رحلة جديدة`);
      if (!cancelled) setConsciousnessInsight(insight);

      if (!geminiClient.isAvailable()) return;
      const prompt = buildWelcomePrompt(authFirstName, authToneGender);
      const out = await geminiClient.generate(prompt);
      if (cancelled) return;
      const cleaned = cleanWelcomeMessage(out);
      if (!cleaned) return;
      setWelcome({ message: cleaned, source: "ai" });
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, authUser, authFirstName, authToneGender, logPulse, setPulseCheckContext, setShowPulseCheck]);

  const goToGoals = () => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }
    skipNextPulseCheck();
    setScreen("goal");
  };

  const startRecovery = () => {
    if (shouldGateStartWithAuth && canUsePulseCheck) {
      trackEvent(AnalyticsEvents.MICRO_COMPASS_OPENED, { source: "landing", gate: "pulse" });
      setWelcome(null);
      setPostAuthIntentState(null);
      setShowAuthModal(false);
      setPulseCheckContext("start_recovery");
      setShowPulseCheck(true);
      return;
    }
    if (shouldGateStartWithAuth && !canUsePulseCheck) {
      setWelcome(null);
      setPostAuthIntentState({ kind: "login", createdAt: Date.now() });
      setShowAuthModal(true);
      return;
    }
    goToGoals();
  };

  useEffect(() => {
    if (screen === "landing" && canShowAIChatbot) {
      void preloadChatbot();
    }
    if (screen === "goal") {
      void preloadCoreMap();
      void preloadGym();
    }
  }, [screen, canShowAIChatbot]);

  useEffect(() => {
    if (screen !== "map") setSelectedNodeId(null);
  }, [screen]);

  useEffect(() => {
    if (canUseMap) return;
    if (screen === "goal" || screen === "map" || screen === "mission" || screen === "guided") {
      setScreen("landing");
    }
  }, [canUseMap, screen]);

  useEffect(() => {
    if (canUseJourneyTools) return;
    if (screen === "tools") setScreen("landing");
  }, [canUseJourneyTools, screen]);

  useEffect(() => {
    if (!isLockedPhaseOne) return;
    if (screen === "guided" || screen === "mission" || screen === "tools") {
      setScreen("map");
    }
  }, [isLockedPhaseOne, screen]);

  useEffect(() => {
    if (!isLockedPhaseOne) return;
    if (goalId !== "family") setGoalId("family");
  }, [goalId, isLockedPhaseOne]);

  const openMissionScreen = (nodeId: string) => {
    if (isLockedPhaseOne) return;
    setMissionNodeId(nodeId);
    setScreen("mission");
  };
  const openJourneyTools = () => {
    if (isLockedPhaseOne) return;
    if (!canUseJourneyTools) {
      setLockedFeature("journey_tools");
      return;
    }
    recordFlowEvent("tools_opened");
    setToolsBackScreen(screen === "tools" ? "landing" : screen);
    setScreen("tools");
  };
  const openDawayirTool = () => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }
    const lastGoalMeta = getLastGoalMeta(lastGoalById, storedGoalId, storedCategory);
    if (lastGoalMeta) {
      setGoalId(lastGoalMeta.goalId);
      setCategory(lastGoalMeta.category as AdviceCategory);
      setScreen("map");
      setSelectedNodeId(null);
      return;
    }
    setScreen("goal");
  };
  const openDawayirSetup = () => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }
    skipNextPulseCheck();
    setScreen("goal");
  };

  const pulseOpenedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (showPulseCheck) {
      pulseOpenedAtRef.current = Date.now();
      recordFlowEvent("pulse_opened");
    }
  }, [showPulseCheck]);
  const closePulseCheck = useCallback((completed = false, closeReason?: "backdrop" | "close_button" | "programmatic" | "browser_close") => {
    if (!completed && pulseOpenedAtRef.current != null) {
      recordFlowEvent("pulse_abandoned", { closeReason });
    }
    pulseOpenedAtRef.current = null;
    setShowPulseCheck(false);
    setPulseCheckContext("regular");
  }, [setPulseCheckContext, setShowPulseCheck]);

  const isDefaultPulseSubmit = (payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean; notes?: string }) => {
    const notes = payload.notes?.trim() ?? "";
    return payload.energy === 5 && payload.mood === "calm" && payload.focus === "none" && notes.length === 0;
  };

  useEffect(() => {
    const onPageHide = () => {
      if (!showPulseCheck) return;
      closePulseCheck(false, "browser_close");
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [closePulseCheck, showPulseCheck]);

  const handlePulseGateSubmit = (payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean; notes?: string }) => {
    recordFlowEvent("pulse_completed");
    if (isDefaultPulseSubmit(payload)) recordFlowEvent("pulse_completed_without_choices");
    else recordFlowEvent("pulse_completed_with_choices");
    trackEvent(AnalyticsEvents.MICRO_COMPASS_COMPLETED, {
      gate: "pulse",
      pulse_energy: payload.energy,
      pulse_mood: payload.mood,
      pulse_focus: payload.focus,
      pulse_auto: payload.auto ?? false
    });
    closePulseCheck(true, "programmatic");

    const intent: PostAuthIntent = {
      kind: "start_recovery",
      pulse: payload,
      createdAt: Date.now()
    };
    setPostAuthIntentState(intent);
    setShowAuthModal(true);
  };

  const handlePulseSubmit = useCallback((payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean; notes?: string }) => {
    recordFlowEvent("pulse_completed");
    if (isDefaultPulseSubmit(payload)) recordFlowEvent("pulse_completed_without_choices");
    else recordFlowEvent("pulse_completed_with_choices");
    logPulse(payload);
    closePulseCheck(true, "programmatic");

    // توصيل البوصلة بمرآة الوعي (غير معطِّل للتجربة)
    const numericPart = `طاقة ${payload.energy}/10، مزاج ${payload.mood}, تركيز ${payload.focus}`;
    const feelingText = payload.notes ? `${payload.notes.trim()}\n\n(${numericPart})` : numericPart;
    const userId = authUser?.id ?? null;
    void (async () => {
      try {
        await consciousnessService.saveMoment(userId, feelingText);
        const matches = await consciousnessService.recallSimilarMoments(feelingText, {
          threshold: 0.7,
          limit: 3,
          sources: ["pulse"]
        });
        if (matches && matches.length > 0) {
          setLastPulseInsights(matches.slice(0, 3));
        }
      } catch (err) {
        console.error("Pulse consciousness wiring error:", err);
      }
    })();

    const isLow = payload.energy <= 3;
    const isAngry = payload.mood === "angry";

    if (isLow) {
      if (themeBeforePulse == null) {
        setThemeBeforePulse(theme);
      }
      setTheme("dark");
      snoozeNotifications(240);
    } else if (themeBeforePulse != null) {
      setTheme(themeBeforePulse);
      setThemeBeforePulse(null);
    }

    if (isAngry) {
      setShowNoiseSilencingPulse(true);
      if (isLow) setPendingCocoonAfterNoise(true);
      return;
    }

    if (isLow) {
      openCocoonModal();
    }
  }, [authUser, closePulseCheck, logPulse, openCocoonModal, setTheme, setThemeBeforePulse, snoozeNotifications, theme, themeBeforePulse]);

  const agentContext = useMemo<AgentContext>(
    () => ({
      nodesSummary: nodes.map((n) => ({ id: n.id, label: n.label, ring: n.ring })),
      availableFeatures,
      screen,
      selectedNodeId,
      goalId,
      category,
      pulse: lastPulse
    }),
    [nodes, availableFeatures, screen, selectedNodeId, goalId, category, lastPulse]
  );

  const agentSystemPrompt = useMemo<string | undefined>(() => {
    if (!agentModule) return undefined;
    const basePrompt = agentModule.buildAgentSystemPrompt(agentContext);
    const adminTrimmed = adminPrompt?.trim();
    return adminTrimmed ? `${adminTrimmed}\n\n${basePrompt}` : basePrompt;
  }, [agentModule, agentContext, adminPrompt]);

  const agentActions = useMemo<AgentActions | undefined>(
    () => {
      if (!agentModule) return undefined;
      return agentModule.createAgentActions({
        resolvePerson: (labelOrId) => agentModule.resolvePersonFromNodes(labelOrId, nodes),
        onNavigateBreathing: () => setShowBreathing(true),
        onNavigateGym: () => setShowGym(true),
        onNavigateMap: () => setScreen("map"),
        onNavigateBaseline: () => setShowBaseline(true),
        onNavigateEmergency: () => useEmergencyState.getState().open(),
        availableFeatures,
        onNavigatePerson: (nodeId) => {
          setScreen("map");
          setSelectedNodeId(nodeId);
        }
      });
    },
    [agentModule, nodes, availableFeatures]
  );

  const pulseInsight = useMemo(
    () => getWeeklyPulseInsight(pulseLogs, weekdayLabels),
    [pulseLogs, weekdayLabels]
  );

  const pulseMode = useMemo(() => {
    if (!lastPulse) return "normal";
    const ageMs = Date.now() - (lastPulse.timestamp ?? 0);
    if (ageMs > 24 * 60 * 60 * 1000) return "normal"; // آخر نبض خلال ٢٤ ساعة فقط
    if (lastPulse.mood === "angry") return "angry";
    if (lastPulse.energy <= 3) return "low";
    if (lastPulse.energy >= 8) return "high";
    return "normal";
  }, [lastPulse]);

  const challengeTarget = useMemo(() => {
    const candidates = nodes
      .map((node) => {
        const incomplete = getIncompleteMissionSteps(node);
        if (!incomplete) return null;
        if (!incomplete.steps.length) return null;
        return { node, incomplete };
      })
      .filter((item): item is { node: (typeof nodes)[number]; incomplete: NonNullable<ReturnType<typeof getIncompleteMissionSteps>> } => Boolean(item));
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const remainingDiff = b.incomplete.steps.length - a.incomplete.steps.length;
      if (remainingDiff !== 0) return remainingDiff;
      return (b.incomplete.startedAt ?? 0) - (a.incomplete.startedAt ?? 0);
    });
    const target = candidates[0];
    const nextStep = target.incomplete.steps[0];
    return {
      nodeId: target.node.id,
      label: target.node.label,
      step: nextStep.step,
      stepIndex: nextStep.index,
      total: target.incomplete.total,
      missionLabel: target.incomplete.missionLabel
    };
  }, [nodes]);

  const challengeLabel = challengeTarget
    ? `مع ${challengeTarget.label} — ${challengeTarget.missionLabel} (خطوة ${challengeTarget.stepIndex + 1}/${challengeTarget.total})`
    : null;

  const hasActiveMission = useMemo(
    () => nodes.some((n) => n.missionProgress?.startedAt && !n.missionProgress?.isCompleted),
    [nodes]
  );

  useEffect(() => {
    if (!notificationSupported || notificationPermission !== "granted") return;
    if (!notificationSettings.enabled || !notificationSettings.missionReminder) return;

    const [hourStr, minuteStr] = notificationSettings.dailyReminderTime.split(":");
    const targetHour = Number(hourStr);
    const targetMinute = Number(minuteStr);
    const storageKey = "dawayir-mission-reminder-last";
    const pickMissionReminderTarget = (todayKey: string) => {
      const active = nodes
        .filter((n) => n.missionProgress?.startedAt && !n.missionProgress?.isCompleted)
        .sort((a, b) => (b.missionProgress?.startedAt ?? 0) - (a.missionProgress?.startedAt ?? 0));
      const strategy = notificationSettings.missionReminderStrategy ?? "next";
      for (const node of active) {
        const incomplete = getIncompleteMissionSteps(node);
        if (!incomplete || incomplete.allSteps.length === 0) continue;

        const pickStep = () => {
          if (strategy === "last") return incomplete.steps[incomplete.steps.length - 1];
          if (strategy === "cycle") {
            const totalSteps = incomplete.allSteps;
            if (totalSteps.length === 0) return null;
            const cycleKey = `dawayir-mission-cycle-${node.id}`;
            let lastIndex = -1;
            let lastDate: string | null = null;
            if (typeof window !== "undefined") {
              try {
                const stored = window.localStorage.getItem(cycleKey);
                if (stored) {
                  const parsed = JSON.parse(stored) as { lastIndex?: number; lastDate?: string };
                  if (typeof parsed.lastIndex === "number") lastIndex = parsed.lastIndex;
                  if (typeof parsed.lastDate === "string") lastDate = parsed.lastDate;
                }
              } catch {
                // ignore storage errors
              }
            }
            const startIndex =
              lastDate === todayKey
                ? (lastIndex + totalSteps.length) % totalSteps.length
                : (lastIndex + 1 + totalSteps.length) % totalSteps.length;
            for (let offset = 0; offset < totalSteps.length; offset += 1) {
              const idx = (startIndex + offset) % totalSteps.length;
              const candidate = totalSteps[idx];
              if (!candidate.completed) {
                return {
                  step: candidate.step,
                  index: candidate.index,
                  cycleKey
                };
              }
            }
            return null;
          }
          if (strategy === "random") {
            if (incomplete.steps.length <= 1) return incomplete.steps[0];
            const pool = incomplete.steps.slice(1);
            return pool[Math.floor(Math.random() * pool.length)];
          }
          return incomplete.steps[0];
        };

        const selected = pickStep();
        if (!selected) continue;
        return {
          node,
          next: {
            step: selected.step,
            stepIndex: selected.index,
            total: incomplete.total,
            missionLabel: incomplete.missionLabel,
            missionGoal: incomplete.missionGoal
          },
          cycleStorage:
            "cycleKey" in selected
              ? { key: selected.cycleKey, index: selected.index }
              : null
        };
      }
      return null;
    };

    const checkAndSend = () => {
      if (snoozedUntil && Date.now() < snoozedUntil) return;
      if (!hasActiveMission) return;
      const now = new Date();
      if (now.getHours() !== targetHour || now.getMinutes() !== targetMinute) return;
      const todayKey = now.toISOString().slice(0, 10);
      if (typeof window !== "undefined") {
        const lastSent = window.localStorage.getItem(storageKey);
        if (lastSent === todayKey) return;
        const reminderTarget = pickMissionReminderTarget(todayKey);
        const send = reminderTarget
          ? sendNotification({
              title: "مهمتك مستنياك 🎯",
              body: `مع ${reminderTarget.node.label} — خطوة ${reminderTarget.next.stepIndex + 1}/${reminderTarget.next.total}: ${reminderTarget.next.step}`,
              tag: "mission-reminder"
            })
          : sendPresetNotification(NOTIFICATION_TYPES.MISSION_REMINDER);
        void send.then(() => {
          window.localStorage.setItem(storageKey, todayKey);
          if (reminderTarget?.cycleStorage) {
            window.localStorage.setItem(
              reminderTarget.cycleStorage.key,
              JSON.stringify({ lastDate: todayKey, lastIndex: reminderTarget.cycleStorage.index })
            );
          }
        });
      }
    };

    checkAndSend();
    const id = window.setInterval(checkAndSend, 60 * 1000);
    return () => window.clearInterval(id);
  }, [
    notificationSupported,
    notificationPermission,
    notificationSettings.enabled,
    notificationSettings.missionReminder,
    notificationSettings.dailyReminderTime,
    notificationSettings.missionReminderStrategy,
    hasActiveMission,
    nodes,
    snoozedUntil
  ]);

  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--space-void)" }} />}>
        <AdminDashboard
          onExit={() => {
            if (typeof window !== "undefined") {
              window.history.pushState({}, "", "/");
              setIsAdminRoute(false);
            }
          }}
        />
      </Suspense>
    );
  }

  return (
    <PWAInstallProvider>
    <div className="min-h-screen flex transition-colors relative overflow-hidden isolate" dir="rtl"
      style={{ background: "var(--space-void)" }}
    >
      {/* 🌌 Nebula Background — Deep Cosmic Blue Canvas */}
      <div className="nebula-bg" aria-hidden="true" />
      <AnimatePresence>
        {activeBroadcast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 max-w-lg"
            role="status"
            aria-live="polite"
          >
            <div className="glass-card px-4 py-3 border border-amber-300/40 bg-amber-50/10 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--soft-gold, #fbbf24)" }}>
                    رسالة من إدارة الرحلة
                  </p>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{activeBroadcast.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {activeBroadcast.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBroadcast(null)}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold border border-white/15 hover:bg-white/5 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                  aria-label="إخفاء الرسالة"
                >
                  إخفاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {postNoiseSessionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-md mx-auto"
            role="status"
            aria-live="polite"
          >
            <div
              className="bento-block text-center py-4 px-6"
              style={{
                borderColor: "rgba(34, 197, 94, 0.25)",
                background: "rgba(34, 197, 94, 0.06)"
              }}
            >
              <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                حمد لله على السلامة 🌿
              </p>
              <p className="text-sm mt-1 opacity-90" style={{ color: "var(--text-secondary)" }}>
                يومك بقى أخف دلوقتي
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {lastPulseInsights.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-lg mx-auto">
          <div className="bento-block" style={{ borderColor: "rgba(245, 166, 35, 0.25)", padding: "1.5rem" }}>
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: "rgba(245, 166, 35, 0.12)",
                  border: "1px solid rgba(245, 166, 35, 0.25)",
                  color: "var(--warm-amber)"
                }}
              >
                ✨
              </div>
              <div className="text-right flex-1 min-w-0">
                <h3 className="text-sm font-bold mb-3" style={{ color: "var(--warm-amber)" }}>
                  ومضة من الذاكرة
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {lastPulseInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="min-w-[220px] max-w-[280px] rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(245, 166, 35, 0.08)",
                        border: "1px solid rgba(245, 166, 35, 0.15)"
                      }}
                    >
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        شعورك دلوقتي بيشبه موقف{" "}
                        {insight.created_at && (
                          <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                            حصل يوم{" "}
                            {new Date(insight.created_at).toLocaleDateString("ar-EG")}
                          </span>
                        )}
                        {": "}
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {insight.content.slice(0, 90)}
                          {insight.content.length > 90 ? "..." : ""}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastPulseInsights([])}
              className="glass-button w-full text-xs font-bold"
              style={{ color: "var(--warm-amber)" }}
            >
              تم · إخفاء الومضة
            </button>
          </div>
        </div>
      )}
      {/* Legacy pattern removed — nebula-bg handles the cosmic background */}
      {isSupabaseReady && !isAdminRoute && !showAuthModal && !showPulseCheck && (
        <div className="fixed z-80 top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-auto pl-4" dir="ltr">
          <button
            type="button"
            onClick={() => {
              recordFlowEvent("profile_clicked");
              if (authUser) {
                setShowDataManagement(true);
                return;
              }
              setPulseCheckContext("regular");
              setShowPulseCheck(false);
              setWelcome(null);
              const intent: PostAuthIntent = { kind: "login", createdAt: Date.now() };
              setPostAuthIntentState(intent);
              setShowAuthModal(true);
            }}
            className="group w-11 h-11 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-0 cursor-pointer relative"
            style={{ color: "var(--text-secondary)" }}
            aria-label={authUser ? "حسابي" : "تسجيل الدخول"}
          >
            <span className="relative inline-flex items-center justify-center">
              <User className="w-5 h-5" />
              {authUser && (
                <span
                  className="absolute top-0 right-0 w-2 h-2 rounded-full"
                  style={{ background: "var(--soft-teal)", boxShadow: "0 0 0 2px var(--space-void)" }}
                  aria-hidden="true"
                />
              )}
            </span>
            <span
              className="pointer-events-none absolute top-full mt-1 right-0 max-w-48 rounded-2xl px-3 py-1 text-[11px] font-medium leading-snug opacity-0 translate-y-1 bg-slate-900/90 text-slate-50 border border-white/10 backdrop-blur-md group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 text-center"
            >
              {authUser ? "افتح حسابك" : "سجّل دخولك واحفظ رحلتك"}
            </span>
          </button>
        </div>
      )}
      {whatsAppLink && !isAdminRoute && !showAuthModal && !showPulseCheck && (
        <button
          type="button"
          onClick={() => {
            trackEvent("whatsapp_contact_clicked", { placement: "app_floating" });
            window.open(whatsAppLink, "_blank", "noopener,noreferrer");
          }}
          className="fixed z-40 right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-6 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white w-12 h-12 shadow-lg hover:bg-emerald-500 active:scale-95 transition-all"
          title="تواصل واتساب"
          aria-label="تواصل واتساب"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
        </button>
      )}
      {!isLockedPhaseOne && isPrivilegedUser && (
        <Suspense fallback={null}>
          <AppSidebar
            onOpenGym={() => setShowGym(true)}
            onStartJourney={goToGoals}
            onOpenBaseline={() => setShowBaseline(true)}
            onOpenGuidedJourney={() => setScreen("guided")}
            onOpenMission={openMissionScreen}
            onOpenJourneyTools={openJourneyTools}
            onOpenJourneyTimeline={() => {
              setScreen("map");
              setShowJourneyTimeline(true);
            }}
            onOpenDawayir={openDawayirTool}
            onFeatureLocked={setLockedFeature}
            viewingNodeId={screen === "map" ? selectedNodeId : null}
            onNoiseSessionComplete={() => {
              setPostNoiseSessionMessage(true);
              setTimeout(() => setPostNoiseSessionMessage(false), 4500);
            }}
          />
        </Suspense>
      )}
      <main
        className={`flex-1 min-w-0 flex transition-[margin] ${showPulseCheck ? "opacity-0 pointer-events-none select-none" : ""}`}
        style={{ marginRight: !isLockedPhaseOne && isPrivilegedUser ? SIDEBAR_TAB_MARGIN : "0px" }}
        aria-hidden={showPulseCheck}
      >
        {screen === "map" && (
          <JourneyTimeline
            isOpen={showJourneyTimeline}
            onClose={() => setShowJourneyTimeline(false)}
            onCardClick={(nodeId) => setSelectedNodeId(nodeId)}
          />
        )}
        <Suspense fallback={<div className="text-sm" style={{ color: "var(--text-muted)" }}>...جاري التحميل</div>}>
          <div key={screen} className={`flex-1 min-w-0 flex items-center justify-center transition-all duration-300 ease-in-out ${screen === "landing" ? "" : "app-panel-main"}`}>
            {screen === "landing" && (
              <Landing
                onStartJourney={startRecovery}
                onOpenTools={openJourneyTools}
                showTopToolsButton={showTopToolsButton}
                showPostStartContent={!isLockedPhaseOne && isPrivilegedUser}
                showToolsSection={!isLockedPhaseOne}
                onFeatureLocked={setLockedFeature}
                availableFeatures={availableFeatures}
              />
            )}

            {screen === "goal" && (
              <div className="w-full flex-1 min-h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col px-3 sm:px-4">
                {welcome && (
                  <OnboardingWelcomeBubble
                    message={welcome.message}
                    source={welcome.source}
                    onClose={() => setWelcome(null)}
                  />
                )}
                <GoalPicker
                  onBack={() => setScreen("landing")}
                  onContinue={(nextCategory, nextGoalId) => {
                    setWelcome(null);
                    setCategory(nextCategory);
                    setGoalId(nextGoalId);
                    useJourneyState.getState().setLastGoal(nextGoalId, nextCategory);
                    skipNextPulseCheck();
                    setScreen("map");
                  }}
                />
              </div>
            )}

            {screen === "map" && (
              <CoreMapScreen
                category={category}
                goalId={goalId}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onOpenBreathing={() => setShowBreathing(true)}
                onOpenMission={openMissionScreen}
                pulseMode={pulseMode}
                pulseInsight={pulseInsight}
                onOpenCocoon={openCocoonModal}
                onOpenNoise={() => setShowNoiseSilencingPulse(true)}
                canUseBasicDiagnosis={availableFeatures.basic_diagnosis}
                onFeatureLocked={setLockedFeature}
                onOpenChallenge={
                  challengeTarget ? () => openMissionScreen(challengeTarget.nodeId) : undefined
                }
                challengeLabel={challengeLabel}
              />
            )}

            {screen === "tools" && (
              <JourneyToolsScreen
                onBack={() => setScreen(toolsBackScreen)}
                onOpenDawayir={openDawayirTool}
                onOpenDawayirSetup={openDawayirSetup}
                onFeatureLocked={setLockedFeature}
                availableFeatures={availableFeatures}
                onOpenGoal={(goalId, category) => {
                  setGoalId(goalId);
                  setCategory(category as AdviceCategory);
                  setScreen("map");
                }}
              />
            )}

            {screen === "guided" && (
              <GuidedJourneyFlow
                onBackToLanding={() => setScreen("landing")}
                onFinishJourney={() => setScreen("map")}
              />
            )}

            {screen === "mission" && missionNodeId && (
              <MissionScreen
                nodeId={missionNodeId}
                onBack={() => setScreen("map")}
              />
            )}
            </div>
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {showGym && (
          <RelationshipGym
            onClose={() => setShowGym(false)}
            onStartJourney={() => {
              setShowGym(false);
              goToGoals();
            }}
          />
        )}

        {showBaseline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
              <button
                type="button"
                onClick={() => setShowBaseline(false)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors z-10"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">
                  القياس الأولي
                </h2>
                <p className="text-sm text-slate-600 mb-6 text-center">
                  إجابات سريعة عشان نعرف نقطة البداية
                </p>
                <BaselineAssessment
                  onComplete={() => setShowBaseline(false)}
                />
              </div>
              <div className="p-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBaseline(false)}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {canShowAIChatbot && (
          <AIChatbot
            agentContext={agentContext}
            agentActions={agentActions}
            systemPromptOverride={agentSystemPrompt}
            onOpenBreathing={() => setShowBreathing(true)}
            onNavigateToMap={() => setScreen("map")}
          />
        )}

        {/* زر إضافي لفتح أرشيف الوعي من شاشة الهبوط — وضع التطوير فقط */}
        {screen === "landing" && role?.toLowerCase() === "developer" && (
          <button
            type="button"
            onClick={() => setShowConsciousnessArchive(true)}
            className="fixed bottom-6 left-6 z-40 glass-button text-xs px-4 py-2 flex items-center gap-2"
            style={{ color: "var(--warm-amber)", borderColor: "rgba(245, 166, 35, 0.25)" }}
          >
            <span>&#x2728;</span>
            <span>أرشيف الوعي</span>
          </button>
        )}

        <ConsciousnessArchiveModal
          isOpen={showConsciousnessArchive}
          onClose={() => setShowConsciousnessArchive(false)}
        />
        {lastNewAchievementId && <AchievementToast />}

        {showPulseCheck && (
          <PulseCheckModal
            isOpen={showPulseCheck}
            context={pulseCheckContext}
            onSubmit={(payload) => {
              if (pulseCheckContext === "start_recovery") {
                handlePulseGateSubmit(payload);
                return;
              }
              handlePulseSubmit(payload);
            }}
            onClose={(reason) => closePulseCheck(false, reason)}
          />
        )}

        {showCocoon && (
          <CocoonModeModal
            isOpen={showCocoon}
            onStart={() => {
              setShowCocoon(false);
              setReturnToGoalOnBreathingClose(true);
              setShowBreathing(true);
            }}
            onClose={() => setShowCocoon(false)}
          />
        )}

        {showNoiseSilencingPulse && (
          <NoiseSilencingModal
            isOpen={showNoiseSilencingPulse}
            onClose={() => {
              setShowNoiseSilencingPulse(false);
              if (pendingCocoonAfterNoise) {
                setPendingCocoonAfterNoise(false);
                openCocoonModal();
              }
            }}
            onSessionComplete={() => {
              setShowNoiseSilencingPulse(false);
              if (pendingCocoonAfterNoise) {
                setPendingCocoonAfterNoise(false);
                openCocoonModal();
              }
              setPostNoiseSessionMessage(true);
              setTimeout(() => setPostNoiseSessionMessage(false), 4500);
            }}
          />
        )}

        {lockedFeature != null && (
          <FeatureLockedModal
            isOpen={lockedFeature != null}
            featureKey={lockedFeature}
            onClose={() => setLockedFeature(null)}
          />
        )}

        {showBreathing && (
          <BreathingOverlay
            onClose={() => {
              setShowBreathing(false);
              if (returnToGoalOnBreathingClose) {
                setReturnToGoalOnBreathingClose(false);
                setShowCocoon(false);
                setPendingCocoonAfterNoise(false);
                suppressCocoonFor(4000);
                setScreen("map");
              }
            }}
          />
        )}

        {isEmergencyOpen && (
          <EmergencyOverlay
            onStartBreathing={() => {
              useEmergencyState.getState().close();
              setShowBreathing(true);
            }}
            onStartScenario={() => {
              useEmergencyState.getState().close();
              setShowGym(true);
            }}
          />
        )}
      </Suspense>

      {postAuthIntent && (
        <GoogleAuthModal
          isOpen={showAuthModal}
          intent={postAuthIntent}
          onClose={() => setShowAuthModal(false)}
          onNotNow={(pulseToSave) => {
            setShowAuthModal(false);
            setPostAuthIntentState(null);
            clearPostAuthIntent();
            setWelcome(null);
            skipNextPulseCheck();
            if (pulseToSave) logPulse(pulseToSave);
            openDawayirSetup();
          }}
        />
      )}

      {showDataManagement && (
        <Suspense fallback={null}>
          <DataManagement isOpen={showDataManagement} onClose={() => setShowDataManagement(false)} />
        </Suspense>
      )}
      {screen === "landing" && role?.toLowerCase() === "developer" && (
        <div className="fixed top-24 left-4 right-4 z-10 max-w-md mx-auto">
          <ConsciousnessHistoryMap />
        </div>
      )}
      {consciousnessInsight && screen !== "landing" && (
        <div className="fixed bottom-28 left-6 right-6 bento-block z-50 max-w-lg mx-auto"
          style={{ borderColor: "rgba(45, 212, 191, 0.25)", padding: "1.5rem" }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(45, 212, 191, 0.12)",
                border: "1px solid rgba(45, 212, 191, 0.25)"
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--soft-teal)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--soft-teal)" }}>
                بصيرة الوعي
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                {consciousnessInsight.suggestedAction}
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1.5 text-xs font-bold rounded-full"
                  style={{ background: "var(--soft-teal-dim)", color: "var(--soft-teal)" }}
                >
                  {consciousnessInsight.emotionalState}
                </span>
                <span className="px-3 py-1.5 text-xs font-bold rounded-full"
                  style={{ background: "rgba(139, 92, 246, 0.12)", color: "rgba(167, 139, 250, 0.9)" }}
                >
                  نمط: {consciousnessInsight.underlyingPattern}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PWAInstallProvider>
  );
}
