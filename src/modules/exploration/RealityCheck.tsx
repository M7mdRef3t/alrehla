import type { FC } from "react";
import React, { useState } from "react";
import { ScanEye } from "lucide-react";
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
      {/* Interrogation Field Tactical Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-none border border-white/5 bg-black/40">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHBhdGggZD0iTTAgMEg0IiBzdHJva2U9IiMyZGQ0YmYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-40" />
        
        {/* Scan line effect */}
        <motion.div
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity }}
          className="absolute left-0 right-0 h-[2px] bg-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.3)] z-0"
        />
        {/* HUD Corner Decorators */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-teal-500/50" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-teal-500/50" />
        <div className="absolute top-4 right-8 flex items-center gap-4 text-[8px] font-black tracking-[0.2em] text-slate-500 uppercase pointer-events-none font-tajawal">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            الكيان: {personLabel}
          </div>
          <div className="w-[1px] h-3 bg-slate-800" />
          <div>مصفوفة_معايرة_الواقع_v2.0</div>
        </div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-teal-500/50" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-teal-500/50" />
      </div>

      <div className="relative z-10 pt-6 mb-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-teal-600 uppercase tracking-[0.3em] font-bold animate-pulse font-tajawal">
            [ مصفوفة_معايرة_الواقع ]
          </p>
          <div className="w-12 h-12 mt-2 rounded-sm bg-white/[0.03] border border-teal-500/30 flex items-center justify-center relative group overflow-hidden">
             <ScanEye className="w-6 h-6 text-teal-400 z-10 transition-transform group-hover:scale-110 duration-700" />
             <div className="absolute inset-0 bg-teal-500/5 blur-xl group-hover:bg-teal-500/20 transition-all z-0" />
             <motion.div 
               className="absolute top-0 bottom-0 left-0 w-[1px] bg-teal-400/50 z-0 pointer-events-none"
               animate={{ left: ["0%", "100%", "0%"] }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             />
          </div>
          <h2 id="reality-title" className="text-2xl font-black text-white tracking-tight uppercase mt-2 font-alexandria">
            <EditableText id="reality_title" defaultText={realityCopy.title} page="reality" />
          </h2>
          <div className="inline-flex items-center gap-2 bg-teal-500/10 px-3 py-1 rounded-sm border border-teal-500/20 mt-1">
             <span className="text-xs text-teal-700 uppercase tracking-widest font-tajawal">الكيان:</span>
             <span className="text-sm font-bold text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] tracking-widest font-tajawal">{personLabel}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar — Tactical Segments */}
      <div className="flex items-center gap-1 mb-6 relative z-10 mx-auto w-full max-w-xs" dir="ltr">
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

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 relative z-10 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={internalStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className="flex flex-col h-full space-y-6"
          >
            <h3 className="text-lg sm:text-2xl font-black text-center tracking-tight leading-relaxed text-white font-alexandria">
              <EditableText id={`reality_q${internalStep + 1}`} defaultText={realityCopy[`q${internalStep + 1}` as keyof typeof realityCopy] as string} page="reality" showEditIcon={false} />
            </h3>
            
            <div className="flex flex-col gap-2 max-w-md mx-auto w-full">
              {OPTIONS.map((opt) => {
                const currentKey = `q${internalStep + 1}` as keyof RealityAnswers;
                const isSelected = answers[currentKey] === opt;
                const label = realityCopy.options[opt];
                const tier = realityTier[opt] ?? "amber";
                
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

        {onBack && (
          <div className="mt-8 shrink-0 flex justify-end relative z-10 w-full max-w-md mx-auto">
            <button
              type="button"
              className="px-8 py-4 rounded-none bg-black/40 border border-white/5 text-slate-500 text-[10px] tracking-[0.3em] hover:bg-white/5 hover:text-white hover:border-white/10 transition-all duration-300 uppercase font-tajawal"
              onClick={() => {
                if (internalStep > 0) setInternalStep(s => s - 1);
                else onBack?.();
              }}
            >
              <EditableText id="reality_back" defaultText="إلغاء_الأمر" page="reality" editOnClick={false} />
            </button>
          </div>
        )}
    </section>
  );
};

