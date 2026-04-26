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
      {/* Cinematic Tactical Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-none border border-white/5 bg-black/40">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHBhdGggZD0iTTAgMEg0IiBzdHJva2U9IiMyZGQ0YmYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30" />
        <motion.div
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          className="absolute left-0 right-0 h-[2px] bg-teal-500/20 shadow-[0_0_20px_rgba(45,212,191,0.3)] z-0"
        />
        {/* HUD Corner Decorators */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-teal-500/50" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-teal-500/50" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-teal-500/50" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-teal-500/50" />
      </div>

      {isChaos && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-rose-950/40 border-r-4 border-rose-500 rounded-none p-4 flex flex-col items-center text-center relative z-10 shadow-[inset_-20px_0_40px_-20px_rgba(225,29,72,0.3)]"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
            <h3 className="text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] font-tajawal">[ تحذير: زيادة_العشوائية ]</h3>
          </div>
          <p className="text-xs text-rose-200 max-w-sm font-bold leading-relaxed tracking-wide">
            مؤشرات الفوضى مرتفعة الآن ({prediction.entropyScore}%). يُنصح بتأجيل القرارات الكبرى والتعامل من مساحة "مراقبة" فقط لتجنب استنزاف الطاقة.
          </p>
        </motion.div>
      )}

      <div className="relative z-10 mb-4 pt-6">
        <p className="text-[10px] text-teal-600 uppercase tracking-[0.3em] mb-2 font-bold animate-pulse">
          [ مسح_الرنين_الشعوري ]
        </p>
        <h2 id="feeling-title" className="text-2xl font-black text-white mb-2 tracking-tight uppercase font-alexandria">
          <EditableText id="feeling_title" defaultText={feelingCopy.title} page="feeling" />
        </h2>
        <div className="inline-flex items-center gap-2 bg-teal-500/10 px-3 py-1 rounded-sm border border-teal-500/20 mb-2">
           <span className="text-xs text-teal-700 uppercase tracking-widest font-tajawal">الهدف:</span>
           <span className="text-sm font-bold text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] tracking-widest font-tajawal">{personLabel}</span>
        </div>
      </div>

      {/* Progress Bar — Tactical Segments */}
      <div className="flex items-center gap-1 mb-8 relative z-10 mx-auto w-full max-w-xs" dir="ltr">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 transition-all duration-500 border-l-2 border-r-2 border-black ${
              idx < internalStep
                ? "bg-teal-500 shadow-[0_0_10px_#2dd4bf]"
                : idx === internalStep
                  ? "bg-teal-500/50 animate-pulse"
                  : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 relative z-10 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={internalStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className="flex flex-col h-full space-y-6"
          >
            <h3 className="text-lg sm:text-2xl font-black text-center tracking-tight leading-relaxed text-white font-alexandria">
              <EditableText id={`feeling_q${internalStep + 1}`} defaultText={feelingCopy[`q${internalStep + 1}` as keyof typeof feelingCopy] as string} page="feeling" showEditIcon={false} />
            </h3>
            
            <div className="flex flex-col gap-3 pb-8 max-w-md mx-auto w-full">
              {OPTIONS.map((opt) => {
                const currentKey = `q${internalStep + 1}` as keyof FeelingAnswers;
                const isSelected = answers[currentKey] === opt;
                const label = feelingCopy.options[opt];
                const tier = impactTier[opt] ?? "amber";
                
                let activeStyle = "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-teal-500/30 hover:text-white";
                if (isSelected) {
                   if (tier === "green") activeStyle = "bg-teal-900/40 text-teal-300 border-teal-500 shadow-[inset_-20px_0_40px_-20px_rgba(45,212,191,0.4)]";
                   else if (tier === "amber") activeStyle = "bg-amber-900/40 text-amber-300 border-amber-500 shadow-[inset_-20px_0_40px_-20px_rgba(245,158,11,0.4)]";
                   else if (tier === "red") activeStyle = "bg-rose-900/40 text-rose-300 border-rose-500 shadow-[inset_-20px_0_40px_-20px_rgba(225,29,72,0.4)]";
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(currentKey, opt, internalStep)}
                    className={`group w-full flex items-center p-5 text-sm font-black transition-all duration-300 rounded-none border-r-2 overflow-hidden font-tajawal ${activeStyle} ${!isSelected && 'hover:pr-6'}`}
                  >
                    <div className={`font-mono text-xs mr-4 rtl:ml-4 rtl:mr-0 transition-colors ${isSelected ? "text-white" : "text-slate-600 group-hover:text-slate-400"}`}>
                       {isSelected ? "[X]" : "[ ]"}
                    </div>
                    <span className="tracking-wide text-right flex-1">{label}</span>
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
