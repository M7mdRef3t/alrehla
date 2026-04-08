import { logger } from "@/services/logger";
import type { FC } from "react";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Send, CheckCircle2, ClipboardList } from "lucide-react";
import { surveyCopy, type SurveyQuestion, type SurveyAnswers } from "@/copy/survey";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import { trackEvent } from "@/services/analytics";
import { Button, Card } from "./UI";

/* ═══════════════════════════════
   Research Survey — 10 أسئلة بحثية
   Step-by-step wizard flow
   ═══════════════════════════════ */

const cosmicEase = [0.22, 1, 0.36, 1] as [number, number, number, number];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    filter: "blur(6px)"
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: cosmicEase }
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 80 : -80,
    opacity: 0,
    filter: "blur(6px)",
    transition: { duration: 0.3, ease: cosmicEase }
  })
};

// ─── Scale Question ─────────────────────────────────────────
const ScaleInput: FC<{
  question: SurveyQuestion;
  value: number | undefined;
  onChange: (v: number) => void;
}> = ({ question, value, onChange }) => {
  if (question.type !== "scale") return null;
  const min = question.scaleMin;
  const max = question.scaleMax;
  const points = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {points.map((n) => (
          <motion.button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            className="w-11 h-11 rounded-full font-bold text-sm transition-all duration-200 focus-visible:outline-none"
            style={{
              background: value === n
                ? "linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(139, 92, 246, 0.2))"
                : "rgba(255, 255, 255, 0.06)",
              border: value === n
                ? "2px solid rgba(45, 212, 191, 0.5)"
                : "1.5px solid rgba(255, 255, 255, 0.1)",
              color: value === n ? "var(--soft-teal)" : "var(--text-secondary)",
              boxShadow: value === n ? "0 0 20px rgba(45, 212, 191, 0.15)" : "none"
            }}
          >
            {n}
          </motion.button>
        ))}
      </div>
      <div className="flex justify-between w-full max-w-xs text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{question.scaleLabels.min}</span>
        <span>{question.scaleLabels.max}</span>
      </div>
    </div>
  );
};

// ─── Multiple Choice Question ───────────────────────────────
const MCInput: FC<{
  question: SurveyQuestion;
  value: string | undefined;
  onChange: (v: string) => void;
}> = ({ question, value, onChange }) => {
  if (question.type !== "mc") return null;

  return (
    <div className="flex flex-col gap-2.5 w-full max-w-md mx-auto">
      {question.options.map((opt) => (
        <motion.button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          whileTap={{ scale: 0.97 }}
          className="w-full text-right px-5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 focus-visible:outline-none"
          style={{
            background: value === opt.value
              ? "linear-gradient(135deg, rgba(45, 212, 191, 0.12), rgba(139, 92, 246, 0.08))"
              : "rgba(255, 255, 255, 0.04)",
            border: value === opt.value
              ? "1.5px solid rgba(45, 212, 191, 0.4)"
              : "1.5px solid rgba(255, 255, 255, 0.08)",
            color: value === opt.value ? "var(--soft-teal)" : "var(--text-primary)",
            boxShadow: value === opt.value ? "0 0 16px rgba(45, 212, 191, 0.1)" : "none"
          }}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
};

// ─── Open-Ended Question ────────────────────────────────────
const OpenInput: FC<{
  question: SurveyQuestion;
  value: string | undefined;
  onChange: (v: string) => void;
}> = ({ question, value, onChange }) => {
  if (question.type !== "open") return null;

  return (
    <div className="w-full max-w-md mx-auto">
      <textarea
        id={`survey-answer-${question.id}`}
        name={`surveyAnswer${question.id}`}
        dir="rtl"
        rows={3}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none focus-visible:outline-none transition-all duration-200"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: "1.5px solid rgba(255, 255, 255, 0.1)",
          color: "var(--text-primary)",
          caretColor: "var(--soft-teal)"
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(45, 212, 191, 0.4)";
          e.currentTarget.style.boxShadow = "0 0 16px rgba(45, 212, 191, 0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
};

// ─── Main Survey Component ──────────────────────────────────
interface ResearchSurveyProps {
  onComplete: () => void;
}

export const ResearchSurvey: FC<ResearchSurveyProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const questions = surveyCopy.questions;
  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];

  const currentAnswer = answers[currentQuestion.id];
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== "";

  const progress = useMemo(
    () => ((currentStep + (hasAnswer ? 1 : 0)) / totalSteps) * 100,
    [currentStep, totalSteps, hasAnswer]
  );

  const setAnswer = useCallback((value: string | number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }, [currentQuestion.id]);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Track survey completion
      trackEvent("survey_completed", {
        total_questions: totalSteps,
        answered_count: Object.keys(answers).length
      });

      // Save to Supabase
      if (isSupabaseReady && supabase) {
        const isMobile = typeof window !== "undefined"
          ? window.matchMedia("(max-width: 768px)").matches
          : false;

        const session = await supabase.auth.getSession();

        await supabase.from("research_survey_responses").insert({
          user_id: session.data.session?.user?.id || null,
          answers,
          device_type: isMobile ? "mobile" : "desktop",
          completed_at: new Date().toISOString()
        });
      }

      setIsDone(true);
    } catch (err) {
      logger.error("[Survey] Submit error:", err);
      // Still show thank you even if save fails
      setIsDone(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, isSubmitting, totalSteps]);

  // ─── Thank You Screen ─────────────────────────────────────
  if (isDone) {
    return (
      <main className="w-full max-w-lg mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: cosmicEase }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(139, 92, 246, 0.15))",
              border: "2px solid rgba(45, 212, 191, 0.3)",
              boxShadow: "0 0 40px rgba(45, 212, 191, 0.2)"
            }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "var(--soft-teal)" }} />
          </div>

          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {surveyCopy.thankYou}
          </h1>
          <p
            className="text-sm leading-relaxed mb-8 max-w-sm mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            {surveyCopy.thankYouSub}
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={onComplete}
            className="glass-button px-8 py-3 text-sm font-medium"
          >
            {surveyCopy.backToApp}
          </Button>
        </motion.div>
      </main>
    );
  }

  // ─── Survey Flow ──────────────────────────────────────────
  return (
    <main
      className="w-full max-w-lg mx-auto min-h-[60vh] flex flex-col py-6 px-4"
      dir="rtl"
      aria-labelledby="survey-title"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: cosmicEase }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(139, 92, 246, 0.15))",
              border: "1px solid rgba(45, 212, 191, 0.3)"
            }}
          >
            <ClipboardList className="w-5 h-5" style={{ color: "var(--soft-teal)" }} />
          </div>
          <div className="text-right">
            <h1 id="survey-title" className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {surveyCopy.title}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {surveyCopy.subtitle}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.06)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--soft-teal), rgba(139, 92, 246, 0.6))",
              boxShadow: "0 0 8px rgba(45, 212, 191, 0.3)"
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          {surveyCopy.progress(currentStep + 1, totalSteps)}
        </p>
      </motion.div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <Card className="p-5 sm:p-6 mb-6">
              <p
                className="text-base sm:text-lg font-bold mb-6 text-right leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {currentQuestion.text}
              </p>

              {currentQuestion.type === "scale" && (
                <ScaleInput
                  question={currentQuestion}
                  value={typeof currentAnswer === "number" ? currentAnswer : undefined}
                  onChange={setAnswer}
                />
              )}
              {currentQuestion.type === "mc" && (
                <MCInput
                  question={currentQuestion}
                  value={typeof currentAnswer === "string" ? currentAnswer : undefined}
                  onChange={setAnswer}
                />
              )}
              {currentQuestion.type === "open" && (
                <OpenInput
                  question={currentQuestion}
                  value={typeof currentAnswer === "string" ? currentAnswer : undefined}
                  onChange={setAnswer}
                />
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          size="md"
          onClick={goPrev}
          disabled={currentStep === 0}
          className="glass-button px-4 py-2.5 text-sm select-none"
          style={{ opacity: currentStep === 0 ? 0.3 : 1 }}
        >
          <ChevronRight className="w-4 h-4 ml-1" />
          السابق
        </Button>

        {currentStep < totalSteps - 1 ? (
          <Button
            variant="primary"
            size="md"
            onClick={goNext}
            disabled={!hasAnswer}
            className="glass-button px-5 py-2.5 text-sm font-medium select-none"
            style={{ opacity: hasAnswer ? 1 : 0.4 }}
          >
            التالي
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!hasAnswer || isSubmitting}
            className="glass-button px-6 py-2.5 text-sm font-medium select-none"
            style={{ opacity: hasAnswer && !isSubmitting ? 1 : 0.4 }}
          >
            {isSubmitting ? surveyCopy.submitting : surveyCopy.submit}
            <Send className="w-4 h-4 mr-1" />
          </Button>
        )}
      </div>
    </main>
  );
};
