import type { FC } from "react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Wind } from "lucide-react";
import { soundManager } from "@/services/soundManager";

interface ActiveInterventionPromptProps {
  hesitationSec: number;
  cognitiveLoadRequired: number;
  onBreathing: () => void;
  onContinue: () => void;
}

export const ActiveInterventionPrompt: FC<ActiveInterventionPromptProps> = ({
  hesitationSec,
  cognitiveLoadRequired,
  onBreathing,
  onContinue
}) => {
  useEffect(() => {
    soundManager.playEffect("heartbeat");
  }, []);

  const loadPercent = Math.max(0, Math.min(100, Math.round((cognitiveLoadRequired / 5) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[60] w-full sm:max-w-sm"
      role="alert"
      aria-live="assertive"
      dir="rtl"
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(10,10,30,0.96) 0%, rgba(20,20,50,0.95) 100%)",
          border: "1px solid rgba(99,102,241,0.25)",
          boxShadow: "0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)"
        }}
      >
        {/* Ambient glow top-right */}
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
        />

        <div className="relative p-4">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.35)",
              }}
            >
              <Brain className="w-4 h-4" style={{ color: "rgba(167,139,250,0.9)" }} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-black text-white leading-tight">
                توقف لحظة
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(148,163,184,0.7)" }}>
                رصدنا تردداً لمدة {hesitationSec} ثانية
              </p>
            </div>
          </div>

          {/* Message */}
          <p
            className="text-xs leading-relaxed text-right mb-3"
            style={{ color: "rgba(203,213,225,0.85)" }}
          >
            الأفضل الآن استعادة التركيز قبل الاستمرار.
          </p>

          {/* Cognitive load bar */}
          <div
            className="rounded-xl px-3 py-2.5 mb-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: "rgba(148,163,184,0.6)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>
                {cognitiveLoadRequired}/5
              </span>
              <span style={{ color: "rgba(167,139,250,0.85)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em" }}>
                الحمل المعرفي
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loadPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full relative z-10"
                style={{ background: "linear-gradient(90deg, #6366f1 0%, #a78bfa 100%)" }}
              />
              {loadPercent > 60 && (
                <motion.div
                  className="absolute inset-0 z-0"
                  style={{ background: "rgba(167,139,250,0.4)", filter: "blur(4px)" }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Secondary — Continue */}
            <button
              type="button"
              onClick={onContinue}
              className="flex-shrink-0 rounded-xl px-4 py-2.5 text-[11px] font-bold transition-all"
              style={{
                color: "rgba(148,163,184,0.9)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              أكمل الآن
            </button>

            {/* Primary — Breathe */}
            <motion.button
              type="button"
              onClick={onBreathing}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-black"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(79,70,229,0.9) 100%)",
                border: "1px solid rgba(99,102,241,0.5)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                color: "#fff",
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 6px 22px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.97 }}
            >
              <Wind className="w-3.5 h-3.5" />
              تنفس ٣٠ ثانية
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

