import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Landing } from "./components/Landing";
import { GoalPicker } from "./components/GoalPicker";
import { CoreMapScreen } from "./components/CoreMapScreen";
import { AppSidebar } from "./components/AppSidebar";
import { RelationshipGym } from "./components/RelationshipGym";
import { BaselineAssessment } from "./components/BaselineAssessment";
import { BreathingOverlay } from "./components/BreathingOverlay";
import { AIChatbot } from "./components/AIChatbot";
import { EmergencyOverlay } from "./components/EmergencyOverlay";
import { AchievementToast } from "./components/Achievements";
import { useNotificationState } from "./state/notificationState";
import { useEmergencyState } from "./state/emergencyState";
import { useMapState } from "./state/mapState";
import { useJourneyState } from "./state/journeyState";
import { useAchievementState, getLibraryOpenedAt, getBreathingUsedAt } from "./state/achievementState";
import { trackPageView } from "./services/analytics";
import type { AdviceCategory } from "./data/adviceScripts";
import {
  createAgentActions,
  resolvePersonFromNodes,
  buildAgentSystemPrompt
} from "./agent";

type Screen = "landing" | "goal" | "map";

/** مسافة للمينيو — تاب صغير ظاهر (الشريط يظهر عند التحريك) */
const SIDEBAR_TAB_MARGIN = "2.5rem"; // w-10

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [category, setCategory] = useState<AdviceCategory>("general");
  const [goalId, setGoalId] = useState<string>("unknown");
  const [showGym, setShowGym] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const recordUserActivity = useNotificationState((s) => s.recordUserActivity);
  const isEmergencyOpen = useEmergencyState((s) => s.isOpen);
  const nodes = useMapState((s) => s.nodes);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const checkAndUnlock = useAchievementState((s) => s.checkAndUnlock);

  // فحص الإنجازات عند تغيّر الخريطة أو الرحلة
  useEffect(() => {
    if (screen !== "map") return;
    checkAndUnlock({
      nodes,
      baselineCompletedAt: baselineCompletedAt ?? null,
      libraryOpenedAt: getLibraryOpenedAt(),
      breathingUsedAt: getBreathingUsedAt()
    });
  }, [screen, nodes, baselineCompletedAt, checkAndUnlock]);

  // تسجيل النشاط عند تغيير الشاشة (تفاعل حقيقي)
  useEffect(() => {
    if (screen !== "landing") {
      recordUserActivity();
    }
  }, [screen, recordUserActivity]);

  // تتبع الصفحة للـ Analytics
  useEffect(() => {
    const pageNames: Record<Screen, string> = {
      landing: "الرئيسية",
      goal: "اختيار الهدف",
      map: "خريطة العلاقات"
    };
    trackPageView(pageNames[screen]);
  }, [screen]);

  const goToGoals = () => setScreen("goal");

  useEffect(() => {
    if (screen !== "map") setSelectedNodeId(null);
  }, [screen]);

  const agentContext = useMemo(
    () => ({
      nodesSummary: nodes.map((n) => ({ id: n.id, label: n.label, ring: n.ring })),
      screen,
      selectedNodeId,
      goalId,
      category
    }),
    [nodes, screen, selectedNodeId, goalId, category]
  );

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors" dir="rtl">
      <AppSidebar
        onOpenGym={() => setShowGym(true)}
        onStartJourney={goToGoals}
        onOpenBaseline={() => setShowBaseline(true)}
        viewingNodeId={screen === "map" ? selectedNodeId : null}
      />
      <main
        className="flex-1 min-w-0 flex items-center justify-center px-4 transition-[margin]"
        style={{ marginRight: SIDEBAR_TAB_MARGIN }}
      >
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full flex justify-center max-w-2xl"
        >
          {screen === "landing" && <Landing onStartJourney={goToGoals} />}

          {screen === "goal" && (
            <GoalPicker
              onBack={() => setScreen("landing")}
              onContinue={(nextCategory, nextGoalId) => {
                setCategory(nextCategory);
                setGoalId(nextGoalId);
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
            />
          )}
        </motion.div>
      </main>

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

      <AIChatbot
        agentContext={agentContext}
        agentActions={agentActions}
        systemPromptOverride={buildAgentSystemPrompt(agentContext)}
        onOpenBreathing={() => setShowBreathing(true)}
        onNavigateToMap={() => setScreen("map")}
      />
      <AchievementToast />

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
    </div>
  );
}
