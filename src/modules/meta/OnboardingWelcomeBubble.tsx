import type { FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, LayoutTemplate, X } from "lucide-react";

export type WelcomeSource = "ai" | "template" | "offline_intervention";

interface OnboardingWelcomeBubbleProps {
  message: string;
  source: WelcomeSource;
  onClose: () => void;
}

export const OnboardingWelcomeBubble: FC<OnboardingWelcomeBubbleProps> = ({
  message,
  source,
  onClose
}) => {
  const isAi = source === "ai";
  const isOfflineIntervention = source === "offline_intervention";

  return (
    <AnimatePresence>
      <motion.div
        className="w-full mb-4"
        initial={{ opacity: 0, y: -10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="glass-card px-4 py-3 text-right"
          style={{ borderColor: "rgba(45, 212, 191, 0.2)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(139, 92, 246, 0.15))",
                  border: "1px solid rgba(45, 212, 191, 0.3)",
                  boxShadow: "0 0 16px rgba(45, 212, 191, 0.15)"
                }}
              >
                <Bot className="w-4 h-4" style={{ color: "var(--soft-teal)" }} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-extrabold" style={{ color: "var(--soft-teal)" }}>
                    {isOfflineIntervention ? "????? ???? ????? ??? ???? ????..." : "?????? ??"}
                  </p>
                  <span
                    className="inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-2 py-0.5"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--text-muted)"
                    }}
                    title={isAi ? "AI" : isOfflineIntervention ? "Intervention" : "???? ?????"}
                    aria-label={isAi ? "AI" : isOfflineIntervention ? "Intervention" : "???? ?????"}
                  >
                    {isAi ? "AI" : isOfflineIntervention ? "Oracle" : <LayoutTemplate className="w-3 h-3" aria-hidden="true" />}
                  </span>
                </div>
                <p
                  className="mt-1 text-sm font-semibold leading-relaxed"
                  style={{ color: "var(--text-primary)" }}
                >
                  {message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{ color: "var(--text-muted)" }}
              aria-label="?????"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
