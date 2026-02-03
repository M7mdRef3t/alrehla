import type { FC } from "react";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { realityCopy } from "../copy/reality";
import { getOptionButtonClass, realityTier } from "../utils/optionColors";

export type RealityOption = "often" | "sometimes" | "rarely" | "never";

export type RealityAnswers = {
  q1: RealityOption;
  q2: RealityOption;
  q3: RealityOption;
};

/** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
const OPTIONS: RealityOption[] = ["often", "sometimes", "rarely", "never"];

/** تواصل: high=3، medium=2، low=1، zero=0. المجموع 6–9 أخضر، 3–5 أصفر، 0–2 أحمر */
function points(opt: RealityOption): number {
  return opt === "often" ? 3 : opt === "sometimes" ? 2 : opt === "rarely" ? 1 : 0;
}

export function realityScoreToRing(answers: RealityAnswers): "green" | "yellow" | "red" {
  const score = points(answers.q1) + points(answers.q2) + points(answers.q3);
  if (score >= 6) return "green";
  if (score >= 3) return "yellow";
  return "red";
}

interface RealityCheckProps {
  personLabel: string;
  onDone: (answers: RealityAnswers) => void;
  /** عند التوفير يظهر زر رجوع للشاشة السابقة */
  onBack?: () => void;
}

export const RealityCheck: FC<RealityCheckProps> = ({
  personLabel,
  onDone,
  onBack
}) => {
  const [answers, setAnswers] = React.useState<RealityAnswers>({
    q1: "sometimes",
    q2: "sometimes",
    q3: "sometimes"
  });

  const [answered, setAnswered] = React.useState<Record<string, boolean>>({
    q1: true,
    q2: true,
    q3: true
  });

  const handleAnswer = (key: keyof RealityAnswers, value: RealityOption) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setAnswered((prev) => ({ ...prev, [key]: true }));
  };

  const allAnswered = answered.q1 && answered.q2 && answered.q3;

  return (
    <section
      className="mt-10 text-center"
      aria-labelledby="reality-title"
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors active:scale-95 rounded-lg hover:bg-gray-100 w-full justify-start"
          aria-label="رجوع"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">رجوع</span>
        </button>
      )}
      <h2 id="reality-title" className="text-2xl font-bold text-slate-900 mb-2">
        {realityCopy.title}
      </h2>
      <p className="text-base text-gray-600 leading-relaxed">
        {realityCopy.bodyPrefix}{personLabel}
      </p>

      <ul className="list-none mt-8 space-y-4 text-sm text-slate-800 max-w-md mx-auto">
        {(["q1", "q2", "q3"] as const).map((key) => (
          <li key={key} className="p-4 bg-white border border-gray-200 rounded-xl text-right">
            <p className="font-medium mb-3">{realityCopy[key]}</p>
            <div className="flex gap-2">
              {OPTIONS.map((opt) => {
                const isSelected = answers[key] === opt;
                const label = realityCopy.options[opt];
                const tier = realityTier[opt] ?? "amber";
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`flex-1 px-3 py-2.5 text-sm font-medium ${getOptionButtonClass(tier, isSelected)}`}
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
          disabled={!allAnswered}
          className="rounded-full bg-teal-600 text-white px-10 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          onClick={() => onDone(answers)}
          title={allAnswered ? realityCopy.cta : "جاوب على كل الأسئلة الأول"}
        >
          {realityCopy.cta}
        </button>
      </div>
    </section>
  );
};
