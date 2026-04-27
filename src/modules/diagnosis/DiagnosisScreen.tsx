'use client';

/**
 * DiagnosisScreen — شاشة التشخيص الأولي
 * ══════════════════════════════════════════════════
 * الـ Entry Point الإجباري لكل مستخدم جديد
 * 5 أسئلة سريعة → UserStateObject → Recommended Product
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeDiagnosis, USER_STATE_RESULT_LABELS, MAIN_PAIN_RESULT_LABELS, RECOMMENDED_PRODUCT_LABELS } from "./diagnosisEngine";
import { saveDiagnosisState } from "./types";
import type { DiagnosisAnswers, UserStateObject, MainPain, RecommendedProduct, UserStateType } from "./types";
import { ConversionOfferCard } from "../conversion/ConversionOfferCard";
import { runtimeEnv } from "@/config/runtimeEnv";
import { analyticsService } from "@/domains/analytics";
import { Bot, Sparkles } from "lucide-react";
import { BotpressService } from "@/services/botpressService";

const SentientGuide: FC<{ message: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 mb-6 shadow-[0_10px_30px_rgba(45,212,191,0.1)]"
  >
    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30 shrink-0">
      <Bot className="w-5 h-5 text-teal-400" />
    </div>
    <p className="text-xs text-teal-100 font-bold leading-relaxed">
      {message}
    </p>
  </motion.div>
);

import type { FC } from "react";

// ════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════

const STEPS = 5;

type FeelingOption = {
  value: UserStateType;
  label: string;
  sub: string;
  emoji: string;
  color: string;
};

type BlockerOption = {
  value: NonNullable<DiagnosisAnswers["q4_blocker"]>;
  label: string;
  sub: string;
  emoji: string;
};

type GoalOption = {
  value: MainPain;
  label: string;
  sub: string;
  emoji: string;
};

const DEFAULT_FEELING_OPTIONS: FeelingOption[] = [
  { value: "overwhelmed", label: "مضغوط ومشغول الدنيا", sub: "كل حاجة نازلة عليّا مرة واحدة", emoji: "🌊", color: "#f87171" },
  { value: "stuck", label: "واقف بس مش مطلّع", sub: "أفكر كتير وما بتحركش", emoji: "🪨", color: "#f59e0b" },
  { value: "lost", label: "تايه ومش عارف من فين أبدأ", sub: "مفيش خريطة واضحة جوايا", emoji: "🌫️", color: "#94a3b8" },
  { value: "anxious", label: "قلقان ومشدود", sub: "خايف من حاجة مش واضحة", emoji: "⚡", color: "#a78bfa" },
  { value: "ready", label: "جاهز وعايز أتحرك", sub: "محتاج بس خطة واضحة", emoji: "🚀", color: "#2dd4bf" },
  { value: "ununderstood", label: "محدش فاهمني", sub: "الإحساس أعمق من كل ده", emoji: "🌑", color: "#6366f1" },
];

const FAMILY_FEELING_OPTIONS: FeelingOption[] = [
  { value: "overwhelmed", label: "شايل فوق طاقتي", sub: "طلبات وتوقعات كتير ومفيش مساحة ليا", emoji: "🌊", color: "#f87171" },
  { value: "stuck", label: "محشور بين الذنب وراحتي", sub: "لو قربت بتتعب، ولو بعدت بتتلام", emoji: "🪨", color: "#f59e0b" },
  { value: "lost", label: "مش عارف أتعامل معاهم إزاي", sub: "كل تصرف بيحسسك إنك غلطان", emoji: "🌫️", color: "#94a3b8" },
  { value: "anxious", label: "متوتر قبل أي كلام أو زيارة", sub: "جسمك بيستعد للمواجهة قبل ما تحصل", emoji: "⚡", color: "#a78bfa" },
  { value: "ready", label: "عايز حدود واضحة من غير حرب", sub: "مش عايز تقطع، عايز تعرف تقف", emoji: "🚀", color: "#2dd4bf" },
  { value: "ununderstood", label: "حاسس إن صوتك مش واصل", sub: "بتشرح كتير وبرضه محدش شايفك", emoji: "🌑", color: "#6366f1" },
];

const DEFAULT_BLOCKER_OPTIONS: BlockerOption[] = [
  { value: "dont_know", label: "مش عارف من فين أبدأ", sub: "مفيش خطوة واضحة", emoji: "🗺️" },
  { value: "afraid", label: "خايف", sub: "من الفشل أو من ردود الفعل", emoji: "😰" },
  { value: "not_ready", label: "مش وقته", sub: "فيه حاجات تانية أهم دلوقتي", emoji: "⏳" },
  { value: "not_sure", label: "بصراحة مش متأكد", sub: "ممكن أبالغ في الموضوع", emoji: "🤔" },
];

const FAMILY_BLOCKER_OPTIONS: BlockerOption[] = [
  { value: "dont_know", label: "مش عارف أبدأ منين معاهم", sub: "كل طريق حاسس إنه هيولّع الموضوع", emoji: "🧭" },
  { value: "afraid", label: "خايف من رد فعلهم", sub: "زعل، لوم، ضغط، أو قلب الترابيزة عليك", emoji: "🛡️" },
  { value: "not_ready", label: "لسه مش قادر أحط حدود", sub: "عارف إن في حاجة غلط بس المواجهة تقيلة", emoji: "⏳" },
  { value: "not_sure", label: "مش متأكد حقي أطلب ده", sub: "جزء منك بيقول يمكن أنا اللي مكبرها", emoji: "⚖️" },
];

const DEFAULT_GOAL_OPTIONS: GoalOption[] = [
  { value: "relationship", label: "أصلح أو أنهي علاقة مهمة", sub: "مع شخص بيشغل بالي", emoji: "💔" },
  { value: "self", label: "أكون أنا أحسن", sub: "صحة نفسية أو تطوير الذات", emoji: "✨" },
  { value: "work", label: "أحقق هدف في الشغل", sub: "إنجاز أو تغيير مسار", emoji: "🎯" },
  { value: "family", label: "أحسّن وضعي مع عيلتي", sub: "حدود أو علاقات أفضل", emoji: "🌱" },
];

const FAMILY_GOAL_OPTIONS: GoalOption[] = [
  { value: "family", label: "أحط حدود من غير قطيعة", sub: "أتعامل من غير ما أخسر نفسي أو أفتح حرب", emoji: "🛡️" },
  { value: "relationship", label: "أفهم النمط اللي بيتكرر", sub: "مين بيضغط؟ إمتى؟ وإيه اللي بيشدني لنفس الدوامة", emoji: "🔎" },
  { value: "self", label: "أرجّع مساحتي الداخلية", sub: "أقلل الذنب والخوف وأسمع نفسي بوضوح", emoji: "✨" },
  { value: "work", label: "أخفف أثرهم على يومي", sub: "مايبقاش توتر العيلة سايق شغلي وطاقتي وقراراتي", emoji: "🎯" },
];

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
      dir="ltr"
      className="w-full flex flex-row items-center gap-3 px-4 py-4 rounded-2xl transition-all"
      style={{
        background: selected ? `${color}18` : "rgba(255,255,255,0.03)",
        border: `1.5px solid ${selected ? color : "rgba(255,255,255,0.08)"}`,
        boxShadow: selected ? `0 0 16px ${color}30` : "none",
      }}
    >
      {/* النص: flex-1 يأخذ كل المساحة على اليسار */}
      <div className="flex flex-col flex-1 text-right" dir="rtl">
        <span
          className="text-sm font-bold block w-full"
          style={{ color: selected ? color : "rgba(255,255,255,0.85)" }}
        >
          {label}
        </span>
        {sub && (
          <span className="text-[10px] mt-1.5 block w-full leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>
            {sub}
          </span>
        )}
      </div>
      {/* الأيقونة: ثاني في DOM = اليمين في LTR flex */}
      {selected ? (
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
      ) : (
        emoji && <span className="text-xl flex-shrink-0" aria-hidden>{emoji}</span>
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
  const stateLabel = USER_STATE_RESULT_LABELS[state.type] ?? state.type;
  const painLabel = MAIN_PAIN_RESULT_LABELS[state.mainPain] ?? state.mainPain;

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
            <span className="text-3xl font-black text-white drop-shadow-[0_0_12px_rgba(45,212,191,0.5)]">{state.diagnosisScore}</span>
            <span className="text-[9px] text-teal-400/60 font-black uppercase tracking-widest">pulse</span>
          </div>
        </div>
      </div>

      {/* Diagnosis Summary */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-extrabold text-white">التشخيص اتكمّل</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          إنت دلوقتي <span className="text-teal-400 font-bold">{stateLabel}</span>،
          وأكتر حاجة <span className="text-purple-400 font-bold italic">شاغلاك</span> هي <span className="text-purple-400 font-bold">{painLabel}</span>.
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
  const isFamilyPain = answers.q1_pain === "family";
  const feelingStepTitle = isFamilyPain ? "إيه اللي بيحصل جواك ناحية العيلة؟" : "إيه الإحساس الأكتر؟";
  const feelingStepDescription = isFamilyPain
    ? "اختار أقرب إحساس للعلاقة دي. مش مطلوب تشرح لهم دلوقتي، المطلوب نفهم أثرهم عليك."
    : "الوصف اللي لو قلته لحد آمن بره الدوامة هيفهم حالتك بسرعة.";
  const feelingOptions = isFamilyPain ? FAMILY_FEELING_OPTIONS : DEFAULT_FEELING_OPTIONS;
  const blockerStepTitle = isFamilyPain ? "إيه اللي موقفك معاهم؟" : "إيه اللي بيوقفك؟";
  const blockerStepDescription = isFamilyPain
    ? "مش بندور على مين الغلطان. بندور على أول عقدة محتاجة تتفك عشان ترجع تمسك حدودك."
    : "كن صريح مع نفسك — الإجابة دي بتفرق.";
  const blockerOptions = isFamilyPain ? FAMILY_BLOCKER_OPTIONS : DEFAULT_BLOCKER_OPTIONS;
  const goalStepTitle = isFamilyPain ? "إيه أول هدف واقعي مع العيلة؟" : "لو هتختار هدف واحد…";
  const goalStepDescription = isFamilyPain
    ? "اختار اتجاه عملي للخريطة الجاية. مش قرار نهائي، ده أول خيط نمسكه."
    : "مش لازم يبقى كبير — اللي حاسس إنه الأهم دلوقتي.";
  const goalOptions = isFamilyPain ? FAMILY_GOAL_OPTIONS : DEFAULT_GOAL_OPTIONS;
  const stepGuideMessage =
    step === 1 ? "خليك صريح مع نفسك، دي البداية عشان تسترد قيادتك." :
    step === 2 && isFamilyPain ? "إحساسك مع العيلة مش حكم عليهم، ده مؤشر على اللي محتاج حدود أو وضوح." :
    step === 2 ? "المشاعر دي رسائل، مهم نفهم هي عايزة تقول إيه." :
    step === 3 ? "الوقت بيفرق في تحليل الأنماط المتكررة." :
    step === 4 && isFamilyPain ? "العيلة بتلمس مناطق حساسة: الذنب، الخوف، والحق في المساحة. خلينا نحدد العقدة بالظبط." :
    step === 4 ? "الخوف طبيعي، بس الوضوح هو اللي بيكسره." :
    step === 5 && isFamilyPain ? "آخر خطوة: نختار اتجاه يخلّي الخريطة تساعدك وسط العلاقة، مش ترميك في قرار متسرع." :
    "آخر خطوة، عشان نبني خريطة طريق تناسبك بجد.";

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
      
      // Notify Botpress about progress
      BotpressService.sendMessage({
        userId: "anonymous", // Will be updated if user logs in
        text: `المسافر جاوب على السؤال رقم ${step}`,
        metadata: { step, answers }
      });
    } else {
      const computed = computeDiagnosis(answers);
      saveDiagnosisState(computed);
      
      analyticsService.track(analyticsService.Events.DIAGNOSIS_RESULT_VIEW, {
        score: computed.diagnosisScore,
        type: computed.type,
        main_pain: computed.mainPain,
        product: computed.recommendedProduct
      });

      // Send Final Diagnosis to Botpress
      BotpressService.sendMessage({
        userId: "anonymous",
        text: `المسافر خلص التشخيص. النتيجة: ${computed.type}، المشكلة: ${computed.mainPain}`,
        metadata: { diagnosis: computed }
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
      className="min-h-screen w-full overflow-y-auto ob-dark-force"
      style={{ background: "#020408", display: "flex", justifyContent: "center" }}
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
      <div
        className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center gap-6 mx-auto"
        style={{ maxWidth: "30rem", padding: "7rem 1.25rem 4rem", boxSizing: "border-box" }}
      >

        {/* Header */}
        <div className="relative flex w-full items-center justify-center text-center">
          <div className="flex flex-col items-center gap-1">
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
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:border-white/20 hover:text-slate-300"
            >
              تخطي
            </button>
          )}
        </div>

        {/* Progress */}
        {!result && (
          <>
            <ProgressBar step={step} total={STEPS} />
            <div className="mt-4">
              <SentientGuide 
                message={stepGuideMessage} 
              />
            </div>
          </>
        )}

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
                  <div className="space-y-1 mb-1 flex flex-col items-start w-full text-right">
                    <h2 className="text-[18px] font-extrabold text-white">إيه أكتر حاجة شغلاك دلوقتي؟</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">الموضوع اللي بيطلع في بالك لما بتصحى أو قبل ما تنام.</p>
                  </div>
                  <div className="space-y-2.5">
                    {([
                      { value: "relationship", label: "علاقاتي مع الناس", sub: "شخص أو أكتر بياخد منك طاقة", emoji: "🔗" },
                      { value: "family", label: "عيلتي", sub: "ضغوط أو توقعات من المقربين", emoji: "🏠" },
                      { value: "work", label: "الشغل والإنجاز", sub: "مش وصّال للي عايزه", emoji: "💼" },
                      { value: "self", label: "علاقتي بنفسي", sub: "داخلي مش تمام", emoji: "💭" },
                    ] as { value: MainPain; label: string; sub: string; emoji: string }[]).map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q1_pain === opt.value}
                        onClick={() => { setAnswer("q1_pain", opt.value); setTimeout(next, 200); }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── Q2: Feeling ── */}
              {step === 2 && (
                <>
                  <div className="space-y-1 mb-1 flex flex-col items-start w-full text-right">
                    <h2 className="text-[18px] font-extrabold text-white">{feelingStepTitle}</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">{feelingStepDescription}</p>
                  </div>
                  <div className="space-y-2.5">
                    {feelingOptions.map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q2_feeling === opt.value}
                        color={opt.color}
                        onClick={() => { setAnswer("q2_feeling", opt.value); setTimeout(next, 200); }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── Q3: Duration ── */}
              {step === 3 && (
                <>
                  <div className="space-y-1 mb-1 flex flex-col items-start w-full text-right">
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
                        onClick={() => { setAnswer("q3_duration", opt.value as DiagnosisAnswers["q3_duration"]); setTimeout(next, 200); }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── Q4: Blocker ── */}
              {step === 4 && (
                <>
                  <div className="space-y-1 mb-1 flex flex-col items-start w-full text-right">
                    <h2 className="text-[18px] font-extrabold text-white">{blockerStepTitle}</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">{blockerStepDescription}</p>
                  </div>
                  <div className="space-y-2.5">
                    {blockerOptions.map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q4_blocker === opt.value}
                        onClick={() => { setAnswer("q4_blocker", opt.value); setTimeout(next, 200); }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── Q5: Long-term Goal ── */}
              {step === 5 && (
                <>
                  <div className="space-y-1 mb-1 flex flex-col items-start w-full text-right">
                    <h2 className="text-[18px] font-extrabold text-white">{goalStepTitle}</h2>
                    <p className="text-[12px] text-slate-400 leading-relaxed">{goalStepDescription}</p>
                  </div>
                  <div className="space-y-2.5">
                    {goalOptions.map((opt) => (
                      <OptionBtn
                        key={opt.value}
                        label={opt.label}
                        sub={opt.sub}
                        emoji={opt.emoji}
                        selected={answers.q5_goal === opt.value}
                        onClick={() => { setAnswer("q5_goal", opt.value); setTimeout(next, 200); }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Next Button Removed */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
