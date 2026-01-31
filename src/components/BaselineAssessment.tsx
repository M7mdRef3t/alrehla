import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BASELINE_QUESTIONS,
  computeBaselineScore,
  type BaselineAnswers,
  type BaselineQuestion
} from "../data/baselineQuestions";
import { useJourneyState } from "../state/journeyState";

interface BaselineAssessmentProps {
  onComplete: () => void;
}

export const BaselineAssessment: FC<BaselineAssessmentProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<BaselineAnswers>({});
  const completeBaseline = useJourneyState((s) => s.completeBaseline);

  const question = BASELINE_QUESTIONS[currentIndex];
  const isLast = currentIndex === BASELINE_QUESTIONS.length - 1;
  const canNext =
    question &&
    (question.type === "scale"
      ? typeof answers[question.id] === "number"
      : typeof answers[question.id] === "string");

  const handleNext = () => {
    if (isLast) {
      const score = computeBaselineScore(answers);
      completeBaseline(answers, score);
      onComplete();
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (!question) return null;

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <div className="mb-6">
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {BASELINE_QUESTIONS.length}
        </span>
        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / BASELINE_QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8">
            {question.text}
          </h2>

          {question.type === "scale" && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span>{question.scaleLabels?.low}</span>
                <span>{question.scaleLabels?.high}</span>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [question.id]: n }))
                    }
                    className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
                      answers[question.id] === n
                        ? "bg-teal-600 text-white scale-110 shadow-lg"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {question.type === "choice" && question.options && (
            <div className="flex flex-col gap-3">
              {question.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setAnswers((a) => ({ ...a, [question.id]: opt.value }))
                  }
                  className={`px-6 py-4 rounded-2xl text-right font-medium transition-all border-2 ${
                    answers[question.id] === opt.value
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex justify-between items-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
        >
          رجوع
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          className="px-6 py-3 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLast ? "ابدأ الخريطة" : "التالي"}
        </button>
      </div>
    </div>
  );
};
