import type { FC } from "react";
import React from "react";
import { realityCopy } from "../copy/reality";

export type RealityOption = "often" | "sometimes" | "rarely";

export type RealityAnswers = {
  q1: RealityOption;
  q2: RealityOption;
  q3: RealityOption;
};

const OPTIONS: RealityOption[] = ["often", "sometimes", "rarely"];

/** غالبًا=2، أحيانًا=1، نادراً=0. المجموع 4–6 أخضر، 2–3 أصفر، 0–1 أحمر */
export function realityScoreToRing(answers: RealityAnswers): "green" | "yellow" | "red" {
  const score =
    (answers.q1 === "often" ? 2 : answers.q1 === "sometimes" ? 1 : 0) +
    (answers.q2 === "often" ? 2 : answers.q2 === "sometimes" ? 1 : 0) +
    (answers.q3 === "often" ? 2 : answers.q3 === "sometimes" ? 1 : 0);
  if (score >= 4) return "green";
  if (score >= 2) return "yellow";
  return "red";
}

interface RealityCheckProps {
  personLabel: string;
  onDone: (answers: RealityAnswers) => void;
}

export const RealityCheck: FC<RealityCheckProps> = ({
  personLabel,
  onDone
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
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`flex-1 rounded-full px-3 py-2.5 text-sm font-medium active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isSelected
                        ? "bg-teal-100 text-teal-700 border-2 border-teal-500 shadow-sm focus-visible:ring-teal-400"
                        : "bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-600 focus-visible:ring-gray-400"
                    }`}
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
