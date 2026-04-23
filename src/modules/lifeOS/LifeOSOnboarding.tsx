"use client";

/**
 * 🌅 LifeOSOnboarding — أول خطوة في الرحلة
 * ============================================
 * الشاشة الأولى اللي المسافر بيشوفها لو ما عنده تقييمات بعد.
 * 5 خطوات بسيطة توصله لحالة نشطة في Life OS.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap as Sparkles, Heart, ChevronLeft, Check, Flame, Zap } from "lucide-react";
import { LIFE_DOMAINS, type LifeDomainId } from "@/types/lifeDomains";
import { useLifeState } from '@/modules/map/dawayirIndex';
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { resolveDisplayName } from "@/services/userMemory";

// ─── Types ────────────────────────────────────────────────────────

type OnboardingStep = "welcome" | "domain-pick" | "pulse" | "assessment" | "launch";

const MOOD_OPTIONS = [
  { value: "bright" as const, emoji: "😄", label: "مبسوط" },
  { value: "calm" as const, emoji: "😌", label: "هادي" },
  { value: "hopeful" as const, emoji: "🌱", label: "متفائل" },
  { value: "tense" as const, emoji: "😤", label: "متوتر" },
  { value: "anxious" as const, emoji: "😟", label: "قلقان" },
  { value: "overwhelmed" as const, emoji: "🌊", label: "مرهق" },
];

// ─── Progress Bar ─────────────────────────────────────────────────
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full transition-all"
          animate={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i <= current ? "#8b5cf6" : "rgba(255,255,255,0.1)",
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
interface LifeOSOnboardingProps {
  onComplete: () => void;
}

export function LifeOSOnboarding({ onComplete }: LifeOSOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [selectedDomain, setSelectedDomain] = useState<LifeDomainId>("self");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState<number>(5);
  const [assessmentAnswers, setAssessmentAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const submitAssessment = useLifeState(s => s.submitAssessment);
  const setPulseCheck = useAppOverlayState(s => s.setPulseCheck);
  const userName = resolveDisplayName();

  const STEPS: OnboardingStep[] = ["welcome", "domain-pick", "pulse", "assessment", "launch"];
  const currentStepIndex = STEPS.indexOf(step);
  const selectedDomainConfig = LIFE_DOMAINS.find(d => d.id === selectedDomain)!;
  const questions = selectedDomainConfig.quickAssessmentQuestions;

  const handleAnswerQuestion = useCallback((score: number) => {
    const newAnswers = [...assessmentAnswers, score];
    setAssessmentAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      // All questions answered — save assessment
      const avgScore = Math.round(
        newAnswers.reduce((s, a) => s + a, 0) / newAnswers.length
      );
      submitAssessment(
        selectedDomain,
        avgScore,
        newAnswers,
        "تقييم اليوم الأول في الرحلة"
      );
      setStep("launch");
    }
  }, [assessmentAnswers, currentQuestion, questions, selectedDomain, submitAssessment]);

  const renderStep = () => {
    switch (step) {
      // ─── Step 1: Welcome ─────────────────────────────────────
      case "welcome":
        return (
          <motion.div
            key="welcome"
            className="flex flex-col items-center text-center space-y-8 pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Animated icon */}
            <motion.div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-12 h-12 text-violet-400" />
            </motion.div>

            <div className="space-y-3">
              <h1 className="text-2xl font-black text-white leading-tight">
                {userName ? `أهلاً ${userName}` : "أهلاً بيك في رحلتك"} 🌅
              </h1>
              <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                دي مش مجرد أداة — دي رحلة حياتك الفعلية.
                جارفيس هيبقى رفيقك طول الطريق.
              </p>
            </div>

            <div className="w-full space-y-3 text-right">
              {[
                { icon: "🧭", text: "بتتابع 8 مجالات في حياتك" },
                { icon: "🧠", text: "جارفيس يحلل أنماطك ويوصلك بين النقط" },
                { icon: "🔥", text: "بتبني عادات وبتحافظ على streak" },
                { icon: "⚡", text: "خطوات صغيرة كل يوم = تحول كبير" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-bold text-white/50">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={() => setStep("domain-pick")}
              className="w-full py-4 rounded-2xl text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", boxShadow: "0 8px 30px rgba(139,92,246,0.4)" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ابدأ الرحلة ✨
            </motion.button>
          </motion.div>
        );

      // ─── Step 2: Domain Pick ──────────────────────────────────
      case "domain-pick":
        return (
          <motion.div
            key="domain-pick"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white">ابدأ من فين؟</h2>
              <p className="text-xs text-white/30">
                اختار المجال اللي عايز تبدأ به — هتقيّمه وجارفيس يبدأ يفهمك منه.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {LIFE_DOMAINS.map((domain) => (
                <motion.button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className="p-4 rounded-2xl text-right transition-all"
                  style={{
                    background: selectedDomain === domain.id
                      ? `${domain.color}15`
                      : "rgba(255,255,255,0.03)",
                    border: selectedDomain === domain.id
                      ? `1.5px solid ${domain.color}40`
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{domain.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white/80">{domain.label}</p>
                      <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed truncate">
                        {domain.description}
                      </p>
                    </div>
                    {selectedDomain === domain.id && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: domain.color }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={() => setStep("pulse")}
              className="w-full py-4 rounded-2xl text-sm font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${selectedDomainConfig.color}, ${selectedDomainConfig.color}80)`,
                boxShadow: `0 8px 30px ${selectedDomainConfig.color}30`
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {selectedDomainConfig.icon} ابدأ بـ {selectedDomainConfig.label}
            </motion.button>
          </motion.div>
        );

      // ─── Step 3: Pulse (Mood + Energy) ───────────────────────
      case "pulse":
        return (
          <motion.div
            key="pulse"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white">إزيك دلوقتي؟</h2>
              <p className="text-xs text-white/30">
                جارفيس محتاج يعرف ازيك عشان يكلمك بالأسلوب الصح.
              </p>
            </div>

            {/* Mood */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/25 uppercase tracking-wider">
                مزاجك دلوقتي
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <motion.button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className="py-3 px-2 rounded-2xl flex flex-col items-center gap-1 transition-all"
                    style={{
                      background: selectedMood === mood.value
                        ? "rgba(139,92,246,0.15)"
                        : "rgba(255,255,255,0.03)",
                      border: selectedMood === mood.value
                        ? "1.5px solid rgba(139,92,246,0.4)"
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-[10px] font-bold text-white/60">{mood.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-white/25 uppercase tracking-wider">
                  مستوى الطاقة
                </label>
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-sm font-black text-white font-mono">{energy}/10</span>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={energy}
                onChange={e => setEnergy(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "#8b5cf6" }}
              />
              <div className="flex justify-between text-[9px] text-white/20 font-bold">
                <span>مرهق جداً</span>
                <span>طاقة عالية 🔥</span>
              </div>
            </div>

            <motion.button
              onClick={() => setStep("assessment")}
              disabled={!selectedMood}
              className="w-full py-4 rounded-2xl text-sm font-black text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", boxShadow: "0 8px 30px rgba(139,92,246,0.3)" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              التالي ←
            </motion.button>
          </motion.div>
        );

      // ─── Step 4: Quick Assessment ─────────────────────────────
      case "assessment": {
        const q = questions[currentQuestion];
        const progress = (currentQuestion / questions.length) * 100;

        return (
          <motion.div
            key={`assessment-${currentQuestion}`}
            className="space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-3xl">{selectedDomainConfig.icon}</span>
                <h2 className="text-lg font-black text-white">تقييم {selectedDomainConfig.label}</h2>
              </div>
              <p className="text-xs text-white/30">
                سؤال {currentQuestion + 1} من {questions.length}
              </p>
              {/* Mini progress bar */}
              <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: selectedDomainConfig.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div
              className="rounded-3xl p-6 text-center"
              style={{ background: `${selectedDomainConfig.color}08`, border: `1px solid ${selectedDomainConfig.color}20` }}
            >
              <p className="text-base font-bold text-white/80 leading-relaxed">{q}</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-wider text-center">إجابتك من 1 إلى 10</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <motion.button
                    key={score}
                    onClick={() => handleAnswerQuestion(score)}
                    className="py-3 rounded-2xl text-sm font-black text-white/70 hover:text-white transition-all"
                    style={{
                      background: score <= 3
                        ? "rgba(239,68,68,0.08)"
                        : score <= 6
                        ? "rgba(245,158,11,0.08)"
                        : "rgba(16,185,129,0.08)",
                      border: score <= 3
                        ? "1px solid rgba(239,68,68,0.15)"
                        : score <= 6
                        ? "1px solid rgba(245,158,11,0.15)"
                        : "1px solid rgba(16,185,129,0.15)",
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {score}
                  </motion.button>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-white/20 font-bold px-1">
                <span>ضعيف 😞</span>
                <span>ممتاز 🌟</span>
              </div>
            </div>
          </motion.div>
        );
      }

      // ─── Step 5: Launch 🚀 ────────────────────────────────────
      case "launch":
        return (
          <motion.div
            key="launch"
            className="flex flex-col items-center text-center space-y-8 pt-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div
                className="w-28 h-28 rounded-3xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${selectedDomainConfig.color}20, rgba(6,182,212,0.1))` }}
              >
                <span className="text-5xl">{selectedDomainConfig.icon}</span>
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-white">رحلتك بدأت! 🎉</h2>
              <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                تقييم {selectedDomainConfig.label} اتسجل.
                جارفيس دلوقتي بيفهم نقطة البداية في رحلتك.
              </p>
            </div>

            {/* What's next */}
            <div className="w-full space-y-3 text-right">
              <p className="text-[10px] font-black text-white/25 uppercase tracking-wider">اللي ينتظرك:</p>
              {[
                { icon: "☀️", text: "\"يومك\" — خطط ليومك وتابع عاداتك" },
                { icon: "🧠", text: "جارفيس — اسأله في أي وقت" },
                { icon: "📊", text: "الـ Life Score — متحدث لحظياً" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs font-bold text-white/50">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={onComplete}
              className="w-full py-4 rounded-2xl text-sm font-black text-white"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                boxShadow: "0 8px 30px rgba(139,92,246,0.4)"
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                ابدأ يومي
              </div>
            </motion.button>
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      dir="rtl"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(3,3,9,0.95)" }} />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-lg rounded-t-[2rem] overflow-hidden overflow-y-auto"
        style={{
          background: "#0a0a18",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          maxHeight: "92vh",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 250 }}
      >
        {/* Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mt-4 mb-2" />

        {/* Header */}
        <div className="px-6 pb-2 flex items-center justify-between">
          <ProgressDots current={currentStepIndex} total={STEPS.length} />
          {currentStepIndex > 0 && (
            <button
              onClick={() => setStep(STEPS[currentStepIndex - 1])}
              className="flex items-center gap-1 text-[11px] font-bold text-white/25 hover:text-white/50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              رجوع
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-12 pt-4">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
