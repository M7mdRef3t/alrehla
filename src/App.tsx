import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { X, User } from "lucide-react";
import { Landing } from "./components/Landing";
import { useNotificationState } from "./state/notificationState";
import { useEmergencyState } from "./state/emergencyState";
import { useMapState } from "./state/mapState";
import { useJourneyState } from "./state/journeyState";
import { useAchievementState, getLibraryOpenedAt, getBreathingUsedAt } from "./state/achievementState";
import { useThemeState } from "./state/themeState";
import { usePulseState } from "./state/pulseState";
import type { PulseFocus, PulseMood } from "./state/pulseState";
import { trackPageView, trackEvent, AnalyticsEvents } from "./services/analytics";
import { sendNotification, sendPresetNotification, NOTIFICATION_TYPES } from "./services/notifications";
import type { AdviceCategory } from "./data/adviceScripts";
import type { AgentActions, AgentContext } from "./agent/types";
import { getIncompleteMissionSteps } from "./utils/missionProgress";
import { getLastGoalMeta } from "./utils/goalLabel";
import { getWeeklyPulseInsight } from "./utils/pulseInsights";
import { useAdminState } from "./state/adminState";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "./utils/featureFlags";
import type { FeatureFlagKey } from "./config/features";
import { getEffectiveRoleFromState, useAuthState, type UserToneGender } from "./state/authState";
import { initAppContentRealtime } from "./state/appContentState";
import { InstallHintBanner } from "./components/InstallHintBanner";
import { GoogleAuthModal } from "./components/GoogleAuthModal";
import { OnboardingWelcomeBubble, type WelcomeSource } from "./components/OnboardingWelcomeBubble";
import { clearPostAuthIntent, getPostAuthIntent, type PostAuthIntent } from "./utils/postAuthIntent";
import { geminiClient } from "./services/geminiClient";
import { isSupabaseReady } from "./services/supabaseClient";

type Screen = "landing" | "goal" | "map" | "guided" | "mission" | "tools";
type PulseCheckContext = "regular" | "start_recovery";

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
  const [showPulseCheck, setShowPulseCheck] = useState(false);
  const [pulseCheckContext, setPulseCheckContext] = useState<PulseCheckContext>("regular");
  const [showCocoon, setShowCocoon] = useState(false);
  const [showNoiseSilencingPulse, setShowNoiseSilencingPulse] = useState(false);
  const [pendingCocoonAfterNoise, setPendingCocoonAfterNoise] = useState(false);
  const [themeBeforePulse, setThemeBeforePulse] = useState<"light" | "dark" | "system" | null>(null);
  const [agentModule, setAgentModule] = useState<AgentModule | null>(null);
  const [lockedFeature, setLockedFeature] = useState<FeatureFlagKey | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname.startsWith("/admin") : false
  );
  const [postAuthIntent, setPostAuthIntentState] = useState<PostAuthIntent | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  /** لما المستخدم يضغط "مش دلوقتي" بعد ضبط البوصلة، نتخطى إظهار البوصلة تاني في نفس الجلسة */
  const skipNextPulseCheckRef = useRef(false);
  /** آخر شاشة — عشان ضبط البوصلة (everyOpen) يظهر فقط عند الخروج من الـ landing، مش عند الانتقال من هدف لخريطة */
  const prevScreenRef = useRef<Screen>("landing");
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [welcome, setWelcome] = useState<{ message: string; source: WelcomeSource } | null>(null);

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
  const pulseCheckMode = usePulseState((s) => s.checkInMode);
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
  const showTopToolsButton = isPrivilegedUser;
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
  const canUseJourneyTools = availableFeatures.journey_tools;
  const canUseAIField = availableFeatures.ai_field;
  const canShowAIChatbot = canUseAIField && isPrivilegedUser;
  const canUsePulseCheck = availableFeatures.pulse_check;
  const shouldGateStartWithAuth = isSupabaseReady && !authUser && !isPrivilegedUser;

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
    const handler = () =>
      setIsAdminRoute(window.location.pathname.startsWith("/admin"));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    const stop = initAppContentRealtime();
    return () => stop();
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
    if (!canUsePulseCheck) return;
    if (skipNextPulseCheckRef.current) {
      skipNextPulseCheckRef.current = false;
      prevScreenRef.current = screen;
      return;
    }
    if (screen === "landing") {
      prevScreenRef.current = "landing";
      return;
    }
    if (pulseCheckMode === "everyOpen") {
      // ضبط البوصلة (everyOpen) يظهر فقط عند الخروج من الـ landing، مش عند الانتقال من هدف → خريطة
      if (prevScreenRef.current !== "landing") {
        prevScreenRef.current = screen;
        return;
      }
      prevScreenRef.current = screen;
      const t = window.setTimeout(() => {
        setPulseCheckContext("regular");
        setShowPulseCheck(true);
      }, 350);
      return () => window.clearTimeout(t);
    }

    const now = new Date();
    const lastPulseDate = lastPulse ? new Date(lastPulse.timestamp) : null;
    const isSameDay =
      lastPulseDate &&
      lastPulseDate.getFullYear() === now.getFullYear() &&
      lastPulseDate.getMonth() === now.getMonth() &&
      lastPulseDate.getDate() === now.getDate();
    if (isSameDay) {
      prevScreenRef.current = screen;
      return;
    }
    prevScreenRef.current = screen;
    const t = window.setTimeout(() => {
      setPulseCheckContext("regular");
      setShowPulseCheck(true);
    }, 350);
    return () => window.clearTimeout(t);
  }, [lastPulse, pulseCheckMode, canUsePulseCheck, screen, shouldGateStartWithAuth]);

  useEffect(() => {
    if (canUsePulseCheck) return;
    if (showPulseCheck && pulseCheckContext === "regular") setShowPulseCheck(false);
  }, [canUsePulseCheck, showPulseCheck, pulseCheckContext]);

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
    if (authStatus !== "ready") return;
    if (!authUser) return;
    const intent = getPostAuthIntent();
    if (!intent) return;
    clearPostAuthIntent();
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
  }, [authStatus, authUser, authFirstName, authToneGender, logPulse]);

  const goToGoals = () => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }
    setScreen("goal");
  };

  const startRecovery = () => {
    if (shouldGateStartWithAuth) {
      trackEvent(AnalyticsEvents.MICRO_COMPASS_OPENED, { source: "landing", gate: "pulse" });
      setWelcome(null);
      setPostAuthIntentState(null);
      setShowAuthModal(false);
      setPulseCheckContext("start_recovery");
      setShowPulseCheck(true);
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

  const openMissionScreen = (nodeId: string) => {
    setMissionNodeId(nodeId);
    setScreen("mission");
  };
  const openJourneyTools = () => {
    if (!canUseJourneyTools) {
      setLockedFeature("journey_tools");
      return;
    }
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
    setScreen("goal");
  };

  const closePulseCheck = () => {
    setShowPulseCheck(false);
    setPulseCheckContext("regular");
  };

  const handlePulseGateSubmit = (payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean }) => {
    trackEvent(AnalyticsEvents.MICRO_COMPASS_COMPLETED, {
      gate: "pulse",
      pulse_energy: payload.energy,
      pulse_mood: payload.mood,
      pulse_focus: payload.focus,
      pulse_auto: payload.auto ?? false
    });
    closePulseCheck();

    const intent: PostAuthIntent = {
      kind: "start_recovery",
      pulse: payload,
      createdAt: Date.now()
    };
    setPostAuthIntentState(intent);
    setShowAuthModal(true);
  };

  const handlePulseSubmit = (payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean }) => {
    logPulse(payload);
    closePulseCheck();

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
      setShowCocoon(true);
    }
  };

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
      <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-slate-900" />}>
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors relative overflow-hidden isolate" dir="rtl">
      <InstallHintBanner />
      <div className="pointer-events-none absolute inset-0 hidden dark:block opacity-[0.06] -z-10" aria-hidden="true">
        <div className="absolute inset-0 ops-room-pattern" />
      </div>
      {isSupabaseReady && !isAdminRoute && !showAuthModal && !showPulseCheck && (
        <div className="fixed z-80 top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-auto pl-4" dir="ltr">
          <button
            type="button"
            onClick={() => {
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
            className="w-11 h-11 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer"
            aria-label={authUser ? "حسابي" : "تسجيل الدخول"}
            title={authUser ? "حسابي" : "تسجيل الدخول"}
          >
            <span className="relative inline-flex items-center justify-center">
              <User className="w-5 h-5" />
              {authUser && (
                <span
                  className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                  aria-hidden="true"
                />
              )}
            </span>
          </button>
        </div>
      )}
      {isPrivilegedUser && (
        <Suspense fallback={null}>
          <AppSidebar
            onOpenGym={() => setShowGym(true)}
            onStartJourney={goToGoals}
            onOpenBaseline={() => setShowBaseline(true)}
            onOpenGuidedJourney={() => setScreen("guided")}
            onOpenMission={openMissionScreen}
            onOpenJourneyTools={openJourneyTools}
            onOpenDawayir={openDawayirTool}
            onFeatureLocked={setLockedFeature}
            viewingNodeId={screen === "map" ? selectedNodeId : null}
          />
        </Suspense>
      )}
      <main
        className={`flex-1 min-w-0 flex items-center justify-center px-4 transition-[margin] ${showPulseCheck ? "opacity-0 pointer-events-none select-none" : ""}`}
        style={{ marginRight: isPrivilegedUser ? SIDEBAR_TAB_MARGIN : "0px" }}
        aria-hidden={showPulseCheck}
      >
        <Suspense fallback={<div className="text-slate-500 text-sm">...جاري التحميل</div>}>
            <div key={screen} className="w-full flex justify-center max-w-2xl">
            {screen === "landing" && (
              <Landing
                onStartJourney={startRecovery}
                onOpenTools={openJourneyTools}
                showTopToolsButton={showTopToolsButton}
                showPostStartContent={isPrivilegedUser}
                showToolsSection
                onFeatureLocked={setLockedFeature}
                availableFeatures={availableFeatures}
              />
            )}

            {screen === "goal" && (
              <div className="w-full">
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
                onOpenCocoon={() => setShowCocoon(true)}
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
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
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
            onClose={closePulseCheck}
          />
        )}

        {showCocoon && (
          <CocoonModeModal
            isOpen={showCocoon}
            onStart={() => {
              setShowCocoon(false);
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
                setShowCocoon(true);
              }
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
          <BreathingOverlay onClose={() => setShowBreathing(false)} />
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
          onNotNow={() => {
            setShowAuthModal(false);
            setPostAuthIntentState(null);
            clearPostAuthIntent();
            setWelcome(null);
            skipNextPulseCheckRef.current = true;
            openDawayirSetup();
          }}
        />
      )}

      {showDataManagement && (
        <Suspense fallback={null}>
          <DataManagement isOpen={showDataManagement} onClose={() => setShowDataManagement(false)} />
        </Suspense>
      )}
    </div>
  );
}
