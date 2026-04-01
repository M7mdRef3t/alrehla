import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAchievementState } from "../state/achievementState";

interface BreathingOverlayProps {
  onClose: () => void;
  autoCloseAfterCycles?: number;
}

// Scientific 4-2-6 breathing pattern (box breathing variant)
const INHALE_MS = 4000;
const HOLD_MS   = 2000;
const EXHALE_MS = 6000;
const CYCLE_MS  = INHALE_MS + HOLD_MS + EXHALE_MS; // 12 000ms

const DEFAULT_CYCLES = 4;

type Phase = "inhale" | "hold" | "exhale";

const CYCLE_PHRASES = [
  "جسمك بيشكرك دلوقتي",
  "الهواء ده بتاعك وحدك",
  "خلّي الضغط يمشي مع الزفير",
  "أنت بتشتغل صح",
];

const PHASE_COLORS: Record<Phase, string> = {
  inhale: "#2dd4bf",   // teal
  hold:   "#818cf8",   // indigo
  exhale: "#f5a623",   // amber
};

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "شهيق",
  hold:   "ثبّت",
  exhale: "زفير",
};

const PHASE_SUBLABELS: Record<Phase, string> = {
  inhale: "امتلئ",
  hold:   "احتفظ",
  exhale: "افرد",
};

// SVG circle props
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const BreathingOverlay: FC<BreathingOverlayProps> = ({
  onClose,
  autoCloseAfterCycles = DEFAULT_CYCLES,
}) => {
  const [phase, setPhase]             = useState<Phase>("inhale");
  const [cycleCount, setCycleCount]   = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0); // 0→1 during each phase
  const [showExitHint, setShowExitHint]   = useState(false);
  const markBreathingUsed = useAchievementState((s) => s.markBreathingUsed);

  useEffect(() => { markBreathingUsed(); }, [markBreathingUsed]);

  // Show exit hint after 30 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowExitHint(true), 30_000);
    return () => clearTimeout(t);
  }, []);

  // Phase sequencer
  useEffect(() => {
    let startedAt = Date.now();
    let currentPhase: Phase = "inhale";
    let currentCycles = 0;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const phaseDuration =
        currentPhase === "inhale" ? INHALE_MS :
        currentPhase === "hold"   ? HOLD_MS :
                                    EXHALE_MS;

      const progress = Math.min(elapsed / phaseDuration, 1);
      setPhaseProgress(progress);

      if (elapsed >= phaseDuration) {
        startedAt = Date.now();
        if (currentPhase === "inhale") {
          currentPhase = "hold";
        } else if (currentPhase === "hold") {
          currentPhase = "exhale";
        } else {
          currentPhase = "inhale";
          currentCycles += 1;
          setCycleCount(currentCycles);
          if (autoCloseAfterCycles > 0 && currentCycles >= autoCloseAfterCycles) {
            onClose();
            return;
          }
        }
        setPhase(currentPhase);
        setPhaseProgress(0);
      }
    };

    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [autoCloseAfterCycles, onClose]);

  const accentColor = PHASE_COLORS[phase];

  // SVG stroke-dashoffset drives the ring fill
  const strokeOffset = CIRCUMFERENCE * (1 - phaseProgress);

  // Scale for the inner orb
  const orbScale =
    phase === "inhale" ? 0.75 + phaseProgress * 0.45 :  // 0.75 → 1.20
    phase === "hold"   ? 1.2 :
                        1.2 - phaseProgress * 0.45;      // 1.20 → 0.75

  const phraseIndex = Math.min(cycleCount, CYCLE_PHRASES.length - 1);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-between"
      style={{ background: "#010207", colorScheme: "dark" }}
      role="dialog"
      aria-modal="true"
      aria-label="تمرين التنفس"
      dir="rtl"
    >
      {/* Deep ambient orb */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}0d 0%, transparent 65%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "background 2s ease",
          pointerEvents: "none"
        }}
      />

      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-6 pt-8 pb-4 relative z-10">
        <div
          className="text-xs font-black uppercase tracking-[0.28em]"
          style={{ color: "rgba(148,163,184,0.4)" }}
        >
          الملاذ الآمن
        </div>
        <AnimatePresence>
          {showExitHint && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(148,163,184,0.6)"
              }}
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
              <span className="text-xs font-black tracking-widest uppercase">خروج</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Central breathing engine */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10 px-6">

        {/* Phase label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p
              className="text-4xl font-black tracking-tight mb-1"
              style={{ color: accentColor, textShadow: `0 0 40px ${accentColor}60` }}
            >
              {PHASE_LABELS[phase]}
            </p>
            <p
              className="text-xs font-black uppercase tracking-[0.3em]"
              style={{ color: `${accentColor}80` }}
            >
              {PHASE_SUBLABELS[phase]}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* SVG Breathing Ring + Inner Orb */}
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          {/* Outer progress ring */}
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            style={{ position: "absolute", transform: "rotate(-90deg)" }}
          >
            {/* Track */}
            <circle
              cx="110" cy="110" r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="3"
            />
            {/* Progress arc */}
            <motion.circle
              cx="110" cy="110" r={RADIUS}
              fill="none"
              stroke={accentColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              style={{
                filter: `drop-shadow(0 0 8px ${accentColor}90)`,
                transition: "stroke 2s ease, stroke-dashoffset 0.05s linear"
              }}
            />
          </svg>

          {/* Middle static ring */}
          <div
            style={{
              position: "absolute",
              width: 140,
              height: 140,
              borderRadius: "50%",
              border: `1px solid ${accentColor}25`,
              transition: "border-color 2s ease"
            }}
          />

          {/* Inner breathing orb */}
          <motion.div
            animate={{ scale: orbScale }}
            transition={{ duration: 0.05, ease: "linear" }}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
              border: `1px solid ${accentColor}50`,
              boxShadow: `0 0 40px ${accentColor}30, inset 0 0 20px ${accentColor}10`,
              transition: "background 2s ease, border-color 2s ease, box-shadow 2s ease"
            }}
          />
        </div>

        {/* Cycle phrase */}
        <AnimatePresence mode="wait">
          {cycleCount > 0 && (
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-sm font-medium text-center max-w-xs"
              style={{ color: "rgba(148,163,184,0.55)" }}
            >
              {CYCLE_PHRASES[phraseIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: cycle dots + end button */}
      <div className="w-full flex flex-col items-center gap-6 px-6 pb-10 relative z-10">
        {/* Cycle counter dots */}
        <div className="flex items-center gap-3">
          {Array.from({ length: autoCloseAfterCycles }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                background: i < cycleCount
                  ? accentColor
                  : i === cycleCount
                    ? `${accentColor}50`
                    : "rgba(255,255,255,0.1)",
                scale: i === cycleCount ? 1.3 : 1
              }}
              transition={{ duration: 0.5 }}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                boxShadow: i < cycleCount ? `0 0 8px ${accentColor}80` : "none"
              }}
            />
          ))}
        </div>

        {/* End button — always visible but subtle initially */}
        <motion.button
          type="button"
          onClick={onClose}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: showExitHint ? 0.9 : 0.3 }}
          whileHover={{ opacity: 1 }}
          className="px-8 py-3 rounded-2xl text-sm font-black tracking-wider transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(148,163,184,0.7)"
          }}
        >
          إنهاء التنفس
        </motion.button>
      </div>
    </div>
  );
};
