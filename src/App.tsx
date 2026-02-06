import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Landing } from "./components/Landing";
import { GoalPicker } from "./components/GoalPicker";
import { AppSidebar } from "./components/AppSidebar";
import { AchievementToast } from "./components/Achievements";
import { useNotificationState } from "./state/notificationState";
import { useEmergencyState } from "./state/emergencyState";
import { useMapState } from "./state/mapState";
import { useJourneyState } from "./state/journeyState";
import { useAchievementState, getLibraryOpenedAt, getBreathingUsedAt } from "./state/achievementState";
import { useThemeState } from "./state/themeState";
import { usePulseState } from "./state/pulseState";
import type { PulseFocus, PulseMood } from "./state/pulseState";
import { trackPageView } from "./services/analytics";
import { sendNotification, sendPresetNotification, NOTIFICATION_TYPES } from "./services/notifications";
import type { AdviceCategory } from "./data/adviceScripts";
import {
  createAgentActions,
  resolvePersonFromNodes,
  buildAgentSystemPrompt
} from "./agent";
import { getIncompleteMissionSteps } from "./utils/missionProgress";
import { getLastGoalMeta } from "./utils/goalLabel";
import { getWeeklyPulseInsight } from "./utils/pulseInsights";
import { PulseCheckModal } from "./components/PulseCheckModal";
import { CocoonModeModal } from "./components/CocoonModeModal";
import { NoiseSilencingModal } from "./components/NoiseSilencingModal";
import { FeatureLockedModal } from "./components/FeatureLockedModal";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { useAdminState } from "./state/adminState";
import { isFeatureEnabled } from "./utils/featureFlags";
import type { FeatureFlagKey } from "./config/features";
import { fetchAdminConfig } from "./services/adminApi";
import { isSupabaseReady } from "./services/supabaseClient";

type Screen = "landing" | "goal" | "map" | "guided" | "mission" | "tools";

/** مسافة للمينيو — تاب صغير ظاهر (الشريط يظهر عند التحريك) */
const SIDEBAR_TAB_MARGIN = "2.5rem"; // w-10

const CoreMapScreen = lazy(() => import("./components/CoreMapScreen").then((m) => ({ default: m.CoreMapScreen })));
const RelationshipGym = lazy(() => import("./components/RelationshipGym").then((m) => ({ default: m.RelationshipGym })));
const BaselineAssessment = lazy(() => import("./components/BaselineAssessment").then((m) => ({ default: m.BaselineAssessment })));
const BreathingOverlay = lazy(() => import("./components/BreathingOverlay").then((m) => ({ default: m.BreathingOverlay })));
const AIChatbot = lazy(() => import("./components/AIChatbot").then((m) => ({ default: m.AIChatbot })));
const EmergencyOverlay = lazy(() => import("./components/EmergencyOverlay").then((m) => ({ default: m.EmergencyOverlay })));
const GuidedJourneyFlow = lazy(() => import("./components/GuidedJourneyFlow").then((m) => ({ default: m.GuidedJourneyFlow })));
const MissionScreen = lazy(() => import("./components/MissionScreen").then((m) => ({ default: m.MissionScreen })));
const JourneyToolsScreen = lazy(() => import("./components/JourneyToolsScreen").then((m) => ({ default: m.JourneyToolsScreen })));

const preloadCoreMap = () => import("./components/CoreMapScreen");
const preloadChatbot = () => import("./components/AIChatbot");
const preloadGym = () => import("./components/RelationshipGym");

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
  const [showCocoon, setShowCocoon] = useState(false);
  const [showNoiseSilencingPulse, setShowNoiseSilencingPulse] = useState(false);
  const [pendingCocoonAfterNoise, setPendingCocoonAfterNoise] = useState(false);
  const [themeBeforePulse, setThemeBeforePulse] = useState<"light" | "dark" | "system" | null>(null);
  const [lockedFeature, setLockedFeature] = useState<FeatureFlagKey | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname.startsWith("/admin") : false
  );

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
  const theme = useThemeState((s) => s.theme);
  const setTheme = useThemeState((s) => s.setTheme);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const pulseLogs = usePulseState((s) => s.logs);
  const snoozedUntil = usePulseState((s) => s.snoozedUntil);
  const pulseCheckMode = usePulseState((s) => s.checkInMode);
  const logPulse = usePulseState((s) => s.logPulse);
  const snoozeNotifications = usePulseState((s) => s.snoozeNotifications);
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminPrompt = useAdminState((s) => s.systemPrompt);
  const setFeatureFlags = useAdminState((s) => s.setFeatureFlags);
  const setSystemPrompt = useAdminState((s) => s.setSystemPrompt);
  const setScoringWeights = useAdminState((s) => s.setScoringWeights);
  const setScoringThresholds = useAdminState((s) => s.setScoringThresholds);
  const setPulseCheckMode = usePulseState((s) => s.setCheckInMode);

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
    if (!isSupabaseReady) return;
    let cancelled = false;
    fetchAdminConfig()
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
    if (pulseCheckMode === "everyOpen") {
      const t = window.setTimeout(() => setShowPulseCheck(true), 350);
      return () => window.clearTimeout(t);
    }

    const now = new Date();
    const lastPulseDate = lastPulse ? new Date(lastPulse.timestamp) : null;
    const isSameDay =
      lastPulseDate &&
      lastPulseDate.getFullYear() === now.getFullYear() &&
      lastPulseDate.getMonth() === now.getMonth() &&
      lastPulseDate.getDate() === now.getDate();
    if (isSameDay) return;
    const t = window.setTimeout(() => setShowPulseCheck(true), 350);
    return () => window.clearTimeout(t);
  }, [lastPulse, pulseCheckMode, canUsePulseCheck]);

  useEffect(() => {
    if (canUsePulseCheck) return;
    if (showPulseCheck) setShowPulseCheck(false);
  }, [canUsePulseCheck, showPulseCheck]);

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

  const canUseMap = isFeatureEnabled(featureFlags.dawayir_map, betaAccess);
  const canUseJourneyTools = isFeatureEnabled(featureFlags.journey_tools, betaAccess);
  const canUseAIField = isFeatureEnabled(featureFlags.ai_field, betaAccess);
  const canUsePulseCheck = isFeatureEnabled(featureFlags.pulse_check, betaAccess);

  const goToGoals = () => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }
    setScreen("goal");
  };

  useEffect(() => {
    if (screen === "landing") {
      void preloadChatbot();
    }
    if (screen === "goal") {
      void preloadCoreMap();
      void preloadGym();
    }
  }, [screen]);

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

  const handlePulseSubmit = (payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean }) => {
    logPulse(payload);
    setShowPulseCheck(false);

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

  const agentContext = useMemo(
    () => ({
      nodesSummary: nodes.map((n) => ({ id: n.id, label: n.label, ring: n.ring })),
      screen,
      selectedNodeId,
      goalId,
      category,
      pulse: lastPulse
    }),
    [nodes, screen, selectedNodeId, goalId, category, lastPulse]
  );

  const agentSystemPrompt = useMemo(() => {
    const basePrompt = buildAgentSystemPrompt(agentContext);
    const adminTrimmed = adminPrompt?.trim();
    return adminTrimmed ? `${adminTrimmed}\n\n${basePrompt}` : basePrompt;
  }, [agentContext, adminPrompt]);

  const agentActions = useMemo(
    () =>
      createAgentActions({
        resolvePerson: (labelOrId) => resolvePersonFromNodes(labelOrId, nodes),
        onNavigateBreathing: () => setShowBreathing(true),
        onNavigateGym: () => setShowGym(true),
        onNavigateMap: () => setScreen("map"),
        onNavigateBaseline: () => setShowBaseline(true),
        onNavigateEmergency: () => useEmergencyState.getState().open(),
        onNavigatePerson: (nodeId) => {
          setScreen("map");
          setSelectedNodeId(nodeId);
        }
      }),
    [nodes]
  );

  const pulseInsight = useMemo(() => getWeeklyPulseInsight(pulseLogs), [pulseLogs]);

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
      <AdminDashboard
        onExit={() => {
          if (typeof window !== "undefined") {
            window.history.pushState({}, "", "/");
            setIsAdminRoute(false);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors" dir="rtl">
      <AppSidebar
        onOpenGym={() => setShowGym(true)}
        onStartJourney={goToGoals}
        onOpenBaseline={() => setShowBaseline(true)}
        onOpenGuidedJourney={() => setScreen("guided")}
        onOpenMission={openMissionScreen}
        onOpenJourneyTools={canUseJourneyTools ? openJourneyTools : undefined}
        onOpenDawayir={canUseMap ? openDawayirTool : undefined}
        viewingNodeId={screen === "map" ? selectedNodeId : null}
      />
      <main
        className="flex-1 min-w-0 flex items-center justify-center px-4 transition-[margin]"
        style={{ marginRight: SIDEBAR_TAB_MARGIN }}
      >
        <Suspense fallback={<div className="text-slate-500 text-sm">...جاري التحميل</div>}>
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full flex justify-center max-w-2xl"
            >
            {screen === "landing" && (
              <Landing
                onStartJourney={goToGoals}
                onOpenTools={canUseJourneyTools ? openJourneyTools : undefined}
                showToolsSection={canUseJourneyTools}
              />
            )}

            {screen === "goal" && (
              <GoalPicker
                onBack={() => setScreen("landing")}
                onContinue={(nextCategory, nextGoalId) => {
                  setCategory(nextCategory);
                  setGoalId(nextGoalId);
                  useJourneyState.getState().setLastGoal(nextGoalId, nextCategory);
                  setScreen("map");
                }}
              />
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
            </motion.div>
          </AnimatePresence>
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

        {canUseAIField && (
          <AIChatbot
            agentContext={agentContext}
            agentActions={agentActions}
            systemPromptOverride={agentSystemPrompt}
            onOpenBreathing={() => setShowBreathing(true)}
            onNavigateToMap={() => setScreen("map")}
          />
        )}
        <AchievementToast />

        <PulseCheckModal
          isOpen={showPulseCheck}
          onSubmit={handlePulseSubmit}
          onClose={() => setShowPulseCheck(false)}
        />

        <CocoonModeModal
          isOpen={showCocoon}
          onStart={() => {
            setShowCocoon(false);
            setShowBreathing(true);
          }}
          onClose={() => setShowCocoon(false)}
        />

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

        <FeatureLockedModal
          isOpen={lockedFeature != null}
          featureKey={lockedFeature}
          onClose={() => setLockedFeature(null)}
        />

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
    </div>
  );
}
