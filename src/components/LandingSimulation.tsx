import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, Loader2, BrainCircuit, Target, AlertCircle } from "lucide-react";
import { setEmotionalOffer } from "../services/subscriptionManager";

type Question = {
  id: string;
  text: string;
  options: { id: string; text: string; category: "future" | "relationships" | "progress" }[];
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "إيه أكتر حاجة بتسحب طاقتك الذهنية الأيام دي؟",
    options: [
      { id: "o1", text: "التفكير المستمر في المستقبل وخايف منه", category: "future" },
      { id: "o2", text: "علاقة أو وضع متعب بحاول أسايره", category: "relationships" },
      { id: "o3", text: "حاسس إني متأخر عن كل اللي في سني", category: "progress" },
    ],
  },
  {
    id: "q2",
    text: "لما تصحى من النوم ومفيش وراك حاجة ضرورية، إحساسك إيه؟",
    options: [
      { id: "o4", text: "بمسك الموبايل عشان أهرب من التفكير", category: "progress" },
      { id: "o5", text: "بحس إن ورايا هم ومش عارف أبدأ منين", category: "future" },
      { id: "o6", text: "بحس بوحدة أو بتجنب أكلم حد معين", category: "relationships" },
    ],
  },
  {
    id: "q3",
    text: "لو معاك عصاية سحرية تحل بيها مشكلة واحدة دلوقتي، تختار إيه؟",
    options: [
      { id: "o7", text: "أعرف خطوتي الجاية صح إيه ومترددش", category: "future" },
      { id: "o8", text: "أبطل أقارن نفسي بغيري وأركز في حالي", category: "progress" },
      { id: "o9", text: "أرسم حدود واضحة مع الناس اللي بتستنزفني", category: "relationships" },
    ],
  },
];

export function LandingSimulation() {
  const [step, setStep] = useState<"intro" | "questions" | "analyzing" | "result">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dominantCategory, setDominantCategory] = useState<"future" | "relationships" | "progress" | null>(null);

  const handleStart = () => setStep("questions");

  const handleAnswer = (optionId: string, category: "future" | "relationships" | "progress") => {
    setAnswers({ ...answers, [QUESTIONS[currentQuestionIndex].id]: category });
    
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Analyze answers
      const categories = Object.values({ ...answers, [QUESTIONS[currentQuestionIndex].id]: category });
      const counts = categories.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      let maxCount = 0;
      let dominant = "future"; // default
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
        // Store emotional offer right before showing result
        if (dominantCategory === "future") {
            setEmotionalOffer({
               title: "عشان تفك اشتباك المستقبل",
               message: "إنت محتاج خطوتك لبكرة بس، مش خطة لـ 10 سنين قدام. استخدم الخطة الشخصية بـ 9$ عشاب توضح الرؤية ومتتعلّقش في التفكير.",
               discountPercentage: 0,
               urgencyLevel: "high"
            });
        } else if (dominantCategory === "progress") {
             setEmotionalOffer({
               title: "عشان تبطل جلد ذات",
               message: "المقارنات هي اللي بتوقفك مش الكسل. افتح الخريطة الشخصية بـ 9$ عشان تشوف إنجازك إنت، بعيد عن دوشة السوشيال ميديا.",
               discountPercentage: 0,
               urgencyLevel: "high"
            });
        } else {
             setEmotionalOffer({
               title: "عشان تنظف دوائرك",
               message: "في حد بيسحب طاقتك وإنت مش واخد بالك أو بتساير. ابدأ خطتك بـ 9$ وارسم دوائرك عشان تعرف مين بيشحنك ومين بيستنزفك.",
               discountPercentage: 0,
               urgencyLevel: "high"
            });
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, dominantCategory]);

  const getResultContent = () => {
    switch (dominantCategory) {
      case "future":
        return {
          title: "إنت مش يائس، إنت غرقان في بكرة",
          message: "تحليلات المشكلة: عقلك شغال بأقصى طاقة عشان يرسم كل السيناريوهات السيئة للمستقبل. ده مش معناه إنك فاشل، ده معناه إن مخك بيحاول يحميك بطريقة غلط بتخليك متشُل.",
          action: "اكتشف خطوتك الصغيرة بكرة",
          icon: <Target className="h-10 w-10 text-emerald-400" />
        };
      case "progress":
        return {
          title: "إنت مش كسول، إنت بتحارب وهم المقارنة",
          message: "تحليل المشكلة: إنت رابط قيمتك بسرعة نجاح اللي حواليك. كل مرة بتشرد فيها على السوشيال ميديا، بتجلد ذاتك أكتر وبتقول 'أنا متأخر'. الحقيقة إنت واقف في مكانك عشان بتبص لورا.",
          action: "ارسم مسارك إنت، مش مسارهم",
          icon: <Loader2 className="h-10 w-10 text-amber-400" /> // Using Loader2 as a placeholder for 'waiting/progress'
        };
      case "relationships":
        return {
          title: "طاقتك مسروقة، مش خلصانة",
          message: "تحليل المشكلة: المشكلة مش إنك معندكش طاقة تشتغل أو تبني مستقبلك. المشكلة إن فيه علاقة (ممكن تكون قريبة جداً) بتسحب كهربتك أول بأول عشان تراضيها أو تسايرها.",
          action: "حدد مين بيستنزفك النهارده",
          icon: <AlertCircle className="h-10 w-10 text-red-400" />
        };
      default:
         return {
          title: "عقلك زحمة محتاج ترتيب",
          message: "جزء كبير من طاقتك رايح في التفكير مش في الفعل. خلينا نحدد إيه أولوية حرق الأعصاب دي.",
          action: "فك الزحمة دي الأول",
          icon: <BrainCircuit className="h-10 w-10 text-blue-400" />
        };
    }
  };


  return (
    <div className="relative mx-auto mt-8 w-full max-w-lg overflow-hidden rounded-3xl border border-gray-800 bg-[#0a0a0a] shadow-2xl" id="simulation" dir="rtl">
      
      {/* Dynamic Background Glow based on Step */}
      <div className={`absolute -inset-20 opacity-20 blur-3xl transition-colors duration-1000 ${
            step === 'analyzing' ? 'bg-indigo-500 animate-pulse' : 
            step === 'result' ? (dominantCategory === 'future' ? 'bg-emerald-500' : dominantCategory === 'progress' ? 'bg-amber-500' : 'bg-red-500') : 
            'bg-[var(--soft-teal)]'
        }`} />

      <div className="relative z-10 min-h-[400px] p-8 sm:p-10 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Intro */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex rounded-full bg-white/5 p-4 text-[var(--soft-teal)] shadow-inner border border-white/10">
                <BrainCircuit className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white leading-tight">عقلك زحمة ومشوش؟</h3>
              <p className="mb-8 text-[15px] leading-relaxed text-gray-400">
                مش لازم تبقى فاهم كل حاجة دلوقتي. جاوب على 3 أسئلة بسرعة وبدون تفكير، وخلينا نكتشف <span className="text-white font-semibold border-b border-[var(--soft-teal)]/50 pb-0.5">الحاجة الحقيقية</span> اللي سارقة طاقتك وموقفاك.
              </p>
              <button
                onClick={handleStart}
                className="group w-full rounded-2xl bg-white px-6 py-4 text-[16px] font-bold text-black transition-all hover:bg-gray-100 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                فك الزحمة دي في دقيقتين
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Questions */}
          {step === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col h-full justify-between"
            >
              <div>
                 <div className="mb-8 flex items-center gap-2">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${idx <= currentQuestionIndex ? 'bg-[var(--soft-teal)]' : 'bg-white/10'}`} />
                    ))}
                 </div>
                 <h3 className="mb-8 text-xl font-bold text-white leading-relaxed">
                   {QUESTIONS[currentQuestionIndex].text}
                 </h3>
              </div>
              
              <div className="space-y-3">
                {QUESTIONS[currentQuestionIndex].options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id, option.category)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-right text-[15px] text-gray-300 transition-all hover:bg-white/10 hover:border-[var(--soft-teal)]/50 hover:text-white active:scale-[0.98]"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Analyzing */}
          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-10"
            >
              <Loader2 className="mb-6 h-12 w-12 animate-spin text-indigo-400" />
              <h3 className="text-lg font-bold text-white mb-2">بنحلل نمط تفكيرك...</h3>
              <p className="text-sm text-gray-400">بنربط إجاباتك ببعض عشان نوصّل للنقطة العميا</p>
            </motion.div>
          )}

          {/* STEP 4: Result (Aha Moment) */}
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mb-6 inline-flex rounded-full bg-white/5 p-4 border border-white/10 shadow-lg">
                 {getResultContent()?.icon}
              </div>
              
              <h3 className="mb-4 text-2xl font-bold leading-tight text-white px-2">
                {getResultContent()?.title}
              </h3>
              
              <div className="mb-8 rounded-2xl bg-white/5 border border-white/10 p-5 text-right relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-white/30 to-transparent" />
                <p className="text-[15px] leading-relaxed text-gray-300">
                  {getResultContent()?.message}
                </p>
              </div>

              <div className="space-y-4">
                 <button
                    onClick={() => window.location.href = '/pricing'}
                    className="group relative w-full overflow-hidden rounded-2xl bg-white px-6 py-4 text-[16px] font-bold text-black transition-transform hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    <div className="relative flex justify-center items-center gap-2 z-10">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        {getResultContent()?.action} (9$ شهرياً)
                    </div>
                  </button>
                  <p className="text-xs text-gray-500">
                      ابشر، الإلغاء بضغطة زر لو حسيت إنها مش مفيدة.
                  </p>
              </div>
              
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </div>
  );
}
