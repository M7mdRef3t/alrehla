import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Landing } from "./components/Landing";
import { GoalPicker } from "./components/GoalPicker";
import { CoreMapScreen } from "./components/CoreMapScreen";
import { AppSidebar } from "./components/AppSidebar";
import { RelationshipGym } from "./components/RelationshipGym";
import { BaselineAssessment } from "./components/BaselineAssessment";
import { AIChatbot } from "./components/AIChatbot";
import { useJourneyState } from "./state/journeyState";
import type { AdviceCategory } from "./data/adviceScripts";

type Screen = "landing" | "goal" | "map";

const LANDING_AUTO_REDIRECT_MS = 10000;
/** مسافة للمينيو — تاب صغير ظاهر (الشريط يظهر عند التحريك) */
const SIDEBAR_TAB_MARGIN = "2.5rem"; // w-10

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [category, setCategory] = useState<AdviceCategory>("general");
  const [goalId, setGoalId] = useState<string>("unknown");
  const [showGym, setShowGym] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);

  /** بعد ما الكلام يظهر، نصبر 10 ثواني وندخل تلقائي على قائمة الأهداف */
  useEffect(() => {
    if (screen !== "landing") return;
    const t = setTimeout(() => setScreen("goal"), LANDING_AUTO_REDIRECT_MS);
    return () => clearTimeout(t);
  }, [screen]);

  const goToGoals = () => setScreen("goal");

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <AppSidebar
        onOpenGym={() => setShowGym(true)}
        onStartJourney={goToGoals}
        onOpenBaseline={() => setShowBaseline(true)}
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
          {screen === "landing" && <Landing />}

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
            <CoreMapScreen category={category} goalId={goalId} />
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
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
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

      <AIChatbot />
    </div>
  );
}
