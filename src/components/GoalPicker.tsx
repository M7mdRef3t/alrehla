import type { FC } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Briefcase, Home, Heart, Wallet, HelpCircle,
  Users, UserCircle, Star, ArrowRight
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { resolveAdviceCategory, type AdviceCategory } from "../data/adviceScripts";
import { goalPickerCopy } from "../copy/goalPicker";
import { useJourneyState } from "../state/journeyState";
import { usePulseState } from "../state/pulseState";
import type { PulseFocus, PulseMood } from "../state/pulseState";
import type { BaselineAnswers } from "../data/baselineQuestions";
import { trackEvent, AnalyticsEvents } from "../services/analytics";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  work: Briefcase,
  family: Home,
  friends: Users,
  love: Heart,
  money: Wallet,
  self: UserCircle,
  unknown: HelpCircle
};

const GOAL_COLORS: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  work:    { color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)",  glow: "rgba(96,165,250,0.20)"  },
  family:  { color: "#34D399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)",  glow: "rgba(52,211,153,0.20)"  },
  friends: { color: "#A78BFA", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)", glow: "rgba(167,139,250,0.20)" },
  love:    { color: "#FB7185", bg: "rgba(251,113,133,0.10)", border: "rgba(251,113,133,0.25)", glow: "rgba(251,113,133,0.20)" },
  money:   { color: "#FBBF24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)",  glow: "rgba(251,191,36,0.20)"  },
  self:    { color: "#14B8A6", bg: "rgba(20,184,166,0.10)",  border: "rgba(20,184,166,0.25)",  glow: "rgba(20,184,166,0.20)"  },
  unknown: { color: "#94A3B8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.18)", glow: "rgba(148,163,184,0.12)" },
};

const ALL_GOAL_IDS = ["family", "friends", "work", "love", "money", "self", "unknown"];
const ENABLED_GOAL_IDS = ALL_GOAL_IDS;

/* ─── Animations ─────────────────────────────────────────────────────────────── */

const cosmicEase = [0.22, 1, 0.36, 1] as [number, number, number, number];

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: cosmicEase } }
};

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.96, filter: "blur(5px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
    transition: { delay: i * 0.07, duration: 0.55, ease: cosmicEase }
  })
};

/* ─── Recommendation Logic ───────────────────────────────────────────────────── */

function getPulseRecommendations(pulse: { mood: PulseMood; focus: PulseFocus; energy: number }): string[] {
  const { mood, focus, energy } = pulse;
  const recs: string[] = [];
  if (focus === "event" && (mood === "angry" || mood === "anxious" || mood === "tense")) recs.push("family", "work");
  if (focus === "event" && mood === "sad") recs.push("family", "friends");
  if (focus === "thought" && (mood === "anxious" || mood === "sad" || mood === "overwhelmed")) recs.push("unknown", "friends");
  if (focus === "body" || energy <= 3) recs.push("money", "unknown");
  if (focus === "none" && energy >= 6) recs.push("money", "work");
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
  if (q1 != null && q1 <= 2) recommendations.push("family", "friends");
  if (q2 != null && q2 >= 4) recommendations.push("work", "money");
  if (q3 === "no") recommendations.push("love");
  if (q4 != null && q4 >= 4) return ENABLED_GOAL_IDS;
  const baseline = recommendations.length > 0 ? recommendations : ["family"];
  return pulseRecs.length > 0 ? [...new Set([...pulseRecs, ...baseline])] : baseline;
}

/* ─── Goal Card ──────────────────────────────────────────────────────────────── */

interface GoalCardProps {
  option: { id: string; label: string; subtitle: string };
  index: number;
  isEnabled: boolean;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: (id: string) => void;
}

const GoalCard: FC<GoalCardProps> = ({ option, index, isEnabled, isSelected, isRecommended, onSelect }) => {
  const Icon = ICON_MAP[option.id] ?? HelpCircle;
  const c = GOAL_COLORS[option.id] ?? GOAL_COLORS.unknown;

  return (
    <motion.div
      custom={index}
      variants={tileVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.button
        type="button"
        disabled={!isEnabled}
        onClick={() => isEnabled && onSelect(option.id)}
        className="relative w-full flex flex-col gap-3 rounded-2xl p-5 text-right transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
        style={{
          background: isSelected ? c.bg : "rgba(15,15,28,0.55)",
          border: `1.5px solid ${isSelected ? c.border : "rgba(255,255,255,0.06)"}`,
          backdropFilter: "blur(14px)",
          boxShadow: isSelected ? `0 0 24px ${c.glow}, 0 8px 24px rgba(0,0,0,0.2)` : "0 4px 20px rgba(0,0,0,0.15)",
          opacity: isEnabled ? 1 : 0.45,
          cursor: isEnabled ? "pointer" : "not-allowed"
        }}
        whileHover={isEnabled ? { y: -3, scale: 1.02 } : {}}
        whileTap={isEnabled ? { scale: 0.98 } : {}}
        transition={{ duration: 0.2 }}
      >
        {/* Recommended badge */}
        {isRecommended && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + index * 0.07, type: "spring", stiffness: 300 }}
            className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
          >
            <Star className="w-2.5 h-2.5" />
            مناسب ليك
          </motion.div>
        )}

        {/* Selected indicator line */}
        {isSelected && (
          <motion.div
            layoutId="selected-indicator"
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: `2px solid ${c.color}`, opacity: 0.6 }}
          />
        )}

        {/* Icon + label row */}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isSelected ? c.bg : "rgba(255,255,255,0.04)",
              border: `1px solid ${isSelected ? c.border : "rgba(255,255,255,0.06)"}`,
              boxShadow: isSelected ? `0 0 16px ${c.glow}` : "none"
            }}
            whileHover={isEnabled ? { scale: 1.08 } : {}}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: isSelected ? c.color : isEnabled ? "#94A3B8" : "#475569" }}
            />
          </motion.div>

          <div className="flex-1 text-right">
            <p
              className="text-sm font-black mb-0.5"
              style={{ color: isSelected ? c.color : "#E2E8F0", fontFamily: "Tajawal, sans-serif" }}
            >
              {option.label}
            </p>
            <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "#64748B" }}>
              {option.subtitle}
            </p>
          </div>
        </div>

        {/* "Coming soon" overlay */}
        {!isEnabled && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl text-xs font-bold"
            style={{ background: "rgba(10,10,26,0.8)", color: "#475569" }}
          >
            قريباً
          </div>
        )}
      </motion.button>
    </motion.div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */

interface GoalPickerProps {
  initialGoalId?: string;
  onBack: () => void;
  onContinue: (category: AdviceCategory, goalId: string) => void;
}

export const GoalPicker: FC<GoalPickerProps> = ({ initialGoalId, onBack, onContinue }) => {
  const [recommendedGoals, setRecommendedGoals] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialGoalId);
  const baselineAnswers = useJourneyState((s) => s.baselineAnswers);
  const lastPulse = usePulseState((s) => s.lastPulse);

  useEffect(() => {
    const pulse = lastPulse ? { mood: lastPulse.mood, focus: lastPulse.focus, energy: lastPulse.energy } : null;
    setRecommendedGoals(getSmartRecommendations(baselineAnswers, pulse));
  }, [baselineAnswers, lastPulse]);

  const handleSelect = (goalId: string) => {
    setSelectedId(goalId);
    const category = resolveAdviceCategory(goalId);
    trackEvent(AnalyticsEvents.GOAL_SELECTED, { goal_id: goalId, category });
    // Small delay for animation to complete
    setTimeout(() => {
      onContinue(category, goalId);
    }, 220);
  };

  return (
    <main
      className="relative w-full min-h-screen flex flex-col items-center"
      style={{ background: "#0A0A1A", fontFamily: "IBM Plex Sans Arabic, Tajawal, sans-serif" }}
      dir="rtl"
      aria-labelledby="goal-title"
    >
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: [
            "radial-gradient(ellipse 60% 40% at 20% 15%, rgba(124,58,237,0.08) 0%, transparent 55%)",
            "radial-gradient(ellipse 50% 35% at 80% 80%, rgba(20,184,166,0.06) 0%, transparent 50%)"
          ].join(", ")
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      <div className="relative w-full max-w-2xl px-5 pt-10 pb-20 flex flex-col gap-8">

        {/* ── Header ── */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Step indicator */}
          <div className="inline-flex items-center gap-2 mb-5">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="rounded-full transition-all duration-300"
                style={{
                  width: step === 2 ? 20 : 8,
                  height: 8,
                  background: step === 2
                    ? "linear-gradient(90deg, #14B8A6, #7C3AED)"
                    : step < 2 ? "rgba(20,184,166,0.5)" : "rgba(255,255,255,0.1)"
                }}
              />
            ))}
          </div>

          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#7C3AED" }}>
            خطوة ٢ من ٤
          </p>
          <h1
            id="goal-title"
            className="text-3xl sm:text-4xl font-black text-white mb-3"
            style={{ fontFamily: "Tajawal, sans-serif", lineHeight: 1.2 }}
          >
            {goalPickerCopy.title}
          </h1>
          <p className="text-sm sm:text-base leading-loose max-w-[40ch] mx-auto" style={{ color: "#64748B" }}>
            {goalPickerCopy.subtitle}
          </p>
        </motion.div>

        {/* ── Goal Cards Grid ── */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          role="group"
          aria-label="أختار مجال الرحلة"
        >
          {goalPickerCopy.options.map((option, i) => (
            <GoalCard
              key={option.id}
              option={option}
              index={i}
              isEnabled={ENABLED_GOAL_IDS.includes(option.id)}
              isSelected={selectedId === option.id}
              isRecommended={recommendedGoals.includes(option.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* ── Back button ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="flex justify-center pt-2"
        >
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 hover:opacity-70"
            style={{ color: "#475569", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
          >
            <ArrowRight className="w-4 h-4" />
            {goalPickerCopy.buttons.back}
          </button>
        </motion.div>

        {/* Privacy note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center text-[11px] font-medium"
          style={{ color: "#334155" }}
        >
          🔒 اختيارك خاص وبيتخزن على جهازك بس
        </motion.p>
      </div>
    </main>
  );
};
