import type { FC } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Briefcase, Home, Heart, Wallet, HelpCircle,
  Users, UserCircle, Star, ArrowRight
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { resolveAdviceCategory, type AdviceCategory } from "@/data/adviceScripts";
import { goalPickerCopy } from "@/copy/goalPicker";
import { useJourneyState } from "@/state/journeyState";
import { usePulseState } from "@/state/pulseState";
import type { PulseFocus, PulseMood } from "@/state/pulseState";
import { soundManager } from "@/services/soundManager";
import type { BaselineAnswers } from "@/data/baselineQuestions";
import { trackEvent, AnalyticsEvents } from "@/services/analytics";

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

const ALL_GOAL_IDS = ["family", "friends", "work", "love", "money", "unknown"];
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
        className="relative w-full aspect-square sm:aspect-auto sm:min-h-[140px] flex flex-col items-center justify-center gap-3 rounded-[2.5rem] p-6 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
        style={{
          background: isSelected
            ? `radial-gradient(circle at center, ${c.bg}, rgba(15,15,28,0.8))`
            : "rgba(255,255,255,0.02)",
          border: `1.5px solid ${isSelected ? c.border : "rgba(255,255,255,0.05)"}`,
          backdropFilter: "blur(14px)",
          boxShadow: isSelected ? `0 20px 40px ${c.glow}` : "none",
          cursor: isEnabled ? "pointer" : "not-allowed"
        }}
        whileHover={isEnabled ? { y: -5, scale: 1.02, backgroundColor: "rgba(255,255,255,0.04)" } : {}}
        whileTap={isEnabled ? { scale: 0.95 } : {}}
      >
        {/* Recommended badge */}
        {isRecommended && !isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4"
            style={{ color: c.color }}
          >
            <Star className="w-4 h-4 fill-current animate-pulse" />
          </motion.div>
        )}

        <motion.div
          animate={isSelected ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-3xl flex items-center justify-center mb-1"
          style={{
            background: isSelected ? c.bg : "rgba(255,255,255,0.03)",
            boxShadow: isSelected ? `0 0 20px ${c.glow}` : "none"
          }}
        >
          <Icon
            className="w-8 h-8"
            style={{ color: isSelected ? c.color : "#64748B" }}
            strokeWidth={1.5}
          />
        </motion.div>

        <div className="space-y-1">
          <p
            className="text-base font-black"
            style={{ color: isSelected ? "white" : "#94A3B8" }}
          >
            {option.label}
          </p>
          <p className="text-[10px] leading-tight opacity-40 px-2" style={{ color: "#E2E8F0" }}>
            {option.subtitle}
          </p>
        </div>

        {!isEnabled && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center text-xs font-bold text-slate-600">
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
  const [selectedId, setSelectedId] = useState<string | null>(initialGoalId ?? null);
  const [isWarping, setIsWarping] = useState(false);
  const mirrorName = useJourneyState((s) => s.mirrorName);
  const baselineAnswers = useJourneyState((s) => s.baselineAnswers);
  const lastPulse = usePulseState((s) => s.lastPulse);

  useEffect(() => {
    const pulse = lastPulse ? { mood: lastPulse.mood, focus: lastPulse.focus, energy: lastPulse.energy } : null;
    setRecommendedGoals(getSmartRecommendations(baselineAnswers, pulse));
  }, [baselineAnswers, lastPulse]);

  const handleSelect = (goalId: string) => {
    setSelectedId(goalId);
    soundManager.playClick();
    soundManager.playEffect('warp');
    
    setIsWarping(true);
    
    const category = resolveAdviceCategory(goalId);
    trackEvent(AnalyticsEvents.GOAL_SELECTED, { goal_id: goalId, category });
    
    // Warp delay for cinematic effect
    setTimeout(() => {
      onContinue(category, goalId);
    }, 1200);
  };

  return (
    <div className="relative w-full flex flex-col items-center">


      {/* Mirror Echo: Subliminal identity resonance */}
      {mirrorName && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.025, scale: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="text-[40vw] font-black text-white whitespace-nowrap"
            style={{ 
                fontFamily: "var(--font-sans)",
              filter: "blur(20px)",
              letterSpacing: "-0.05em"
            }}
          >
            {mirrorName}
          </motion.div>
        </div>
      )}

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
            خطوة ٢ من ٥
          </p>
          <h1
            id="goal-title"
            className="text-3xl sm:text-4xl font-black text-white mb-3"
            style={{ fontFamily: "var(--font-display)", lineHeight: 1.2 }}
          >
            {goalPickerCopy.title}
          </h1>
          <p className="text-sm sm:text-base leading-loose max-w-[40ch] mx-auto" style={{ color: "#64748B" }}>
            {goalPickerCopy.subtitle}
          </p>
        </motion.div>

        {/* ── Goal Cards Grid ── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
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

      {/* Warp Transition Overlay */}
      {isWarping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-1"
          style={{ background: "radial-gradient(circle at center, var(--ds-color-space-deep) 0%, var(--ds-color-space-void) 100%)" }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 10, opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, ease: "circIn" }}
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, white 0%, transparent 70%)",
              filter: "blur(40px)"
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-white text-4xl font-black italic tracking-tighter"
            style={{ fontFamily: "var(--font-display)" }}
          >
            جاري الانتقال...
          </motion.div>
        </motion.div>
      )}
    </div>

  );
};
