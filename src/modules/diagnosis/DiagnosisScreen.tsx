'use client';

/**
 * DiagnosisScreen — شاشة التشخيص الأولي
 * ══════════════════════════════════════════════════
 * الـ Entry Point الإجباري لكل مستخدم جديد
 * 5 أسئلة سريعة → UserStateObject → Recommended Product
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeDiagnosis, USER_STATE_LABELS, MAIN_PAIN_LABELS, RECOMMENDED_PRODUCT_LABELS } from "./diagnosisEngine";
import { saveDiagnosisState } from "./types";
import type { DiagnosisAnswers, UserStateObject, MainPain, RecommendedProduct } from "./types";
import { ConversionOfferCard } from "../conversion/ConversionOfferCard";
import { runtimeEnv } from "@/config/runtimeEnv";
import { analyticsService } from "@/domains/analytics";

// ════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════

const STEPS = 5;

interface DiagnosisScreenProps {
  onComplete: (state: UserStateObject, product?: RecommendedProduct) => void;
  onSkip?: () => void;
}

// ════════════════════════════════════════════════
// Option Button Atom
// ════════════════════════════════════════════════

interface OptionBtnProps {
  label: string;
  sub?: string;
  emoji?: string;
  selected: boolean;
  color?: string;
  onClick: () => void;
}

function OptionBtn({ label, sub, emoji, selected, color = "#2dd4bf", onClick }: OptionBtnProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-right"
      style={{
        background: selected ? `${color}18` : "rgba(255,255,255,0.03)",
        border: `1.5px solid ${selected ? color : "rgba(255,255,255,0.08)"}`,
        boxShadow: selected ? `0 0 16px ${color}30` : "none",
      }}
    >
      {emoji && (
        <span className="text-xl flex-shrink-0" aria-hidden>{emoji}</span>
      )}
      <div className="flex flex-col items-start flex-1">
        <span
          className="text-sm font-bold"
          style={{ color: selected ? color : "rgba(255,255,255,0.85)" }}
        >
          {label}
        </span>
        {sub && (
          <span className="text-[10px] mt-0.5" style={{ color: "rgba(148,163,184,0.7)" }}>
            {sub}
          </span>
        )}
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: color }}
        >
          <svg width="10" height="8" fill="none" viewBox="0 0 12 9">
            <path d="M1 4.5L4.5 8L11 1" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

// ════════════════════════════════════════════════
// Progress Bar
// ════════════════════════════════════════════════

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-500"
          style={{
            background: i < step
              ? "linear-gradient(90deg, #2dd4bf, #8b5cf6)"
              : "rgba(255,255,255,0.08)",
          }}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════
// Result Card — الـ Insight بعد التشخيص
// ════════════════════════════════════════════════

function ResultCard({
  state,
  onProceed,
}: {
  state: UserStateObject;
  onProceed: (product: RecommendedProduct) => void;
}) {
  const product = RECOMMENDED_PRODUCT_LABELS[state.recommendedProduct];
  const stateLabel = USER_STATE_LABELS[state.type] ?? state.type;
  const painLabel = MAIN_PAIN_LABELS[state.mainPain] ?? state.mainPain;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 w-full"
    >
      {/* Score Ring */}
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96" fill="none">
            <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="48" cy="48" r="40"
              stroke="url(#scoreGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(state.diagnosisScore / 100) * 251.3} 251.3`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{state.diagnosisScore}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">score</span>
          </div>
        </div>
      </div>

      {/* Diagnosis Summary */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-extrabold text-white">التشخيص اتكمّل</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          إنت دلوقتي <span className="text-teal-400 font-bold">{stateLabel}</span>،
          وأكتر حاجة شايلاك هي <span className="text-purple-400 font-bold">{painLabel}</span>.
        </p>
      </div>

      {/* Conversion Engine Layer 3 — Offer Card */}
      <div className="mt-2">
        <ConversionOfferCard
          userState={state}
          source="diagnosis"
          onSelectFree={(product) => onProceed(product)}
          onSelectSession={() => {
            onProceed("session");
          }}
          onDismiss={() => onProceed("dawayir")}
        />
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════
// Main DiagnosisScreen
// ════════════════════════════════════════════════

export function DiagnosisScreen({ onComplete, onSkip }: DiagnosisScreenProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<DiagnosisAnswers>({});
  const [result, setResult] = useState<UserStateObject | null>(null);

  const setAnswer = useCallback(<K extends keyof DiagnosisAnswers>(key: K, value: DiagnosisAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Track initial view
  useState(() => {
    analyticsService.track(analyticsService.Events.DIAGNOSIS_VIEW);
    if (typeof window !== "undefined" && (window as any).clarity) {
      (window as any).clarity("set", "diagnosis_started", "true");
    }
  });

  const next = useCallback(() => {
    // Determine what was answered for tracking
    const currentAnswer = step === 1 ? answers.q1_pain :
                        step === 2 ? answers.q2_feeling :
                        step === 3 ? answers.q3_duration :
                        step === 4 ? answers.q4_blocker :
                        step === 5 ? answers.q5_goal : undefined;

    analyticsService.track(analyticsService.Events.DIAGNOSIS_STEP_COMPLETE, {
      step_number: step,
      answer: currentAnswer,
      is_last_step: step === STEPS
    });

    if (typeof window !== "undefined" && (window as any).clarity) {
      (window as any).clarity("set", "diagnosis_step", String(step));
    }

    if (step < STEPS) {
      setStep((s) => s + 1);
    } else {
      const computed = computeDiagnosis(answers);
      saveDiagnosisState(computed);
      
      analyticsService.track(analyticsService.Events.DIAGNOSIS_RESULT_VIEW, {
        score: computed.diagnosisScore,
        type: computed.type,
        main_pain: computed.mainPain,
        product: computed.recommendedProduct
      });

      setResult(computed);
    }
  }, [step, answers]);

  const handleProceed = useCallback((product: RecommendedProduct) => {
    if (result) onComplete({ ...result, recommendedProduct: product });
  }, [result, onComplete]);

  // Determine if current step has an answer
  const canProceed = (() => {
    if (step === 1) return Boolean(answers.q1_pain);
    if (step === 2) return Boolean(answers.q2_feeling);
    if (step === 3) return Boolean(answers.q3_duration);
    if (step === 4) return Boolean(answers.q4_blocker);
    if (step === 5) return Boolean(answers.q5_goal);
    return false;
  })();

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start overflow-y-auto ob-dark-force"
      style={{ background: "#020408" }}
      dir="rtl"
    >
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(45,212,191,0.3) 0%, transparent 70%)",
            top: "-10%", right: "-10%",
            filter: "blur(80px)",
            animation: "ob-orb-drift1 40s infinite alternate ease-in-out",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
            bottom: "-15%", left: "-10%",
            filter: "blur(80px)",
            animation: "ob-orb-drift2 55s infinite alternate ease-in-out",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-5 pb-10 pt-10 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-extrabold text-white">
              {result ? "نتيجة التشخيص" : "اعرف نفسك الأول"}
            </h1>
            {!result && (
              <p className="text-[11px] text-slate-400">
                سؤال {step} من {STEPS}
              </p>
            )}
          </div>
          {onSkip && !result && (
            <button
              onClick={onSkip}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
            >
              تخطي
            </button>
          )}
        </div>

        {/* Progress */}
        {!result && <ProgressBar step={step} total={STEPS} />}

        {/* Steps / Result */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result">
              <ResultCard state={result} onProceed={handleProceed} />
            </motion.div>
          ) : (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              {/* ── Q1: Main Pain ── */}
              {step === 1 && (
                <>
                  <div className="space-y-1 mb-1">
                    <h2 className="text-[18px] font-extrabold text-white">إيه اللي شايلك دلوقتي؟</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">الموضوع اللي بيطلع في بالك لما بتصحى أو قبل ما تنام.</p>
                  </div>
                  <div className="space-y-2.5">
                    {([
                      { value: "relationship", label: "علاقاتي مع الناس", sub: "شخص أو أكتر بياخد منك طاقة", emoji: "🔗" },
                      { value: "family", label: "عيلتي", sub: "ضغوط أو توقعات من المقربين", emoji: "🏠" },
                      { value: "work", label: "الشغل والإنجاز", sub: "مش وصّال للي عايزه", emoji: "💼" },
                      { value: "self", label: "علاقتي بنفسي", sub: "داخلي مش تمام", emoji: "🪞" },
                    ] as { value: MainPain; label: string; sub: string; emoji: string }[]).map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q1_pain === opt.value}
                        onClick={() => { setAnswer("q1_pain", opt.value); }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── Q2: Feeling ── */}
              {step === 2 && (
                <>
                  <div className="space-y-1 mb-1">
                    <h2 className="text-[18px] font-extrabold text-white">إيه الإحساس الأكتر؟</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">الوصف اللي لو قلته لحد قريب هيفهمك على طول.</p>
                  </div>
                  <div className="space-y-2.5">
                    {([
                      { value: "overwhelmed", label: "مضغوط ومشغول الدنيا", sub: "كل حاجة نازلة عليّا مرة واحدة", emoji: "🌊", color: "#f87171" },
                      { value: "stuck", label: "واقف بس مش مطلّع", sub: "أفكر كتير وما بتحركش", emoji: "🪨", color: "#f59e0b" },
                      { value: "lost", label: "تايه ومش عارف من فين أبدأ", sub: "مفيش خريطة واضحة جوايا", emoji: "🌫️", color: "#94a3b8" },
                      { value: "anxious", label: "قلقان ومشدود", sub: "خايف من حاجة مش واضحة", emoji: "⚡", color: "#a78bfa" },
                      { value: "ready", label: "جاهز وعايز أتحرك", sub: "محتاج بس خطة واضحة", emoji: "🚀", color: "#2dd4bf" },
                    ] as { value: string; label: string; sub: string; emoji: string; color: string }[]).map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q2_feeling === opt.value}
                        color={opt.color}
                        onClick={() => setAnswer("q2_feeling", opt.value as DiagnosisAnswers["q2_feeling"])}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── Q3: Duration ── */}
              {step === 3 && (
                <>
                  <div className="space-y-1 mb-1">
                    <h2 className="text-[18px] font-extrabold text-white">من امتى وإنت كده؟</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">مش عيب — المهم تعرف.</p>
                  </div>
                  <div className="space-y-2.5">
                    {([
                      { value: "just_now", label: "بدأ دلوقتي", sub: "من أيام أو أسبوع", emoji: "📍" },
                      { value: "weeks", label: "من أسابيع", sub: "الشهر اللي فات أو أكتر شوية", emoji: "📅" },
                      { value: "months", label: "من فترة طويلة", sub: "شهور أو أكتر وأنا شايله", emoji: "🕰️" },
                    ] as { value: string; label: string; sub: string; emoji: string }[]).map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q3_duration === opt.value}
                        onClick={() => setAnswer("q3_duration", opt.value as DiagnosisAnswers["q3_duration"])}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── Q4: Blocker ── */}
              {step === 4 && (
                <>
                  <div className="space-y-1 mb-1">
                    <h2 className="text-[18px] font-extrabold text-white">إيه اللي بيوقفك؟</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">كن صريح مع نفسك — الإجابة دي بتفرق.</p>
                  </div>
                  <div className="space-y-2.5">
                    {([
                      { value: "dont_know", label: "مش عارف من فين أبدأ", sub: "مفيش خطوة واضحة", emoji: "🗺️" },
                      { value: "afraid", label: "خايف", sub: "من الفشل أو من ردود الفعل", emoji: "😰" },
                      { value: "not_ready", label: "مش وقته", sub: "فيه حاجات تانية أهم دلوقتي", emoji: "⏳" },
                      { value: "not_sure", label: "بصراحة مش متأكد", sub: "ممكن أبالغ في الموضوع", emoji: "🤔" },
                    ] as { value: string; label: string; sub: string; emoji: string }[]).map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q4_blocker === opt.value}
                        onClick={() => setAnswer("q4_blocker", opt.value as DiagnosisAnswers["q4_blocker"])}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── Q5: Long-term Goal ── */}
              {step === 5 && (
                <>
                  <div className="space-y-1 mb-1">
                    <h2 className="text-[18px] font-extrabold text-white">لو هتختار هدف واحد…</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">مش لازم يبقى كبير — اللي حاسس إنه الأهم دلوقتي.</p>
                  </div>
                  <div className="space-y-2.5">
                    {([
                      { value: "relationship", label: "أصلح أو أنهي علاقة مهمة", sub: "مع شخص بيشغل بالي", emoji: "💔" },
                      { value: "self", label: "أكون أنا أحسن", sub: "صحة نفسية أو تطوير الذات", emoji: "✨" },
                      { value: "work", label: "أحقق هدف في الشغل", sub: "إنجاز أو تغيير مسار", emoji: "🎯" },
                      { value: "family", label: "أحسّن وضعي مع عيلتي", sub: "حدود أو علاقات أفضل", emoji: "🌱" },
                    ] as { value: MainPain; label: string; sub: string; emoji: string }[]).map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q5_goal === opt.value}
                        onClick={() => setAnswer("q5_goal", opt.value)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Next Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={next}
                disabled={!canProceed}
                className="w-full py-4 rounded-2xl text-[15px] font-extrabold transition-all mt-2"
                style={{
                  background: canProceed
                    ? "linear-gradient(135deg, #2dd4bf, #8b5cf6)"
                    : "rgba(255,255,255,0.05)",
                  color: canProceed ? "#0f172a" : "rgba(255,255,255,0.2)",
                  cursor: canProceed ? "pointer" : "not-allowed",
                  boxShadow: canProceed ? "0 4px 20px rgba(45,212,191,0.25)" : "none",
                }}
              >
                {step === STEPS ? "شوف نتيجتك ←" : "كمّل →"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
