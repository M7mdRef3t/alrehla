import React, { type FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DynamicStep } from "../../utils/dynamicPlanGenerator";

interface WeekCardProps {
  weekNumber: number;
  step: DynamicStep;
  completedSteps: string[];
  onToggleStep: (stepId: string) => void;
  onUpdateStepInput: (stepId: string, value: string) => void;
  stepInputs: Record<string, string>;
  stepFeedback?: Record<string, "hard" | "easy" | "unrealistic">;
  onStepFeedback?: (stepId: string, value: "hard" | "easy" | "unrealistic") => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const WeekCard: FC<WeekCardProps> = ({
  weekNumber,
  step,
  completedSteps,
  onToggleStep,
  onUpdateStepInput,
  stepInputs,
  stepFeedback,
  onStepFeedback,
  isExpanded = false,
  onToggleExpand
}) => {
  const [selectedDay, setSelectedDay] = useState(1);

  const totalActions = step.actions.length;
  const completedCount = step.actions.filter((a) => completedSteps.includes(a.id)).length;
  const progressPct = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;
  const isComplete = completedCount === totalActions;

  const currentAction = step.actions[selectedDay - 1];
  const isCurrentCompleted = currentAction ? completedSteps.includes(currentAction.id) : false;

  return (
    <motion.div
      className="border border-purple-200 dark:border-purple-900/40 rounded-2xl overflow-hidden transition-all dark:bg-slate-800/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-50/50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3 text-right flex-1">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">الأسبوع {weekNumber}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step.title} • {completedCount}/{totalActions}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-purple-200 dark:border-purple-900/40 px-6 py-4 space-y-4"
          >
            {/* Day selector */}
            <div className="flex gap-1 flex-wrap justify-center">
              {step.actions.map((_, i: number) => {
                const dayNum = i + 1;
                const done = completedSteps.includes(step.actions[i].id);
                const active = selectedDay === dayNum;
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDay(dayNum)}
                    className={`min-w-9 py-1.5 px-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-purple-600 text-white ring-2 ring-purple-400"
                        : done
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Current action */}
            {currentAction && (
              <div className="p-4 bg-purple-50 dark:bg-slate-700/50 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentAction.text || "خطوة"}</p>
                  </div>
                  {isCurrentCompleted && <span className="text-green-600 text-sm font-bold shrink-0">✓</span>}
                </div>

                {currentAction.requiresInput && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="اكتب موقفك..."
                      value={stepInputs[currentAction.id] || ""}
                      onChange={(e) => onUpdateStepInput(currentAction.id, e.target.value)}
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm dark:bg-slate-600 dark:border-purple-700"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleStep(currentAction.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isCurrentCompleted
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {isCurrentCompleted ? "✓ تمام" : "تمام"}
                  </button>

                  {onStepFeedback && (
                    <div className="flex gap-1">
                      {(["easy", "hard", "unrealistic"] as const).map((feedback) => (
                        <button
                          key={feedback}
                          type="button"
                          onClick={() => onStepFeedback(currentAction.id, feedback)}
                          className={`px-3 py-2 text-xs rounded-lg transition-all ${
                            stepFeedback?.[currentAction.id] === feedback
                              ? "bg-slate-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {feedback === "easy" ? "سهل" : feedback === "hard" ? "صعب" : "مش واقعي"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress indicator */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{progressPct}% مكتمل</span>
                {isComplete && <span className="text-green-600 font-bold">✓ تمام الأسبوع</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
