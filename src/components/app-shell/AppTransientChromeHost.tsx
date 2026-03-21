import { memo, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicBroadcast } from "../../services/broadcasts";
import type { MemoryMatch } from "../../services/consciousnessService";
import type { ActiveInterventionState } from "./useNextStepRouting";
import type { PulseDeltaToast } from "./useAppSessionToasts";

const ActiveInterventionPrompt = lazy(() =>
  import("../ActiveInterventionPrompt").then((m) => ({ default: m.ActiveInterventionPrompt }))
);

interface AppTransientChromeHostProps {
  activeBroadcast: PublicBroadcast | null;
  onDismissBroadcast: () => void;
  postBreathingMessage: boolean;
  activeIntervention: ActiveInterventionState | null;
  onStartInterventionBreathing: () => void;
  onContinueIntervention: () => void;
  postNoiseSessionMessage: boolean;
  pulseDeltaToast: PulseDeltaToast | null;
  lastPulseInsights: MemoryMatch[];
  onClearPulseInsights: () => void;
}

export const AppTransientChromeHost = memo(function AppTransientChromeHost({
  activeBroadcast,
  onDismissBroadcast,
  postBreathingMessage,
  activeIntervention,
  onStartInterventionBreathing,
  onContinueIntervention,
  postNoiseSessionMessage,
  pulseDeltaToast,
  lastPulseInsights,
  onClearPulseInsights
}: AppTransientChromeHostProps) {
  return (
    <>
      <AnimatePresence>
        {activeBroadcast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 max-w-lg"
            role="status"
            aria-live="polite"
          >
            <div className="glass-card px-4 py-3 border border-amber-300/40 bg-amber-50/10 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--soft-gold, #fbbf24)" }}>
                    رسالة من إدارة الرحلة
                  </p>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{activeBroadcast.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {activeBroadcast.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onDismissBroadcast}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold border border-white/15 hover:bg-white/5 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                  aria-label="إخفاء الرسالة"
                >
                  إخفاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {postBreathingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-md mx-auto"
            role="status"
            aria-live="polite"
          >
            <div
              className="bento-block text-center py-4 px-6"
              style={{
                borderColor: "rgba(20, 184, 166, 0.3)",
                background: "rgba(20, 184, 166, 0.08)"
              }}
            >
              <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                تم الشحن.. رجعت للخريطة
              </p>
              <p className="text-sm mt-1 opacity-90" style={{ color: "var(--text-secondary)" }}>
                كمّل خطوة بسيطة وبس
              </p>
            </div>
          </motion.div>
        )}
        {activeIntervention && (
          <Suspense fallback={null}>
            <ActiveInterventionPrompt
              hesitationSec={activeIntervention.hesitationSec}
              cognitiveLoadRequired={activeIntervention.cognitiveLoadRequired}
              onBreathing={onStartInterventionBreathing}
              onContinue={onContinueIntervention}
            />
          </Suspense>
        )}
        {postNoiseSessionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-md mx-auto"
            role="status"
            aria-live="polite"
          >
            <div
              className="bento-block text-center py-4 px-6"
              style={{
                borderColor: "rgba(34, 197, 94, 0.25)",
                background: "rgba(34, 197, 94, 0.06)"
              }}
            >
              <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                حمد لله على السلامة
              </p>
              <p className="text-sm mt-1 opacity-90" style={{ color: "var(--text-secondary)" }}>
                يومك بقى أخف دلوقتي
              </p>
            </div>
          </motion.div>
        )}
        {pulseDeltaToast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="fixed left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-md mx-auto"
            style={{ bottom: postNoiseSessionMessage ? "7.1rem" : (lastPulseInsights.length > 0 ? "8.8rem" : "1.5rem") }}
            role="status"
            aria-live="polite"
          >
            <div
              className="bento-block text-center py-3.5 px-5"
              style={{
                borderColor:
                  pulseDeltaToast.tone === "up"
                    ? "rgba(45, 212, 191, 0.35)"
                    : pulseDeltaToast.tone === "down"
                      ? "rgba(248, 113, 113, 0.32)"
                      : "rgba(148, 163, 184, 0.3)",
                background:
                  pulseDeltaToast.tone === "up"
                    ? "rgba(45, 212, 191, 0.1)"
                    : pulseDeltaToast.tone === "down"
                      ? "rgba(248, 113, 113, 0.09)"
                      : "rgba(148, 163, 184, 0.08)"
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {pulseDeltaToast.title}
              </p>
              <p className="text-xs mt-1 opacity-90" style={{ color: "var(--text-secondary)" }}>
                {pulseDeltaToast.body}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {lastPulseInsights.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-lg mx-auto">
          <div className="bento-block" style={{ borderColor: "rgba(245, 166, 35, 0.25)", padding: "1.5rem" }}>
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: "rgba(245, 166, 35, 0.12)",
                  border: "1px solid rgba(245, 166, 35, 0.25)",
                  color: "var(--warm-amber)"
                }}
              >
                *
              </div>
              <div className="text-right flex-1 min-w-0">
                <h3 className="text-sm font-bold mb-3" style={{ color: "var(--warm-amber)" }}>ومضة من الذاكرة</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {lastPulseInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="min-w-[220px] max-w-[280px] rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(245, 166, 35, 0.08)",
                        border: "1px solid rgba(245, 166, 35, 0.15)"
                      }}
                    >
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        شعورك دلوقتي بيشبه موقف{" "}
                        {insight.created_at && (
                          <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                            حصل يوم{" "}
                            {new Date(insight.created_at).toLocaleDateString("ar-EG")}
                          </span>
                        )}
                        {": "}
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {insight.content.slice(0, 90)}
                          {insight.content.length > 90 ? "..." : ""}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearPulseInsights}
              className="glass-button w-full text-xs font-bold"
              style={{ color: "var(--warm-amber)" }}
            >
              تم · إخفاء الومضة
            </button>
          </div>
        </div>
      )}
    </>
  );
});
