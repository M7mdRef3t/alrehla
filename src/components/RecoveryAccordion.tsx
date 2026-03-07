import React, { type FC, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Ring } from "../modules/map/mapTypes";
import { recoveryPlans } from "../data/recoveryPlans";
import { scriptBank } from "../data/scriptBank";
import { ProgressTracker } from "./ProgressTracker";
import { SituationLogger } from "./SituationLogger";
import type { SituationLog } from "../types/recoveryPlan";

interface RecoveryAccordionProps {
  ring: Ring;
  completedSteps: string[];
  situationLogs: SituationLog[];
  onToggleStep: (stepId: string) => void;
  onAddLog: (log: Omit<SituationLog, "id" | "date">) => void;
  onDeleteLog: (logId: string) => void;
}

type AccordionSection = "plan" | "scripts" | "log" | "progress";

export const RecoveryAccordion: FC<RecoveryAccordionProps> = ({
  ring,
  completedSteps,
  situationLogs,
  onToggleStep,
  onAddLog,
  onDeleteLog
}) => {
  const [openSections, setOpenSections] = useState<Set<AccordionSection>>(new Set());

  const toggleSection = (section: AccordionSection) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const plan = recoveryPlans[ring];
  const totalSteps = plan.weeks.reduce((sum, week) => sum + week.steps.length, 0);
  const completedCount = completedSteps.length;

  return (
    <div className="mt-8 space-y-3">
      {/* برت 30  */}
      <div className="border-2 border-purple-200 rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => toggleSection("plan")}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg"></span>
            <span className="font-bold text-purple-900">برت 30 </span>
          </div>
          {openSections.has("plan") ? (
            <ChevronUp className="w-5 h-5 text-purple-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-700" />
          )}
        </button>
        {openSections.has("plan") && (
          <div className="p-5 space-y-6 text-right">
            {plan.weeks.map((week) => (
              <div key={week.week} className="border-r-4 border-purple-300 pr-4">
                <h4 className="font-bold text-purple-900 mb-1">
                  اأسبع {week.week}: {week.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">{week.description}</p>
                <div className="space-y-2">
                  {week.steps.map((step) => {
                    const isCompleted = completedSteps.includes(step.id);
                    return (
                      <label
                        key={step.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-150 ${isCompleted
                            ? "bg-purple-100 border-purple-400"
                            : "bg-white border-gray-200 hover:bg-purple-50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => onToggleStep(step.id)}
                          className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <span
                          className={`text-sm leading-relaxed ${isCompleted
                              ? "text-purple-800 font-medium line-through"
                              : "text-slate-700"
                            }`}
                        >
                          {step.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ب اسربتات */}
      <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => toggleSection("scripts")}
          className="w-full p-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg"></span>
            <span className="font-bold text-blue-900">ب اسربتات اجازة</span>
          </div>
          {openSections.has("scripts") ? (
            <ChevronUp className="w-5 h-5 text-blue-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-700" />
          )}
        </button>
        {openSections.has("scripts") && (
          <div className="p-5 space-y-4 text-right">
            {scriptBank.map((script, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-br from-blue-50 to-[var(--soft-teal)] border border-blue-200 rounded-lg"
              >
                <h4 className="font-bold text-blue-900 mb-2">{script.situation}</h4>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="font-semibold text-red-800 mb-1"> تش:</p>
                    <p className="text-gray-700">{script.dontSay}</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="font-semibold text-green-800 mb-1"> :</p>
                    <p className="text-gray-700">{script.doSay}</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                     {script.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* سج ااف */}
      <div className="border-2 border-amber-200 rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => toggleSection("log")}
          className="w-full p-4 flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg"></span>
            <span className="font-bold text-amber-900">سج ادا</span>
          </div>
          {openSections.has("log") ? (
            <ChevronUp className="w-5 h-5 text-amber-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-700" />
          )}
        </button>
        {openSections.has("log") && (
          <div className="p-5">
            <SituationLogger
              logs={situationLogs}
              onAddLog={onAddLog}
              onDeleteLog={onDeleteLog}
            />
          </div>
        )}
      </div>

      {/* اتد */}
      <div className="border-2 border-teal-200 rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => toggleSection("progress")}
          className="w-full p-4 flex items-center justify-between bg-teal-50 hover:bg-teal-100 transition-colors duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg"></span>
            <span className="font-bold text-teal-900">
              تد ادا ({completedCount}  {totalSteps})
            </span>
          </div>
          {openSections.has("progress") ? (
            <ChevronUp className="w-5 h-5 text-teal-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-teal-700" />
          )}
        </button>
        {openSections.has("progress") && (
          <div className="p-5">
            <ProgressTracker completedSteps={completedCount} totalSteps={totalSteps} />
          </div>
        )}
      </div>
    </div>
  );
};


