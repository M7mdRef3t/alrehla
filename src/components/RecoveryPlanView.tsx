import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen, MessageCircle } from "lucide-react";
import type { Ring, SituationLog } from "../modules/map/mapTypes";
import { recoveryPlans } from "../data/recoveryPlans";
import { scriptBank } from "../data/scriptBank";
import { ProgressTracker } from "./ProgressTracker";
import { SituationLogger } from "./SituationLogger";

interface RecoveryPlanViewProps {
  personLabel: string;
  ring: Ring;
  completedSteps: string[];
  situationLogs: SituationLog[];
  onToggleStep: (stepId: string) => void;
  onAddLog: (log: Omit<SituationLog, "id" | "date">) => void;
  onDeleteLog: (logId: string) => void;
}

export const RecoveryPlanView: FC<RecoveryPlanViewProps> = ({
  personLabel,
  ring,
  completedSteps,
  situationLogs,
  onToggleStep,
  onAddLog,
  onDeleteLog
}) => {
  const plan = recoveryPlans[ring];
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [showScripts, setShowScripts] = useState(false);

  const totalSteps = plan.weeks.reduce((acc, week) => acc + week.steps.length, 0);

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          مسار الحماية - {plan.duration} يوم
        </h2>
        <p className="text-sm text-gray-600">
          مسار عملي لحماية مدارك مع {personLabel}
        </p>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker
        completedSteps={completedSteps.length}
        totalSteps={totalSteps}
      />

      {/* Weekly Plan */}
      <div className="mt-6 space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          خطوات الرحلة الأسبوعية
        </h3>

        {plan.weeks.map((week) => {
          const weekSteps = week.steps;
          const completedInWeek = weekSteps.filter(step =>
            completedSteps.includes(step.id)
          ).length;
          const isExpanded = expandedWeek === week.week;

          return (
            <motion.div
              key={week.week}
              className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: week.week * 0.1 }}
            >
              {/* Week Header */}
              <button
                type="button"
                onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 text-right"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 mb-1">
                    الأسبوع {week.week}: {week.title}
                  </h4>
                  <p className="text-sm text-gray-600">{week.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${(completedInWeek / weekSteps.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">
                      {completedInWeek}/{weekSteps.length}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" />
                )}
              </button>

              {/* Week Steps */}
              {isExpanded && (
                <motion.div
                  className="p-4 pt-0 space-y-2 border-t border-gray-100"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {weekSteps.map((step) => {
                    const isCompleted = completedSteps.includes(step.id);

                    return (
                      <label
                        key={step.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${isCompleted
                            ? "bg-teal-50 border-2 border-teal-400"
                            : "bg-gray-50 border border-gray-200 hover:border-teal-300"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => onToggleStep(step.id)}
                          className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <span
                          className={`text-sm leading-relaxed ${isCompleted
                              ? "text-teal-900 font-medium line-through"
                              : "text-slate-700"
                            }`}
                        >
                          {step.text}
                        </span>
                      </label>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Script Bank */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowScripts(!showScripts)}
          className="w-full flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors duration-150"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">بنك السكريبتات الجاهزة</span>
          </div>
          {showScripts ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {showScripts && (
          <motion.div
            className="mt-3 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
          >
            {scriptBank.map((script, index) => (
              <div
                key={index}
                className="p-4 bg-white border border-blue-200 rounded-xl text-right"
              >
                <p className="font-semibold text-blue-900 mb-2">
                  {script.situation}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold flex-shrink-0">❌</span>
                    <span className="text-gray-700">
                      <span className="font-medium">متقولش:</span> "{script.dontSay}"
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold flex-shrink-0">✅</span>
                    <span className="text-gray-700">
                      <span className="font-medium">قول:</span> "{script.doSay}"
                    </span>
                  </div>
                  {script.explanation && (
                    <p className="text-xs text-gray-500 mt-2 pr-6">
                      💡 {script.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Situation Logger */}
      <SituationLogger
        logs={situationLogs}
        onAddLog={onAddLog}
        onDeleteLog={onDeleteLog}
      />
    </div>
  );
};
