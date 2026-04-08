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
  Activity,
  Compass,
  Radar
} from "lucide-react";
import html2canvas from "html2canvas";
import { trackEvent, trackPageView } from "../../src/services/analytics";
import { captureUtmFromCurrentUrl, captureLeadAttributionFromCurrentUrl } from "../../src/services/marketingAttribution";

/* ═══════════════════════════════════════════════════════════════════════
   Tactical Types & Constants
   ═══════════════════════════════════════════════════════════════════════ */

interface WeatherQuestion {
  id: string;
  text: string;
  terminalSubText: string;
  options: { id: string; text: string; weight: number; zone: "family" | "friends" | "work" | "partner" | "mixed" }[];
}

interface WeatherResult {
  weatherLevel: "hurricane" | "storm" | "wind" | "cloud" | "sun";
  overallHeadline: string;
  dominantSource: string;
  behavioralExplanation: string;
  energyLevel: number;
  shareText: string;
  stormZonesCount: number;
  dominantZoneId: string;
}

const QUESTIONS: WeatherQuestion[] = [
  {
    id: "q1",
    text: "بتخرج من القاعدة (يومك) حاسس إن طاقتك 'منهوبة' ولا مجرد 'تعبانة'؟",
    terminalSubText: "Scanning energy leakage patterns...",
    options: [
      { id: "q1a", text: "تعب طبيعي، بنام وأصحى فايق", weight: 0, zone: "mixed" },
      { id: "q1b", text: "تعب ذهني، بفكر كتير في اللي حصل", weight: 45, zone: "mixed" },
      { id: "q1c", text: "منهوبة تماماً، كأني كنت في معركة خسرانها", weight: 90, zone: "mixed" },
    ],
  },
  {
    id: "q2",
    text: "إيه السحابة اللي مضللة على حياتك والأغلب بيطلع منها البرق؟",
    terminalSubText: "Detecting dominant atmospheric disturbance...",
    options: [
      { id: "q2a", text: "منطقة العمل (ضغط مهني وسحب طاقة)", weight: 65, zone: "work" },
      { id: "q2b", text: "الدائرة القريبة (أهل/شريك/أصدقاء)", weight: 75, zone: "partner" },
      { id: "q2c", text: "مش عارف، الدنيا كلها غيوم دلوقتي", weight: 85, zone: "mixed" },
    ],
  },
  {
    id: "q3",
    text: "لو النظام سألك: إيه اللي فاتح الثغرات في حدودك الدفاعية؟",
    terminalSubText: "Identifying boundary vulnerability...",
    options: [
      { id: "q3_a", text: "العطاء الزيادة بنية 'الجدعنة'", weight: 85, zone: "mixed" },
      { id: "q3_b", text: "الخوف من الرفض عشان محرجش حد", weight: 80, zone: "mixed" },
      { id: "q3_c", text: "فترة ضغط مؤقتة وهتعدي لوحدها", weight: 20, zone: "mixed" },
    ],
  },
];

const LEVEL_PALETTE: Record<WeatherResult["weatherLevel"], { color: string; glow: string; label: string; bg: string }> = {
  hurricane: { color: "#f43f5e", glow: "rgba(244,63,94,0.4)", label: "إعصار مدمر", bg: "rgba(244,63,94,0.1)" },
  storm: { color: "#fb7185", glow: "rgba(251,113,133,0.3)", label: "عاصفة مستمرة", bg: "rgba(251,113,133,0.08)" },
  wind: { color: "#fbbf24", glow: "rgba(251,191,36,0.25)", label: "رياح استنزاف", bg: "rgba(251,191,36,0.07)" },
  cloud: { color: "#2dd4bf", glow: "rgba(45,212,191,0.2)", label: "غيوم متقطعة", bg: "rgba(45,212,191,0.06)" },
  sun: { color: "#10b981", glow: "rgba(16,185,129,0.2)", label: "أجواء صحوة", bg: "rgba(16,185,129,0.05)" },
};

/* ═══════════════════════════════════════════════════════════════════════
   Logic Engine
   ═══════════════════════════════════════════════════════════════════════ */

function deriveResult(answers: Record<string, { weight: number; zone: string }>): WeatherResult {
  let totalWeight = 0;
  let dominantZoneId = "mixed";
  let maxWeight = -1;

  Object.entries(answers).forEach(([_, val]) => {
    totalWeight += val.weight;
    if (val.weight > maxWeight && val.zone !== "mixed") {
      maxWeight = val.weight;
      dominantZoneId = val.zone;
    }
  });

  const avg = totalWeight / QUESTIONS.length;
  let level: WeatherResult["weatherLevel"] = "sun";
  let headline = "أجواء صحوة";

  if (avg >= 75) { level = "hurricane"; headline = "إعصار مدمر للطاقة"; }
  else if (avg >= 55) { level = "storm"; headline = "عاصفة استنزافية"; }
  else if (avg >= 35) { level = "wind"; headline = "رياح ضغط خفية"; }
  else if (avg >= 15) { level = "cloud"; headline = "غيوم متفرقة"; }

  const explanation = avg >= 70 ? "أنت في حالة دفاع مستمر بتسحب كل قدرتك على التفكير الإبداعي." : "هناك ثغرات بسيطة في حدودك تسمح بمرور رياح الإرهاق.";
  
  return {
    weatherLevel: level,
    overallHeadline: headline,
    dominantSource: dominantZoneId === "work" ? "بيئة العمل" : dominantZoneId === "partner" ? "الدوائر المقربة" : "خليط من الجبهات",
    behavioralExplanation: explanation,
    energyLevel: Math.max(1, Math.min(10, Math.round(10 - (avg / 10)))),
    shareText: `🌦️ تقرير طقس علاقاتي: ${headline} | السيادة: ${dominantZoneId}`,
    stormZonesCount: avg >= 50 ? 1 : 0,
    dominantZoneId
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   Styles & Animations
   ═══════════════════════════════════════════════════════════════════════ */

const WEATHER_UI_STYLES = `
  .tactical-bg {
    background: radial-gradient(circle at center, #0a0e1f 0%, #020408 100%);
    position: fixed;
    inset: 0;
    overflow: hidden;
  }
  .hud-grid {
    background-image: 
      linear-gradient(rgba(45, 212, 191, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(45, 212, 191, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    position: absolute;
    inset: -100px;
    transform: perspective(1000px) rotateX(60deg) translateY(-100px);
    opacity: 0.3;
  }
  .scan-line {
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--ds-color-primary), transparent);
    position: absolute;
    top: 50%;
    left: 0;
    z-index: 20;
    animation: scanning 4s ease-in-out infinite;
    box-shadow: 0 0 20px var(--ds-color-primary-glow);
  }
  @keyframes scanning {
    0% { top: 0%; opacity: 0; }
    50% { opacity: 0.8; }
    100% { top: 100%; opacity: 0; }
  }
  .terminal-loading {
     overflow: hidden;
     border-right: .15em solid orange;
     white-space: nowrap;
     margin: 0 auto;
     letter-spacing: .15em;
     animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
  }
  @keyframes typing { from { width: 0 } to { width: 100% } }
  @keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: var(--ds-color-primary) } }
`;

/* ═══════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function WeatherForecastClient() {
  const [step, setStep] = useState<"intro" | "questions" | "analyzing" | "result">("intro");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { weight: number; zone: string }>>({});
  const [result, setResult] = useState<WeatherResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Lifecycle Tracking
  useEffect(() => {
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();
    trackPageView("weather_tactical_hud");
  }, []);

  const handleStart = useCallback(() => {
    setStep("questions");
    trackEvent("weather_scan_initiated");
  }, []);

  const handleAnswer = useCallback((weight: number, zone: string) => {
    const updatedAnswers = { ...answers, [QUESTIONS[qIdx].id]: { weight, zone } };
    setAnswers(updatedAnswers);
    
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      setStep("analyzing");
      setTimeout(() => {
        setResult(deriveResult(updatedAnswers));
        setStep("result");
      }, 3000);
    }
  }, [answers, qIdx]);

  const handleShare = useCallback(async () => {
    if (!result || !resultRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(resultRef.current, { backgroundColor: "#060A16", scale: 2 });
      canvas.toBlob(async (blob) => {
        setIsCapturing(false);
        if (!blob) return;
        const file = new File([blob], "diagnostic-weather.png", { type: "image/png" });
        if (navigator.share) {
          await navigator.share({ files: [file], title: "تقرير طقس العلاقات", text: result.shareText });
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url; link.download = "weather-report.png";
          link.click();
        }
      });
    } catch (e) { setIsCapturing(false); }
  }, [result, isCapturing]);

  const handleCTA = useCallback(() => {
    if (typeof window !== "undefined" && result) {
      window.sessionStorage.setItem('weather_context', JSON.stringify(result));
      window.location.assign("/dawayir?surface=weather-funnel");
    }
  }, [result]);

  return (
    <div className="weather-page min-h-screen relative text-white overflow-hidden" dir="rtl">
      <style>{WEATHER_UI_STYLES}</style>

      {/* L1: The Deep Void & Atmosphere */}
      <div className="tactical-bg" />
      <div className="hud-grid" />
      <div className="tactical-crt-overlay opacity-20 pointer-events-none" />
      <div className="radar-sweep pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen">
        <AnimatePresence mode="wait">
          
          {/* ────── INTRO ────── */}
          {step === "intro" && (
            <motion.div 
              key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="text-center w-full max-w-2xl"
            >
              <div className="mb-12 relative flex justify-center">
                 <div className="absolute inset-0 bg-teal-500/10 blur-[80px] rounded-full scale-110 animate-pulse" />
                 <div className="relative z-10 w-48 h-48 sm:w-64 sm:h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                       <motion.circle cx="100" cy="100" r="90" fill="none" stroke="rgba(45,212,191,0.1)" strokeWidth="1" strokeDasharray="10 5" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} />
                       <motion.circle cx="100" cy="100" r="70" fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="2" strokeDasharray="40 10" animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
                       <circle cx="100" cy="100" r="45" fill="rgba(8, 14, 30, 0.9)" stroke="rgba(45,212,191,0.6)" strokeWidth="2" />
                       <motion.path d="M100 65 V135 M65 100 H135" stroke="rgba(45,212,191,0.8)" strokeWidth="2" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} />
                       <motion.circle cx="100" cy="100" r="30" fill="none" stroke="white" strokeWidth="0.5" animate={{ r: [30, 100], opacity: [0.3, 0] }} transition={{ duration: 2.5, repeat: Infinity }} />
                    </svg>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border border-teal-500/20 bg-teal-500/5 terminal-text text-[9px] font-bold tracking-[0.2em] text-teal-400">
                  <span className="w-1 h-1 bg-teal-400 rounded-full animate-pulse" />
                  SOVEREIGN_WEATHER_RADAR_ACTIVE
                </div>
                <h1 className="text-5xl sm:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                  طقس الـعـلاقـات
                </h1>
                <p className="text-gray-400 text-lg sm:text-xl font-medium max-w-[32ch] mx-auto leading-relaxed opacity-80">
                  مستعد لرصد "التحولات المناخية" في جبهتك الداخلية؟ التحليل يبدأ من معطياتك الشخصية.
                </p>
                <div className="pt-8">
                  <motion.button 
                    onClick={handleStart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-6 rounded-sm bg-teal-500 text-black font-black text-xl tracking-[0.05em] uppercase shadow-[0_20px_60px_-15px_rgba(45,212,191,0.5)] transition-all"
                  >
                    بدء المسح التكتيكي
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ────── QUESTIONS ────── */}
          {step === "questions" && (
            <motion.div 
               key={`q-${qIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
               className="w-full max-w-xl"
            >
               <div className="mb-12 flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="terminal-text text-[10px] text-teal-500 font-bold uppercase tracking-widest">Diagnostic Step {qIdx + 1}/3</p>
                     <p className="text-gray-500 text-[11px] terminal-text">{QUESTIONS[qIdx].terminalSubText}</p>
                  </div>
                  <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                     <motion.div className="h-full bg-teal-500" initial={{ width: 0 }} animate={{ width: `${(qIdx + 1) * 33}%` }} />
                  </div>
               </div>

               <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-10 leading-[1.2]">
                  {QUESTIONS[qIdx].text}
               </h2>

               <div className="space-y-4">
                  {QUESTIONS[qIdx].options.map((opt) => (
                    <motion.button
                      key={opt.id} onClick={() => handleAnswer(opt.weight, opt.zone)}
                      whileHover={{ scale: 1.01, background: "rgba(45,212,191,0.1)", borderColor: "rgba(45,212,191,0.4)" }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full text-right p-6 rounded-sm border border-white/10 bg-white/[0.02] text-slate-200 font-bold transition-all text-lg flex items-center justify-between"
                    >
                      <span>{opt.text}</span>
                      <Compass className="w-4 h-4 opacity-20" />
                    </motion.button>
                  ))}
               </div>
            </motion.div>
          )}

          {/* ────── ANALYZING ────── */}
          {step === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
               <div className="scan-line" />
               <div className="mb-12 relative inline-block">
                  <motion.div 
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
                    className="w-32 h-32 border-4 border-dashed border-teal-500/30 rounded-full flex items-center justify-center"
                  >
                     <Radar className="w-12 h-12 text-teal-500 animate-pulse" />
                  </motion.div>
               </div>
               <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white italic tracking-widest uppercase">Analyzing Telemetry...</h3>
                  <p className="terminal-loading terminal-text text-teal-400 text-sm">Cross-referencing behavioral patterns with boundary sovereignty data...</p>
               </div>
            </motion.div>
          )}

          {/* ────── RESULT ────── */}
          {step === "result" && result && (
            <motion.div 
              key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg"
            >
              <div 
                ref={resultRef}
                className="relative rounded-sm border p-8 bg-[#060A16] shadow-2xl overflow-hidden"
                style={{ borderColor: LEVEL_PALETTE[result.weatherLevel].color + '40', boxShadow: `0 30px 100px -20px ${LEVEL_PALETTE[result.weatherLevel].glow}` }}
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-24 h-24" /></div>
                 
                 <div className="mb-10 flex justify-between items-start border-b border-white/5 pb-6">
                    <div>
                       <p className="terminal-text text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Current Sovereign State</p>
                       <h2 className="text-3xl font-black" style={{ color: LEVEL_PALETTE[result.weatherLevel].color }}>{result.overallHeadline}</h2>
                    </div>
                    <div className="text-right">
                       <p className="terminal-text text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Energy Ratio</p>
                       <p className="text-2xl font-black text-white">{result.energyLevel}/10</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                          <Compass className="w-4 h-4" style={{ color: LEVEL_PALETTE[result.weatherLevel].color }}/>
                          <p className="terminal-text text-[10px] text-gray-400 font-bold uppercase">Disturbance Source</p>
                       </div>
                       <p className="text-xl font-bold text-slate-100">{result.dominantSource}</p>
                    </div>

                    <div className="p-4 rounded-sm" style={{ background: LEVEL_PALETTE[result.weatherLevel].bg }}>
                       <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-white" />
                          <p className="terminal-text text-[10px] text-white font-bold uppercase opacity-60">Sovereignty Assessment</p>
                       </div>
                       <p className="text-lg font-medium text-white leading-relaxed italic">"{result.behavioralExplanation}"</p>
                    </div>
                 </div>

                 <div className="mt-12 flex justify-between items-center opacity-30 pt-4 border-t border-white/5 terminal-text text-[8px] font-bold">
                    <span>ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    <span>VERIFIED BY ALREHLA SYSTEMS</span>
                 </div>
              </div>

              <div className="mt-8 space-y-4">
                 <motion.button 
                    onClick={handleCTA} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-6 rounded-sm bg-white text-black font-black text-xl hover:bg-slate-200 transition-colors"
                 >
                    تصميم مسار السيادة الكامل
                 </motion.button>
                 <button 
                    onClick={handleShare} disabled={isCapturing}
                    className="w-full py-4 text-[12px] font-black uppercase tracking-[0.2em] text-teal-400 border border-teal-500/20 hover:bg-teal-500/5 transition-all"
                 >
                    {isCapturing ? "Screengrab in progress..." : "Export diagnostic report 📸"}
                 </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
