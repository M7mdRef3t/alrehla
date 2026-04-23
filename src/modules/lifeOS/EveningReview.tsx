"use client";

/* eslint-disable react-hooks/exhaustive-deps */
/**
 * 🌙 EveningReview — مراجعة آخر اليوم
 * =====================================
 * يظهر بالليل كـ gentle nudge — يسأل المستخدم عن يومه.
 * النتيجة بتأثر على Life Score + Morning Brief اليوم الثاني.
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, Star, Sun, ChevronLeft, CheckCircle2, Zap as Sparkles,
  Heart, Zap, Battery, BatteryLow, BatteryFull, ArrowLeft,
} from "lucide-react";
import { useRitualState } from "@/domains/journey/store/ritual.store";
import { useLifeState } from '@/modules/map/dawayirIndex';
import { getTodayRituals, getDailyCompletionStats } from "@/services/ritualsEngine";
import type { EveningReflection } from "@/types/dailyRituals";

interface EveningReviewProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReviewStep = "mood" | "energy" | "best" | "better" | "lesson" | "summary";

const MOOD_OPTIONS: { id: EveningReflection["eveningMood"]; label: string; icon: string; color: string }[] = [
  { id: "great", label: "ممتاز", icon: "🤩", color: "#10b981" },
  { id: "good", label: "كويس", icon: "😊", color: "#06b6d4" },
  { id: "neutral", label: "عادي", icon: "😐", color: "#f59e0b" },
  { id: "tired", label: "تعبان", icon: "😮‍💨", color: "#f97316" },
  { id: "stressed", label: "متوتر", icon: "😤", color: "#ef4444" },
];

const ENERGY_LABELS = [
  "",
  "خلصت",    // 1
  "منهك",    // 2
  "تعبان",   // 3
  "ضعيف",    // 4
  "متوسط",   // 5
  "كويس",    // 6
  "نشيط",    // 7
  "ممتاز",   // 8
  "فظيع",    // 9
  "صاروخ",   // 10
];

export function EveningReview({ isOpen, onClose }: EveningReviewProps) {
  const [step, setStep] = useState<ReviewStep>("mood");
  const [mood, setMood] = useState<EveningReflection["eveningMood"] | null>(null);
  const [energy, setEnergy] = useState(5);
  const [bestMoment, setBestMoment] = useState("");
  const [couldBeBetter, setCouldBeBetter] = useState("");
  const [lesson, setLesson] = useState("");

  const submitEveningReflection = useRitualState((s) => s.submitEveningReflection);
  const rateDayOverall = useRitualState((s) => s.rateDayOverall);
  const rituals = useRitualState((s) => s.rituals);
  const logs = useRitualState((s) => s.logs);
  const addEntry = useLifeState((s) => s.addEntry);

  const todayRituals = useMemo(() => getTodayRituals(rituals, logs), [rituals, logs]);
  const stats = useMemo(() => getDailyCompletionStats(todayRituals), [todayRituals]);

  const steps: ReviewStep[] = ["mood", "energy", "best", "better", "lesson", "summary"];
  const currentIndex = steps.indexOf(step);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  }, [currentIndex, steps]);

  const handleBack = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  }, [currentIndex, steps]);

  const handleSubmit = useCallback(() => {
    if (!mood) return;

    const reflection: EveningReflection = {
      bestMoment: bestMoment.trim() || "—",
      couldBeBetter: couldBeBetter.trim() || "—",
      lessonLearned: lesson.trim() || "—",
      eveningMood: mood,
      eveningEnergy: energy,
      completedAt: Date.now(),
    };

    submitEveningReflection(reflection);

    // Calculate day rating from mood + energy + rituals
    const moodScore: Record<string, number> = {
      great: 9, good: 7, neutral: 5, tired: 3, stressed: 2,
    };
    const dayRating = Math.round(
      (moodScore[mood] * 0.4 + energy * 0.3 + (stats.percentage / 10) * 0.3)
    );
    rateDayOverall(Math.min(dayRating, 10));

    // Save lesson as a life entry
    if (lesson.trim()) {
      addEntry("lesson", lesson.trim(), "self", 2);
    }

    // Reset and close
    setStep("mood");
    setMood(null);
    setEnergy(5);
    setBestMoment("");
    setCouldBeBetter("");
    setLesson("");
    onClose();
  }, [
    mood, energy, bestMoment, couldBeBetter, lesson, stats,
    submitEveningReflection, rateDayOverall, addEntry, onClose,
  ]);

  if (!isOpen) return null;

  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md mx-4 rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0c0c1a 0%, #0a0a18 100%)",
          border: "1px solid rgba(99,102,241,0.15)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        dir="rtl"
      >
        {/* Top gradient line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #8b5cf6, #06b6d4)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6 space-y-6 min-h-[360px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-black text-white">مراجعة اليوم</h2>
            </div>
            {currentIndex > 0 && (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white/30 rotate-180" />
              </button>
            )}
          </div>

          {/* Steps content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === "mood" && (
                <motion.div key="mood" className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white/80">كيف حالك دلوقتي؟</h3>
                    <p className="text-xs text-white/25">مزاجك آخر اليوم</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {MOOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all"
                        style={{
                          background: mood === opt.id ? `${opt.color}15` : "rgba(255,255,255,0.02)",
                          border: `2px solid ${mood === opt.id ? `${opt.color}40` : "rgba(255,255,255,0.05)"}`,
                          transform: mood === opt.id ? "scale(1.05)" : "scale(1)",
                        }}
                        onClick={() => { setMood(opt.id); handleNext(); }}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className="text-[9px] font-bold" style={{ color: mood === opt.id ? opt.color : "rgba(255,255,255,0.3)" }}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "energy" && (
                <motion.div key="energy" className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white/80">طاقتك قد إيه؟</h3>
                    <p className="text-xs text-white/25">مستوى طاقتك آخر اليوم (1-10)</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      {energy <= 3 ? (
                        <BatteryLow className="w-6 h-6 text-red-400" />
                      ) : energy <= 6 ? (
                        <Battery className="w-6 h-6 text-amber-400" />
                      ) : (
                        <BatteryFull className="w-6 h-6 text-emerald-400" />
                      )}
                      <span className="text-4xl font-black text-white font-mono">{energy}</span>
                    </div>
                    <p className="text-sm font-bold text-white/40">{ENERGY_LABELS[energy]}</p>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={energy}
                      onChange={(e) => setEnergy(Number(e.target.value))}
                      className="w-full accent-violet-500"
                      style={{ accentColor: energy <= 3 ? "#ef4444" : energy <= 6 ? "#f59e0b" : "#10b981" }}
                    />
                  </div>
                  <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
                  >
                    التالي
                  </button>
                </motion.div>
              )}

              {step === "best" && (
                <motion.div key="best" className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white/80">⭐ أحلى لحظة في يومك</h3>
                    <p className="text-xs text-white/25">إيه أحلى حاجة حصلت النهاردة؟</p>
                  </div>
                  <textarea
                    value={bestMoment}
                    onChange={(e) => setBestMoment(e.target.value)}
                    placeholder="مثال: خلصت المشروع اللي كان واقفني..."
                    className="w-full h-24 px-4 py-3 rounded-2xl text-sm font-medium text-white placeholder:text-white/15 outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    autoFocus
                  />
                  <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
                  >
                    {bestMoment.trim() ? "التالي" : "تخطي"}
                  </button>
                </motion.div>
              )}

              {step === "better" && (
                <motion.div key="better" className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white/80">🔄 إيه ممكن يكون أحسن</h3>
                    <p className="text-xs text-white/25">من غير جلد ذات — بس ملاحظة</p>
                  </div>
                  <textarea
                    value={couldBeBetter}
                    onChange={(e) => setCouldBeBetter(e.target.value)}
                    placeholder="مثال: كنت ممكن أنام بدري..."
                    className="w-full h-24 px-4 py-3 rounded-2xl text-sm font-medium text-white placeholder:text-white/15 outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    autoFocus
                  />
                  <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
                  >
                    {couldBeBetter.trim() ? "التالي" : "تخطي"}
                  </button>
                </motion.div>
              )}

              {step === "lesson" && (
                <motion.div key="lesson" className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white/80">💡 درس اليوم</h3>
                    <p className="text-xs text-white/25">حاجة اتعلمتها — كبيرة أو صغيرة</p>
                  </div>
                  <textarea
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    placeholder="مثال: الصبر بيجيب نتايج أحسن من العجلة..."
                    className="w-full h-24 px-4 py-3 rounded-2xl text-sm font-medium text-white placeholder:text-white/15 outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    autoFocus
                  />
                  <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
                  >
                    {lesson.trim() ? "التالي" : "تخطي"}
                  </button>
                </motion.div>
              )}

              {step === "summary" && (
                <motion.div key="summary" className="space-y-5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-violet-400 mx-auto" />
                    <h3 className="text-base font-black text-white">ملخص يومك</h3>
                  </div>

                  {/* Summary card */}
                  <div
                    className="rounded-2xl p-4 space-y-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {/* Mood + Energy row */}
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-center">
                        <span className="text-2xl">{MOOD_OPTIONS.find((m) => m.id === mood)?.icon}</span>
                        <p className="text-[9px] text-white/25 mt-0.5">{MOOD_OPTIONS.find((m) => m.id === mood)?.label}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xl font-black text-white font-mono">{energy}/10</span>
                        <p className="text-[9px] text-white/25 mt-0.5">طاقة</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xl font-black text-emerald-400 font-mono">{stats.percentage}%</span>
                        <p className="text-[9px] text-white/25 mt-0.5">عادات</p>
                      </div>
                    </div>

                    {/* Entries */}
                    {bestMoment.trim() && (
                      <div className="flex items-start gap-2 text-right">
                        <span className="text-xs shrink-0">⭐</span>
                        <p className="text-[11px] text-white/50 leading-relaxed">{bestMoment}</p>
                      </div>
                    )}
                    {lesson.trim() && (
                      <div className="flex items-start gap-2 text-right">
                        <span className="text-xs shrink-0">💡</span>
                        <p className="text-[11px] text-white/50 leading-relaxed">{lesson}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all"
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                      boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
                    }}
                  >
                    احفظ واختم يومك 🌙
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
