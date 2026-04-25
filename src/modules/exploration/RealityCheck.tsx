import type { FC } from "react";
import React, { useState } from "react";
import { ArrowLeft, Target, ScanEye } from "lucide-react";
import { realityCopy } from "@/copy/reality";
import { EditableText } from "./EditableText";
import { realityTier } from "@/utils/optionColors";
import { motion, AnimatePresence } from "framer-motion";

export type RealityOption = "often" | "sometimes" | "rarely" | "never";

export type RealityAnswers = {
  q1: RealityOption;
  q2: RealityOption;
  q3: RealityOption;
};

/** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
const OPTIONS: RealityOption[] = ["often", "sometimes", "rarely", "never"];

interface RealityCheckProps {
  personLabel: string;
  onDone: (answers: RealityAnswers) => void;
  /** عند التوفير يظهر زر رجوع للشاشة السابقة */
  onBack?: () => void;
}

const listVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 15, rotateX: 10 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring" as const, bounce: 0.4 } }
};

export const RealityCheck: FC<RealityCheckProps> = ({
  personLabel,
  onDone,
  onBack
}) => {
  const [answers, setAnswers] = React.useState<Partial<RealityAnswers>>({});
  const [internalStep, setInternalStep] = useState(0);

  const handleAnswer = (key: keyof RealityAnswers, value: RealityOption, stepIndex: number) => {
    import("@/services/soundManager").then((m) => m.soundManager.playEffect("cosmic_pulse"));
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (stepIndex < 2) {
      setTimeout(() => setInternalStep(stepIndex + 1), 300);
    }
  };

  const allAnswered = Boolean(answers.q1 && answers.q2 && answers.q3);

  React.useEffect(() => {
    if (allAnswered) {
      const t = setTimeout(() => {
        onDone({
          q1: answers.q1 as RealityOption,
          q2: answers.q2 as RealityOption,
          q3: answers.q3 as RealityOption
        });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [allAnswered, answers, onDone]);

  return (
    <section
      className="text-center h-full min-h-0 flex flex-col relative"
      aria-labelledby="reality-title"
    >
      {/* Interrogation Field Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000030_1px,transparent_1px),linear-gradient(to_bottom,#00000030_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e15_1px,transparent_1px),linear-gradient(to_bottom,#0f766e15_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
        
        {/* Scan line effect */}
        <motion.div
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 12, ease: "linear", repeat: Infinity }}
          className="absolute left-0 right-0 h-[2px] bg-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.4)] z-0"
        />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-teal-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.1)] relative group">
             <ScanEye className="w-8 h-8 text-teal-400 transition-transform group-hover:scale-110 duration-700" />
             <div className="absolute inset-0 rounded-2xl bg-teal-500/5 blur-xl group-hover:bg-teal-500/10 transition-all" />
          </div>
          <h2 id="reality-title" className="text-3xl font-black text-[var(--consciousness-text)] tracking-tight">
            <EditableText id="reality_title" defaultText={realityCopy.title} page="reality" />
          </h2>
          <p className="text-sm font-bold text-[var(--consciousness-text-muted)] leading-relaxed px-4 max-w-md mx-auto opacity-80">
            <EditableText id="reality_body_prefix" defaultText={realityCopy.bodyPrefix} page="reality" showEditIcon={false} />{" "}
            <span className="text-teal-500 dark:text-teal-400 border-b border-teal-500/30">({personLabel})</span>
          </p>
        </div>
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
              <EditableText id={`reality_q${internalStep + 1}`} defaultText={realityCopy[`q${internalStep + 1}` as keyof typeof realityCopy] as string} page="reality" showEditIcon={false} />
            </h3>
            
            <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
              {OPTIONS.map((opt) => {
                const currentKey = `q${internalStep + 1}` as keyof RealityAnswers;
                const isSelected = answers[currentKey] === opt;
                const label = realityCopy.options[opt];
                const tier = realityTier[opt] ?? "amber";
                
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

        {onBack && (
          <div className="mt-8 shrink-0 flex justify-end relative z-10 w-full max-w-md mx-auto">
            <button
              type="button"
              className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all duration-500"
              onClick={() => {
                if (internalStep > 0) setInternalStep(s => s - 1);
                else onBack();
              }}
            >
              <EditableText id="reality_back" defaultText="رجوع" page="reality" editOnClick={false} />
            </button>
          </div>
        )}
    </section>
  );
};

