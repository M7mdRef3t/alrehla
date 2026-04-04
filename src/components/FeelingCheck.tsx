import type { FC } from "react";
import React from "react";
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
      className="mt-0 text-center h-full min-h-0 flex flex-col"
      aria-labelledby="feeling-title"
    >
      {isChaos && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 backdrop-blur-md rounded-xl p-4 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
          <h3 className="text-sm font-bold text-rose-100 mb-1">الرادار الإدراكي يوصي بالهدوء</h3>
          <p className="text-xs text-rose-200/80 max-w-sm">
            مؤشرات الفوضى مرتفعة الآن ({prediction.entropyScore}%). يُنصح بتأجيل القرارات الكبرى والتعامل من مساحة "مراقبة" فقط لتجنب استنزاف الطاقة.
          </p>
        </div>
      )}

      <h2 id="feeling-title" className="text-2xl font-bold text-slate-50 mb-2">
        <EditableText id="feeling_title" defaultText={feelingCopy.title} page="feeling" />
      </h2>
      <p className="text-base text-slate-400 leading-relaxed px-4">
        <EditableText id="feeling_body" defaultText={feelingCopy.body} page="feeling" multiline showEditIcon={false} />{" "}
        <span className="font-bold text-teal-400">({personLabel})</span>
      </p>

      <ul className="list-none mt-6 flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 text-sm text-slate-200 max-w-md mx-auto w-full">
        {(["q1", "q2", "q3"] as const).map((key) => (
          <li key={key} className="p-5 bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl text-right">
            <p className="font-semibold mb-4 text-slate-100">
              <EditableText id={`feeling_${key}`} defaultText={feelingCopy[key]} page="feeling" showEditIcon={false} />
            </p>
            <div className="flex gap-2 items-stretch">
              {OPTIONS.map((opt) => {
                const isSelected = answers[key] === opt;
                const label = feelingCopy.options[opt];
                const tier = impactTier[opt] ?? "amber";
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`flex-1 min-w-0 transition-all duration-300 ${getOptionButtonClass(tier, isSelected)}`}
                    onClick={() => handleAnswer(key, opt)}
                    title={label}
                  >
                    <span className="truncate">{label}</span> {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 shrink-0 pb-2">
        <button
          type="button"
          disabled={!allAnswered}
          className="w-full sm:w-auto rounded-full bg-teal-500/90 text-slate-950 px-12 py-4 text-base font-black hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-300 shadow-[0_0_25px_rgba(45,212,191,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
        </button>
      </div>
    </section>
  );
};
