import type { FC } from "react";
import React from "react";
import { ArrowLeft, Target, ScanEye } from "lucide-react";
import { realityCopy } from "../copy/reality";
import { EditableText } from "./EditableText";
import { realityTier } from "../utils/optionColors";
import { motion } from "framer-motion";

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

  const handleAnswer = (key: keyof RealityAnswers, value: RealityOption) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const allAnswered = Boolean(answers.q1 && answers.q2 && answers.q3);

  return (
    <section
      className="text-center h-full min-h-0 flex flex-col relative"
      aria-labelledby="reality-title"
    >
      {/* Interrogation Field Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e15_1px,transparent_1px),linear-gradient(to_bottom,#0f766e15_1px,transparent_1px)] bg-[size:40px_40px]" />
        {/* Scan line effect */}
        <motion.div
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          className="absolute left-0 right-0 h-[2px] bg-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.3)] z-0"
        />
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-teal-400 transition-all active:scale-95 rounded-xl hover:bg-white/5 w-fit mb-4 group"
            aria-label="رجوع"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">
              <EditableText id="reality_back" defaultText="رجوع" page="reality" editOnClick={false} />
            </span>
          </button>
        )}
        
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-teal-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.1)] relative">
             <ScanEye className="w-6 h-6 text-teal-400" />
          </div>
          <h2 id="reality-title" className="text-2xl font-black text-slate-50 tracking-wide">
            <EditableText id="reality_title" defaultText={realityCopy.title} page="reality" />
          </h2>
          <p className="text-sm font-medium text-slate-400 leading-relaxed px-4 max-w-sm mx-auto">
            <EditableText id="reality_body_prefix" defaultText={realityCopy.bodyPrefix} page="reality" showEditIcon={false} />{" "}
            <span className="font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">({personLabel})</span>
          </p>
        </div>
      </div>

      <motion.ul 
        variants={listVariant}
        initial="hidden"
        animate="show"
        className="list-none flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 text-sm text-slate-200 max-w-md mx-auto w-full relative z-10"
      >
        {(["q1", "q2", "q3"] as const).map((key) => (
          <motion.li key={key} variants={itemVariant} className="p-5 bg-slate-900/60 border border-white/5 backdrop-blur-xl rounded-2xl text-right hover:border-white/10 transition-colors shadow-xl">
            <p className="font-bold mb-4 text-slate-100 flex items-start gap-3 leading-relaxed">
              <Target className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
              <EditableText id={`reality_${key}`} defaultText={realityCopy[key]} page="reality" showEditIcon={false} />
            </p>
            <div className="flex gap-2 items-stretch flex-wrap sm:flex-nowrap">
              {OPTIONS.map((opt) => {
                const isSelected = answers[key] === opt;
                const label = realityCopy.options[opt];
                // Base Sovereign Style
                let activeStyle = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";
                
                if (isSelected) {
                   const tier = realityTier[opt] ?? "amber";
                   if (tier === "green") activeStyle = "bg-teal-500/20 border-teal-500/50 text-teal-100 shadow-[0_0_15px_rgba(20,184,166,0.2)]";
                   else if (tier === "amber") activeStyle = "bg-amber-500/20 border-amber-500/50 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
                   else if (tier === "red") activeStyle = "bg-rose-500/20 border-rose-500/50 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]";
                }

                return (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className={`flex-1 min-w-[70px] transition-all duration-300 p-2.5 rounded-xl border relative overflow-hidden font-bold text-xs ${activeStyle}`}
                    onClick={() => handleAnswer(key, opt)}
                    title={label}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId={`glow_${key}`}
                        className="absolute inset-0 bg-white/5"
                      />
                    )}
                    <span className="relative z-10 truncate block text-center">{label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-6 shrink-0 pb-2 relative z-10">
        <motion.button
          whileHover={allAnswered ? { scale: 1.02 } : {}}
          whileTap={allAnswered ? { scale: 0.98 } : {}}
          type="button"
          disabled={!allAnswered}
          className="w-full sm:w-auto rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-12 py-4 text-base font-black hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] disabled:opacity-30 disabled:saturate-0 disabled:cursor-not-allowed transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border border-teal-400/50"
          onClick={() => {
            if (!allAnswered) return;
            onDone({
              q1: answers.q1 as RealityOption,
              q2: answers.q2 as RealityOption,
              q3: answers.q3 as RealityOption
            });
          }}
          title={allAnswered ? realityCopy.cta : "قم باستكمال الفحص"}
        >
          <div className="flex items-center justify-center gap-2">
            <ScanEye className={`w-5 h-5 ${allAnswered ? "animate-pulse delay-700" : ""}`} />
            <EditableText id="reality_cta" defaultText={realityCopy.cta} page="reality" editOnClick={false} />
          </div>
        </motion.button>
      </div>
    </section>
  );
};

