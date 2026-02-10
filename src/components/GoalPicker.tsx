import type { FC } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Briefcase,
  Home,
  Heart,
  Wallet,
  HelpCircle,
  Users,
  Star,
  Target
} from "lucide-react";
import { resolveAdviceCategory, type AdviceCategory } from "../data/adviceScripts";
import { goalPickerCopy } from "../copy/goalPicker";
import { useJourneyState } from "../state/journeyState";
import { EditableText } from "./EditableText";
import { trackEvent, AnalyticsEvents } from "../services/analytics";

/* ════════════════════════════════════════════════
   🌌 GOAL PICKER — Cosmic Orbit Selection
   ════════════════════════════════════════════════ */

const ICON_MAP: Record<string, any> = {
  work: Briefcase,
  family: Home,
  friends: Users,
  love: Heart,
  money: Wallet,
  unknown: HelpCircle
};

const ENABLED_GOAL_IDS = ["family", "friends", "work", "love", "money", "unknown"];

const cosmicEase = [0.22, 1, 0.36, 1] as [number, number, number, number];

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: cosmicEase
    }
  })
};

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: cosmicEase }
  }
};

function getSmartRecommendations(baselineAnswers?: any): string[] {
  if (!baselineAnswers) return [];
  const recommendations: string[] = [];
  if (baselineAnswers.q1 && baselineAnswers.q1 <= 2) {
    recommendations.push("family", "friends");
  }
  if (baselineAnswers.q2 && baselineAnswers.q2 >= 4) {
    recommendations.push("work", "money");
  }
  if (baselineAnswers.q3 === "no") {
    recommendations.push("love");
  }
  if (baselineAnswers.q4 && baselineAnswers.q4 >= 4) {
    return ENABLED_GOAL_IDS;
  }
  return recommendations.length > 0 ? recommendations : ["family"];
}

interface GoalPickerProps {
  initialGoalId?: string;
  onBack: () => void;
  onContinue: (category: AdviceCategory, goalId: string) => void;
}

export const GoalPicker: FC<GoalPickerProps> = ({
  initialGoalId,
  onBack,
  onContinue
}) => {
  const [recommendedGoals, setRecommendedGoals] = useState<string[]>([]);
  const baselineAnswers = useJourneyState((s) => s.baselineAnswers);

  useEffect(() => {
    const recommendations = getSmartRecommendations(baselineAnswers);
    setRecommendedGoals(recommendations);
  }, [baselineAnswers]);

  const handleSelect = (goalId: string) => {
    if (!ENABLED_GOAL_IDS.includes(goalId)) return;
    const category = resolveAdviceCategory(goalId);
    trackEvent(AnalyticsEvents.GOAL_SELECTED, { goal_id: goalId, category });
    onContinue(category, goalId);
  };

  return (
    <main
      className="w-full max-w-4xl py-10 md:py-14 text-center"
      aria-labelledby="goal-title"
    >
      {/* Progress indicator — cosmic style */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <div className="flex items-center justify-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(139, 92, 246, 0.15))",
              border: "1px solid rgba(45, 212, 191, 0.3)",
              boxShadow: "0 0 20px rgba(45, 212, 191, 0.15)"
            }}
          >
            <Target className="w-5 h-5" style={{ color: "var(--soft-teal)" }} />
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              خطوة 2 من 4
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              اختيار الهدف
            </p>
          </div>
        </div>
        <div
          className="mt-3 w-full max-w-xs mx-auto h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.06)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--soft-teal), rgba(139, 92, 246, 0.6))",
              boxShadow: "0 0 8px rgba(45, 212, 191, 0.3)"
            }}
            initial={{ width: "25%" }}
            animate={{ width: "50%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Emotional introduction */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-12"
      >
        <h1
          id="goal-title"
          className="text-3xl md:text-4xl font-bold mb-6"
          style={{ color: "var(--text-primary)", letterSpacing: "var(--tracking-wider)" }}
        >
          <EditableText id="goal_picker_title" defaultText={goalPickerCopy.title} page="goal_picker" />
        </h1>
        <p
          className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          <EditableText
            id="goal_picker_subtitle"
            defaultText={goalPickerCopy.subtitle}
            page="goal_picker"
            multiline
            showEditIcon={false}
          />
        </p>
      </motion.div>

      {/* Goal cards — Glass Orbs */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 justify-items-center max-w-4xl mx-auto mb-12"
        role="group"
        aria-label="اختر أكثر حاجة شاغلة بالك"
      >
        {goalPickerCopy.options.map((option, i) => {
          const Icon = ICON_MAP[option.id];
          const isEnabled = ENABLED_GOAL_IDS.includes(option.id);
          const isSelected = initialGoalId != null && option.id === initialGoalId;
          const isRecommended = recommendedGoals.includes(option.id);

          return (
            <motion.div
              key={option.id}
              custom={i}
              variants={tileVariants}
              initial="hidden"
              animate="visible"
              className="relative group"
            >
              {/* Recommended badge */}
              {isRecommended && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 400 }}
                  className="absolute -top-3 -right-3 z-10"
                >
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
                    style={{
                      background: "linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(139, 92, 246, 0.15))",
                      border: "1px solid rgba(45, 212, 191, 0.35)",
                      color: "var(--soft-teal)",
                      boxShadow: "0 0 16px rgba(45, 212, 191, 0.2)"
                    }}
                  >
                    <Star className="w-3 h-3" />
                    موصى به
                  </div>
                </motion.div>
              )}

              <motion.button
                type="button"
                className="group/card relative w-full max-w-[320px] text-center transition-all duration-300 focus-visible:outline-none select-none"
                style={{
                  background: isSelected
                    ? "rgba(45, 212, 191, 0.08)"
                    : "rgba(15, 20, 50, 0.5)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: `1.5px solid ${
                    !isEnabled
                      ? "rgba(255, 255, 255, 0.04)"
                      : isSelected
                        ? "rgba(45, 212, 191, 0.35)"
                        : "rgba(255, 255, 255, 0.08)"
                  }`,
                  borderRadius: "1.25rem",
                  padding: "2rem",
                  boxShadow: isSelected
                    ? "0 0 30px rgba(45, 212, 191, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    : "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                  opacity: isEnabled ? 1 : 0.5,
                  cursor: isEnabled ? "pointer" : "not-allowed"
                }}
                onClick={() => handleSelect(option.id)}
                title={isEnabled ? option.label : "قريبًا"}
                disabled={!isEnabled}
                whileTap={isEnabled ? { scale: 0.97 } : undefined}
                whileHover={isEnabled ? { scale: 1.03, y: -4 } : {}}
              >
                {!isEnabled && (
                  <span
                    className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] opacity-0 group-hover/card:opacity-100 transition-opacity z-10 text-base font-bold"
                    style={{
                      background: "rgba(10, 10, 26, 0.85)",
                      color: "var(--text-muted)"
                    }}
                  >
                    <EditableText
                      id="goal_picker_coming_soon"
                      defaultText="قريبًا"
                      page="goal_picker"
                      showEditIcon={false}
                    />
                  </span>
                )}

                <div className="flex justify-center mb-4">
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: isEnabled
                        ? "radial-gradient(circle at 40% 35%, rgba(45, 212, 191, 0.15), rgba(139, 92, 246, 0.08) 60%, transparent 80%)"
                        : "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${isEnabled ? "rgba(45, 212, 191, 0.2)" : "rgba(255, 255, 255, 0.06)"}`,
                      boxShadow: isEnabled ? "0 0 20px rgba(45, 212, 191, 0.1)" : "none"
                    }}
                    whileHover={isEnabled ? { scale: 1.1 } : {}}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon
                      className="w-8 h-8"
                      style={{
                        color: isEnabled ? "var(--soft-teal)" : "var(--text-muted)"
                      }}
                      aria-hidden="true"
                    />
                  </motion.div>
                </div>

                <p
                  className="text-lg font-bold mb-2"
                  style={{ color: isEnabled ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  <EditableText
                    id={`goal_picker_option_${option.id}_label`}
                    defaultText={option.label}
                    page="goal_picker"
                    editOnClick={false}
                  />
                </p>

                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isEnabled ? "var(--text-secondary)" : "var(--text-muted)" }}
                >
                  <EditableText
                    id={`goal_picker_option_${option.id}_subtitle`}
                    defaultText={option.subtitle}
                    page="goal_picker"
                    multiline
                    editOnClick={false}
                  />
                </p>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Back button */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex justify-center"
      >
        <motion.button
          type="button"
          className="glass-button px-8 py-4 text-base font-medium select-none"
          style={{ color: "var(--text-secondary)" }}
          onClick={onBack}
          title="رجوع للشاشة السابقة"
          aria-label="رجوع"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <EditableText
            id="goal_picker_back"
            defaultText={goalPickerCopy.buttons.back}
            page="goal_picker"
            editOnClick={false}
          />
        </motion.button>
      </motion.div>
    </main>
  );
};
