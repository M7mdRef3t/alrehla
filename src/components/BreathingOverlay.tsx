import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useAchievementState } from "../state/achievementState";

interface BreathingOverlayProps {
  onClose: () => void;
  /** عدد دورات التنفس قبل إغلاق تلقائي (0 = لا إغلاق تلقائي) */
  autoCloseAfterCycles?: number;
}

const CYCLE_DURATION_MS = 8000; // 4s inhale + 4s exhale
/** تجربة أقصر لتجنب الإحساس بالتعليق */
const DEFAULT_CLOSE_AFTER_CYCLES = 4;

export const BreathingOverlay: FC<BreathingOverlayProps> = ({
  onClose,
  autoCloseAfterCycles = DEFAULT_CLOSE_AFTER_CYCLES
}) => {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const markBreathingUsed = useAchievementState((s) => s.markBreathingUsed);

  const totalSeconds = autoCloseAfterCycles > 0 ? autoCloseAfterCycles * (CYCLE_DURATION_MS / 1000) : 0;
  const remainingSeconds = totalSeconds > 0 ? Math.max(0, totalSeconds - elapsedSeconds) : 0;

  useEffect(() => {
    markBreathingUsed();
  }, [markBreathingUsed]);

  useEffect(() => {
    const t = setInterval(() => {
      setPhase((p) => {
        if (p === "in") {
          setCycleCount((c) => c + 1);
          return "out";
        }
        return "in";
      });
    }, CYCLE_DURATION_MS / 2);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (autoCloseAfterCycles > 0 && cycleCount >= autoCloseAfterCycles) {
      // Reward Resilience
      const state = useAchievementState.getState();
      state.addActionPoints("action_resilience_recovery");
      onClose();
    }
  }, [autoCloseAfterCycles, cycleCount, onClose]);

  useEffect(() => {
    setElapsedSeconds(0);
  }, [autoCloseAfterCycles]);

  useEffect(() => {
    if (totalSeconds <= 0) return;
    const t = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [totalSeconds]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
      aria-label="دقيقة تنفس"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
        aria-label="إغلاق"
      >
        <X className="w-5 h-5" />
      </button>

      <p className="text-white/90 text-lg font-medium mb-10 mt-6">
        {phase === "in" ? "شهيق" : "زفير"}
      </p>

      <motion.div
        className="w-48 h-48 rounded-full bg-teal-400/30 border-4 border-teal-300/50 shrink-0"
        animate={{
          scale: phase === "in" ? [0.8, 1.4] : [1.4, 0.8],
          opacity: phase === "in" ? [0.6, 1] : [1, 0.6]
        }}
        transition={{
          duration: CYCLE_DURATION_MS / 2 / 1000,
          ease: "easeInOut"
        }}
      />

      <p className="text-white/70 text-sm mt-10 max-w-xs text-center px-4">
        خد وقتك - تمرين تنفس قصير للتهدئة
      </p>

      {totalSeconds > 0 && (
        <p className="text-white/60 text-xs mt-2">الانتقال التلقائي خلال {remainingSeconds} ثانية</p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-5 px-5 py-2 rounded-full border border-white/30 text-white/90 text-sm hover:bg-white/10 transition-colors"
      >
        إنهاء التنفس والمتابعة
      </button>
    </div>
  );
};
