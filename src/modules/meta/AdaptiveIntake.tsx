import type { FC } from "react";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Send, Zap as Sparkles, Brain, Zap, Target, Lock, Compass } from "lucide-react";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { Card } from "./UI";
import { soundManager } from "@/services/soundManager";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type DetectedState = "overloaded" | "confused" | "triggered" | "stuck" | "avoiding" | "ready";

interface IntakeQuestion {
  id: string;
  text: string;
  options: { value: string; label: string; state?: DetectedState; icon: any }[];
}

const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "state_detection",
    text: "راقب حالتك دلوقتي.. إيه أكتر كلمة بتوصف تأثير المشهد عليك؟",
    options: [
      { value: "heavy", label: "ضبابية ومش قادر أقرر", state: "overloaded", icon: Brain },
      { value: "lost", label: "الرؤية مشوشة ومفيش مسار واضح", state: "confused", icon: Compass },
      { value: "burning", label: "في مشهد دفاع/هجوم ساخن", state: "triggered", icon: Zap },
      { value: "frozen", label: "عالق ومحتاج أكسر التجميد", state: "stuck", icon: Lock },
      { value: "running", label: "عايز أنسحب وأعيد التموضع", state: "avoiding", icon: Target },
      { value: "ready", label: "جاهز أخد قرارات حاسمة", state: "ready", icon: Sparkles },
    ]
  },
  {
      id: "pain_depth",
      text: "التشويش/الاستنزاف ده بقاله قد إيه مأثر على قراراتك؟",
      options: [
          { value: "today", label: "موقف طارئ النهاردة", icon: Target },
          { value: "week", label: "أسبوع من الاستنزاف المستمر", icon: Target },
          { value: "long", label: "نمط متكرر محتاج يتكسر", icon: Target }
      ]
  }
];

const cosmicEase = [0.22, 1, 0.36, 1] as [number, number, number, number];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0, filter: "blur(10px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: cosmicEase } },
  exit: (dir: number) => ({ x: dir < 0 ? 50 : -50, opacity: 0, filter: "blur(10px)", transition: { duration: 0.3 } })
};

const ADAPTIVE_INTAKE_STYLES = `
  .adaptive-intake-heading {
    font-family: var(--font-display);
  }
`;

/* ─── Component ─────────────────────────────────────────────────────────────── */

export const AdaptiveIntake: FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);
  const completeIntake = useJourneyState((s) => s.completeIntake);

  const currentQuestion = INTAKE_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / INTAKE_QUESTIONS.length) * 100;

  const handleSelect = (value: string, state?: DetectedState) => {
    soundManager.playClick();
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    if (state) {
        newAnswers.detected_state = state;
    }
    setAnswers(newAnswers);

    setTimeout(() => {
        if (currentStep < INTAKE_QUESTIONS.length - 1) {
            setDirection(1);
            setCurrentStep(currentStep + 1);
        } else {
            const finalState = (newAnswers.detected_state as DetectedState) || "confused";
            completeIntake(finalState);
            onComplete();
        }
    }, 400);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col min-h-[500px]" dir="rtl">
      <style>{ADAPTIVE_INTAKE_STYLES}</style>
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black text-white mb-2 adaptive-intake-heading">
            قراءة المشهد الداخلي
        </h2>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
            <motion.div 
                className="h-full bg-gradient-to-r from-teal-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
            />
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            <p className="text-xl font-bold text-teal-100/90 mb-8 text-center leading-relaxed">
              {currentQuestion.text}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = answers[currentQuestion.id] === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value, opt.state)}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-4 p-5 rounded-2xl text-right transition-all border ${
                          isSelected ? "border-teal-500/50 bg-teal-500/10" : "border-white/5 bg-white/5"
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${isSelected ? "bg-teal-500/20 text-teal-400" : "bg-white/5 text-white/40"}`}>
                        <Icon size={20} />
                      </div>
                      <span className={`font-bold ${isSelected ? "text-white" : "text-white/70"}`}>
                        {opt.label}
                      </span>
                    </motion.button>
                  );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-center">
          <button 
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="text-white/30 hover:text-white/60 text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-0"
          >
              <ChevronRight size={16} />
              السابق
          </button>
      </div>
    </div>
  );
};
