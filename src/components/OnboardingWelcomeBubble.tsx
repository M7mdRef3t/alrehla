import type { FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, LayoutTemplate, X } from "lucide-react";

export type WelcomeSource = "ai" | "template";

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
  return (
    <AnimatePresence>
      <motion.div
        className="w-full mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/60 dark:bg-slate-900/70 shadow-sm px-4 py-3 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-100">
                    المساعد
                  </p>
                  <span
                    className="inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-2 py-0.5 border border-emerald-200 bg-white/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-slate-950/60 dark:text-emerald-200"
                    title={source === "ai" ? "AI" : "نسخة ثابتة"}
                    aria-label={source === "ai" ? "AI" : "نسخة ثابتة"}
                  >
                    {source === "ai" ? "AI" : <LayoutTemplate className="w-3 h-3" aria-hidden="true" />}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center shrink-0"
              aria-label="إخفاء"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

