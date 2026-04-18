'use client';

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeDiagnosis, USER_STATE_LABELS, MAIN_PAIN_LABELS, RECOMMENDED_PRODUCT_LABELS } from "./diagnosisEngine";
import { saveDiagnosisState } from "./types";
import type { DiagnosisAnswers, UserStateObject, MainPain, RecommendedProduct } from "./types";
import { ConversionOfferCard } from "../conversion/ConversionOfferCard";
import { analyticsService } from "@/domains/analytics";

const STEPS = 5;

interface DiagnosisScreenProps {
  onComplete: (state: UserStateObject, product?: RecommendedProduct) => void;
  onSkip?: () => void;
}

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
      {emoji && <span className="text-xl flex-shrink-0">{emoji}</span>}
      <div className="flex flex-col items-start flex-1">
        <span className="text-sm font-bold" style={{ color: selected ? color : "rgba(255,255,255,0.85)" }}>{label}</span>
        {sub && <span className="text-[10px] mt-0.5" style={{ color: "rgba(148,163,184,0.7)" }}>{sub}</span>}
      </div>
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: color }}>
          <svg width="10" height="8" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </motion.div>
      )}
    </motion.button>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: i < step ? "linear-gradient(90deg, #2dd4bf, #8b5cf6)" : "rgba(255,255,255,0.08)" }} />
      ))}
    </div>
  );
}

function ResultCard({ state, onProceed }: { state: UserStateObject; onProceed: (product: RecommendedProduct) => void; }) {
  const product = RECOMMENDED_PRODUCT_LABELS[state.recommendedProduct];
  const stateLabel = USER_STATE_LABELS[state.type] ?? state.type;
  const painLabel = MAIN_PAIN_LABELS[state.mainPain] ?? state.mainPain;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 w-full">
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96" fill="none">
            <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="48" cy="48" r="40" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(state.diagnosisScore / 100) * 251.3} 251.3`} className="transition-all duration-1000" />
            <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#2dd4bf" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{state.diagnosisScore}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">score</span>
          </div>
        </div>
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-extrabold text-white">التشخيص اتكمّل</h2>
        <p className="text-sm text-slate-300 leading-relaxed">إنت دلوقتي <span className="text-teal-400 font-bold">{stateLabel}</span>، وأكتر حاجة شايلاك هي <span className="text-purple-400 font-bold">{painLabel}</span>.</p>
      </div>
      <div className="mt-2">
        <ConversionOfferCard userState={state} source="diagnosis" onSelectFree={(p) => onProceed(p)} onSelectSession={() => onProceed("session")} onDismiss={() => onProceed("dawayir")} />
      </div>
    </motion.div>
  );
}

export function DiagnosisScreen({ onComplete, onSkip }: DiagnosisScreenProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<DiagnosisAnswers>({});
  const [result, setResult] = useState<UserStateObject | null>(null);

  const setAnswer = useCallback((key: keyof DiagnosisAnswers, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    analyticsService.track(analyticsService.Events.DIAGNOSIS_VIEW);
  }, []);

  const next = useCallback(() => {
    const currentAnswer = step === 1 ? answers.q1_pain : step === 2 ? answers.q2_feeling : step === 3 ? answers.q3_duration : step === 4 ? answers.q4_blocker : step === 5 ? answers.q5_goal : null;
    analyticsService.track("diagnosis_step_complete", { step, answer: currentAnswer });

    if (step < STEPS) { setStep(s => s + 1); } 
    else { const resultState = computeDiagnosis(answers); setResult(resultState); }
  }, [step, answers]);

  const handleProceed = useCallback((product: RecommendedProduct) => { if (result) onComplete(result, product); }, [result, onComplete]);
  const skipStep = useCallback(() => { analyticsService.track("diagnosis_step_skipped", { step_number: step }); next(); }, [step, next]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start overflow-y-auto ob-dark-force" style={{ background: "#020408" }} dir="rtl">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.3) 0%, transparent 70%)", top: "-10%", right: "-10%", filter: "blur(80px)" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)", bottom: "-15%", left: "-10%", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 pb-10 pt-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-extrabold text-white">{result ? "نتيجة التشخيص" : "اعرف نفسك الأول"}</h1>
            {!result && <p className="text-[11px] text-slate-400">سؤال {step} من {STEPS}</p>}
          </div>
          {onSkip && !result && <button onClick={onSkip} className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">تخطي التشخيص</button>}
        </div>

        {!result && <ProgressBar step={step} total={STEPS} />}

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result"><ResultCard state={result} onProceed={handleProceed} /></motion.div>
          ) : (
            <motion.div key={`step-${step}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-4">
              {step === 1 && (
                <div className="space-y-2.5">
                  <h2 className="text-[18px] font-extrabold text-white">إيه اللي شايلك دلوقتي؟</h2>
                  <OptionBtn label="علاقاتي مع الناس" selected={answers.q1_pain === "relationship"} onClick={() => { setAnswer("q1_pain", "relationship"); next(); }} />
                  <OptionBtn label="عيلتي" selected={answers.q1_pain === "family"} onClick={() => { setAnswer("q1_pain", "family"); next(); }} />
                  <OptionBtn label="الشغل والإنجاز" selected={answers.q1_pain === "work"} onClick={() => { setAnswer("q1_pain", "work"); next(); }} />
                  <OptionBtn label="علاقتي بنفسي" selected={answers.q1_pain === "self"} onClick={() => { setAnswer("q1_pain", "self"); next(); }} />
                </div>
              )}
              {step === 2 && (
                <div className="space-y-2.5">
                  <h2 className="text-[18px] font-extrabold text-white">إيه الإحساس الأكتر؟</h2>
                  <OptionBtn label="مضغوط ومشغول" selected={answers.q2_feeling === "overwhelmed"} onClick={() => { setAnswer("q2_feeling", "overwhelmed"); next(); }} />
                  <OptionBtn label="واقف بس مش مطلّع" selected={answers.q2_feeling === "stuck"} onClick={() => { setAnswer("q2_feeling", "stuck"); next(); }} />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-2.5">
                  <h2 className="text-[18px] font-extrabold text-white">من امتى وإنت كده؟</h2>
                  <OptionBtn label="بدأ دلوقتي" selected={answers.q3_duration === "just_now"} onClick={() => { setAnswer("q3_duration", "just_now"); next(); }} />
                  <OptionBtn label="من أسابيع" selected={answers.q3_duration === "weeks"} onClick={() => { setAnswer("q3_duration", "weeks"); next(); }} />
                </div>
              )}
              <div className="flex flex-col gap-3 mt-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={next} className="w-full py-4 rounded-2xl text-[15px] font-extrabold transition-all" style={{ background: "linear-gradient(135deg, #2dd4bf, #8b5cf6)", color: "#0f172a" }}>{step === STEPS ? "شوف نتيجتك ←" : "كمّل →"}</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
