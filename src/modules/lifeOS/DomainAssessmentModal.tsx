"use client";

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react";
import { LIFE_DOMAINS, getDomainConfig, type LifeDomainId } from "@/types/lifeDomains";
import { useLifeState } from "@/state/lifeState";

interface DomainAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If null, show selector; if set, jump to that domain */
  initialDomainId?: LifeDomainId | null;
}

/**
 * Domain Assessment Modal
 * ========================
 * يسأل المستخدم 3 أسئلة سريعة لكل مجال (تقييم 1-10)
 * ويحسب درجة المجال ويحفظها في lifeState.
 *
 * الأسئلة موجودة في LIFE_DOMAINS[x].quickAssessmentQuestions
 */
export const DomainAssessmentModal = memo(function DomainAssessmentModal({
  isOpen,
  onClose,
  initialDomainId = null
}: DomainAssessmentModalProps) {
  const submitAssessment = useLifeState(s => s.submitAssessment);
  const recalculateLifeScore = useLifeState(s => s.recalculateLifeScore);

  const [phase, setPhase] = useState<"select" | "assess" | "done">(
    initialDomainId ? "assess" : "select"
  );
  const [selectedDomain, setSelectedDomain] = useState<LifeDomainId | null>(initialDomainId);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [note, setNote] = useState("");

  const domainConfig = selectedDomain ? getDomainConfig(selectedDomain) : null;
  const questions = domainConfig?.quickAssessmentQuestions ?? [];

  const handleSelectDomain = useCallback((id: LifeDomainId) => {
    setSelectedDomain(id);
    setCurrentQuestion(0);
    setAnswers([]);
    setNote("");
    setPhase("assess");
  }, []);

  const handleAnswer = useCallback((score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      // All answered — calculate and save
      const avg = Math.round(newAnswers.reduce((s, v) => s + v, 0) / newAnswers.length);
      submitAssessment(selectedDomain!, avg, newAnswers, note || undefined);
      recalculateLifeScore();
      setPhase("done");
    }
  }, [answers, currentQuestion, questions.length, selectedDomain, note, submitAssessment, recalculateLifeScore]);

  const handleReset = useCallback(() => {
    setPhase(initialDomainId ? "assess" : "select");
    setSelectedDomain(initialDomainId);
    setCurrentQuestion(0);
    setAnswers([]);
    setNote("");
  }, [initialDomainId]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const scoreAvg = answers.length > 0
    ? Math.round(answers.reduce((s, v) => s + v, 0) / answers.length)
    : 0;

  // Score buttons row: 1-10
  const scoreButtons = Array.from({ length: 10 }, (_, i) => i + 1);

  const getScoreColor = (s: number) => {
    if (s >= 8) return "#10b981";
    if (s >= 5) return "#8b5cf6";
    if (s >= 3) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          dir="rtl"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: "rgba(6, 8, 18, 0.97)",
              border: "1px solid rgba(139,92,246,0.2)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.6)"
            }}
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-black text-white">تقييم المجالات</span>
              </div>
              <button onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* Phase: Select Domain */}
              {phase === "select" && (
                <motion.div key="select" className="px-6 pb-6 space-y-3"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <p className="text-xs text-white/40 font-medium">اختار المجال اللي عايز تقيّمه:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LIFE_DOMAINS.map(d => (
                      <button key={d.id} onClick={() => handleSelectDomain(d.id)}
                        className="p-3.5 rounded-2xl text-right transition-all hover:scale-[1.02] group"
                        style={{ background: `${d.color}08`, border: `1px solid ${d.color}20` }}>
                        <span className="text-2xl block mb-1">{d.icon}</span>
                        <span className="text-xs font-bold text-white/60 group-hover:text-white/80 transition-colors">
                          {d.label}
                        </span>
                        <ChevronLeft className="w-3 h-3 inline text-white/15 mr-1" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Phase: Assessment Questions */}
              {phase === "assess" && domainConfig && (
                <motion.div key="assess" className="px-6 pb-6 space-y-5"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                  {/* Domain + progress */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{domainConfig.icon}</span>
                      <span className="text-base font-black" style={{ color: domainConfig.color }}>
                        {domainConfig.label}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="flex gap-1.5">
                      {questions.map((_, i) => (
                        <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5">
                          <motion.div className="h-full rounded-full"
                            style={{ background: domainConfig.color }}
                            animate={{ width: i < answers.length ? "100%" : i === answers.length ? "40%" : "0%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] text-white/20 font-mono">
                      {currentQuestion + 1} / {questions.length}
                    </span>
                  </div>

                  {/* Question */}
                  <AnimatePresence mode="wait">
                    <motion.div key={currentQuestion} className="space-y-4"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <p className="text-sm font-bold text-white/80 leading-relaxed min-h-[48px]">
                        {questions[currentQuestion]}
                      </p>

                      {/* Score buttons 1-10 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[9px] text-white/20">
                          <span>ضعيف</span>
                          <span>ممتاز</span>
                        </div>
                        <div className="grid grid-cols-10 gap-1">
                          {scoreButtons.map(s => (
                            <motion.button
                              key={s}
                              onClick={() => handleAnswer(s)}
                              className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-black transition-all"
                              style={{
                                background: `${getScoreColor(s)}15`,
                                border: `1px solid ${getScoreColor(s)}30`,
                                color: getScoreColor(s)
                              }}
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {s}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Back */}
                  {phase === "assess" && !initialDomainId && (
                    <button onClick={() => setPhase("select")}
                      className="text-[10px] text-white/20 hover:text-white/40 flex items-center gap-1 transition-colors">
                      <ChevronRight className="w-3 h-3" /> تغيير المجال
                    </button>
                  )}
                </motion.div>
              )}

              {/* Phase: Done */}
              {phase === "done" && domainConfig && (
                <motion.div key="done" className="px-6 pb-8 space-y-5 text-center"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>

                  <div className="py-4 space-y-3">
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                      style={{ background: `${getScoreColor(scoreAvg)}15`, border: `2px solid ${getScoreColor(scoreAvg)}40` }}>
                      <Check className="w-8 h-8" style={{ color: getScoreColor(scoreAvg) }} />
                    </div>
                    <div>
                      <p className="text-white/40 text-sm font-medium">
                        {domainConfig.icon} {domainConfig.label}
                      </p>
                      <p className="text-5xl font-black font-mono mt-1"
                        style={{ color: getScoreColor(scoreAvg) }}>
                        {scoreAvg * 10}
                      </p>
                      <p className="text-[10px] text-white/20 mt-1">/ 100</p>
                    </div>

                    {/* Note input */}
                    <div className="text-right">
                      <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="ملاحظة إضافية (اختياري)..."
                        className="w-full rounded-xl p-3 text-xs text-white bg-white/5 border border-white/8 placeholder:text-white/15 resize-none focus:outline-none focus:border-violet-500/30"
                        rows={2}
                      />
                    </div>

                    <p className="text-xs text-white/30 font-medium leading-relaxed">
                      {scoreAvg >= 8 ? "ممتاز! المجال ده بيتعمله كويس 🌟" :
                        scoreAvg >= 5 ? "معقول. فيه مجال للتحسين 💪" :
                          scoreAvg >= 3 ? "محتاج اهتمام. خد خطوة صغيرة النهاردة 🎯" :
                            "وضع صعب. ابدأ بحاجة واحدة بسيطة بس 🤍"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => {
                      setPhase("select");
                      setSelectedDomain(null);
                      setAnswers([]);
                      setCurrentQuestion(0);
                    }}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold bg-white/5 border border-white/8 text-white/50 hover:bg-white/8 transition-all">
                      مجال آخر
                    </button>
                    <button onClick={handleClose}
                      className="flex-1 py-3 rounded-2xl text-sm font-black text-black transition-all"
                      style={{ background: getScoreColor(scoreAvg) }}>
                      تمام ✓
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
