import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Shield, Battery, Users, Target, Compass, Sparkles } from "lucide-react";
import {
  BASELINE_QUESTIONS,
  computeBaselineScore,
  type BaselineAnswers
} from "@/data/baselineQuestions";
import { useJourneyState } from "@/state/journeyState";

interface BaselineAssessmentProps {
  onComplete: () => void;
}

const questionIcons = {
  q1: <Shield className="w-6 h-6" />,
  q2: <Battery className="w-6 h-6" />,
  q3: <Users className="w-6 h-6" />,
  q4: <Target className="w-6 h-6" />
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

  // Compass Needle Mouse Tracking Logic
  const needleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseAngle, setMouseAngle] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      // Calculate angle in degrees
      const angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);
      setMouseAngle(angle);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);


  const handleNext = () => {
    if (isLast) {
      const score = computeBaselineScore(answers);
      completeBaseline(answers, score);
      setIsCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 3000); // 3s for cinemtaic lock-in
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (!question && !isCompleted) return null;

  // Cinematic Lock-in Screen
  if (isCompleted) {
    return (
      <motion.div
        className="w-full max-w-lg mx-auto text-center flex flex-col items-center justify-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
          {/* Outer glowing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-teal-500/30"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          {/* Inner ring spinning fast to stop */}
          <motion.div
            className="absolute inset-2 rounded-full border border-teal-400/50 border-t-transparent"
            animate={{ rotate: [0, 360 * 3, 360 * 3] }}
            transition={{ duration: 2, ease: "circOut" }}
          />
          {/* The Needle locking in */}
          <motion.div
            className="absolute w-1 h-24 bg-gradient-to-t from-teal-500 to-transparent origin-bottom"
            style={{ bottom: "50%" }}
            initial={{ rotate: -45, scaleY: 0.8 }}
            animate={{ rotate: 0, scaleY: 1, filter: "drop-shadow(0 0 8px #2dd4bf)" }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
          />
          {/* Flash Effect */}
          <motion.div
            className="absolute inset-0 bg-white rounded-full z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
          <Compass className="w-16 h-16 text-teal-400 opacity-80" />
        </div>

        <motion.h2
          className="text-3xl font-bold mb-4 bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          تم تحديد المسار
        </motion.h2>
        <motion.p
          className="text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          البوصلة جاهزة الآن لاستكشاف خريطتك
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto text-center relative">

      {/* 🧭 Soul Compass Header */}
      <div ref={containerRef} className="relative w-full h-40 mb-8 flex items-center justify-center cursor-crosshair">

        {/* Pulsing Aura */}
        <motion.div
          className="absolute w-48 h-48 rounded-full bg-teal-500/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Background Dial - Larger */}
        <div className="absolute w-36 h-36 rounded-full border border-slate-600/50 bg-slate-900/60 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]" />

        {/* Progress Bezel (SVG Circle) */}
        <svg className="absolute w-36 h-36 -rotate-90 pointer-events-none">
          <circle
            cx="72" cy="72" r="68"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          <motion.circle
            cx="72" cy="72" r="68"
            fill="none"
            stroke="url(#compassGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="427.25" // 2 * pi * 68
            initial={{ strokeDashoffset: 427.25 }}
            animate={{ strokeDashoffset: 427.25 - (427.25 * ((currentIndex + 1) / BASELINE_QUESTIONS.length)) }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />
          <defs>
            <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" /> {/* Golden Amber */}
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>

        {/* The Needle (GOLDEN & Larger) */}
        <motion.div
          ref={needleRef}
          className="absolute w-1.5 h-20 bg-gradient-to-t from-amber-400 to-transparent origin-bottom rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)] pointer-events-none"
          style={{ bottom: "50%" }}
          animate={{
            rotate: isHovering ? mouseAngle : (canNext ? [0, -3, 3, 0] : [0, -60, 60, -30, 30, 0]),
          }}
          transition={{
            repeat: isHovering ? 0 : Infinity,
            repeatType: "mirror",
            duration: canNext ? 5 : 1.5,
            ease: "easeInOut",
            type: isHovering ? "spring" : "tween",
            stiffness: isHovering ? 300 : undefined,
            damping: isHovering ? 30 : undefined,
          }}
        >

          <div className="absolute -top-1 -left-2 w-5 h-5 rounded-full bg-amber-400/30 blur-sm" />
        </motion.div>

        {/* Center Pivot (Gold) */}
        <div className="absolute w-4 h-4 bg-amber-200 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] z-10 border-2 border-slate-900" />
      </div>

      {/* 📝 Question Card (Dark Glass) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          className="glass-card mb-8 px-6 py-8 relative overflow-hidden ring-1 ring-white/10"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4 }}
        >
          {/* Subtle cosmic background glow in card */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon & Title */}
          <div className="flex flex-col items-center gap-4 mb-8 relative z-10">
            <div className="p-3 rounded-full bg-white/5 border border-white/10 shadow-lg shadow-amber-900/20 text-amber-400">
              {questionIcons[question.id as keyof typeof questionIcons]}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">
              {question.text}
            </h2>
          </div>

          {/* 🪐 Planetary Scale Choices (Stars to Planets) */}
          {question.type === "scale" && (
            <div className="space-y-6">
              <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest px-2">
                <span>{question.scaleLabels?.low}</span>
                <span>{question.scaleLabels?.high}</span>
              </div>

              <div className="flex justify-center items-center gap-2 sm:gap-4 relative h-16">
                {/* Connecting Line (Stardust) */}
                <div className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-slate-600/50 to-transparent top-1/2 -z-0" />

                {[1, 2, 3, 4, 5].map((n) => {
                  const isSelected = answers[question.id] === n;
                  return (
                    <motion.button
                      key={n}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [question.id]: n }))}
                      className={`relative z-10 flex items-center justify-center transition-all duration-300 rounded-full ${isSelected
                          ? "bg-amber-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.6)] border-2 border-white/30"
                          : "bg-slate-800 text-slate-500 border border-slate-600 hover:bg-slate-700 hover:scale-125"
                        }`}
                      style={{
                        width: isSelected ? 56 : 24, // Tiny stars vs Big Planet
                        height: isSelected ? 56 : 24,
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className={`text-lg font-bold ${isSelected ? "opacity-100" : "opacity-0"}`}>
                        {n}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🌑 Choice Buttons (Asteroids) */}
          {question.type === "choice" && question.options && (
            <div className="flex flex-col gap-3">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [question.id]: option.value }))}
                    className={`relative p-4 rounded-xl text-right transition-all border overflow-hidden group ${isSelected
                      ? "bg-teal-500/20 border-teal-500/50 text-white shadow-[0_0_15px_rgba(45,212,191,0.15)]"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                      }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="glow"
                        className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      {isSelected && <Sparkles className="w-4 h-4 text-teal-300 animate-pulse" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 🚀 Navigation Controls */}
      <div className="flex justify-between items-center px-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className={`text-sm font-medium transition-colors ${currentIndex === 0 ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-white"
            }`}
        >
          السابق
        </button>

        <motion.button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          className={`px-8 py-3 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 ${!canNext
            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            : "bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] border border-white/10"
            }`}
          whileHover={canNext ? { scale: 1.05 } : {}}
          whileTap={canNext ? { scale: 0.95 } : {}}
        >
          <span>{isLast ? "أكمل المعايرة" : "التالي"}</span>
          {canNext && <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>}
        </motion.button>
      </div>
    </div>
  );
};


