"use client";

import { motion } from "framer-motion";

type Step = { n: number; label: string; sublabel: string };

const STEPS: Step[] = [
  { n: 1, label: "البداية", sublabel: "نظرة على الرحلة" },
  { n: 2, label: "كيفية التأكيد", sublabel: "اختر طريقتك" },
  { n: 3, label: "بيانات التوثيق", sublabel: "الخطوات والتفاصيل" },
  { n: 4, label: "إتمام العهد", sublabel: "أرسل الإثبات" },
];

type WizardProgressBarProps = {
  currentStep: number; // 1–4
};

export function WizardProgressBar({ currentStep }: WizardProgressBarProps) {
  const pct = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <div
      className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl"
      dir="rtl"
    >
      {/* Progress rail */}
      <div className="h-0.5 w-full bg-slate-900/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="h-full bg-gradient-to-l from-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
        />
      </div>

      {/* Steps */}
      <div className="mx-auto flex max-w-lg items-center justify-center py-4">
        {STEPS.map((step, index) => {
          const isDone = currentStep > step.n;
          const isActive = currentStep === step.n;

          return (
            <div key={step.n} className="contents">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <motion.div
                  animate={{
                    backgroundColor: isDone ? "rgb(45, 212, 191)" : isActive ? "rgba(45,212,191,0.1)" : "transparent",
                    borderColor: isDone ? "rgba(45, 212, 191, 1)" : isActive ? "rgba(45, 212, 191, 1)" : "rgba(255, 255, 255, 0.1)",
                    color: isDone ? "#020617" : isActive ? "rgb(94, 234, 212)" : "rgb(71, 85, 105)"
                  }}
                  className={`flex h-8 w-8 items-center justify-center border-2 rounded-full text-xs font-black transition-shadow duration-500 ${
                    isActive ? "shadow-[0_0_15px_rgba(45,212,191,0.4)]" : ""
                  }`}
                >
                  {isDone ? "✓" : step.n}
                </motion.div>
                {/* Label (hidden on very small screens) */}
                <span
                  className={`mt-1.5 hidden text-[10px] font-black sm:block transition-colors duration-500 flex-col items-center ${
                    isActive ? "text-teal-300 drop-shadow-sm" : isDone ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {step.label}
                  {isActive && <span className="block text-[8px] font-medium text-slate-400 mt-0.5">{step.sublabel}</span>}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="mx-2 mb-4 flex-1 sm:min-w-[40px]">
                  <div
                    className={`h-[2px] w-full rounded-full transition-all duration-700 ${
                      currentStep > step.n ? "bg-teal-400/40 shadow-[0_0_8px_rgba(45,212,191,0.2)]" : "bg-white/5"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
