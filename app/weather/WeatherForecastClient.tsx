"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudLightning,
  Wind,
  Sun,
  ArrowLeft,
  Zap,
  Shield,
} from "lucide-react";
import html2canvas from "html2canvas";
import { trackEvent, trackPageView } from "../../src/services/analytics";
import { captureUtmFromCurrentUrl, captureLeadAttributionFromCurrentUrl } from "../../src/services/marketingAttribution";

/* ═══════════════════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════════════════ */

interface WeatherQuestion {
  id: string;
  text: string;
  options: { id: string; text: string; weight: number; zone: "family" | "friends" | "work" | "partner" | "mixed" }[];
}

interface WeatherResult {
  weatherLevel: "hurricane" | "storm" | "wind" | "cloud" | "sun";
  overallHeadline: string;
  dominantSource: string;
  behavioralExplanation: string;
  energyLevel: number;
  shareText: string;
  // Raw metrics for UI mapping
  stormZonesCount: number;
  dominantZoneId: string;
}

const QUESTIONS: WeatherQuestion[] = [
  {
    id: "q1",
    text: "بتدخل مكان أو بتكلم شخص معين.. ولما تقفل معاه/تخرج بتلاقي نفسك مفصول تماماً؟",
    options: [
      { id: "q1a", text: "لأ خالص، الأمور مستقرة وبخرج بطاقة عادية", weight: 0, zone: "mixed" },
      { id: "q1b", text: "أحياناً بيحصل.. بس بقنع نفسي إن ده إرهاق طبيعي", weight: 40, zone: "mixed" },
      { id: "q1c", text: "أيوة جداً! بحتاج أنام أو أفصل عشان أسترد روحي", weight: 80, zone: "mixed" },
    ],
  },
  {
    id: "q2",
    text: "لو ركزت لحظة.. مصدر الدوامة اللي بتسحب مجهودك الأكبر دلوقتي هو إيه؟",
    options: [
      { id: "q2a", text: "الشغل (بدي ١٠٠٪ وبدون تقدير أو عائد عاطفي)", weight: 60, zone: "work" },
      { id: "q2b", text: "علاقات شخصية (دور المنقذ مع أهل/صديق/شريك)", weight: 70, zone: "partner" },
      { id: "q2c", text: "مزيج خانق بين الإتنين أو مش عارف أحدد بالضبط", weight: 80, zone: "mixed" },
    ],
  },
  {
    id: "q3",
    text: "إيه النمط اللي دايماً بتلاقيه متكرر في استنزافك؟",
    options: [
      { id: "q3_a", text: "العطاء المفتوح: بدي قبل ما أتأكد إن الطرف التاني بيقدر", weight: 85, zone: "mixed" },
      { id: "q3_b", text: "صعوبة الرفض: مبعرفش أقول (لا) عشان مبانش مقصر", weight: 75, zone: "mixed" },
      { id: "q3_c", text: "العلاقة متوزنة عموماً بس بمر بفترة ضغط عابرة", weight: 20, zone: "mixed" },
    ],
  },
];

const DOMINANT_SOURCES: Record<string, string> = {
  family: "الأهل",
  friends: "الأصدقاء / المعارف",
  work: "بيئة العمل",
  partner: "شريك عاطفي",
  mixed: "خليط متعارض (أكثر من مصدر)",
};

/* ═══════════════════════════════════════════════════════════════════════
   Logic
   ═══════════════════════════════════════════════════════════════════════ */

function deriveResult(answers: Record<string, { weight: number; zone: string }>): WeatherResult {
  let totalWeight = 0;
  let dominantScore = -1;
  let dominantZoneId = "mixed";
  
  for (const ans of Object.values(answers)) {
    totalWeight += ans.weight;
    if (ans.weight >= dominantScore && ans.zone !== "mixed") {
      dominantScore = ans.weight;
      dominantZoneId = ans.zone;
    }
  }
  
  // If no obvious dominant zone but high weights, logic infers a mix or specific Q interactions
  if (answers["q2"] && answers["q2"].zone !== "mixed") {
    dominantZoneId = answers["q2"].zone; // User explicitly selected a source in Q2
  } else if (dominantZoneId === "mixed" && answers["q2"]?.weight >= 70) {
    dominantZoneId = "mixed";
  }

  // Calculate Level based on average impact severity
  const avg = totalWeight / 3;
  let weatherLevel: WeatherResult["weatherLevel"] = "sun";
  let overallHeadline = "أجواء صحوة";
  
  if (avg >= 75) {
    weatherLevel = "hurricane";
    overallHeadline = "إعصار مدمر للطاقة";
  } else if (avg >= 55) {
    weatherLevel = "storm";
    overallHeadline = "عاصفة مستمرة";
  } else if (avg >= 35) {
    weatherLevel = "wind";
    overallHeadline = "رياح استنزاف خفية";
  } else if (avg >= 15) {
    weatherLevel = "cloud";
    overallHeadline = "غيوم متقطعة";
  } else {
    weatherLevel = "sun";
    overallHeadline = "أجواء صحوة";
  }

  // Behavioral Logic Extraction
  let behavioralExplanation = "الاستنزاف عندك مش من المجهود، غالباً من العطاء في المكان الغلط بلا مردود.";
  if (answers["q3"]?.weight === 85) {
    behavioralExplanation = "أنت بتدي قبل ما تتأكد إن الطرف يستحق، وده بيغلف الاستنزاف باسم 'الواجب'.";
  } else if (answers["q3"]?.weight === 75) {
    behavioralExplanation = "صعوبة قول (لا) هي الفتحة الأساسية اللي بتتسحب منها طاقتك بشكل يومي.";
  } else if (answers["q1"]?.weight === 80) {
    behavioralExplanation = "أنت مش بتفصل.. حتى مساحتك الآمنة بقت بتمثل ضغط أو ثقل عليك.";
  }

  const dominantSource = DOMINANT_SOURCES[dominantZoneId] || "خليط من الدوائر";
  const energyLevel = Math.max(1, Math.min(10, Math.round(10 - (avg / 10))));

  const shareText = `🌦️ نشرة طقس علاقاتي:
الحالة: ${overallHeadline}
المصدر الأغلب: ${dominantSource}
النمط: ${behavioralExplanation}

اختبر طقسك على: 
https://www.alrehla.app/weather`;

  return { 
    weatherLevel,
    overallHeadline,
    dominantSource,
    behavioralExplanation,
    energyLevel,
    shareText,
    stormZonesCount: avg >= 50 ? 1 : 0,
    dominantZoneId
  };
}
const LEVEL_PALETTE: Record<WeatherResult["weatherLevel"], { bg: string; border: string; glow: string; text: string; icon: typeof CloudLightning; label: string }> = {
  hurricane: { bg: "rgba(225,29,72,0.1)", border: "rgba(225,29,72,0.3)", glow: "rgba(225,29,72,0.2)", text: "#f43f5e", icon: CloudLightning, label: "إعصار مدمر" },
  storm: { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", glow: "rgba(244,63,94,0.15)", text: "#fda4af", icon: CloudLightning, label: "عاصفة مستمرة" },
  wind: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.15)", text: "#fcd34d", icon: Wind, label: "رياح استنزاف" },
  cloud: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", glow: "rgba(16,185,129,0.15)", text: "#6ee7b7", icon: Sun, label: "غيوم متقطعة" },
  sun: { bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.25)", glow: "rgba(20,184,166,0.15)", text: "#5eead4", icon: Sun, label: "أجواء صحوة" },
};

/* ═══════════════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════════════ */

const WEATHER_STYLES = `
  .weather-page {
    --void: #020408;
    --glass: rgba(8, 12, 22, 0.80);
    --glass-border: rgba(255,255,255,0.09);
    --teal: #14b8a6;
    --storm-color: #f43f5e;
    --windy-color: #f59e0b;
    --clear-color: #10b981;
    font-family: 'IBM Plex Sans Arabic', 'Tajawal', sans-serif;
    color-scheme: dark;
  }
  .weather-page * { box-sizing: border-box; }

  @keyframes wf-orb1 {
    0%   { transform: translate(0%, 0%)   scale(1);    }
    50%  { transform: translate(-5%, 8%)  scale(1.1);  }
    100% { transform: translate(4%, -4%)  scale(0.92); }
  }
  @keyframes wf-orb2 {
    0%   { transform: translate(0%, 0%)    scale(1);    }
    50%  { transform: translate(7%, -9%)  scale(1.07); }
    100% { transform: translate(-4%, 5%)  scale(0.96); }
  }
  @keyframes wf-orb3 {
    0%   { transform: translate(0%, 0%)  scale(1);    }
    100% { transform: translate(4%, -7%) scale(1.14); }
  }
`;

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function WeatherForecastClient() {
  const [step, setStep] = useState<"intro" | "questions" | "analyzing" | "result">("intro");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { weight: number; zone: string }>>({});
  const [result, setResult] = useState<WeatherResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  // Capture UTM + track page view on mount
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();
    trackPageView("weather_forecast_v2");
    trackEvent("weather_landing_view", { tool: "relationship_weather_v2" });
  }, []);

  const handleStart = useCallback(() => {
    setStep("questions");
    trackEvent("weather_start_clicked", { tool: "relationship_weather_v2" });
  }, []);

  useEffect(() => {
    if (step === "questions") {
       trackEvent(`weather_q${qIdx + 1}_view`);
    } else if (step === "result" && result) {
       trackEvent("weather_result_view", {
         weather_level: result.weatherLevel,
         dominant_source: result.dominantSource,
       });
    }
  }, [step, qIdx, result]);

  const handleAnswer = useCallback(
    (weight: number, zone: string) => {
      const updated = { ...answers, [QUESTIONS[qIdx].id]: { weight, zone } };
      setAnswers(updated);

      trackEvent(`weather_q${qIdx + 1}_answered`, {
         zone,
         weight,
      });

      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
      } else {
        setStep("analyzing");
        setTimeout(() => {
          const derivedResult = deriveResult(updated);
          setResult(derivedResult);
          setStep("result");
        }, 2200); // Shorter analysis time for less friction
      }
    },
    [answers, qIdx]
  );

  const [isCapturing, setIsCapturing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!result || !resultRef.current || isCapturing) return;
    
    setIsCapturing(true);
    trackEvent("weather_share_clicked", {
      weather_level: result.weatherLevel,
      method: "image_share",
    });
    
    try {
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#060A16",
        scale: 2,
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        setIsCapturing(false);
        if (!blob) return;
        
        const file = new File([blob], "alrehla-weather.png", { type: "image/png" });
        const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function" && navigator.canShare && navigator.canShare({ files: [file] });
        
        if (canNativeShare) {
          try {
            await navigator.share({
              files: [file],
              title: "نشرة طقس العلاقات",
              text: result.shareText,
            });
            trackEvent("weather_share_completed", { method: "native_image_share" });
          } catch {
            console.error("Native share failed or user cancelled");
          }
        } else {
            // Fallback: Download the image and copy text
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "alrehla-weather.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            try {
              await navigator.clipboard.writeText(result.shareText);
              alert("تم تحميل الصورة ونسخ التقرير عشان تشاركه براحتك 📸");
            } catch {
              alert("تم تحميل الصورة بنجاح! 📸");
            }
            trackEvent("weather_share_completed", { method: "download_fallback" });
        }
      }, "image/png");
      
    } catch (error) {
       console.error("Failed to generate image", error);
       setIsCapturing(false);
       trackEvent("weather_share_failed", { reason: "html2canvas_error" });
    }

  }, [result, isCapturing]);

  const handleCTA = useCallback(() => {
    trackEvent("weather_onboarding_clicked", {
      weather_level: result?.weatherLevel,
      destination: "dawayir_ai",
    });
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem('weather_context', JSON.stringify(result));
      window.location.assign("/dawayir?surface=weather-funnel&utm_source=weather_tool_v2&utm_medium=organic&utm_campaign=viral_weather_v2");
    }
  }, [result]);

  const handleRestart = useCallback(() => {
    setStep("intro");
    setQIdx(0);
    setAnswers({});
    setResult(null);
  }, []);

  return (
    <div className="weather-page relative min-h-screen w-full overflow-x-hidden" dir="rtl" style={{ background: "var(--void)" }}>
      <style>{WEATHER_STYLES}</style>

      {/* Ambient BG (Unchanged for visual identity) */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.11) 0%, transparent 70%)",
          top: "-15%", right: "-8%", animation: "wf-orb1 38s ease-in-out infinite alternate", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 560, height: 560, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)",
          bottom: "-18%", left: "-10%", animation: "wf-orb2 52s ease-in-out infinite alternate", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.055) 0%, transparent 70%)",
          top: "40%", left: "30%", animation: "wf-orb3 44s ease-in-out infinite alternate", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%)",
          opacity: 0.6, pointerEvents: "none",
        }} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* ─── INTRO ─── */}
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease }} className="text-center"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold tracking-widest uppercase" style={{ borderColor: "rgba(20,184,166,0.25)", background: "rgba(20,184,166,0.07)", color: "#7dd8cf" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  أداة مجانية — تحليل سريع
                </div>
                <div className="mb-6 text-6xl">🌪️</div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ lineHeight: 1.15 }}>
                  نشرة طقس العلاقات
                </h1>
                <p className="text-base text-gray-400 leading-relaxed mb-10 max-w-[36ch] mx-auto">
                  اعرف في أقل من دقيقة: هل اللي تعبك <span className="text-white font-semibold">"ضغط عابر"</span> ولا <span className="text-[#f43f5e] font-semibold">"استنزاف مستمر"؟</span>
                </p>

                <motion.button
                  type="button" onClick={handleStart} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="group w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-lg text-white"
                  style={{ background: "linear-gradient(135deg, #14B8A6, #0d9488)", boxShadow: "0 14px 42px rgba(20,184,166,0.3)" }}
                >
                  <Zap className="w-5 h-5 opacity-80" />
                  ابدأ الرصد الآن
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                </motion.button>
              </motion.div>
            )}

            {/* ─── QUESTIONS ─── */}
            {step === "questions" && (
              <motion.div
                key={`q-${qIdx}`}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease }}
              >
                <div className="flex gap-2 mb-8">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-colors duration-500" style={{ background: i <= qIdx ? "var(--teal)" : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
                <p className="text-[11px] font-bold text-teal-400 tracking-widest uppercase mb-3">
                  سؤال {qIdx + 1} لكشف الاستنزاف
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed mb-8">
                  {QUESTIONS[qIdx].text}
                </h2>
                <div className="space-y-3">
                  {QUESTIONS[qIdx].options.map((opt) => (
                    <motion.button
                      key={opt.id} type="button" onClick={() => handleAnswer(opt.weight, opt.zone)}
                      whileHover={{ scale: 1.01, borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-2xl border p-5 text-right text-[15px] text-gray-200 transition-colors font-semibold"
                      style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}
                    >
                      {opt.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── ANALYZING ─── */}
            {step === "analyzing" && (
              <motion.div
                key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="inline-block mb-6 text-5xl">
                  ⭕
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">بنقرأ النمط السلوكي...</h3>
                <p className="text-sm text-gray-500">جاري تحديد مصدر الدوامة</p>
              </motion.div>
            )}

            {/* ─── RESULT (THE SHARE CARD) ─── */}
            {step === "result" && result && (
              <motion.div
                key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease }}
              >
                {/* 📸 The Native Share Card Element */}
                <div 
                  ref={resultRef}
                  className="relative rounded-3xl border overflow-hidden mb-6 p-6 sm:p-8" 
                  style={{ 
                    borderColor: LEVEL_PALETTE[result.weatherLevel].border, 
                    background: "rgba(8, 12, 22, 0.9)",
                    boxShadow: `0 20px 80px -10px ${LEVEL_PALETTE[result.weatherLevel].glow}`
                  }}
                >
                  <div className="absolute top-0 right-0 w-full h-1" style={{ background: LEVEL_PALETTE[result.weatherLevel].text }} />
                  
                  {/* Layer 1: The Verdict */}
                  <div className="mb-6 pb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">الحالة الحالية للطاقة</p>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{result.weatherLevel === "hurricane" ? "🌪️" : result.weatherLevel === "storm" ? "⛈️" : result.weatherLevel === "wind" ? "🌬️" : "☀️"}</div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">{result.overallHeadline}</h2>
                    </div>
                  </div>

                  {/* Layer 2: The Source */}
                  <div className="mb-6 pb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">المصدر الأساسي للاستنزاف</p>
                    <div className="flex items-center gap-2">
                       <Shield className="w-5 h-5" style={{ color: LEVEL_PALETTE[result.weatherLevel].text }}/>
                       <h3 className="text-lg font-bold text-white">{result.dominantSource}</h3>
                    </div>
                  </div>

                  {/* Layer 3: Behavioral Analysis (The Bite) */}
                  <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">التشخيص السلوكي</p>
                    <p className="text-[15px] sm:text-base leading-relaxed text-gray-300 font-medium">
                      "{result.behavioralExplanation}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between opacity-50 pt-2">
                     <span className="text-[9px] font-bold tracking-widest uppercase text-white">الرحلة | ALREHLA.APP</span>
                     <span className="text-[9px] font-bold text-white">طاقة: {result.energyLevel}/10</span>
                  </div>
                </div>

                {/* Primary CTA: Convert Intent */}
                <div className="space-y-3 mt-4">
                  <motion.button
                    type="button" onClick={handleCTA}
                    whileHover={{ scale: 1.02, boxShadow: "0 18px 50px rgba(124, 58, 237, 0.2)" }}
                    whileTap={{ scale: 0.97 }}
                    className="group w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-black text-white"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #5b21b6)", border: "1px solid rgba(124, 58, 237, 0.3)" }}
                  >
                    <Zap className="w-5 h-5 opacity-80" />
                    صمّم مسارك الداخلي بالكامل
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  </motion.button>

                  <button
                    onClick={handleShare}
                    disabled={isCapturing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest text-slate-800 transition-all active:scale-95"
                    style={{ background: LEVEL_PALETTE[result.weatherLevel].border, boxShadow: `0 0 20px ${LEVEL_PALETTE[result.weatherLevel].glow}` }}
                  >
                    {isCapturing ? "جاري التجهيز..." : "تجهيز السكرين شوت 📸"}
                  </button>
                  
                  <button type="button" onClick={handleRestart} className="w-full mt-4 py-2 text-[11px] font-semibold text-gray-500 hover:text-gray-300">
                     إعادة التحليل ←
                  </button>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
