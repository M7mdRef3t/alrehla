import type { FC } from "react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { feelingCopy } from "@/copy/feeling";
import { EditableText } from "./EditableText";
import { getOptionButtonClass, impactTier } from "@/utils/optionColors";
import { calculateEntropy } from "@/services/predictiveEngine";
import { AlertCircle } from "lucide-react";

export type FeelingOption = "often" | "sometimes" | "rarely" | "never";

export type FeelingAnswers = {
  q1: FeelingOption;
  q2: FeelingOption;
  q3: FeelingOption;
};

/** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
const OPTIONS: FeelingOption[] = ["often", "sometimes", "rarely", "never"];

interface FeelingCheckProps {
  personLabel: string;
  onDone: (answers: FeelingAnswers) => void;
}

export const FeelingCheck: FC<FeelingCheckProps> = ({
  personLabel,
  onDone
}) => {
  const [answers, setAnswers] = React.useState<Partial<FeelingAnswers>>({});
  const [internalStep, setInternalStep] = useState(0);

  // Predictive Engine integration: Check entropy once on mount
  const prediction = React.useMemo(() => calculateEntropy(), []);
  const isChaos = prediction.entropyScore >= 70;

  const handleAnswer = (key: keyof FeelingAnswers, value: FeelingOption, stepIndex: number) => {
    import("@/services/soundManager").then((m) => m.soundManager.playEffect("cosmic_pulse"));
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (stepIndex < 2) {
      setTimeout(() => setInternalStep(stepIndex + 1), 300);
    }
  };

  const answered = {
    q1: Boolean(answers.q1),
    q2: Boolean(answers.q2),
    q3: Boolean(answers.q3)
  };

  const allAnswered = answered.q1 && answered.q2 && answered.q3;

  React.useEffect(() => {
    if (allAnswered) {
      const t = setTimeout(() => {
        onDone({
          q1: answers.q1 as FeelingOption,
          q2: answers.q2 as FeelingOption,
          q3: answers.q3 as FeelingOption
        });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [allAnswered, answers, onDone]);

  return (
    <section
      className="mt-0 text-center h-full min-h-0 flex flex-col relative px-4"
      aria-labelledby="feeling-title"
    >
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e10_1px,transparent_1px),linear-gradient(to_bottom,#0f766e10_1px,transparent_1px)] bg-[size:40px_40px]" />
        <motion.div
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity }}
          className="absolute left-0 right-0 h-[1px] bg-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.2)] z-0"
        />
      </div>

      {isChaos && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-rose-950/30 border border-rose-500/30 backdrop-blur-xl rounded-[1.5rem] p-5 flex flex-col items-center text-center relative z-10 shadow-[0_0_40px_rgba(244,63,94,0.1)]"
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mb-3 border border-rose-500/30">
            <AlertCircle className="w-6 h-6 text-rose-400 animate-pulse" />
          </div>
          <h3 className="text-xs font-black text-rose-300 mb-2 uppercase tracking-[0.2em]">⚠️ الرادار الإدراكي: تحذير فوضى</h3>
          <p className="text-sm text-rose-100/70 max-w-sm font-bold leading-relaxed">
            مؤشرات الفوضى مرتفعة الآن ({prediction.entropyScore}%). يُنصح بتأجيل القرارات الكبرى والتعامل من مساحة "مراقبة" فقط لتجنب استنزاف الطاقة.
          </p>
        </motion.div>
      )}

      <div className="relative z-10 mb-2">
        <h2 id="feeling-title" className="text-2xl font-black text-[var(--consciousness-text)] mb-2 tracking-tight">
          <EditableText id="feeling_title" defaultText={feelingCopy.title} page="feeling" />
        </h2>
        <p className="text-sm font-bold text-[var(--consciousness-text-muted)] leading-relaxed px-4 opacity-80">
          <EditableText id="feeling_body" defaultText={feelingCopy.body} page="feeling" multiline showEditIcon={false} />{" "}
          <span className="text-teal-500 dark:text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]">({personLabel})</span>
        </p>
      </div>

      {/* Progress Bar — dir=ltr to prevent RTL confusion */}
      <div className="flex items-center gap-2 mb-6 relative z-10" dir="ltr">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              idx < internalStep
                ? "bg-teal-500 shadow-[0_0_10px_#2dd4bf]"
                : idx === internalStep
                  ? "bg-teal-500/40"
                  : "bg-[var(--page-surface-2)] border border-[var(--page-border-soft)]"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 relative z-10 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={internalStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className="flex flex-col h-full justify-center space-y-8"
          >
            <h3 className="text-2xl sm:text-3xl font-black text-center tracking-tight leading-relaxed text-[var(--consciousness-text)]">
              <EditableText id={`feeling_q${internalStep + 1}`} defaultText={feelingCopy[`q${internalStep + 1}` as keyof typeof feelingCopy] as string} page="feeling" showEditIcon={false} />
            </h3>
            
            <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
              {OPTIONS.map((opt) => {
                const currentKey = `q${internalStep + 1}` as keyof FeelingAnswers;
                const isSelected = answers[currentKey] === opt;
                const label = feelingCopy.options[opt];
                const tier = impactTier[opt] ?? "amber";
                
                let activeStyle = "bg-[var(--page-surface-2)] border-[var(--page-border-soft)] text-[var(--consciousness-text-muted)] hover:border-[var(--page-border)] hover:bg-[var(--page-bg-alt)]";
                if (isSelected) {
                   if (tier === "green") activeStyle = "bg-teal-500 text-white border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)] scale-[1.02]";
                   else if (tier === "amber") activeStyle = "bg-amber-500 text-white border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]";
                   else if (tier === "red") activeStyle = "bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]";
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(currentKey, opt, internalStep)}
                    className={`w-full flex items-center p-5 text-base sm:text-lg font-bold transition-all duration-500 rounded-2xl border ${activeStyle}`}
                  >
                    <div className={`w-4 h-4 rounded-full mr-4 rtl:ml-4 rtl:mr-0 border-2 flex items-center justify-center transition-colors ${isSelected ? "border-white" : "border-slate-500"}`}>
                       {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
