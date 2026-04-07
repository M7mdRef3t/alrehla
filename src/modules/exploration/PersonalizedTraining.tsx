import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Target,
  X,
  Sparkles
} from "lucide-react";
import { getScenariosForNode, type TrainingScenario } from "@/data/symptomScenarios";
import type { Ring } from "../map/mapTypes";

const LEVEL_LABELS = ["المبتدئ (الرفض)", "المتوسط (الذنب)", "الوحش (التلاعب)"];
const LEVEL_REWARDS = ["مستوى المبتدئ مكتمل! 🎉", "مستوى المتوسط مكتمل! 💪", "مستوى الوحش مكتمل! 🔥"];

function buildLevels(scenarios: TrainingScenario[]): TrainingScenario[][] {
  if (scenarios.length === 0) return [];
  if (scenarios.length <= 3) return [scenarios];
  if (scenarios.length <= 7) return [scenarios.slice(0, 3), scenarios.slice(3)];
  return [scenarios.slice(0, 3), scenarios.slice(3, 7), scenarios.slice(7)];
}

interface PersonalizedTrainingProps {
  personLabel: string;
  selectedSymptoms: string[];
  ring: Ring;
  goalId: string;
  onClose: () => void;
  onComplete?: () => void;
}

export const PersonalizedTraining: React.FC<PersonalizedTrainingProps> = ({
  personLabel,
  selectedSymptoms,
  ring,
  goalId,
  onClose,
  onComplete
}) => {
  const scenarios = getScenariosForNode(ring, goalId, selectedSymptoms);
  const levels = buildLevels(scenarios);
  const totalScenarios = scenarios.length;

  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showLevelReward, setShowLevelReward] = useState(false);

  const levelScenarios = levels[currentLevel] || [];
  const currentScenario = levelScenarios[currentScenarioIndex];
  const isLastInLevel = currentScenarioIndex === levelScenarios.length - 1;
  const isLastLevel = currentLevel === levels.length - 1;
  const isLastScenario = isLastInLevel && isLastLevel;
  const questionNumberGlobal = levels.slice(0, currentLevel).reduce((acc, l) => acc + l.length, 0) + currentScenarioIndex + 1;
  const progress = totalScenarios > 0 ? (questionNumberGlobal / totalScenarios) * 100 : 0;

  // Haptic عند سؤال "جسمك بيحذرك" (تذكير يتنفس)
  useEffect(() => {
    if (currentScenario?.id === "tension-scenario-1" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [currentScenario?.id]);

  // If no scenarios available
  if (scenarios.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-2xl max-w-md w-full p-6"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              مفيش تدريبات متاحة
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              اختر الأعراض في شاشة النتيجة أولًا حتى نتمكن من توليد تدريب مخصص لك
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              تمام
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleOptionClick = (optionId: string) => {
    if (isAnswered) return;

    setSelectedOption(optionId);
    setIsAnswered(true);

    const selectedOptionData = currentScenario.options.find(
      (opt) => opt.id === optionId
    );

    if (selectedOptionData?.isCorrect) {
      setScore(score + 1);
      if (currentScenario.id === "tension-scenario-1" && navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    }
  };

  const handleNext = () => {
    if (isLastInLevel && !isLastLevel) {
      setShowLevelReward(true);
    } else if (isLastScenario) {
      setShowResults(true);
      if (onComplete) onComplete();
    } else {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handleLevelCompleteNext = () => {
    setShowLevelReward(false);
    setCurrentLevel(currentLevel + 1);
    setCurrentScenarioIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleRestart = () => {
    setCurrentLevel(0);
    setCurrentScenarioIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
    setShowLevelReward(false);
  };

  // Level reward screen (بعد إكمال مستوى)
  if (showLevelReward) {
    const levelTitle = LEVEL_REWARDS[currentLevel] || "مستوى مكتمل! 🎉";
    const nextLabel = currentLevel === 0 ? "كمل للمتوسط" : "كمل للوحش";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden p-6 text-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{levelTitle}</h2>
          <p className="text-slate-600 text-sm mb-6">
            مكافأة: أنت واعي أكتر. كمل للمستوى اللي بعده؟
          </p>
          <button
            onClick={handleLevelCompleteNext}
            className="w-full px-6 py-4 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
          >
            {nextLabel}
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  // Results Screen (بدون نسبة مئوية – رسائل تشجيعية فقط)
  if (showResults) {
    const ratio = totalScenarios > 0 ? score / totalScenarios : 0;
    const isHigh = ratio >= 0.5;
    const message = isHigh
      ? "أنت جاهز للمواجهة!"
      : "بداية كويسة للوعي.. إحنا هنا عشان نتعلم.";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-linear-to-br from-white to-teal-50 rounded-2xl max-w-md w-full overflow-hidden"
        >
          <div className="bg-linear-to-br from-teal-500 to-cyan-600 p-6 text-white text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>
            <Trophy className="w-16 h-16 mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-1">
              {isHigh ? "أنت جاهز للمواجهة! 💪" : "استمر في التدريب 🌱"}
            </h2>
            <p className="text-teal-100 text-sm">تدريب مخصص على التعامل مع {personLabel}</p>
          </div>

          <div className="p-6">
            <div className="bg-white rounded-xl p-4 mb-6 border-2 border-teal-200">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                تقييمك
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 px-4 py-3 bg-white border-2 border-teal-500 text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors"
              >
                أعد التدريب
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              >
                تمام، إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const levelLabel = LEVEL_LABELS[currentLevel] ?? "التدريب";

  if (!currentScenario) {
    return null;
  }

  // Training Screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-linear-to-br from-teal-50 to-cyan-50 p-6 border-b border-teal-100">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">
                تدريب مخصص - {personLabel}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-teal-600 font-medium">{levelLabel}</div>
              <div className="text-sm font-semibold text-slate-700">
                السؤال {questionNumberGlobal} / {totalScenarios}
              </div>
              <div className="flex items-center gap-2 bg-teal-100 px-3 py-1 rounded-full">
                <Trophy className="w-4 h-4 text-teal-700" />
                <span className="text-sm font-bold text-teal-900">{score}</span>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100">
          <motion.div
            className="h-full bg-linear-to-r from-teal-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScenarioIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Scenario Title */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {currentScenario.title}
                </h3>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-3">
                  <p className="text-sm text-purple-900 font-medium mb-2">
                    📌 السياق:
                  </p>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    {currentScenario.context}
                  </p>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                  <p className="text-sm text-yellow-900 font-bold mb-1">
                    ❓ الموقف:
                  </p>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    {currentScenario.situation}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  اختار أفضل رد:
                </p>
                {currentScenario.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isCorrect = option.isCorrect;
                  const showFeedback = isAnswered && isSelected;

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id)}
                      disabled={isAnswered}
                      whileHover={!isAnswered ? { scale: 1.02 } : {}}
                      whileTap={!isAnswered ? { scale: 0.98 } : {}}
                      className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                        isAnswered
                          ? isSelected
                            ? isCorrect
                              ? "bg-green-50 border-green-400"
                              : "bg-red-50 border-red-400"
                            : "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-white border-slate-200 hover:border-teal-400 hover:bg-teal-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isAnswered && isSelected
                              ? isCorrect
                                ? "bg-green-500"
                                : "bg-red-500"
                              : "bg-slate-200"
                          }`}
                        >
                          {isAnswered && isSelected ? (
                            isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : (
                              <XCircle className="w-4 h-4 text-white" />
                            )
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 mb-1">
                            {option.text}
                          </p>
                          {showFeedback && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-3 pt-3 border-t border-slate-200"
                            >
                              <p
                                className={`text-xs font-bold mb-2 ${
                                  isCorrect ? "text-green-700" : "text-red-700"
                                }`}
                              >
                                {option.feedback}
                              </p>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {option.explanation}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            تخطي
          </button>
          {isAnswered ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors"
            >
              {isLastScenario ? "شوف النتيجة" : "السؤال التالي"}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <div className="text-slate-400 text-sm">اختار إجابة...</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
