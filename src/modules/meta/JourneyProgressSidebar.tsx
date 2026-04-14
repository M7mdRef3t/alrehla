import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Lock, ChevronLeft, Clock } from "lucide-react";

export interface JourneyStage {
  id: string;
  label: string;
  description: string;
  icon: string;
  status: "done" | "active" | "locked";
  /** تقدير زمن المرحلة بالدقائق */
  estimatedMinutes?: number;
}

interface JourneyProgressSidebarProps {
  stages: JourneyStage[];
  onNavigate?: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const JourneyProgressSidebar = memo(function JourneyProgressSidebar({
  stages,
  onNavigate,
  isOpen,
  onToggle,
}: JourneyProgressSidebarProps) {
  const doneCount = stages.filter((s) => s.status === "done").length;
  const progress = stages.length > 0 ? (doneCount / stages.length) * 100 : 0;

  return (
    <>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? "إغلاق المسار" : "عرض مسار الرحلة"}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-[80] flex flex-col items-center gap-1.5
                   px-2 py-3 rounded-xl bg-slate-900/80 backdrop-blur-xl
                   border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                   text-slate-400 hover:text-teal-300 transition-all duration-300
                   hover:border-teal-500/30 hover:shadow-[0_4px_20px_rgba(45,212,191,0.15)]"
      >
        <ChevronLeft
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
        <span className="text-[9px] font-black tracking-widest uppercase [writing-mode:vertical-lr] rotate-180">
          المسار
        </span>
      </button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-16 bottom-0 w-72 z-[75]
                       bg-slate-950/90 backdrop-blur-2xl
                       border-r border-white/[0.06]
                       shadow-[-8px_0_48px_rgba(0,0,0,0.5)]
                       flex flex-col overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="px-5 pt-6 pb-4 border-b border-white/[0.06]">
              <p className="text-[10px] font-black tracking-[0.25em] text-teal-400/70 uppercase mb-1">
                مسار الرحلة
              </p>
              <h2 className="text-base font-bold text-white">
                تقدّمك الآن
              </h2>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[11px] text-slate-400">
                    {doneCount} من {stages.length}
                  </span>
                  <span className="text-[11px] font-bold text-teal-400">
                    {Math.round(progress)}٪
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            </div>

            {/* Stages List */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-2">
              {stages.map((stage, i) => {
                const isClickable = stage.status !== "locked" && onNavigate;
                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <button
                      type="button"
                      disabled={stage.status === "locked"}
                      onClick={() => isClickable && onNavigate(stage.id)}
                      className={`w-full text-right p-3.5 rounded-xl transition-all duration-200 group ${
                        stage.status === "active"
                          ? "bg-teal-500/10 border border-teal-500/30 shadow-[0_0_20px_rgba(45,212,191,0.08)]"
                          : stage.status === "done"
                          ? "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
                          : "bg-white/[0.015] border border-white/[0.04] opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                            stage.status === "active"
                              ? "bg-teal-500/20 shadow-[0_0_12px_rgba(45,212,191,0.3)]"
                              : stage.status === "done"
                              ? "bg-emerald-500/10"
                              : "bg-white/5"
                          }`}
                        >
                          {stage.status === "done" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : stage.status === "locked" ? (
                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                          ) : (
                            <span>{stage.icon}</span>
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold leading-snug ${
                              stage.status === "active"
                                ? "text-teal-200"
                                : stage.status === "done"
                                ? "text-slate-300"
                                : "text-slate-600"
                            }`}
                          >
                            {stage.label}
                          </p>
                          {stage.status !== "locked" && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {stage.description}
                            </p>
                          )}
                          {/* Time estimate badge */}
                          {stage.estimatedMinutes != null && stage.status !== "done" && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="w-2.5 h-2.5 text-slate-600" />
                              <span className="text-[10px] text-slate-600">
                                ~{stage.estimatedMinutes} دقيقة
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Dot */}
                        {stage.status === "active" && (
                          <Circle className="w-2 h-2 fill-teal-400 text-teal-400 flex-shrink-0 mt-1 animate-pulse" />
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/[0.06]">
              <p className="text-[10px] text-slate-600 text-center">
                كل خطوة تبني على اللي قبلها
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 z-[74] bg-black/30 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
});
