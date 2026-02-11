import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Battery, Users, Target, CheckCircle2, Compass } from "lucide-react";
import {
  BASELINE_QUESTIONS,
  computeBaselineScore,
  type BaselineAnswers
} from "../data/baselineQuestions";
import { useJourneyState } from "../state/journeyState";

interface BaselineAssessmentProps {
  onComplete: () => void;
}

const questionIcons = {
  q1: <Shield className="w-8 h-8 text-teal-600" />,
  q2: <Battery className="w-8 h-8 text-orange-600" />,
  q3: <Users className="w-8 h-8 text-blue-600" />,
  q4: <Target className="w-8 h-8 text-purple-600" />
};

export const BaselineAssessment: FC<BaselineAssessmentProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<BaselineAnswers>({});
  const [isCompleted, setIsCompleted] = useState(false);
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
      setIsCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (!question && !isCompleted) return null;

  // Completion celebration
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-gradient-to-r from-teal-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-slate-900 mb-4"
        >
          تمام! بوصلتك اضبطت ✨
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-600 mb-6"
        >
          دلوقتي نقدر نبدأ نرسم خريطة علاقاتك الشخصية
        </motion.p>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 mx-auto text-teal-600"
        >
          <Compass className="w-full h-full" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      {/* Progress with better visual */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 text-teal-600"
          >
            <Compass className="w-full h-full" />
          </motion.div>
          <span className="text-sm font-medium text-slate-600">
            ضبط بوصلتك الداخلية
          </span>
        </div>
        
        <span className="text-xs text-slate-500">
          سؤال {currentIndex + 1} من {BASELINE_QUESTIONS.length}
        </span>
        <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / BASELINE_QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
          {/* Question with icon */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              {questionIcons[question.id as keyof typeof questionIcons]}
            </motion.div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 text-right">
              {question.text}
            </h2>
          </div>

          {question.type === "scale" && (
            <div className="space-y-6">
              <div className="flex justify-between text-sm text-slate-500 mb-4">
                <span>{question.scaleLabels?.low}</span>
                <span>{question.scaleLabels?.high}</span>
              </div>
              <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.button
                    key={n}
                    type="button"
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [question.id]: n }))
                    }
                    className={`w-14 h-14 sm:w-12 sm:h-12 rounded-full font-bold text-lg transition-all ${
                      answers[question.id] === n
                        ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white scale-110"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {question.type === "choice" && question.options && (
            <div className="flex flex-col gap-3">
              {question.options.map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setAnswers((a) => ({ ...a, [question.id]: option.value }))
                  }
                  className={`p-4 rounded-xl text-right transition-all ${
                    answers[question.id] === option.value
                      ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mt-8">
        <motion.button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className={`px-6 py-3 rounded-full font-medium transition-all ${
            currentIndex === 0
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
          whileHover={currentIndex > 0 ? { scale: 1.05 } : {}}
          whileTap={currentIndex > 0 ? { scale: 0.95 } : {}}
        >
          السابق
        </motion.button>

        <motion.button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          className={`px-6 py-3 rounded-full font-medium transition-all ${
            !canNext
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700"
          }`}
          whileHover={canNext ? { scale: 1.05 } : {}}
          whileTap={canNext ? { scale: 0.95 } : {}}
        >
          {isLast ? "اكتمل" : "التالي"}
        </motion.button>
      </div>
    </div>
  );
};
