import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Target, AlertCircle, Zap, ShieldAlert, Cpu } from "lucide-react";
import { useJourneyState } from "@/state/journeyState";
import { recordFlowEvent } from "@/services/journeyTracking";
import { soundManager } from "@/services/soundManager";

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
  const [step, setStep] = useState<"intro" | "questions" | "analyzing" | "result">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dominantCategory, setDominantCategory] = useState<"future" | "relationships" | "progress" | null>(null);

  // Connection to Ghost Backend
  const setLandingIntent = useJourneyState((s) => s.setLandingIntent);

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
    if (step === "analyzing") {
      const timer = setTimeout(() => {
        setStep("result");
        soundManager.playEffect("cosmic_pulse");

        // Sovereign Ghost Backend Linking
        let intent: "clarity" | "boundaries" | "calm" = "clarity";
        if (dominantCategory === "relationships") intent = "boundaries";
        if (dominantCategory === "progress") intent = "calm";
        if (dominantCategory === "future") intent = "clarity";

        setLandingIntent(intent);
        
        // Push hidden backend telemetry
        recordFlowEvent("quiz_completed", { meta: { dominantCategory: dominantCategory, calculatedIntent: intent } });

      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, dominantCategory, setLandingIntent]);

  const getResultContent = () => {
    switch (dominantCategory) {
      case "future":
        return {
          title: "الفوضى في التوقع، مش في الواقع",
          message: "عقلك يستبق الأحداث لدرجة الشلل. أنت لا تحتاج لخطة خمسية، بل تحتاج تحديد إحداثية الخطوة القادمة فقط لفك الاشتباك المعرفي.",
          action: "اكتشف إحداثية استقرارك",
          icon: <Target className="h-10 w-10 text-emerald-400" />
        };
      case "progress":
        return {
          title: "محاولة اللحاق المستمرة تستنزفك",
          message: "أنت لست متأخراً، أنت تستخدم مقياساً خاطئاً. المقارنة الصامتة تغذي جلد الذات وتأكل إنجازك. الحقيقة تكمن في تحديد سرعتك الخاصة.",
          action: "استعد سيادتك على إيقاعك",
          icon: <Cpu className="h-10 w-10 text-amber-400" />
        };
      case "relationships":
        return {
          title: "هناك ثغرة في جدارك",
          message: "طاقتك تتسرب عبر حدود غير مرسمة بوضوح. الردود والمجاملات تأكل توازنك. تحتاج لخريطة طقس تكشف مصدر الاستنزاف الخفي.",
          action: "اكتشف طقس علاقاتك الآن",
          icon: <ShieldAlert className="h-10 w-10 text-red-400" />
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

  const handleEnterSanctuary = useCallback(() => {
    soundManager.playEffect("cosmic_pulse");
    setTimeout(() => {
        if (typeof window !== "undefined") window.location.assign("/onboarding?source=simulation");
    }, 500);
  }, []);

  return (
    <div className="relative mx-auto mt-8 w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-[rgba(255,255,255,0.05)] shadow-[0_20px_80px_rgba(0,0,0,0.8)]" id="simulation" dir="rtl"
      style={{ background: "rgba(8, 8, 14, 0.65)", backdropFilter: "blur(40px)" }}>
      
      <div className={`absolute -inset-20 opacity-20 blur-[80px] transition-colors duration-1000 ${
            step === 'analyzing' ? 'bg-indigo-500/40 animate-pulse' : 
            step === 'result' ? (dominantCategory === 'future' ? 'bg-emerald-500/40' : dominantCategory === 'progress' ? 'bg-amber-500/40' : 'bg-red-500/40') : 
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
              <div className="mb-6 inline-flex rounded-full bg-[rgba(255,255,255,0.03)] p-5 text-[var(--ds-color-brand-teal-400)] shadow-[inset_0_1px_rgba(255,255,255,0.1)] border border-[rgba(20,184,166,0.2)]">
                <Cpu className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-3xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>صخب لا ينتهي؟</h3>
              <p className="mb-10 text-[15px] leading-loose text-white/50 max-w-[34ch] mx-auto">
                لا تجري استبيانات. 3 أسئلة من الأعماق، في دقيقتين فقط، لتشغيل مرآة الوعي الخاصة بك وتحديد نقطة الانطلاق.
              </p>
              <button
                onClick={handleStart}
                className="group relative inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-bold text-white transition-all overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
              >
                <div className="absolute inset-0 bg-[var(--ds-color-brand-teal-500)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                شغّل المرآة
                <ArrowLeft className="h-5 w-5 text-[var(--ds-color-brand-teal-400)] transition-transform group-hover:-translate-x-1" />
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    key={option.id + currentQuestionIndex}
                    onClick={() => handleAnswer(option.id, option.category)}
                    className="group w-full rounded-2xl border border-white/5 bg-[rgba(255,255,255,0.02)] p-5 text-right text-[15px] font-medium text-white/70 transition-all hover:bg-[rgba(255,255,255,0.04)] hover:border-[var(--ds-color-brand-teal-500)]/30 hover:text-white hover:pl-7"
                  >
                    {option.text}
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
              <Loader2 className="mb-8 h-12 w-12 animate-spin text-[var(--ds-color-brand-teal-400)] drop-shadow-[0_0_20px_rgba(45,212,191,0.5)]" />
              <h3 className="text-xl font-black text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>جاري فك التشفير</h3>
              <p className="text-sm text-white/40">يتم رصد الإشارات الخفية للتبعية والاستنزاف..</p>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div
              key="result"
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
              
              <div className="mb-10 text-[15px] leading-loose text-white/60 max-w-[34ch] mx-auto text-center">
                {getResultContent()?.message}
              </div>

              <div className="w-full">
                  <button
                    onClick={handleEnterSanctuary}
                    className="group relative w-full overflow-hidden rounded-2xl px-6 py-4 text-[16px] font-black text-white transition-all shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_rgba(255,255,255,0.1)]"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(20,184,166,0.3)", backdropFilter: "blur(12px)" }}
                  >
                    <div className="absolute inset-0 bg-[var(--ds-color-brand-teal-500)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex justify-center items-center gap-3 z-10">
                        {getResultContent()?.action}
                        <ArrowLeft className="h-5 w-5 text-[var(--ds-color-brand-teal-400)] group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
