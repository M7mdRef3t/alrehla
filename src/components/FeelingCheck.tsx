import type { FC } from "react";
import React from "react";
import { feelingCopy } from "../copy/feeling";
import { getOptionButtonClass, impactTier } from "../utils/optionColors";

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
  const [answers, setAnswers] = React.useState<FeelingAnswers>({
    q1: "sometimes",
    q2: "sometimes",
    q3: "sometimes"
  });

  const [answered, setAnswered] = React.useState<Record<string, boolean>>({
    q1: true,
    q2: true,
    q3: true
  });

  const handleAnswer = (key: keyof FeelingAnswers, value: FeelingOption) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setAnswered((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <section
      className="mt-10 text-center"
      aria-labelledby="feeling-title"
    >
      <h2 id="feeling-title" className="text-2xl font-bold text-slate-900 mb-2">
        {feelingCopy.title}
      </h2>
      <p className="text-base text-gray-600 leading-relaxed">
        {feelingCopy.body} <span className="font-semibold text-slate-800">({personLabel})</span>
      </p>

      <ul className="list-none mt-8 space-y-4 text-sm text-slate-800 max-w-md mx-auto">
        {(["q1", "q2", "q3"] as const).map((key) => (
          <li key={key} className="p-4 bg-white border border-gray-200 rounded-xl text-right">
            <p className="font-medium mb-3">{feelingCopy[key]}</p>
            <div className="flex gap-2 items-stretch">
              {OPTIONS.map((opt) => {
                const isSelected = answers[key] === opt;
                const label = feelingCopy.options[opt];
                const tier = impactTier[opt] ?? "amber";
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`flex-1 min-w-0 ${getOptionButtonClass(tier, isSelected)}`}
                    onClick={() => handleAnswer(key, opt)}
                    title={label}
                  >
                    {label} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <button
          type="button"
          disabled={!answered.q1 || !answered.q2 || !answered.q3}
          className="rounded-full bg-teal-600 text-white px-10 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          onClick={() => onDone(answers)}
          title={answered.q1 && answered.q2 && answered.q3 ? "التالي: فين الشخص في حياتك؟" : "جاوب على كل الأسئلة الأول"}
        >
          {feelingCopy.cta}
        </button>
      </div>
    </section>
  );
};
