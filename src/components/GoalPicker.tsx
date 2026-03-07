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
  UserCircle,
  Star,
  Target
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { resolveAdviceCategory, type AdviceCategory } from "../data/adviceScripts";
import { isUserMode } from "../config/appEnv";
import { goalPickerCopy } from "../copy/goalPicker";
import { useJourneyState } from "../state/journeyState";
import { usePulseState } from "../state/pulseState";
import type { PulseFocus, PulseMood } from "../state/pulseState";
import type { BaselineAnswers } from "../data/baselineQuestions";
import { EditableText } from "./EditableText";
import { trackEvent, AnalyticsEvents } from "../services/analytics";
import { Badge, Button, Card } from "./UI";

/* 
   GOAL PICKER - Cosmic Orbit Selection
    */

const ICON_MAP: Record<string, LucideIcon> = {
  work: Briefcase,
  family: Home,
  friends: Users,
  love: Heart,
  money: Wallet,
  self: UserCircle,
  unknown: HelpCircle
};

const ALL_GOAL_IDS = ["family", "friends", "work", "love", "money", "self", "unknown"];
/** ضع استخد: اعة فط. ضع اتطر:  اخرائط. */
const ENABLED_GOAL_IDS = isUserMode ? ["family"] : ALL_GOAL_IDS;

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

/** تصات  ابصة: event+غضبا=صراعات body+طاة خفضة=ستب/اتشاف thought+=تا */
function getPulseRecommendations(pulse: { mood: PulseMood; focus: PulseFocus; energy: number }): string[] {
  const { mood, focus, energy } = pulse;
  const recs: string[] = [];
  if (focus === "event" && (mood === "angry" || mood === "anxious" || mood === "tense")) {
    recs.push("family", "work");
  }
  if (focus === "event" && mood === "sad") {
    recs.push("family", "friends");
  }
  if (focus === "thought" && (mood === "anxious" || mood === "sad" || mood === "overwhelmed")) {
    recs.push("unknown", "friends");
  }
  if (focus === "body" || energy <= 3) {
    recs.push("money", "unknown");
  }
  if (focus === "none" && energy >= 6) {
    recs.push("money", "work");
  }
  return recs.length > 0 ? [...new Set(recs)] : ["unknown"];
}

function getSmartRecommendations(
  baselineAnswers?: BaselineAnswers | null,
  pulse?: { mood: PulseMood; focus: PulseFocus; energy: number } | null
): string[] {
  const pulseRecs = pulse ? getPulseRecommendations(pulse) : [];
  if (!baselineAnswers) return pulseRecs.length > 0 ? pulseRecs : ["unknown"];
  const recommendations: string[] = [];
  const q1 = typeof baselineAnswers.q1 === "number" ? baselineAnswers.q1 : null;
  const q2 = typeof baselineAnswers.q2 === "number" ? baselineAnswers.q2 : null;
  const q3 = typeof baselineAnswers.q3 === "string" ? baselineAnswers.q3 : null;
  const q4 = typeof baselineAnswers.q4 === "number" ? baselineAnswers.q4 : null;
  if (q1 != null && q1 <= 2) {
    recommendations.push("family", "friends");
  }
  if (q2 != null && q2 >= 4) {
    recommendations.push("work", "money");
  }
  if (q3 === "no") {
    recommendations.push("love");
  }
  if (q4 != null && q4 >= 4) {
    return ENABLED_GOAL_IDS;
  }
  const baseline = recommendations.length > 0 ? recommendations : ["family"];
  return pulseRecs.length > 0 ? [...new Set([...pulseRecs, ...baseline])] : baseline;
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
  const lastPulse = usePulseState((s) => s.lastPulse);

  useEffect(() => {
    const pulse = lastPulse ? { mood: lastPulse.mood, focus: lastPulse.focus, energy: lastPulse.energy } : null;
    const recommendations = getSmartRecommendations(baselineAnswers, pulse);
    setRecommendedGoals(recommendations);
  }, [baselineAnswers, lastPulse]);

  const handleSelect = (goalId: string) => {
    if (!ENABLED_GOAL_IDS.includes(goalId)) return;
    const category = resolveAdviceCategory(goalId);
    trackEvent(AnalyticsEvents.GOAL_SELECTED, { goal_id: goalId, category });
    onContinue(category, goalId);
  };

  return (
    <main
      className="w-full max-w-4xl h-full min-h-0 py-2 sm:py-3 text-center overflow-hidden flex flex-col"
      aria-labelledby="goal-title"
    >
      {/* Progress indicator - cosmic style */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-1.5 sm:mb-2 shrink-0"
      >
        <Card className="mx-auto max-w-xl p-3 sm:p-4">
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
              <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>ارحة 2  4</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>تحدد اة</p>
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
        </Card>
      </motion.div>

      {/* Emotional introduction */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-2 sm:mb-3 shrink-0"
      >
        <h1
          id="goal-title"
          className="text-lg sm:text-xl md:text-2xl font-bold mb-1.5 sm:mb-2"
          style={{ color: "var(--text-primary)", letterSpacing: "var(--tracking-wider)" }}
        >
          <EditableText id="goal_picker_title" defaultText={goalPickerCopy.title} page="goal_picker" />
        </h1>
        <p
          className="text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto"
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

      {/* Goal cards  تأ اارتفاع بد سر */}
      <div
        className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 items-stretch justify-items-stretch max-w-4xl mx-auto w-full flex-1 min-h-0 overflow-hidden mb-2 sm:mb-3"
        style={{ gridAutoRows: "minmax(0, 1fr)" }}
        role="group"
        aria-label="حدد ف اة اادة"
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
              className="group h-full min-h-0 flex"
            >
              <motion.button
                type="button"
                className="group/card relative w-full min-w-0 h-full min-h-0 flex flex-col text-center transition-all duration-300 focus-visible:outline-none select-none"
                style={{
                  background: isSelected
                    ? "rgba(45, 212, 191, 0.08)"
                    : "rgba(15, 20, 50, 0.5)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: `1.5px solid ${!isEnabled
                      ? "rgba(255, 255, 255, 0.04)"
                      : isSelected
                        ? "rgba(45, 212, 191, 0.35)"
                        : "rgba(255, 255, 255, 0.08)"
                    }`,
                  borderRadius: "1rem",
                  padding: "0.75rem 0.9rem",
                  boxShadow: isSelected
                    ? "0 0 30px rgba(45, 212, 191, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    : "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                  opacity: isEnabled ? 1 : 0.5,
                  cursor: isEnabled ? "pointer" : "not-allowed"
                }}
                onClick={() => handleSelect(option.id)}
                title={isEnabled ? option.label : "ربا"}
                disabled={!isEnabled}
                whileTap={isEnabled ? { scale: 0.97 } : undefined}
                whileHover={isEnabled ? { scale: 1.02 } : {}}
              >
                {isRecommended && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.45 + i * 0.08, type: "spring", stiffness: 320 }}
                    className="mb-1 sm:mb-1.5 flex justify-center shrink-0"
                  >
                    <Badge
                      className="px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1"
                      style={{
                        background: "linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(139, 92, 246, 0.15))",
                        border: "1px solid rgba(45, 212, 191, 0.35)",
                        color: "var(--soft-teal)",
                        boxShadow: "0 0 12px rgba(45, 212, 191, 0.16)"
                      }}
                    >
                      <Star className="w-3 h-3" />
                      ص ب
                    </Badge>
                  </motion.div>
                )}

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
                      defaultText="ربا"
                      page="goal_picker"
                      showEditIcon={false}
                    />
                  </span>
                )}

                <div className="flex justify-center mb-1 sm:mb-2 shrink-0">
                  <motion.div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
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
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      style={{
                        color: isEnabled ? "var(--soft-teal)" : "var(--text-muted)"
                      }}
                      aria-hidden="true"
                    />
                  </motion.div>
                </div>

                <p
                  className="text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 shrink-0 line-clamp-1"
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
                  className="text-[11px] sm:text-xs leading-relaxed min-h-0 flex-1 line-clamp-2 overflow-hidden"
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
        className="flex justify-center pt-1 shrink-0"
      >
        <Button
          variant="ghost"
          size="md"
          className="glass-button px-6 py-3 text-sm sm:text-base font-medium select-none text-[var(--text-secondary)]"
          onClick={onBack}
          title="رجع شاشة اسابة"
          aria-label="رجع"
        >
          <EditableText
            id="goal_picker_back"
            defaultText={goalPickerCopy.buttons.back}
            page="goal_picker"
            editOnClick={false}
          />
        </Button>
      </motion.div>
    </main>
  );
};
