import type { FC } from "react";
import React from "react";
import { motion } from "framer-motion";
import { feelingCopy } from "../copy/feeling";
import { EditableText } from "./EditableText";
import { getOptionButtonClass, impactTier } from "../utils/optionColors";
import { calculateEntropy } from "../services/predictiveEngine";
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
  
  // Predictive Engine integration: Check entropy once on mount
  const prediction = React.useMemo(() => calculateEntropy(), []);
  const isChaos = prediction.entropyScore >= 70;

  const handleAnswer = (key: keyof FeelingAnswers, value: FeelingOption) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const answered = {
    q1: Boolean(answers.q1),
    q2: Boolean(answers.q2),
    q3: Boolean(answers.q3)
  };

  const allAnswered = answered.q1 && answered.q2 && answered.q3;

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

      <div className="relative z-10 mb-6">
        <h2 id="feeling-title" className="text-2xl font-black text-white mb-2 tracking-tight">
          <EditableText id="feeling_title" defaultText={feelingCopy.title} page="feeling" />
        </h2>
        <p className="text-sm font-bold text-slate-400 leading-relaxed px-4 opacity-80">
          <EditableText id="feeling_body" defaultText={feelingCopy.body} page="feeling" multiline showEditIcon={false} />{" "}
          <span className="text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]">({personLabel})</span>
        </p>
      </div>

      <ul className="list-none flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 text-sm text-slate-200 max-w-md mx-auto w-full relative z-10">
        {(["q1", "q2", "q3"] as const).map((key) => (
          <li key={key} className="p-6 bg-white/[0.03] border border-white/5 backdrop-blur-xl rounded-[2rem] text-right shadow-2xl transition-all hover:bg-white/[0.05]">
            <p className="text-sm font-black mb-5 text-slate-200 tracking-wide border-r-2 border-teal-500/30 pr-4">
              <EditableText id={`feeling_${key}`} defaultText={feelingCopy[key]} page="feeling" showEditIcon={false} />
            </p>
            <div className="flex gap-2 items-stretch">
              {OPTIONS.map((opt) => {
                const isSelected = answers[key] === opt;
                const label = feelingCopy.options[opt];
                const tier = impactTier[opt] ?? "amber";
                
                let activeStyle = "bg-white/[0.05] border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300";
                if (isSelected) {
                   if (tier === "green") activeStyle = "bg-teal-500 text-white border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)] scale-[1.02]";
                   else if (tier === "amber") activeStyle = "bg-amber-500 text-white border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]";
                   else if (tier === "red") activeStyle = "bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]";
                }

                return (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className={`flex-1 min-w-0 transition-all duration-500 p-3.5 rounded-2xl border font-black text-[10px] sm:text-xs uppercase tracking-tighter ${activeStyle}`}
                    onClick={() => handleAnswer(key, opt)}
                    title={label}
                  >
                    <span className="truncate">{label}</span>
                  </motion.button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 shrink-0 pb-2 relative z-10">
        <motion.button
          whileHover={allAnswered ? { scale: 1.02 } : {}}
          whileTap={allAnswered ? { scale: 0.98 } : {}}
          type="button"
          disabled={!allAnswered}
          className={`w-full sm:w-auto rounded-[2rem] px-16 py-5 text-base font-black transition-all duration-700 tracking-[0.2em] uppercase ${
            allAnswered 
              ? "bg-teal-500 text-white shadow-[0_0_40px_rgba(45,212,191,0.3)] hover:shadow-[0_0_60px_rgba(45,212,191,0.5)]" 
              : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
          }`}
          onClick={() => {
            if (!allAnswered) return;
            onDone({
              q1: answers.q1 as FeelingOption,
              q2: answers.q2 as FeelingOption,
              q3: answers.q3 as FeelingOption
            });
          }}
          title={allAnswered ? "التالي: توازن العلاقة" : "جاوب على كل الأسئلة الأول"}
        >
          <EditableText id="feeling_cta" defaultText={feelingCopy.cta} page="feeling" editOnClick={false} />
        </motion.button>
      </div>
    </section>
  );
};
