import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface BreathingOverlayProps {
  onClose: () => void;
  /** عدد دورات التنفس قبل إغلاق تلقائي (0 = لا إغلاق تلقائي) */
  autoCloseAfterCycles?: number;
}

const CYCLE_DURATION_MS = 8000; // 4s inhale + 4s exhale

export const BreathingOverlay: FC<BreathingOverlayProps> = ({
  onClose,
  autoCloseAfterCycles = 0
}) => {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cycleCount, setCycleCount] = useState(0);

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
      onClose();
    }
  }, [autoCloseAfterCycles, cycleCount, onClose]);

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
        className="absolute top-4 left-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
        aria-label="إغلاق"
      >
        <X className="w-5 h-5" />
      </button>

      <p className="text-white/90 text-lg font-medium mb-8">
        {phase === "in" ? "شهيق" : "زفير"}
      </p>

      <motion.div
        className="w-48 h-48 rounded-full bg-teal-400/30 border-4 border-teal-300/50"
        animate={{
          scale: phase === "in" ? [0.8, 1.4] : [1.4, 0.8],
          opacity: phase === "in" ? [0.6, 1] : [1, 0.6]
        }}
        transition={{
          duration: CYCLE_DURATION_MS / 2 / 1000,
          ease: "easeInOut"
        }}
      />
      <p className="text-white/70 text-sm mt-8 max-w-xs text-center">
        خد وقتك — دقيقة واحدة من التنفس الهادئ
      </p>
    </div>
  );
};
