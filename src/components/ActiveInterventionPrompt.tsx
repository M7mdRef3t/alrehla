import type { FC } from "react";
import { motion } from "framer-motion";

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
  const loadPercent = Math.max(0, Math.min(100, Math.round((cognitiveLoadRequired / 5) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-20 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[60] max-w-md mx-auto"
      role="alert"
      aria-live="assertive"
      dir="rtl"
    >
      <div
        className="rounded-2xl p-4 border"
        style={{
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.94) 58%, rgba(51,65,85,0.92) 100%)",
          borderColor: "rgba(251, 191, 36, 0.38)",
          boxShadow: "0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px rgba(251, 191, 36, 0.08)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)"
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
            style={{
              background: "rgba(251, 191, 36, 0.18)",
              border: "1px solid rgba(251, 191, 36, 0.42)",
              color: "rgba(253, 230, 138, 0.95)"
            }}
          >
            !
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
              تدخل لحظي: منع الشلل الإدراكي
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              رصدنا ترددًا مستمرًا لمدة {hesitationSec} ثانية قبل أول تفاعل. الأفضل الآن استعادة الاتزان ثم المتابعة.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl px-3 py-2 border border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span style={{ color: "rgba(251, 191, 36, 0.9)" }}>Cognitive Load</span>
            <span style={{ color: "var(--text-primary)" }}>{cognitiveLoadRequired}/5</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-slate-800/80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${loadPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #f59e0b 0%, #f97316 100%)" }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onBreathing}
            className="flex-1 rounded-xl px-3 py-2 text-xs font-black cta-primary"
          >
            تنفس 30 ثانية
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-xl px-3 py-2 text-xs font-semibold border border-white/20 text-slate-200 hover:bg-white/10"
          >
            أكمل الآن
          </button>
        </div>
      </div>
    </motion.div>
  );
};

