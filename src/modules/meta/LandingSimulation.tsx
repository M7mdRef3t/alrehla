import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Target, Zap, ShieldAlert, Cpu } from "lucide-react";
import { useJourneyProgress } from "@/domains/journey";
import { recordFlowEvent } from "@/services/journeyTracking";
import { soundManager } from "@/services/soundManager";
import { ConversionOfferCard } from "../conversion/ConversionOfferCard";
import { computeMiniDiagnosis } from "@/modules/meta/miniDiagnosisEngine";
import type { UserStateObject, RecommendedProduct } from "@/modules/diagnosis/types";
import { runtimeEnv } from "@/config/runtimeEnv";

type Question = {
  id: string;
  text: string;
  options: { id: string; text: string; category: "future" | "relationships" | "progress" }[];
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "إيه أكتر حاجة بتسحب طاقتك لدرجة بتحس إنك مشلول؟",
    options: [
      { id: "o1", text: "سيناريوهات بكرة اللي مبترحمش", category: "future" },
      { id: "o2", text: "دوائر ومطالب علاقات بتستنزفني", category: "relationships" },
      { id: "o3", text: "الإحساس المستمر إني متأخر عن الباقي", category: "progress" },
    ],
  },
  {
    id: "q2",
    text: "لما بتسكت كل حاجة حواليك، إيه النمط اللي بيسيطر؟",
    options: [
      { id: "o4", text: "دوشة المقارنات وجلد الذات", category: "progress" },
      { id: "o5", text: "خوف من المجهول وخطواتي الجاية", category: "future" },
      { id: "o6", text: "التفكير في رد فعل فلان أو علان", category: "relationships" },
    ],
  },
  {
    id: "q3",
    text: "لنفترض أنك حصلت على 'ملاذ آمن' الآن، كيف ستستخدمه؟",
    options: [
      { id: "o7", text: "لتفريغ راسي من زحمة التخطيط", category: "future" },
      { id: "o8", text: "لاستعادة قيمتي بعيداً عن تقييم الآخرين", category: "progress" },
      { id: "o9", text: "لتنظيف مساحتي من العلاقات السامة", category: "relationships" },
    ],
  },
];

export function LandingSimulation() {
  const [step, setStep] = useState<"intro" | "questions" | "analyzing" | "result" | "convert">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dominantCategory, setDominantCategory] = useState<"future" | "relationships" | "progress" | null>(null);
  const [userState, setUserState] = useState<UserStateObject | null>(null);

  // Connection to Ghost Backend
  const setLandingIntent = useJourneyProgress().setLandingIntent;

  const handleStart = () => {
    setStep("questions");
    soundManager.playEffect("cosmic_pulse");
    recordFlowEvent("quiz_hub_opened", { meta: { source: "landing" } });
  };

  const handleAnswer = (optionId: string, category: "future" | "relationships" | "progress") => {
    soundManager.playEffect("cosmic_pulse");
    const updatedAnswers = { ...answers, [QUESTIONS[currentQuestionIndex].id]: category };
    setAnswers(updatedAnswers);
    
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const categories = Object.values(updatedAnswers);
      const counts = categories.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      let maxCount = 0;
      let dominant = "future";
      for (const [cat, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          dominant = cat;
        }
      }
      
      setDominantCategory(dominant as "future" | "relationships" | "progress");
      setStep("analyzing");
    }
  };

  useEffect(() => {
    if (step === "analyzing" && dominantCategory) {
      const timer = setTimeout(() => {
        // Compute mini diagnosis from answers
        const miniAnswers = {
          q1_category: answers.q1 as "future" | "relationships" | "progress",
          q2_category: answers.q2 as "future" | "relationships" | "progress",
          q3_category: answers.q3 as "future" | "relationships" | "progress",
        };
        const computedState = computeMiniDiagnosis(miniAnswers);
        setUserState(computedState);

        // Sovereign Ghost Backend Linking
        let intent: "clarity" | "boundaries" | "calm" = "clarity";
        if (dominantCategory === "relationships") intent = "boundaries";
        if (dominantCategory === "progress") intent = "calm";
        if (dominantCategory === "future") intent = "clarity";

        setLandingIntent(intent);

        // Push hidden backend telemetry
        recordFlowEvent("quiz_completed", { meta: { dominantCategory: dominantCategory, calculatedIntent: intent, recommendedProduct: computedState.recommendedProduct } });

        setStep("convert");
        soundManager.playEffect("cosmic_pulse");

      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, dominantCategory, answers, setLandingIntent]);

  const getResultContent = () => {
    switch (dominantCategory) {
      case "future":
        return {
          title: "هدفك محتاج إعادة توصيل",
          message: "الشعور بالضياع مش معناه إنك ضعيف. معناه إنك واعي كفاية إنك تحس بالفجوة. في الملاذ، بنساعدك ترسم خريطة هدف حقيقي.",
          action: "اعرف إتجاهك الحقيقي",
          icon: <Target className="h-10 w-10 text-[var(--teal)]" />
        };
      case "progress":
        return {
          title: "محاولة اللحاق المستمرة تستنزفك",
          message: "أنت لست متأخراً، أنت تستخدم مقياساً خاطئاً. المقارنة الصامتة تغذي جلد الذات وتأكل إنجازك. الحقيقة تكمن في تحديد سرعتك الخاصة.",
          action: "استعد سيادتك على إيقاعك",
          icon: <Cpu className="h-10 w-10 text-[var(--gold)]" />
        };
      case "relationships":
        return {
          title: "هناك ثغرة في جدارك",
          message: "طاقتك تتسرب عبر حدود غير مرسمة بوضوح. الردود والمجاملات تأكل توازنك. تحتاج لخريطة طقس تكشف مصدر الاستنزاف الخفي.",
          action: "اكتشف طقس علاقاتك الآن",
          icon: <ShieldAlert className="h-10 w-10 text-rose-500" />
        };
      default:
         return {
          title: "نبض استنزاف مختلط",
          message: "جزء كبير من طاقتك رايح في التفكير المتشابك. في الملاذ الخاص بك، سنقوم بتحليل أين تفقد هذه الطاقة بالضبط.",
          action: "فك الاشتباك المعرفي",
          icon: <Zap className="h-10 w-10 text-blue-400" />
        };
    }
  };

  const handleEnterSanctuary = useCallback((product?: RecommendedProduct) => {
    soundManager.playEffect("cosmic_pulse");
    const productParam = product ? `&product=${product}` : "";
    setTimeout(() => {
        if (typeof window !== "undefined") window.location.assign(`/onboarding?source=simulation${productParam}`);
    }, 500);
  }, []);

  const handleSessionBooking = useCallback(() => {
    soundManager.playEffect("cosmic_pulse");
    
    // Set boot action for the main app to pick up
    if (typeof window !== "undefined") {
      sessionStorage.setItem("dawayir-app-boot-action", "navigate:session-intake");
      
      // Redirect to onboarding shell
      window.location.assign("/onboarding?source=simulation&product=session");
    }
    
    recordFlowEvent("cta_activation_clicked", { meta: { source: "landing_simulation", intent: "session_intake" } });
  }, []);

  const handleDismiss = useCallback(() => {
    handleEnterSanctuary("dawayir");
  }, [handleEnterSanctuary]);

  return (
    <div className="relative mx-auto mt-8 w-full max-w-lg overflow-hidden rounded-[2.5rem] glass-premium shadow-[0_20px_80px_rgba(0,0,0,0.8)]" id="simulation" dir="rtl">
      
      <div className={`absolute -inset-20 opacity-20 blur-[80px] transition-colors duration-1000 ${
            step === 'analyzing' ? 'bg-indigo-500/40 animate-pulse' :
            step === 'convert' ? (dominantCategory === 'future' ? 'bg-emerald-500/40' : dominantCategory === 'progress' ? 'bg-amber-500/40' : 'bg-red-500/40') :
            'bg-[var(--ds-color-brand-teal-500)]/20'
        }`} />

      <div className="relative z-10 min-h-[420px] p-8 sm:p-12 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center flex flex-col items-center"
            >
              <div className="mb-6 inline-flex rounded-full bg-[rgba(255,255,255,0.03)] p-5 text-[var(--teal)] shadow-[inset_0_1px_rgba(255,255,255,0.1)] border border-[rgba(0,240,255,0.25)]">
                <Cpu className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-3xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>تهيئة مرآة الوعي</h3>
              <p className="mb-10 text-[15px] leading-loose text-slate-300 max-w-[34ch] mx-auto text-center">
                ليس مجرد استبيان؛ إنها عدسة لترى داخلك بوضوح. ٣ خطوات صامتة تكشف لك مصدر استنزافك وتضيء لك خطوتك القادمة.
              </p>
              <button
                onClick={handleStart}
                className="group relative inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-bold text-white transition-all overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
              >
                {/* Pulse ring for cinematic effect */}
                <motion.div 
                  className="absolute inset-0 rounded-2xl border border-teal-500/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                شغّل المرآة
                <ArrowLeft className="h-5 w-5 text-teal-400 transition-transform group-hover:-translate-x-1" />
              </button>
            </motion.div>
          )}

          {step === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col h-full justify-between"
            >
              <div>
                 <div className="mb-10 flex items-center gap-3">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${idx <= currentQuestionIndex ? 'bg-[var(--ds-color-brand-teal-400)] shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'bg-white/5'}`} />
                    ))}
                 </div>
                 <h3 className="mb-8 text-xl sm:text-2xl font-black text-white leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                   {QUESTIONS[currentQuestionIndex].text}
                 </h3>
              </div>
              
              <div className="space-y-3">
                {QUESTIONS[currentQuestionIndex].options.map((option, i) => (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i, ease: "easeOut", duration: 0.4 }}
                    key={option.id + currentQuestionIndex}
                    onClick={() => handleAnswer(option.id, option.category)}
                    className="group relative w-full rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-right text-[15px] font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.04] hover:border-teal-500/30 hover:text-white hover:pl-7 hover:shadow-[0_0_20px_rgba(45,212,191,0.1)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/0 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <span className="relative z-10">{option.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              className="flex flex-col items-center justify-center text-center py-10"
            >
              <Loader2 className="mb-8 h-12 w-12 animate-spin text-[var(--teal)] drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]" />
              <h3 className="text-xl font-black text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>نزيح الضباب عن مسارك..</h3>
              <p className="text-sm text-white/40">نقرأ إشاراتك الصامتة لنكشف لك ما يعيق رحلتك الآن.</p>
            </motion.div>
          )}

          {step === "convert" && (
            <motion.div
              key="convert"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center flex flex-col items-center"
            >
              <div className="mb-6 inline-flex rounded-full bg-white/5 p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                 {getResultContent()?.icon}
              </div>
              
              <h3 className="mb-4 text-2xl font-black leading-tight text-white px-2" style={{ fontFamily: "var(--font-display)" }}>
                {getResultContent()?.title}
              </h3>
              
              <div className="mb-10 text-base leading-loose text-white/90 max-w-[34ch] mx-auto text-justify" style={{ textJustify: "inter-word", textAlignLast: "center" }}>
                {getResultContent()?.message}
              </div>

              {userState && (
                <div className="mt-6">
                  <ConversionOfferCard
                    userState={userState}
                    source="landing"
                    onSelectFree={(product) => handleEnterSanctuary(product)}
                    onSelectSession={handleSessionBooking}
                    onDismiss={handleDismiss}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
