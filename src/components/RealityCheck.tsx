import type { FC } from "react";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { realityCopy } from "../copy/reality";
import { EditableText } from "./EditableText";
import { getOptionButtonClass, realityTier } from "../utils/optionColors";

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
          <span className="font-medium">
            <EditableText id="reality_back" defaultText="رجوع" page="reality" editOnClick={false} />
          </span>
        </button>
      )}
      <h2 id="reality-title" className="text-2xl font-bold text-slate-900 mb-2">
        <EditableText id="reality_title" defaultText={realityCopy.title} page="reality" />
      </h2>
      <p className="text-base text-gray-600 leading-relaxed">
        <EditableText id="reality_body_prefix" defaultText={realityCopy.bodyPrefix} page="reality" showEditIcon={false} />{personLabel}
      </p>

      <ul className="list-none mt-8 space-y-4 text-sm text-slate-800 max-w-md mx-auto">
        {(["q1", "q2", "q3"] as const).map((key) => (
          <li key={key} className="p-4 bg-white border border-gray-200 rounded-xl text-right">
            <p className="font-medium mb-3">
              <EditableText id={`reality_${key}`} defaultText={realityCopy[key]} page="reality" showEditIcon={false} />
            </p>
            <div className="flex gap-2 items-stretch">
              {OPTIONS.map((opt) => {
                const isSelected = answers[key] === opt;
                const label = realityCopy.options[opt];
                const tier = realityTier[opt] ?? "amber";
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
          disabled={!allAnswered}
          className="rounded-full bg-teal-600 text-white px-10 py-4 text-base font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          onClick={() => onDone(answers)}
          title={allAnswered ? realityCopy.cta : "جاوب على كل الأسئلة الأول"}
        >
          <EditableText id="reality_cta" defaultText={realityCopy.cta} page="reality" editOnClick={false} />
        </button>
      </div>
    </section>
  );
};
