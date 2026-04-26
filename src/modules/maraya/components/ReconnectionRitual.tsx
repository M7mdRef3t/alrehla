"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind, Heart, BookOpen } from "lucide-react";
import { getGlobalHarmony } from "@/services/globalPulse";
import { getTruthScore, getTruthLevelLabel, getTruthLevelColor } from "@/services/truthScoreEngine";
import type { ReconnectionMessage } from "@/data/reconnectionMessages";

/**
 * 🕊️ Reconnection Ritual — طقس إعادة الربط
 * ===========================================
 * تجربة شاشة كاملة تظهر بعد مواجهة حقيقة مؤلمة.
 * تربط: الجسم (تنفس) + العقل (إدراك) + الروح (آية).
 *
 * Phases:
 * 1. Fade in — stillness (2s)
 * 2. Primary message (hold 4s)
 * 3. Breathing exercise (3 cycles)
 * 4. Quranic verse (hold 5s)
 * 5. Solidarity message (hold 3s)
 * 6. Fade out
 */

interface ReconnectionRitualProps {
  message: ReconnectionMessage;
  onComplete: () => void;
}

type Phase = "enter" | "message" | "breathe" | "ayah" | "solidarity" | "exit";

const PHASE_DURATION: Record<Phase, number> = {
  enter: 2000,
  message: 5000,
  breathe: 18000,   // 3 cycles × ~6s
  ayah: 6000,
  solidarity: 4000,
  exit: 1500,
};

export const ReconnectionRitual: FC<ReconnectionRitualProps> = ({ message, onComplete }) => {
  const [phase, setPhase] = useState<Phase>("enter");
  const [breathCycle, setBreathCycle] = useState(0);
  const [breathState, setBreathState] = useState<"inhale" | "hold" | "exhale">("inhale");

  const harmony = getGlobalHarmony();
  const truthState = getTruthScore();
  const breathConfig = harmony.breathConfig;

  // Phase progression
  useEffect(() => {
    const phases: Phase[] = ["enter", "message", "breathe", "ayah", "solidarity", "exit"];
    const currentIndex = phases.indexOf(phase);

    if (phase === "exit") {
      const t = setTimeout(onComplete, PHASE_DURATION.exit);
      return () => clearTimeout(t);
    }

    if (currentIndex < phases.length - 1) {
      const t = setTimeout(() => {
        setPhase(phases[currentIndex + 1]);
      }, PHASE_DURATION[phase]);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  // Breathing animation
  useEffect(() => {
    if (phase !== "breathe") return;

    let cycle = 0;
    const maxCycles = 3;

    const runBreathCycle = () => {
      if (cycle >= maxCycles) return;

      setBreathState("inhale");
      setBreathCycle(cycle + 1);

      const inhaleTimer = setTimeout(() => {
        setBreathState("hold");

        const holdTimer = setTimeout(() => {
          setBreathState("exhale");

          const exhaleTimer = setTimeout(() => {
            cycle++;
            if (cycle < maxCycles) {
              runBreathCycle();
            }
          }, breathConfig.exhale * 1000);

          return () => clearTimeout(exhaleTimer);
        }, breathConfig.hold * 1000);

        return () => clearTimeout(holdTimer);
      }, breathConfig.inhale * 1000);

      return () => clearTimeout(inhaleTimer);
    };

    runBreathCycle();
  }, [phase, breathConfig]);

  const handleSkip = useCallback(() => {
    setPhase("exit");
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="ritual-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
        className="fixed inset-0 z-[100] flex items-center justify-center select-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(15,23,42,0.97) 0%, rgba(2,6,15,0.99) 100%)",
        }}
        dir="rtl"
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${harmony.color}08 0%, transparent 60%)`,
          }}
        />

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 left-6 p-2 rounded-xl hover:bg-white/5 transition-colors z-10"
          aria-label="تخطي"
        >
          <X className="w-5 h-5 text-slate-600 hover:text-slate-400 transition-colors" />
        </button>

        {/* Content */}
        <div className="max-w-md px-8 text-center space-y-8 relative z-10">
          <AnimatePresence mode="wait">
            {/* Phase: Enter — Stillness */}
            {phase === "enter" && (
              <motion.div
                key="enter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 h-16 mx-auto rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${harmony.color}30, transparent)`,
                    boxShadow: `0 0 60px ${harmony.color}15`,
                  }}
                />
                <p className="text-xs text-slate-600 font-bold tracking-[0.3em] uppercase">
                  خذ لحظة
                </p>
              </motion.div>
            )}

            {/* Phase: Primary Message */}
            {phase === "message" && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <Heart className="w-6 h-6 mx-auto" style={{ color: harmony.color }} />
                <p className="text-lg font-black text-white leading-relaxed tracking-tight">
                  {message.primary}
                </p>

                {/* Truth Score indicator */}
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: getTruthLevelColor(truthState.level) }}
                  />
                  <span className="text-[10px] font-bold" style={{ color: getTruthLevelColor(truthState.level) }}>
                    {getTruthLevelLabel(truthState.level)} — {truthState.score}/100
                  </span>
                </div>
              </motion.div>
            )}

            {/* Phase: Breathing Exercise */}
            {phase === "breathe" && (
              <motion.div
                key="breathe"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <Wind className="w-5 h-5 mx-auto text-slate-500" />

                {/* Breathing circle */}
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: breathState === "inhale" ? 1.6 : breathState === "hold" ? 1.6 : 1,
                      opacity: breathState === "hold" ? 0.8 : 0.4,
                    }}
                    transition={{
                      duration:
                        breathState === "inhale"
                          ? breathConfig.inhale
                          : breathState === "hold"
                          ? breathConfig.hold
                          : breathConfig.exhale,
                      ease: "easeInOut",
                    }}
                    className="w-24 h-24 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${harmony.color}25, transparent)`,
                      border: `2px solid ${harmony.color}20`,
                      boxShadow: `0 0 40px ${harmony.color}10`,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-black text-white">
                    {breathState === "inhale" && "شهيق..."}
                    {breathState === "hold" && "ثبّت..."}
                    {breathState === "exhale" && "زفير..."}
                  </p>
                  <p className="text-[10px] text-slate-600 font-bold">
                    {message.breathPrompt}
                  </p>
                  <p className="text-[9px] text-slate-700 font-mono">
                    {breathCycle}/3
                  </p>
                </div>
              </motion.div>
            )}

            {/* Phase: Quranic Verse */}
            {phase === "ayah" && (
              <motion.div
                key="ayah"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="space-y-4"
              >
                <BookOpen className="w-5 h-5 mx-auto text-amber-400/50" />
                <p
                  className="text-xl font-bold leading-[2.2] text-amber-200/80"
                  style={{ fontFamily: "var(--font-amiri, serif)" }}
                >
                  {message.ayah}
                </p>
                <p className="text-[10px] text-amber-400/30 font-bold">{message.ayahRef}</p>
              </motion.div>
            )}

            {/* Phase: Solidarity */}
            {phase === "solidarity" && (
              <motion.div
                key="solidarity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4"
              >
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  {message.solidarity}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: harmony.color }}
                  />
                  <span className="text-[10px] font-bold" style={{ color: harmony.color }}>
                    {harmony.activeUsers.toLocaleString("ar-EG")} مسافر معاك الآن
                  </span>
                </div>
              </motion.div>
            )}

            {/* Phase: Exit */}
            {phase === "exit" && (
              <motion.div
                key="exit"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReconnectionRitual;
