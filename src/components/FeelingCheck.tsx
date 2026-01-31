import type { FC } from "react";
import React from "react";
import { feelingCopy } from "../copy/feeling";

export type FeelingAnswers = {
  q1: boolean;
  q2: boolean;
  q3: boolean;
};

interface FeelingCheckProps {
  personLabel: string;
  onDone: (answers: FeelingAnswers) => void;
}

export const FeelingCheck: FC<FeelingCheckProps> = ({
  personLabel,
  onDone
}) => {
  const [answers, setAnswers] = React.useState<FeelingAnswers>({
    q1: false,
    q2: false,
    q3: false
  });
  
  // Track which questions have been answered
  const [answered, setAnswered] = React.useState<Record<string, boolean>>({
    q1: false,
    q2: false,
    q3: false
  });

  const handleAnswer = (key: keyof FeelingAnswers, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value
    }));
    setAnswered((prev) => ({
      ...prev,
      [key]: true
    }));
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
        {/* Question 1 */}
        <li className="p-4 bg-white border border-gray-200 rounded-xl text-right">
          <p className="font-medium mb-3">{feelingCopy.q1}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                answered.q1 && answers.q1
                  ? "bg-rose-100 text-rose-700 border-2 border-rose-500 shadow-sm focus-visible:ring-rose-400"
                  : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-gray-400"
              }`}
              onClick={() => handleAnswer("q1", true)}
              title="نعم"
            >
              نعم {answered.q1 && answers.q1 && "✓"}
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                answered.q1 && !answers.q1
                  ? "bg-teal-100 text-teal-700 border-2 border-teal-500 shadow-sm focus-visible:ring-teal-400"
                  : "bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-600 focus-visible:ring-gray-400"
              }`}
              onClick={() => handleAnswer("q1", false)}
              title="لا"
            >
              لا {answered.q1 && !answers.q1 && "✓"}
            </button>
          </div>
        </li>

        {/* Question 2 */}
        <li className="p-4 bg-white border border-gray-200 rounded-xl text-right">
          <p className="font-medium mb-3">{feelingCopy.q2}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                answered.q2 && answers.q2
                  ? "bg-rose-100 text-rose-700 border-2 border-rose-500 shadow-sm focus-visible:ring-rose-400"
                  : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-gray-400"
              }`}
              onClick={() => handleAnswer("q2", true)}
              title="نعم"
            >
              نعم {answered.q2 && answers.q2 && "✓"}
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                answered.q2 && !answers.q2
                  ? "bg-teal-100 text-teal-700 border-2 border-teal-500 shadow-sm focus-visible:ring-teal-400"
                  : "bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-600 focus-visible:ring-gray-400"
              }`}
              onClick={() => handleAnswer("q2", false)}
              title="لا"
            >
              لا {answered.q2 && !answers.q2 && "✓"}
            </button>
          </div>
        </li>

        {/* Question 3 */}
        <li className="p-4 bg-white border border-gray-200 rounded-xl text-right">
          <p className="font-medium mb-3">{feelingCopy.q3}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                answered.q3 && answers.q3
                  ? "bg-rose-100 text-rose-700 border-2 border-rose-500 shadow-sm focus-visible:ring-rose-400"
                  : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-gray-400"
              }`}
              onClick={() => handleAnswer("q3", true)}
              title="نعم"
            >
              نعم {answered.q3 && answers.q3 && "✓"}
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                answered.q3 && !answers.q3
                  ? "bg-teal-100 text-teal-700 border-2 border-teal-500 shadow-sm focus-visible:ring-teal-400"
                  : "bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-600 focus-visible:ring-gray-400"
              }`}
              onClick={() => handleAnswer("q3", false)}
              title="لا"
            >
              لا {answered.q3 && !answers.q3 && "✓"}
            </button>
          </div>
        </li>
      </ul>

      <div className="mt-8">
        <button
          type="button"
          disabled={!answered.q1 || !answered.q2 || !answered.q3}
          className="rounded-full bg-teal-600 text-white px-10 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          onClick={() => onDone(answers)}
          title={answered.q1 && answered.q2 && answered.q3 ? "شوف النتيجة واقتراح الفعل" : "جاوب على كل الأسئلة الأول"}
        >
          {feelingCopy.cta}
        </button>
      </div>
    </section>
  );
};
