import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Landing } from "./components/Landing";
import { GoalPicker } from "./components/GoalPicker";
import { CoreMapScreen } from "./components/CoreMapScreen";
import { GuidedJourneyFlow } from "./components/GuidedJourneyFlow";
import { AIChatbot } from "./components/AIChatbot";
import { useJourneyState } from "./state/journeyState";
import type { AdviceCategory } from "./data/adviceScripts";

type Screen = "landing" | "goal" | "map" | "journey";

const LANDING_AUTO_REDIRECT_MS = 10000;

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [category, setCategory] = useState<AdviceCategory>("general");
  const [goalId, setGoalId] = useState<string>("unknown");
  const isReturningUser = useJourneyState((s) => s.baselineCompletedAt != null);

  /** الانتقال التلقائي للرحلة للمستخدم الرجّاع فقط (مش أول مرة) */
  useEffect(() => {
    if (screen !== "landing" || !isReturningUser) return;
    const t = setTimeout(() => setScreen("journey"), LANDING_AUTO_REDIRECT_MS);
    return () => clearTimeout(t);
  }, [screen, isReturningUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        key={screen}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full flex justify-center"
      >
        {screen === "landing" && (
          <Landing onStartJourney={() => setScreen("journey")} />
        )}

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

        {screen === "journey" && (
          <GuidedJourneyFlow
            onBackToLanding={() => setScreen("landing")}
            onFinishJourney={() => {
              useJourneyState.getState().resetJourney();
              setScreen("landing");
            }}
          />
        )}
      </motion.div>

      {/* AI Chatbot - Available on all screens */}
      <AIChatbot />
    </div>
  );
}
