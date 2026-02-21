import type { FC } from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, BookOpen } from "lucide-react";
import { useDailyQuestion } from "../hooks/useDailyQuestion";
import { useAIQuestionGenerator } from "../hooks/useAIQuestionGenerator";
import { AIGenerationButton, AIGeneratedQuestionBadge } from "./AIGeneratedQuestionBadge";

interface DailyPulseWidgetProps {
  onOpenArchive?: () => void;
}

/* ── ثيم الأسابيع الأربعة ── */
const WEEK_COLORS: Record<number, { accent: string; bg: string; border: string; label: string; dot: string }> = {
  1: { accent: "#2dd4bf", bg: "rgba(45,212,191,0.06)",  border: "rgba(45,212,191,0.18)",  label: "الوعي بالذات",    dot: "#2dd4bf" },
  2: { accent: "#a78bfa", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.18)", label: "دواير القرب",     dot: "#a78bfa" },
  3: { accent: "#fbbf24", bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.18)",  label: "الحدود والتحرر",  dot: "#fbbf24" },
  4: { accent: "#34d399", bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.18)",  label: "النظرة للمستقبل", dot: "#34d399" },
};

export const DailyPulseWidget: FC<DailyPulseWidgetProps> = ({ onOpenArchive }) => {
  const { question, hasAnsweredToday, answer, saveAnswer, totalAnswers } = useDailyQuestion();
  const { generatedQuestion, isGenerating, generateQuestion, isAIAvailable } = useAIQuestionGenerator();
  const [inputValue, setInputValue] = useState(answer || "");
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [useAIQuestion, setUseAIQuestion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // استخدم السؤال المُولّد لو موجود
  const displayQuestion = useAIQuestion && generatedQuestion ? generatedQuestion : question;
  const theme = WEEK_COLORS[displayQuestion.week] ?? WEEK_COLORS[1];

  const handleSave = () => {
    if (!inputValue.trim()) return;
    saveAnswer(inputValue);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleGenerateAIQuestion = async () => {
    await generateQuestion();
    setUseAIQuestion(true);
  };

  return (
    <motion.div
      className="rounded-[1.25rem] p-5 text-right w-full flow-appear"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        animationDelay: "80ms",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
    >
      {/* ── رأس الويدجت ── */}
      <div className="flex items-center justify-between mb-3">

        {/* أرشيف الإجابات */}
        <div className="flex items-center gap-2">
          {totalAnswers > 0 && onOpenArchive && (
            <button
              type="button"
              onClick={onOpenArchive}
              className="organic-tap flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                color: theme.accent,
                background: `${theme.accent}12`,
                border: `1px solid ${theme.accent}25`,
                transition: "background var(--duration-fast) var(--ease-smooth)",
              }}
            >
              <BookOpen className="w-3 h-3" />
              <span>{totalAnswers} إجابة</span>
            </button>
          )}
        </div>

        {/* بادج الأسبوع */}
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ color: theme.accent, background: `${theme.accent}12` }}
        >
          <Sparkles className="w-3 h-3" />
          <span>سؤال المحطة</span>
        </div>
      </div>

      {/* ── شريط تقدم الأسبوع (4 نقاط) ── */}
      <div className="flex items-center gap-1.5 mb-3 justify-end">
        {([1, 2, 3, 4] as const).map((w) => (
          <span
            key={w}
            className="rounded-full transition-all duration-300"
            style={{
              width: w === question.week ? "16px" : "5px",
              height: "5px",
              background: w === question.week
                ? WEEK_COLORS[w].dot
                : w < question.week
                  ? `${WEEK_COLORS[w].dot}50`
                  : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
        <span className="text-[10px] mr-1" style={{ color: "rgba(148,163,184,0.4)" }}>
          {theme.label}
        </span>
      </div>

      {/* ── نص السؤال ── */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p
            className="text-[15px] font-medium leading-[1.85] flex-1"
            style={{ color: "rgba(226,232,240,0.9)" }}
          >
            {displayQuestion.text}
          </p>

          {/* بادج AI-generated */}
          {useAIQuestion && generatedQuestion && (
            <AIGeneratedQuestionBadge isAIGenerated={true} compact />
          )}
        </div>

        {/* زر توليد سؤال جديد */}
        {isAIAvailable && !useAIQuestion && (
          <div className="mt-2">
            <AIGenerationButton
              onClick={handleGenerateAIQuestion}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {/* زر العودة للسؤال الأصلي */}
        {useAIQuestion && (
          <button
            type="button"
            onClick={() => setUseAIQuestion(false)}
            className="organic-tap text-[11px] font-medium mt-2"
            style={{ color: "rgba(148,163,184,0.7)" }}
          >
            ← العودة للسؤال الأصلي
          </button>
        )}
      </div>

      {/* ── منطقة الإجابة ── */}
      <AnimatePresence mode="wait">
        {hasAnsweredToday && !isExpanded ? (
          /* حالة: أجاب بالفعل */
          <motion.div
            key="answered"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2"
          >
            <div
              className="flex-1 rounded-xl px-3 py-2 text-[13px] leading-relaxed italic"
              style={{
                color: "rgba(203,213,225,0.75)",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              "{answer}"
            </div>
            <button
              type="button"
              onClick={handleExpand}
              className="organic-tap shrink-0 mt-1 text-[11px] font-medium"
              style={{ color: theme.accent }}
            >
              تعديل
            </button>
          </motion.div>
        ) : (
          /* حالة: لم يجب أو يريد التعديل */
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="أجب بكلمة أو خاطرة قصيرة..."
              rows={2}
              className="w-full resize-none organic-input rounded-xl px-3 py-2.5 text-[13px] leading-relaxed placeholder:text-slate-600"
              style={{
                borderColor: inputValue.trim() ? theme.border : undefined,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />

            <AnimatePresence>
              {inputValue.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-start mt-2"
                >
                  <button
                    type="button"
                    onClick={handleSave}
                    className="organic-tap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{
                      background: theme.accent,
                      color: "#0f172a",
                      transition: "opacity var(--duration-fast) var(--ease-smooth)",
                    }}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>اتحفظت في رحلتك</span>
                      </>
                    ) : (
                      <span>حفظ في رحلتي</span>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── رسالة ما بعد الحفظ ── */}
      <AnimatePresence>
        {isSaved && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-[12px] text-center"
            style={{ color: theme.accent }}
          >
            اتحفظت في ذكرياتك.. يومك هادي
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
