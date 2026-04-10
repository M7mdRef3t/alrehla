"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Zap, Clock, Heart, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import html2canvas from "html2canvas";
import { trackEvent, trackPageView } from "../../src/services/analytics";
import { captureUtmFromCurrentUrl, captureLeadAttributionFromCurrentUrl } from "../../src/services/marketingAttribution";
import { useAdminState } from "../../src/state/adminState";
import { fetchJourneyPaths } from "../../src/services/adminApi";
import {
  getRelationshipWeatherInitialStage,
  getRelationshipWeatherNextStage,
  getRelationshipWeatherPath,
  getRelationshipWeatherPrimaryLabel,
  getRelationshipWeatherTargetDescription,
  getRelationshipWeatherTargetLabel,
  launchRelationshipWeatherFlow
} from "../../src/utils/relationshipWeatherJourney";

/* ═══════════════════════════════════════════════════════════════════════
   Core Types
   ═══════════════════════════════════════════════════════════════════════ */

type WeatherLevel = "hurricane" | "storm" | "wind" | "sun";
type DrainZone = "work" | "partner" | "family" | "mixed";
type BehaviorPattern = "rescuer" | "guardian" | "responder" | "pleaser";

interface DiagnosticResult {
  weatherLevel: WeatherLevel;
  pattern: BehaviorPattern;
  patternName: string;
  patternDescription: string;
  drainZone: DrainZone;
  drainZoneName: string;
  weeklyHoursCost: number;
  energyScore: number; // 1-10
  coreInsight: string;
  quickActions: [string, string, string];
  mapNodeHint: string;
  shareText: string;
  overallHeadline: string;
  dominantSource: string;
  behavioralExplanation: string;
  energyLevel: number;
  stormZonesCount: number;
  dominantZoneId: string;
}

interface Question {
  id: string;
  text: string;
  subtitle: string;
  type: "single" | "multi";
  options: { id: string; text: string; emoji: string; tags: Record<string, number | string> }[];
}

/* ═══════════════════════════════════════════════════════════════════════
   Questions — Built for insight, not just scoring
   ═══════════════════════════════════════════════════════════════════════ */

const QUESTIONS: Question[] = [
  {
    id: "q_person",
    text: "فكّر في الشخص اللي بيأثر أكتر على طاقتك.. علاقتك بيه إيه؟",
    subtitle: "مش لازم يكون شخص سيء — حتى الناس اللي بنحبها ممكن تستنزفنا",
    type: "single",
    options: [
      { id: "work", text: "زميل أو مدير في الشغل", emoji: "💼", tags: { zone: "work", weight: 60 } },
      { id: "partner", text: "شريك عاطفي أو زوج/زوجة", emoji: "💔", tags: { zone: "partner", weight: 75 } },
      { id: "family", text: "أحد من الأهل (أب، أم، أخ، أخت)", emoji: "🏠", tags: { zone: "family", weight: 70 } },
      { id: "friend", text: "صديق أو شخص من الدائرة المقربة", emoji: "🫂", tags: { zone: "mixed", weight: 55 } },
    ],
  },
  {
    id: "q_demand",
    text: "أكتر حاجة بيطلبها منك (أو بتحس إنه بيتوقعها تلقائياً)؟",
    subtitle: "الاستنزاف الأكتر خطورة هو اللي بيحصل من غير ما حد يطلب",
    type: "single",
    options: [
      { id: "time", text: "وقتك وتواجدك الدائم معاه", emoji: "⏰", tags: { drainType: "time", weight: 70 } },
      { id: "energy", text: "تسمعه وتحمله عاطفياً دايماً", emoji: "🧠", tags: { drainType: "energy", weight: 85 } },
      { id: "decision", text: "ياخد قراراته وآراءه بالاستناد عليك", emoji: "⚖️", tags: { drainType: "decisions", weight: 65 } },
      { id: "rescue", text: "تنقذه أو تحل مشاكله انت", emoji: "🚒", tags: { drainType: "rescue", weight: 90 } },
    ],
  },
  {
    id: "q_feeling",
    text: "لما تفكر فيه أو تتعامل معاه، أكتر حاجة بتحس بيها؟",
    subtitle: "ردود فعلك الداخلية دي مش ضعف — دي بيانات",
    type: "single",
    options: [
      { id: "guilt", text: "ذنب لو ما ساعدتوش", emoji: "😔", tags: { pattern: "rescuer", weight: 85 } },
      { id: "anxiety", text: "قلق من ردة فعله أو زعله", emoji: "😰", tags: { pattern: "pleaser", weight: 80 } },
      { id: "resentment", text: "زهق وضيق بس بكتمه", emoji: "😤", tags: { pattern: "guardian", weight: 75 } },
      { id: "numb", text: "تخدير.. كأني أتعودت وبحون", emoji: "😶", tags: { pattern: "responder", weight: 70 } },
    ],
  },
  {
    id: "q_boundary",
    text: "آخر مرة فكرت تقول 'لأ' أو تحدد حد.. حصل إيه؟",
    subtitle: "ده السؤال الأهم — الإجابة بتكشف الجذر الحقيقي",
    type: "single",
    options: [
      { id: "fear_guilt", text: "ماقدرتش — خفت يتأذى أو يزعل مني", emoji: "😟", tags: { root: "fear_guilt", weight: 90 } },
      { id: "not_worth", text: "قلت في نفسي 'مش بيستاهل الموضوع'", emoji: "🤷", tags: { root: "avoidance", weight: 70 } },
      { id: "said_yes", text: "قلت لأ بفمي وقلت أيوه بأفعالي", emoji: "😅", tags: { root: "compliance", weight: 80 } },
      { id: "spoke", text: "قلت لأ بالفعل.. بس مع توتر كبير", emoji: "💪", tags: { root: "growth", weight: 40 } },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   Behavior Patterns Library
   ═══════════════════════════════════════════════════════════════════════ */

const PATTERNS: Record<BehaviorPattern, { name: string; description: string; icon: string; insight: (zone: string) => string; actions: [string, string, string] }> = {
  rescuer: {
    name: "المنقذ القسري",
    description: "دايماً موجود لحل مشاكل الناس.. لكن في وقت اتنين في الصبح بتتساءل: مين اللي هيجي ينقذني أنا؟",
    icon: "🚒",
    insight: (zone) => `في علاقتك بـ${zone}، أنت مش بس بتساعد — أنت بتدفع "ضريبة وجود" بتقول لنفسك إن وجودك مشروط بفائدتك. وده مش حب، ده خوف متنكر في زي عطاء.`,
    actions: ["قبل ما تساعد أي حد، اسأل نفسك: 'هل طُلب مني ده فعلاً؟'", "مرة واحدة الأسبوع الجاي، قل 'هشوف' بدل 'أيوه' في الحال", "لاحظ: هل بيشكرك ويمشي؟ أم بييجي تاني لما تساعده؟"],
  },
  pleaser: {
    name: "صانع الرضا",
    description: "حياتك كلها تتم في مرآة ردود فعل الناس. لما حد يزعل منك، كأن الأرض اتزلزلت من تحتك.",
    icon: "🪞",
    insight: (zone) => `في علاقتك بـ${zone}، أنت بتدير نفسك حولين سؤال لا شعوري: 'هو مبسوط مني؟' ده بيخليك تتنازل عن تعب وحقوق بشكل تلقائي لأن السلام الزائف أهم من الحقيقة المؤلمة.`,
    actions: ["اكتب: 'لو ما كانش هيزعل، كنت هقول إيه؟' وقولها للمرة الجاية", "لاحظ لو بيستخدم زعله كأداة ضغط عليك", "ابدأ بجملة: 'أنا مش مرتاح لـ...' بدل 'إنت خليتني أحس...'"],
  },
  guardian: {
    name: "الحارس الصامت",
    description: "بتتحمل وتسكت وتزهق بصمت.. وبتبرر لنفسك إن 'الأمور هتتحل'. لكن الاحتقان الداخلي بيصل لحدود.",
    icon: "🛡️",
    insight: (zone) => `في علاقتك بـ${zone}، أنت بتبلع كتير بسبب إحساسك بالمسؤولية أو الخوف من المواجهة. المشكلة إن بلع المشاعر مش بيشيلها — بيخزنها، وعفريتها بيطلع في أوقات تانية.`,
    actions: ["خصص 'دفتر الزعق السري' — اكتب كل ما بتكتمه بدون رقابة", "حدد موضوع واحد صغير وقول رأيك فيه هذا الأسبوع", "اسأل نفسك: 'لو عارف ما هيتعدلش، هقبل أعيش كده؟'"],
  },
  responder: {
    name: "المستجيب التلقائي",
    description: "تعودت لدرجة إنك بتتحرك قبل ما تفكر. طاقتك بتتصرف وانت حتى مش واعي بيها.",
    icon: "⚡",
    insight: (zone) => `في علاقتك بـ${zone}، الاستنزاف مش بيحصل في لحظات لحظات — هو نمط يومي متجذر. جسمك وعقلك تأقلموا على الوضع لدرجة إن التعب بقى 'طبيعي'. وده أخطر أنواع الاستنزاف.`,
    actions: ["لاحظ: قبل ما 'تتحرك' لأي طلب، خد نفس وفكر ٩ ثواني", "حدد ٣ أمور تتعب منها أكتر واكتبها كـ 'حدود واضحة'", "ابدأ تلاحظ متى بتحس بالإرهاق بالضبط — الوعي هو الخطوة الأولى"],
  },
};

const ZONE_NAMES: Record<DrainZone, string> = {
  work: "بيئة الشغل",
  partner: "شريك الحياة",
  family: "الأسرة",
  mixed: "الأصدقاء والمقربين",
};

const LEVEL_CONFIG: Record<WeatherLevel, { color: string; glow: string; bg: string; headline: string; energyBase: number; hoursBase: number }> = {
  hurricane: { color: "#f43f5e", glow: "rgba(244,63,94,0.35)", bg: "rgba(244,63,94,0.08)", headline: "إعصار مستنزف للطاقة", energyBase: 2, hoursBase: 18 },
  storm: { color: "#fb923c", glow: "rgba(251,146,60,0.3)", bg: "rgba(251,146,60,0.07)", headline: "عاصفة استنزافية مستمرة", energyBase: 4, hoursBase: 14 },
  wind: { color: "#facc15", glow: "rgba(250,204,21,0.25)", bg: "rgba(250,204,21,0.06)", headline: "رياح ضغط مستمرة", energyBase: 6, hoursBase: 9 },
  sun: { color: "#10b981", glow: "rgba(16,185,129,0.2)", bg: "rgba(16,185,129,0.05)", headline: "استقرار نسبي", energyBase: 8, hoursBase: 4 },
};

/* ═══════════════════════════════════════════════════════════════════════
   The Diagnostic Engine
   ═══════════════════════════════════════════════════════════════════════ */

function runDiagnostic(answers: Record<string, string>): DiagnosticResult {
  const zone = (answers["q_person"] || "mixed") as DrainZone;
  const demand = answers["q_demand"] || "energy";
  const feeling = answers["q_feeling"] || "numb";
  const boundary = answers["q_boundary"] || "fear_guilt";

  // Derive pattern
  const patternMap: Record<string, BehaviorPattern> = {
    guilt: "rescuer", anxiety: "pleaser", resentment: "guardian", numb: "responder",
  };
  const pattern: BehaviorPattern = patternMap[feeling] || "responder";

  // Derive severity
  const severityMap: Record<string, number> = {
    rescue: 4, energy: 3, time: 2, decision: 1,
    fear_guilt: 4, compliance: 3, avoidance: 2, growth: 0,
    numb: 3, resentment: 2, anxiety: 3, guilt: 3,
  };
  const totalSeverity = (severityMap[demand] || 2) + (severityMap[feeling] || 2) + (severityMap[boundary] || 2);

  let weatherLevel: WeatherLevel = "sun";
  if (totalSeverity >= 9) weatherLevel = "hurricane";
  else if (totalSeverity >= 7) weatherLevel = "storm";
  else if (totalSeverity >= 5) weatherLevel = "wind";

  const cfg = LEVEL_CONFIG[weatherLevel];
  const patternData = PATTERNS[pattern];
  const zoneName = ZONE_NAMES[zone];

  const weeklyHoursCost = cfg.hoursBase + Math.floor(Math.random() * 4);
  const energyScore = cfg.energyBase;

  return {
    weatherLevel,
    pattern,
    patternName: patternData.name,
    patternDescription: patternData.description,
    drainZone: zone,
    drainZoneName: zoneName,
    weeklyHoursCost,
    energyScore,
    coreInsight: patternData.insight(zoneName),
    quickActions: patternData.actions,
    mapNodeHint: `علاقة ${zoneName} — دائرة ضعيفة الحدود`,
    overallHeadline: cfg.headline,
    dominantSource: zoneName,
    behavioralExplanation: patternData.description,
    energyLevel: energyScore,
    shareText: `طقس علاقاتي: ${cfg.headline} | النمط: ${patternData.name} | alrehla.app/weather`,
    stormZonesCount: totalSeverity >= 7 ? 2 : 1,
    dominantZoneId: zone,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   Component Styles
   ═══════════════════════════════════════════════════════════════════════ */

const STYLES = `
  .wf-page {
    --bg: #030711;
    --surface: rgba(255,255,255,0.03);
    --border: rgba(255,255,255,0.08);
    background: var(--bg);
    min-height: 100vh;
    font-family: 'Outfit', 'Tajawal', sans-serif;
    color-scheme: dark;
  }

  .orb-1 {
    position: fixed; top: -20%; right: -10%; width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%);
    pointer-events: none; animation: orb-float 40s ease-in-out infinite alternate;
  }
  .orb-2 {
    position: fixed; bottom: -20%; left: -10%; width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%);
    pointer-events: none; animation: orb-float 55s ease-in-out infinite alternate-reverse;
  }
  @keyframes orb-float {
    from { transform: translate(0,0); }
    to { transform: translate(30px, 20px); }
  }

  .insight-box {
    border-right: 3px solid;
    padding: 1rem 1.25rem;
    border-radius: 0 8px 8px 0;
  }
`;

/* ═══════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function WeatherForecastClient() {
  const [step, setStep] = useState<"intro" | "questions" | "analyzing" | "result">("intro");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const setJourneyPaths = useAdminState((state) => state.setJourneyPaths);
  const weatherPath = useAdminState((state) => {
    const path = getRelationshipWeatherPath(state.journeyPaths);
    return path?.isActive ? path : null;
  });
  const primaryActionLabel = getRelationshipWeatherPrimaryLabel(weatherPath);
  const targetLabel = getRelationshipWeatherTargetLabel(weatherPath);
  const targetDescription = getRelationshipWeatherTargetDescription(weatherPath);

  useEffect(() => {
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();
    trackPageView("weather_diagnostic_v3");
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const remotePaths = await fetchJourneyPaths();
      if (!cancelled && remotePaths?.length) {
        setJourneyPaths(remotePaths);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setJourneyPaths]);

  const finalizeDiagnostic = useCallback((finalAnswers: Record<string, string>) => {
    const diagnostic = runDiagnostic(finalAnswers);
    const nextStage = getRelationshipWeatherNextStage(weatherPath, "analyzing");

    if (nextStage === "result") {
      setResult(diagnostic);
      setStep("result");
      return;
    }

    if (nextStage === "questions") {
      setResult(diagnostic);
      setQIdx(0);
      setAnswers({});
      setSelectedOption(null);
      setStep("questions");
      return;
    }

    if (nextStage === "analyzing") {
      setResult(diagnostic);
      setStep("analyzing");
      return;
    }

    if (nextStage === "complete") {
      setResult(diagnostic);
      launchRelationshipWeatherFlow(weatherPath, diagnostic, "weather_v3");
      return;
    }

    setResult(diagnostic);
    setStep("result");
  }, [weatherPath]);

  const handleStart = useCallback(() => {
    trackEvent("weather_started");
    const initialStage = getRelationshipWeatherInitialStage(weatherPath);

    if (initialStage === "questions") {
      setStep("questions");
      return;
    }

    if (initialStage === "analyzing") {
      setStep("analyzing");
      setTimeout(() => {
        finalizeDiagnostic({});
      }, 2800);
      return;
    }

    if (initialStage === "result") {
      const diagnostic = runDiagnostic({});
      setResult(diagnostic);
      setStep("result");
      return;
    }

    finalizeDiagnostic({});
  }, [finalizeDiagnostic, weatherPath]);

  const handleAnswer = useCallback((optionId: string) => {
    setSelectedOption(optionId);
    
    setTimeout(() => {
      const updatedAnswers = { ...answers, [QUESTIONS[qIdx].id]: optionId };
      setAnswers(updatedAnswers);
      setSelectedOption(null);

      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
      } else {
        const nextStage = getRelationshipWeatherNextStage(weatherPath, "questions");

        if (nextStage === "analyzing") {
          setStep("analyzing");
          setTimeout(() => {
            finalizeDiagnostic(updatedAnswers);
          }, 2800);
          return;
        }

        if (nextStage === "result") {
          const diagnostic = runDiagnostic(updatedAnswers);
          setResult(diagnostic);
          setStep("result");
          return;
        }

        finalizeDiagnostic(updatedAnswers);
      }
    }, 400);
  }, [answers, finalizeDiagnostic, qIdx, weatherPath]);

  const handleShare = useCallback(async () => {
    if (!result || !resultRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(resultRef.current, { backgroundColor: "#030711", scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        setIsCapturing(false);
        if (!blob) return;
        const file = new File([blob], "weather-report.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: result.shareText });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "weather-report.png"; a.click();
          trackEvent("weather_share_downloaded");
        }
      });
    } catch { setIsCapturing(false); }
  }, [result, isCapturing]);

  const handleCTA = useCallback(() => {
    if (!result || typeof window === "undefined") return;
    trackEvent("weather_cta_clicked", { pattern: result.pattern, level: result.weatherLevel });
    launchRelationshipWeatherFlow(weatherPath, result, "weather_v3");
  }, [result, weatherPath]);

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="wf-page relative overflow-x-hidden" dir="rtl">
      <style>{STYLES}</style>
      <div className="orb-1" />
      <div className="orb-2" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 flex flex-col items-center justify-center min-h-screen">
        <AnimatePresence mode="wait">

          {/* ────── INTRO ────── */}
          {step === "intro" && (
            <motion.div
              key="intro" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.6, ease }}
              className="w-full max-w-lg text-center"
            >
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-teal-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> تشخيص مجاني — ٩٠ ثانية فقط
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
                طاقتك بتروح فين؟
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-6 max-w-[36ch] mx-auto">
                فيه ناس في حياتنا بتسحب طاقتنا من غير ما نحس. مش لأنهم أشرار — لأن العلاقة اتبنت على نمط غلط من الأول.
              </p>

              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 mb-8 text-right space-y-3">
                {["هتعرف النمط السلوكي اللي بيخليك تنهار بصمت", "هتشوف الثمن الحقيقي اللي بتدفعه أسبوعياً", "هتاخد ٣ خطوات تقدر تبدأ بيها النهارده"].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                    <span className="text-gray-300 text-sm leading-snug">{point}</span>
                  </div>
                ))}
              </div>

              <motion.button
                onClick={handleStart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-2xl bg-teal-500 text-black font-black text-xl shadow-[0_20px_50px_-15px_rgba(45,212,191,0.5)] transition-all"
              >
                اشوف طقسي دلوقتي
              </motion.button>

              <p className="text-gray-600 text-xs mt-4">بدون تسجيل — بدون إيميل</p>
            </motion.div>
          )}

          {/* ────── QUESTIONS ────── */}
          {step === "questions" && (
            <motion.div
              key={`q-${qIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease }}
              className="w-full max-w-lg"
            >
              {/* Progress */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
                  <span>سؤال {qIdx + 1} من {QUESTIONS.length}</span>
                  <span>{Math.round(((qIdx) / QUESTIONS.length) * 100)}% اكتمل</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal-500 rounded-full"
                    initial={{ width: `${(qIdx / QUESTIONS.length) * 100}%` }}
                    animate={{ width: `${((qIdx + 1) / QUESTIONS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                {QUESTIONS[qIdx].text}
              </h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">{QUESTIONS[qIdx].subtitle}</p>

              <div className="space-y-3">
                {QUESTIONS[qIdx].options.map((opt) => (
                  <motion.button
                    key={opt.id}
                    onClick={() => handleAnswer(opt.id)}
                    disabled={selectedOption !== null}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full text-right p-5 rounded-2xl border transition-all flex items-center gap-4"
                    style={{
                      borderColor: selectedOption === opt.id ? "rgba(45,212,191,0.6)" : "rgba(255,255,255,0.08)",
                      background: selectedOption === opt.id ? "rgba(45,212,191,0.1)" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <span className="text-2xl shrink-0">{opt.emoji}</span>
                    <span className="text-slate-200 font-semibold text-[15px] leading-snug">{opt.text}</span>
                    <ChevronRight className="w-4 h-4 text-white/20 mr-auto shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ────── ANALYZING ────── */}
          {step === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <motion.div
                className="w-20 h-20 rounded-full border-4 border-teal-500/20 border-t-teal-500 mx-auto mb-8"
                animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
              <h3 className="text-2xl font-black text-white mb-3">بنحلل النمط بتاعك...</h3>
              <p className="text-gray-500 text-sm max-w-[30ch] mx-auto">بنربط إجاباتك ببيانات علم النفس السلوكي وأنماط الاستنزاف في العلاقات</p>
            </motion.div>
          )}

          {/* ────── RESULT ────── */}
          {step === "result" && result && (
            <motion.div
              key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }} className="w-full max-w-lg"
            >
              <div ref={resultRef}>

                {/* === PATTERN CARD === */}
                <div
                  className="rounded-2xl border p-6 mb-5"
                  style={{ borderColor: LEVEL_CONFIG[result.weatherLevel].color + "30", background: LEVEL_CONFIG[result.weatherLevel].bg }}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className="text-5xl shrink-0">{PATTERNS[result.pattern].icon}</div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: LEVEL_CONFIG[result.weatherLevel].color }}>
                        النمط السلوكي المكتشف
                      </div>
                      <h2 className="text-2xl font-black text-white">{result.patternName}</h2>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-[15px] italic">"{result.patternDescription}"</p>
                </div>

                {/* === THE HIDDEN PRICE === */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 mb-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> الثمن الخفي كل أسبوع
                  </div>
                  <div className="flex items-end gap-3 mb-4">
                    <div className="text-6xl font-black" style={{ color: LEVEL_CONFIG[result.weatherLevel].color }}>
                      ~{result.weeklyHoursCost}
                    </div>
                    <div className="text-gray-400 text-lg mb-2">ساعة طاقة ذهنية وعاطفية</div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: LEVEL_CONFIG[result.weatherLevel].color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.weeklyHoursCost / 25) * 100}%` }}
                      transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">من أصل ٢٥ ساعة متاحة أسبوعياً للطاقة الذهنية</p>
                </div>

                {/* === CORE INSIGHT === */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 mb-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> الجذر الحقيقي
                  </div>
                  <div
                    className="insight-box"
                    style={{ borderColor: LEVEL_CONFIG[result.weatherLevel].color, background: LEVEL_CONFIG[result.weatherLevel].bg }}
                  >
                    <p className="text-slate-200 leading-relaxed text-[15px]">{result.coreInsight}</p>
                  </div>
                </div>

                {/* === QUICK WINS === */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 mb-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-teal-400" /> ٣ خطوات تبدأ بيها النهارده
                  </div>
                  <div className="space-y-4">
                    {result.quickActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black"
                          style={{ background: LEVEL_CONFIG[result.weatherLevel].bg, color: LEVEL_CONFIG[result.weatherLevel].color, border: `1px solid ${LEVEL_CONFIG[result.weatherLevel].color}40` }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* === CTAs === */}
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3 mb-5">
                  <div className="text-2xl">🗺️</div>
                  <div>
                    <p className="text-white font-bold text-sm">الخطوة الجاية: {targetLabel}</p>
                    <p className="text-gray-500 text-xs leading-snug">{targetDescription}</p>
                  </div>
                </div>

                <motion.button
                  onClick={handleCTA} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-5 rounded-2xl font-black text-lg text-black"
                  style={{ background: `linear-gradient(135deg, ${LEVEL_CONFIG[result.weatherLevel].color}, #2dd4bf)` }}
                >
                  {primaryActionLabel} 🗺️
                </motion.button>

                <button
                  onClick={handleShare} disabled={isCapturing}
                  className="w-full py-4 rounded-2xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all"
                >
                  {isCapturing ? "جاري التحضير..." : "📸 شارك تقريرك مع حد قريب منك"}
                </button>

                <button
                  onClick={() => { setStep("intro"); setQIdx(0); setAnswers({}); setResult(null); }}
                  className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  إعادة التشخيص
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
