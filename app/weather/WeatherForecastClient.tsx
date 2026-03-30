"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudLightning,
  Wind,
  Sun,
  ArrowLeft,
  Share2,
  Zap,
  Shield,
  ChevronDown,
} from "lucide-react";
import { trackEvent, trackPageView } from "../../src/services/analytics";
import { captureUtmFromCurrentUrl, captureLeadAttributionFromCurrentUrl } from "../../src/services/marketingAttribution";

/* ═══════════════════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════════════════ */

type WeatherTone = "storm" | "windy" | "clear";

interface WeatherQuestion {
  id: string;
  text: string;
  options: { id: string; text: string; weight: number; zone: "family" | "friends" | "work" | "partner" }[];
}

interface ZoneForecast {
  zone: string;
  zoneLabel: string;
  tone: WeatherTone;
  emoji: string;
  headline: string;
  advice: string;
  score: number;
}

interface WeatherResult {
  overallTone: WeatherTone;
  overallHeadline: string;
  overallSummary: string;
  zones: ZoneForecast[];
  energyLevel: number;
  shareText: string;
}

const QUESTIONS: WeatherQuestion[] = [
  {
    id: "q1",
    text: "لما بترجع البيت بعد يوم طويل، إيه أكتر حاجة بتحس بيها؟",
    options: [
      { id: "q1a", text: "بحس بأمان وراحة — البيت هو مساحتي", weight: 10, zone: "family" },
      { id: "q1b", text: "بحس بثقل — كأن فيه لسه مطالب مستنياني", weight: 60, zone: "family" },
      { id: "q1c", text: "بحس بلا حاجة — اتعودت أتنمّل", weight: 40, zone: "family" },
    ],
  },
  {
    id: "q2",
    text: "لو صاحبك اتصل بيك دلوقتي، إيه أول رد فعل جواك؟",
    options: [
      { id: "q2a", text: "هرد بحماس — ناس بتفرّحني", weight: 10, zone: "friends" },
      { id: "q2b", text: "هتردد — على حسب مين فيهم", weight: 45, zone: "friends" },
      { id: "q2c", text: "هتجاهل — مش قادر على كلام تاني", weight: 70, zone: "friends" },
    ],
  },
  {
    id: "q3",
    text: "في شغلك أو دراستك، بتحس إنك بتدي أكتر ما بتاخد؟",
    options: [
      { id: "q3a", text: "لا، الأمور متوازنة نسبياً", weight: 10, zone: "work" },
      { id: "q3b", text: "أحياناً.. بس بحاول أسكت", weight: 50, zone: "work" },
      { id: "q3c", text: "آه — بدي ١٠٠% ومحدش شايف", weight: 75, zone: "work" },
    ],
  },
  {
    id: "q4",
    text: "إيه أقرب وصف لأقرب علاقة عاطفية/شريك حياتك؟",
    options: [
      { id: "q4a", text: "مريحة ومتبادلة — بنكمّل بعض", weight: 10, zone: "partner" },
      { id: "q4b", text: "مرهقة أحياناً بس بحبه/بحبها", weight: 55, zone: "partner" },
      { id: "q4c", text: "مفيش شريك حالياً / العلاقة مسروقة مني", weight: 35, zone: "partner" },
    ],
  },
];

const ZONE_META: Record<string, { label: string; emojis: Record<WeatherTone, string> }> = {
  family: { label: "دايرة الأهل", emojis: { storm: "⛈️", windy: "🌬️", clear: "☀️" } },
  friends: { label: "دايرة الأصحاب", emojis: { storm: "🌩️", windy: "💨", clear: "🌤️" } },
  work: { label: "دايرة الشغل", emojis: { storm: "🌪️", windy: "🌥️", clear: "🌈" } },
  partner: { label: "دايرة الشريك", emojis: { storm: "⚡", windy: "🌫️", clear: "💚" } },
};

const ADVICE: Record<string, Record<WeatherTone, string>> = {
  family: {
    storm: "حدودك مع الأهل محتاجة تتقوّي. مش لازم ترضي الكل.",
    windy: "فيه رياح خفيفة — خلّي بالك من المطالب غير المعلنة.",
    clear: "الأهل مصدر أمان ليك — حافظ على المساحة دي.",
  },
  friends: {
    storm: "فيه صداقة بتسحب أكتر ما بتدي. وقت المراجعة.",
    windy: "بعض الأصحاب محتاجين فلترة — مش كلهم بنفس الأثر.",
    clear: "صحابك بيشحنوك — ده كنز. اتمسك بيه.",
  },
  work: {
    storm: "بيئة الشغل بتستنزفك بشكل حاد. حط حدود واضحة.",
    windy: "فيه ضغط بس محتمل — اتعلم تقول لا على الحاجات الزيادة.",
    clear: "الشغل مستقر ومش مصدر استنزاف. ركّز طاقتك في حتة تانية.",
  },
  partner: {
    storm: "العلاقة دي محتاجة حوار صريح ومسافة صحية.",
    windy: "فيه حب بس فيه إرهاق — التوازن مطلوب.",
    clear: "علاقة مريحة ومتبادلة — دي مساحة أمان ليك.",
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   Logic
   ═══════════════════════════════════════════════════════════════════════ */

function deriveResult(answers: Record<string, { weight: number; zone: string }>): WeatherResult {
  const zoneScores: Record<string, number> = {};
  for (const ans of Object.values(answers)) {
    zoneScores[ans.zone] = ans.weight;
  }

  const zones: ZoneForecast[] = Object.entries(zoneScores).map(([zone, score]) => {
    const tone: WeatherTone = score >= 55 ? "storm" : score >= 30 ? "windy" : "clear";
    const meta = ZONE_META[zone];
    return {
      zone,
      zoneLabel: meta.label,
      tone,
      emoji: meta.emojis[tone],
      headline: `${meta.label}: ${tone === "storm" ? "عواصف" : tone === "windy" ? "رياح" : "صحو"}`,
      advice: ADVICE[zone][tone],
      score,
    };
  });

  zones.sort((a, b) => b.score - a.score);

  const avgScore = Object.values(zoneScores).reduce((s, v) => s + v, 0) / Math.max(1, Object.keys(zoneScores).length);
  const overallTone: WeatherTone = avgScore >= 50 ? "storm" : avgScore >= 25 ? "windy" : "clear";
  const energyLevel = Math.max(1, Math.min(10, Math.round(10 - avgScore / 8)));

  const stormCount = zones.filter((z) => z.tone === "storm").length;
  const clearCount = zones.filter((z) => z.tone === "clear").length;

  let overallHeadline: string;
  let overallSummary: string;

  if (stormCount >= 3) {
    overallHeadline = "تحذير: عواصف شاملة في معظم الدوائر";
    overallSummary = "الضغط جاي من أكتر من مكان. مش لازم تحل كلهم مرة واحدة — ابدأ بالأخطر.";
  } else if (stormCount >= 1) {
    overallHeadline = "غيوم مع عواصف محلية";
    overallSummary = "فيه دايرة واحدة على الأقل بتسحب طاقتك بقوة. بقية الدوائر ممكن تتعامل معاها.";
  } else if (clearCount >= 3) {
    overallHeadline = "أجواء صحوة وهادئة";
    overallSummary = "الحمد لله — معظم دوائرك في وضع كويس. ده وقت البناء مش الدفاع.";
  } else {
    overallHeadline = "أجواء متقلبة مع رياح خفيفة";
    overallSummary = "مفيش عواصف حادة بس فيه حاجات محتاجة انتباه قبل ما تتحول لمشاكل أكبر.";
  }

  const shareZones = zones.map((z) => `${z.emoji} ${z.zoneLabel}: ${z.tone === "storm" ? "عواصف" : z.tone === "windy" ? "رياح" : "صحو"}`).join("\n");
  const shareText = `🌦️ نشرة طقس علاقاتي:\n\n${shareZones}\n\n🔋 مستوى الطاقة: ${energyLevel}/10\n\nاكتشف طقس علاقاتك:\nhttps://www.alrehla.app/weather`;

  return { overallTone, overallHeadline, overallSummary, zones, energyLevel, shareText };
}

/* ═══════════════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════════════ */

const WEATHER_STYLES = `
  .weather-page {
    --void: #070b1a;
    --glass: rgba(12, 17, 40, 0.75);
    --glass-border: rgba(255,255,255,0.08);
    --teal: #14b8a6;
    --storm-color: #f43f5e;
    --windy-color: #f59e0b;
    --clear-color: #10b981;
    font-family: 'IBM Plex Sans Arabic', 'Tajawal', sans-serif;
    color-scheme: dark;
  }
  .weather-page * { box-sizing: border-box; }

  .weather-energy-bar {
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    overflow: hidden;
  }
  .weather-energy-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
`;

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TONE_PALETTE: Record<WeatherTone, { bg: string; border: string; glow: string; text: string; icon: typeof CloudLightning }> = {
  storm: { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", glow: "rgba(244,63,94,0.15)", text: "#fda4af", icon: CloudLightning },
  windy: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.15)", text: "#fcd34d", icon: Wind },
  clear: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", glow: "rgba(16,185,129,0.15)", text: "#6ee7b7", icon: Sun },
};

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
    trackPageView("weather_forecast");
    trackEvent("weather_tool_view", { tool: "relationship_weather" });
  }, []);

  const handleStart = useCallback(() => {
    setStep("questions");
    trackEvent("weather_tool_started", { tool: "relationship_weather" });
  }, []);

  const handleAnswer = useCallback(
    (weight: number, zone: string) => {
      const updated = { ...answers, [QUESTIONS[qIdx].id]: { weight, zone } };
      setAnswers(updated);

      trackEvent("weather_tool_answer", {
        question_index: qIdx + 1,
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

          trackEvent("weather_tool_completed", {
            overall_tone: derivedResult.overallTone,
            energy_level: derivedResult.energyLevel,
            storm_zones: derivedResult.zones.filter((z) => z.tone === "storm").length,
            clear_zones: derivedResult.zones.filter((z) => z.tone === "clear").length,
          });
        }, 2800);
      }
    },
    [answers, qIdx]
  );

  const handleShare = useCallback(async () => {
    if (!result) return;
    const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
    trackEvent("weather_tool_shared", {
      overall_tone: result.overallTone,
      energy_level: result.energyLevel,
      method: canNativeShare ? "native_share" : "clipboard",
    });
    if (canNativeShare) {
      try {
        await navigator.share({ text: result.shareText });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(result.shareText);
      alert("تم نسخ النشرة! شاركها مع صحابك 🌦️");
    }
  }, [result]);

  const handleCTA = useCallback(() => {
    trackEvent("weather_tool_cta_clicked", {
      overall_tone: result?.overallTone,
      energy_level: result?.energyLevel,
      destination: "landing",
    });
    if (typeof window !== "undefined") {
      window.location.assign("/?utm_source=weather_tool&utm_medium=organic&utm_campaign=viral_weather");
    }
  }, [result]);

  const handleRestart = useCallback(() => {
    trackEvent("weather_tool_restarted");
    setStep("intro");
    setQIdx(0);
    setAnswers({});
    setResult(null);
  }, []);

  return (
    <div className="weather-page relative min-h-screen w-full overflow-x-hidden" dir="rtl" style={{ background: "var(--void)" }}>
      <style>{WEATHER_STYLES}</style>

      {/* Ambient BG */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: [
              "radial-gradient(ellipse 60% 50% at 20% 15%, rgba(20,184,166,0.06) 0%, transparent 55%)",
              "radial-gradient(ellipse 50% 40% at 80% 80%, rgba(109,40,217,0.05) 0%, transparent 50%)",
            ].join(", "),
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* ─── INTRO ─── */}
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease }}
                className="text-center"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold tracking-widest uppercase" style={{ borderColor: "var(--glass-border)", color: "rgba(255,255,255,0.5)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  أداة مجانية — بدون تسجيل
                </div>

                <div className="mb-6 text-6xl">🌦️</div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ lineHeight: 1.15 }}>
                  نشرة طقس علاقاتك
                </h1>
                <p className="text-base text-gray-400 leading-relaxed mb-8 max-w-[36ch] mx-auto">
                  عواصف في الأهل؟ رياح في الشغل؟ صحو مع الصحاب؟
                  <br />
                  <span className="text-white font-semibold">اكتشف في دقيقة واحدة.</span>
                </p>

                <motion.button
                  type="button"
                  onClick={handleStart}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-lg text-white"
                  style={{ background: "linear-gradient(135deg, #14B8A6, #0d9488)", boxShadow: "0 14px 42px rgba(20,184,166,0.3)" }}
                >
                  <Zap className="w-5 h-5" />
                  طلّع نشرتك
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                </motion.button>

                <div className="mt-6 flex justify-center gap-6">
                  {[
                    { icon: Shield, label: "خصوصية كاملة" },
                    { label: "٤ أسئلة بس", icon: Zap },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                      <Icon className="w-3 h-3 opacity-60" />
                      {label}
                    </div>
                  ))}
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 2.5 }} className="mt-12">
                  <ChevronDown className="w-5 h-5 mx-auto text-gray-600 animate-bounce" />
                </motion.div>
              </motion.div>
            )}

            {/* ─── QUESTIONS ─── */}
            {step === "questions" && (
              <motion.div
                key={`q-${qIdx}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease }}
              >
                {/* Progress */}
                <div className="flex gap-2 mb-8">
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-colors duration-500"
                      style={{ background: i <= qIdx ? "var(--teal)" : "rgba(255,255,255,0.08)" }}
                    />
                  ))}
                </div>

                <p className="text-[11px] font-bold text-teal-400 tracking-widest uppercase mb-3">
                  سؤال {qIdx + 1} من {QUESTIONS.length}
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed mb-8">
                  {QUESTIONS[qIdx].text}
                </h2>

                <div className="space-y-3">
                  {QUESTIONS[qIdx].options.map((opt) => (
                    <motion.button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnswer(opt.weight, opt.zone)}
                      whileHover={{ scale: 1.01, borderColor: "rgba(20,184,166,0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl border p-4 text-right text-[15px] text-gray-300 transition-colors"
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
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6 text-5xl"
                >
                  🌀
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">بنحلل طقس علاقاتك...</h3>
                <p className="text-sm text-gray-500">بنربط إجاباتك بخريطة الدوائر</p>

                <div className="mt-8 space-y-4">
                  {["دايرة الأهل", "دايرة الأصحاب", "دايرة الشغل", "دايرة الشريك"].map((zone, i) => (
                    <motion.div
                      key={zone}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.5, duration: 0.4 }}
                      className="flex items-center gap-3 justify-center text-sm text-gray-400"
                    >
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                      >
                        ◉
                      </motion.span>
                      {zone}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── RESULT ─── */}
            {step === "result" && result && (
              <motion.div
                key="result"
                ref={resultRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease }}
              >
                {/* Overall header */}
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">
                    {result.overallTone === "storm" ? "⛈️" : result.overallTone === "windy" ? "🌤️" : "☀️"}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ lineHeight: 1.15 }}>
                    {result.overallHeadline}
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-[40ch] mx-auto">
                    {result.overallSummary}
                  </p>
                </div>

                {/* Energy bar */}
                <div className="rounded-2xl border p-5 mb-5" style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400">مستوى الطاقة</span>
                    <span className="text-lg font-black text-white">{result.energyLevel}<span className="text-xs text-gray-500">/10</span></span>
                  </div>
                  <div className="weather-energy-bar">
                    <div
                      className="weather-energy-fill"
                      style={{
                        width: `${result.energyLevel * 10}%`,
                        background: result.energyLevel >= 7 ? "var(--clear-color)" : result.energyLevel >= 4 ? "var(--windy-color)" : "var(--storm-color)",
                      }}
                    />
                  </div>
                </div>

                {/* Zone cards */}
                <div className="space-y-3 mb-8">
                  {result.zones.map((zone, i) => {
                    const palette = TONE_PALETTE[zone.tone];
                    const Icon = palette.icon;
                    return (
                      <motion.div
                        key={zone.zone}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.12, duration: 0.5, ease }}
                        className="rounded-2xl border p-5"
                        style={{ borderColor: palette.border, background: palette.bg }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{zone.emoji}</span>
                            <span className="text-sm font-bold text-white">{zone.zoneLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: palette.glow, color: palette.text }}>
                            <Icon className="w-3 h-3" />
                            {zone.tone === "storm" ? "عواصف" : zone.tone === "windy" ? "رياح" : "صحو"}
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {zone.advice}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Share + CTA */}
                <div className="space-y-3">
                  <motion.button
                    type="button"
                    onClick={handleShare}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl border px-6 py-4 text-base font-bold text-white transition-colors"
                    style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)" }}
                  >
                    <Share2 className="w-5 h-5" />
                    شارك نشرتك مع صحابك
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleCTA}
                    whileHover={{ scale: 1.02, boxShadow: "0 18px 50px rgba(20,184,166,0.35)" }}
                    whileTap={{ scale: 0.97 }}
                    className="group w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-black text-white"
                    style={{ background: "linear-gradient(135deg, #14B8A6, #7C3AED)", boxShadow: "0 14px 42px rgba(20,184,166,0.25)" }}
                  >
                    <Zap className="w-5 h-5" />
                    عايز تشوف الخريطة كاملة؟
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  </motion.button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full py-3 text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    جرّب تاني ←
                  </button>
                </div>

                {/* Branding */}
                <div className="mt-10 text-center">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600">
                    الرحلة — منصة الوعي الذاتي وخريطة العلاقات
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
