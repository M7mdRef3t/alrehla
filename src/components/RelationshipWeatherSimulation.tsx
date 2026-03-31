import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudLightning, ArrowLeft, Loader2, Target, Wind } from "lucide-react";
import { setEmotionalOffer } from "../services/subscriptionManager";

type WeatherScore = "storm" | "windy" | "clear";

type Question = {
  id: string;
  text: string;
  options: { id: string; text: string; score: number }[];
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "إيه أكتر حاجة بتسحب طاقتك الذهنية الأيام دي؟",
    options: [
      { id: "o1", text: "التفكير المستمر في كلام أو تصرفات حد معين", score: 2 },
      { id: "o2", text: "بحط فلاتر على كلامي طول الوقت عشان محدش يزعل", score: 1 },
      { id: "o3", text: "هموم ومسؤوليات الحياة والمستقبل العادية", score: 0 },
    ],
  },
  {
    id: "q2",
    text: "لما بتشوف إشعار من شخص معين على موبايلك.. بتحس بإيه؟",
    options: [
      { id: "o4", text: "انقباضة في قلبي وبأجل الرد عليه قدر الإمكان", score: 2 },
      { id: "o5", text: "بحس إن ورايا مجهود وطاقة لازم أطلعها", score: 1 },
      { id: "o6", text: "عادي جداً، مجرد إشعار زيه زي غيره", score: 0 },
    ],
  },
  {
    id: "q3",
    text: "لو اختفيت وقفلت موبايلك وبطلت تراضي اللي حواليك لمدة يوم؟",
    options: [
      { id: "o8", text: "حد هيزعل مني أو هيعملي مشكلة ويدبّسني", score: 2 },
      { id: "o7", text: "هحس بتأنيب الضمير ومسؤولية تجاههم", score: 1 },
      { id: "o9", text: "هرتاح جداً وهشحن بطاريتي", score: 0 },
    ],
  },
];

export function RelationshipWeatherSimulation() {
  const [step, setStep] = useState<"intro" | "questions" | "analyzing" | "result">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [weatherState, setWeatherState] = useState<WeatherScore | null>(null);

  const handleStart = () => {
    setStep("questions");
    trackEvent("weather_hook_started");
  };

  const trackEvent = (name: string) => {
    try {
      if (typeof window !== "undefined" && (window as any).trackEvent) {
         (window as any).trackEvent("CTA_CLICK", { source: "landing_weather_hook", cta_name: name });
      }
    } catch (e) {}
  };

  const handleAnswer = (score: number) => {
    const newScore = totalScore + score;
    setTotalScore(newScore);
    
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      let finalWeather: WeatherScore = "clear";
      if (newScore >= 5) finalWeather = "storm";
      else if (newScore >= 3) finalWeather = "windy";
      
      setWeatherState(finalWeather);
      setStep("analyzing");
    }
  };

  useEffect(() => {
    if (step === "analyzing") {
      const timer = setTimeout(() => {
        setStep("result");
        if (weatherState === "storm") {
            setEmotionalOffer({
               title: "لمواجهة الإعصار",
               message: "إنت بتستنزف طاقتك مع المعارك الغلط. ادخل الخريطة الكاملة بـ 9$ وارسم حدودك عشان توقف النزيف ده فوراً.",
               discountPercentage: 0,
               urgencyLevel: "high"
            });
        } else if (weatherState === "windy") {
             setEmotionalOffer({
               title: "للتحكم في الرياح",
               message: "بتساير الناس عشان تقلل الخساير بس بتخسر نفسك. افتح الخريطة بـ 9$ عشان تعرف إزاي ترسم مسافة أمان بتكلفة نفسية أقل.",
               discountPercentage: 0,
               urgencyLevel: "medium"
            });
        } else {
             setEmotionalOffer({
               title: "للحفاظ على هدوء الطقس",
               message: "طقس علاقاتك هادي دلوقتي، الخريطة الكاملة بـ 9$ هتخليك تراقب النمط وتفضل دايماً سابق بخطوة وتبني مسارات آمنة.",
               discountPercentage: 0,
               urgencyLevel: "low"
            });
        }
        trackEvent(`weather_result_${weatherState}`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, weatherState]);

  const getResultContent = () => {
    switch (weatherState) {
      case "storm":
        return {
          title: "طقسك عاصف: في حد بيخلص رصيدك",
          badge: "عاصفة",
          message: "التحليل: عندك استنزاف عالي ومستمر. طاقتك رايحة في محاولات تفادي غضب شخص أو مسايرته. إنت مش كسول في حياتك، إنت محوّط نفسك بعاصفة.",
          action: "اكتشف مين بيستنزفك واعمل مسافة",
          color: "rose",
          icon: <CloudLightning className="h-10 w-10 text-rose-400" />
        };
      case "windy":
        return {
          title: "طقسك رياح حذرة: السير على قشر بيض",
          badge: "رياح حذرة",
          message: "التحليل: مفيش خناقات مباشرة، بس إنت معظم الوقت حاطط فلاتر وبتحاسب على كلامك. ده اسمه (استنزاف بطيء) بيستهلك طاقتك للإبداع والتفكير.",
          action: "ارسم دوائرك وحدد مسافة الأمان",
          color: "amber",
          icon: <Wind className="h-10 w-10 text-amber-400" />
        };
      case "clear":
      default:
         return {
          title: "طقسك صحو: مافيكش زحمة علاقات",
          badge: "صحو",
          message: "التحليل: علاقاتك مستقرة نسبياً ومش هي السبب الأساسي في ضغطك، طاقتك متوفرة دلوقتي عشان ترسم خطتك للخطوات الجاية من غير تشويش.",
          action: "ابني خطتك لقدام بروقان",
          color: "emerald",
          icon: <Target className="h-10 w-10 text-emerald-400" />
        };
    }
  };

  const getBgColor = () => {
    if (step === 'analyzing') return 'bg-indigo-500 animate-pulse';
    if (step === 'result') {
      if (weatherState === 'storm') return 'bg-rose-500';
      if (weatherState === 'windy') return 'bg-amber-500';
      return 'bg-emerald-500';
    }
    return 'bg-[var(--soft-teal)]';
  };

  const currentResult = getResultContent();

  return (
    <div className="relative mx-auto mt-8 w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl" id="simulation" dir="rtl"
      style={{ background: "rgba(15, 15, 28, 0.8)", backdropFilter: "blur(20px)" }}>
      
      {/* Background glow based on state */}
      <div className={`absolute -inset-20 opacity-20 blur-3xl transition-colors duration-1000 ${getBgColor()}`} />

      <div className="relative z-10 min-h-[400px] p-8 sm:p-10 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex rounded-full bg-white/5 p-4 text-[var(--soft-teal)] shadow-inner border border-white/10">
                <CloudLightning className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white leading-tight">مين بيسرق طاقتك؟</h3>
              <p className="mb-8 text-[15px] leading-relaxed text-gray-400">
                طاقتك مش بتخلص من الشغل، بتخلص من الـ <span className="text-white font-semibold">"زحمة"</span> في العلاقات. جاوب بصراحة وبدون تفكير لـ 3 أسئلة، وشوف <strong>نشرة طقس علاقاتك</strong> دلوقتي حالا.
              </p>
              <button
                onClick={handleStart}
                className="group w-full rounded-2xl bg-white px-6 py-4 text-[16px] font-bold text-black transition-all hover:bg-gray-100 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                اكشف طقس العلاقات في دقيقتين
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </button>
            </motion.div>
          )}

          {step === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col h-full justify-between"
            >
              <div>
                 <div className="mb-8 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">الرادار شغال</span>
                    <div className="flex-1 flex gap-2">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${idx <= currentQuestionIndex ? 'bg-[var(--soft-teal)]' : 'bg-white/10'}`} />
                    ))}
                    </div>
                 </div>
                 <h3 className="mb-8 text-xl font-bold text-white leading-relaxed">
                   {QUESTIONS[currentQuestionIndex].text}
                 </h3>
              </div>
              
              <div className="space-y-3">
                {QUESTIONS[currentQuestionIndex].options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.score)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-right text-[15px] text-gray-300 transition-all hover:bg-white/10 hover:border-[var(--soft-teal)]/50 hover:text-white active:scale-[0.98]"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-10"
            >
              <Loader2 className="mb-6 h-12 w-12 animate-spin text-indigo-400" />
              <h3 className="text-lg font-bold text-white mb-2">بنحلل الطقس...</h3>
              <p className="text-sm text-gray-400">بنربط الإشارات عشان نكتشف مناطق التوهان والتسريب</p>
            </motion.div>
          )}

          {step === "result" && currentResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex rounded-full bg-slate-900/50 p-4 border border-white/10 shadow-lg relative">
                 {currentResult.icon}
              </div>
              
              <h3 className={`mb-4 text-2xl font-bold leading-tight px-2 drop-shadow-sm ${weatherState === 'storm' ? 'text-rose-400' : weatherState === 'windy' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currentResult.title}
              </h3>
              
              <div className="mb-8 rounded-2xl bg-white/5 border border-white/10 p-5 text-right relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-white/30 to-transparent" />
                <p className="text-[15px] leading-relaxed text-gray-300">
                  {currentResult.message}
                </p>
              </div>

              <div className="space-y-4">
                  <button
                    onClick={() => {
                      trackEvent("go_to_map_from_weather");
                      if (typeof window !== "undefined") window.location.assign("/onboarding");
                    }}
                    className={`group relative w-full overflow-hidden rounded-2xl border px-6 py-4 text-[16px] font-bold text-white transition-transform hover:scale-[1.02] ${
                      weatherState === 'storm' ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20' :
                      weatherState === 'windy' ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' :
                      'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <div className="relative flex justify-center items-center gap-2 z-10">
                        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        {currentResult.action}
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
