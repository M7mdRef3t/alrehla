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
        
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-teal-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.1)] relative group">
             <ScanEye className="w-8 h-8 text-teal-400 transition-transform group-hover:scale-110 duration-700" />
             <div className="absolute inset-0 rounded-2xl bg-teal-500/5 blur-xl group-hover:bg-teal-500/10 transition-all" />
          </div>
          <h2 id="reality-title" className="text-3xl font-black text-white tracking-tight">
            <EditableText id="reality_title" defaultText={realityCopy.title} page="reality" />
          </h2>
          <p className="text-sm font-bold text-slate-400 leading-relaxed px-4 max-w-md mx-auto opacity-80">
            <EditableText id="reality_body_prefix" defaultText={realityCopy.bodyPrefix} page="reality" showEditIcon={false} />{" "}
            <span className="text-teal-400 border-b border-teal-500/30">({personLabel})</span>
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
          <motion.li key={key} variants={itemVariant} className="p-7 bg-white/[0.03] border border-white/5 backdrop-blur-2xl rounded-[2rem] text-right shadow-2xl group transition-all hover:bg-white/[0.05]">
            <p className="text-sm font-black mb-6 text-slate-100 flex items-start gap-4 leading-relaxed border-r-2 border-slate-700/50 pr-5">
              <Target className="w-4 h-4 mt-1 shrink-0 text-teal-500/50" />
              <EditableText id={`reality_${key}`} defaultText={realityCopy[key]} page="reality" showEditIcon={false} />
            </p>
            <div className="flex gap-2 items-stretch flex-wrap sm:flex-nowrap">
              {OPTIONS.map((opt) => {
                const isSelected = answers[key] === opt;
                const label = realityCopy.options[opt];
                
                let activeStyle = "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300";
                
                if (isSelected) {
                   const tier = realityTier[opt] ?? "amber";
                   if (tier === "green") activeStyle = "bg-teal-500 text-white border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)] scale-[1.02]";
                   else if (tier === "amber") activeStyle = "bg-amber-500 text-white border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]";
                   else if (tier === "red") activeStyle = "bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]";
                }

                return (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className={`flex-1 min-w-[75px] transition-all duration-500 p-4 rounded-2xl border font-black text-[10px] sm:text-xs uppercase tracking-tighter ${activeStyle}`}
                    onClick={() => handleAnswer(key, opt)}
                    title={label}
                  >
                    <span className="relative z-10 truncate block text-center">{label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-8 shrink-0 pb-2 relative z-10">
        <motion.button
          whileHover={allAnswered ? { scale: 1.02 } : {}}
          whileTap={allAnswered ? { scale: 0.98 } : {}}
          type="button"
          disabled={!allAnswered}
          className={`w-full sm:w-auto rounded-[2rem] px-16 py-6 text-base font-black transition-all duration-700 tracking-[0.2em] uppercase border shadow-2xl ${
            allAnswered 
              ? "bg-teal-500 text-white border-teal-400/50 shadow-[0_0_40px_rgba(45,212,191,0.3)] hover:shadow-[0_0_60px_rgba(45,212,191,0.5)]" 
              : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed"
          }`}
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
          <div className="flex items-center justify-center gap-3">
            <ScanEye className={`w-6 h-6 ${allAnswered ? "animate-pulse" : "opacity-30"}`} />
            <EditableText id="reality_cta" defaultText={realityCopy.cta} page="reality" editOnClick={false} />
          </div>
        </motion.button>
      </div>
    </section>
  );
};

