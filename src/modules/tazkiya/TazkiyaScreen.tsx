/**
 * تزكية — Tazkiya Screen
 * Daily Emotional Purification: اعترف → سامح → اترك
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useTazkiyaState,
  EMOTION_META,
  STEP_META,
  RELEASE_TEMPLATES,
  type EmotionTag,
  type TazkiyaStep,
} from "./store/tazkiya.store";
import {
  Heart,
  Feather,
  Flame,
  Star,
  History,
  Check,
  ChevronLeft,
  RefreshCw,
  Zap as Sparkles,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*            HELPERS                         */
/* ═══════════════════════════════════════════ */

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

/* ═══════════════════════════════════════════ */
/*        STEP PROGRESS BAR                   */
/* ═══════════════════════════════════════════ */

function StepProgress({ current }: { current: TazkiyaStep }) {
  const steps: TazkiyaStep[] = ["confess", "forgive", "release"];
  const idx = steps.indexOf(current);

  return (
    <div className="flex items-center gap-2 px-5 mb-6">
      {steps.map((s, i) => {
        const meta = STEP_META[s];
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? `${meta.color}20` : active ? `${meta.color}15` : "rgba(30,41,59,0.4)",
                  border: `2px solid ${done || active ? meta.color : "rgba(51,65,85,0.3)"}`,
                  color: done || active ? meta.color : "#64748b",
                }}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : meta.emoji}
              </div>
              <span
                className="text-[10px] font-bold hidden sm:block"
                style={{ color: active ? meta.color : "#64748b" }}
              >
                {meta.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 rounded-full transition-all"
                style={{ background: done ? meta.color : "rgba(51,65,85,0.3)" }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*        STEP 1: CONFESS                     */
/* ═══════════════════════════════════════════ */

function ConfessStep({ onNext }: { onNext: () => void }) {
  const { activeCycle, setConfession } = useTazkiyaState();
  const [text, setText] = useState(activeCycle?.confession || "");
  const [emotions, setEmotions] = useState<EmotionTag[]>(activeCycle?.emotions || []);

  const toggleEmotion = (e: EmotionTag) => {
    setEmotions((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  };

  const handleNext = () => {
    if (!text.trim() || emotions.length === 0) return;
    setConfession(text.trim(), emotions);
    onNext();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-5 space-y-5">
      {/* Instruction */}
      <div className="text-center">
        <span className="text-4xl mb-3 block">🪞</span>
        <h2 className="text-lg font-black text-white mb-1">اعترف</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          {STEP_META.confess.instruction}
        </p>
      </div>

      {/* Emotions */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold mb-2 block">ما الذي تشعر به؟</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(EMOTION_META) as EmotionTag[]).map((e) => {
            const meta = EMOTION_META[e];
            const active = emotions.includes(e);
            return (
              <button
                key={e}
                onClick={() => toggleEmotion(e)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${meta.color}20` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? meta.color : "rgba(51,65,85,0.3)"}`,
                  color: active ? meta.color : "#94a3b8",
                }}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Text */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب ما يثقل قلبك... لا أحد يقرأ هذا غيرك"
        rows={5}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
        dir="rtl"
      />

      {/* Next */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleNext}
        disabled={!text.trim() || emotions.length === 0}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(99,102,241,0.06))",
          border: "1px solid rgba(167,139,250,0.3)",
          color: "#a78bfa",
        }}
      >
        اعترفت — التالي
        <ChevronLeft className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*        STEP 2: FORGIVE                     */
/* ═══════════════════════════════════════════ */

function ForgiveStep({ onNext }: { onNext: () => void }) {
  const { setForgiveness } = useTazkiyaState();
  const [forgiveTo, setForgiveTo] = useState<"self" | "other">("self");
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");

  const handleNext = () => {
    const finalTarget = forgiveTo === "self" ? "نفسي" : target.trim();
    if (!message.trim()) return;
    setForgiveness(forgiveTo, finalTarget, message.trim());
    onNext();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-5 space-y-5">
      <div className="text-center">
        <span className="text-4xl mb-3 block">🕊️</span>
        <h2 className="text-lg font-black text-white mb-1">سامح</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          {STEP_META.forgive.instruction}
        </p>
      </div>

      {/* Who */}
      <div className="flex gap-2">
        {[
          { id: "self" as const, label: "أسامح نفسي", emoji: "💚" },
          { id: "other" as const, label: "أسامح شخص آخر", emoji: "🤝" },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setForgiveTo(opt.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all"
            style={{
              background: forgiveTo === opt.id ? "rgba(16,185,129,0.1)" : "rgba(30,41,59,0.4)",
              border: `1px solid ${forgiveTo === opt.id ? "#10b981" : "rgba(51,65,85,0.3)"}`,
              color: forgiveTo === opt.id ? "#10b981" : "#94a3b8",
            }}
          >
            <span>{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Target name */}
      {forgiveTo === "other" && (
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="اسم الشخص (اختياري)"
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
          dir="rtl"
        />
      )}

      {/* Forgiveness message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={forgiveTo === "self" ? "أسامح نفسي لأنني..." : "أسامحك لأنني أستحق أن أتحرر..."}
        rows={4}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
        dir="rtl"
      />

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleNext}
        disabled={!message.trim()}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.06))",
          border: "1px solid rgba(16,185,129,0.3)",
          color: "#10b981",
        }}
      >
        سامحت — التالي
        <ChevronLeft className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*        STEP 3: RELEASE                     */
/* ═══════════════════════════════════════════ */

function ReleaseStep({ onComplete }: { onComplete: () => void }) {
  const { setRelease, completeCycle } = useTazkiyaState();
  const [affirmation, setAffirmation] = useState("");
  const [lightness, setLightness] = useState(3);
  const [releasing, setReleasing] = useState(false);

  const handleRelease = () => {
    if (!affirmation.trim()) return;
    setRelease(affirmation.trim(), lightness);
    setReleasing(true);

    setTimeout(() => {
      completeCycle();
      onComplete();
    }, 3000);
  };

  if (releasing) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Feather floating up */}
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -60, opacity: [1, 1, 0.5, 0] }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        >
          <Feather className="w-16 h-16 text-amber-300" />
        </motion.div>

        {/* Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400"
            initial={{
              x: 0, y: 0, opacity: 0.8,
            }}
            animate={{
              x: (Math.random() - 0.5) * 200,
              y: -100 - Math.random() * 150,
              opacity: 0,
            }}
            transition={{ duration: 2 + Math.random(), delay: 0.3 + Math.random() * 0.5 }}
          />
        ))}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-amber-300 font-black text-lg text-center"
        >
          تركت... وخفّ القلب 🍃
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-slate-500 text-xs text-center"
        >
          دورة التزكية اكتملت
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-5 space-y-5">
      <div className="text-center">
        <span className="text-4xl mb-3 block">🍃</span>
        <h2 className="text-lg font-black text-white mb-1">اترك</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          {STEP_META.release.instruction}
        </p>
      </div>

      {/* Templates */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold mb-2 block">أو اختر جملة جاهزة:</label>
        <div className="space-y-1.5">
          {RELEASE_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => setAffirmation(t)}
              className="w-full text-right px-3 py-2 rounded-lg text-[11px] transition-all"
              style={{
                background: affirmation === t ? "rgba(251,191,36,0.1)" : "rgba(30,41,59,0.3)",
                border: `1px solid ${affirmation === t ? "rgba(251,191,36,0.3)" : "rgba(51,65,85,0.2)"}`,
                color: affirmation === t ? "#fbbf24" : "#94a3b8",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Custom affirmation */}
      <textarea
        value={affirmation}
        onChange={(e) => setAffirmation(e.target.value)}
        placeholder="أو اكتب جملتك الخاصة..."
        rows={2}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
        dir="rtl"
      />

      {/* Lightness score */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold mb-2 block text-center">
          كم تشعر بالخفة الآن؟
        </label>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setLightness(v)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: v <= lightness ? "rgba(251,191,36,0.12)" : "rgba(30,41,59,0.4)",
                border: `1px solid ${v <= lightness ? "#fbbf24" : "rgba(51,65,85,0.3)"}`,
                color: v <= lightness ? "#fbbf24" : "#64748b",
              }}
            >
              <Feather className="w-4 h-4" fill={v <= lightness ? "#fbbf24" : "none"} />
            </button>
          ))}
        </div>
      </div>

      {/* Release */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleRelease}
        disabled={!affirmation.trim()}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))",
          border: "1px solid rgba(251,191,36,0.3)",
          color: "#fbbf24",
        }}
      >
        <Feather className="w-4 h-4" />
        اترك وتحرّر
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           COMPLETION CARD                  */
/* ═══════════════════════════════════════════ */

function CompletionBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-5 rounded-2xl p-5 text-center"
      style={{
        background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(251,191,36,0.05))",
        border: "1px solid rgba(16,185,129,0.2)",
      }}
    >
      <span className="text-3xl block mb-2">✨</span>
      <h3 className="text-sm font-black text-emerald-400 mb-1">اكتملت تزكية اليوم</h3>
      <p className="text-[10px] text-slate-500">اعترفت، سامحت، وتركت. قلبك أخف الآن.</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function TazkiyaScreen() {
  const {
    activeCycle,
    currentStep,
    cycles,
    startCycle,
    cancelCycle,
    getTodayCycle,
    getStreak,
    getTotalCycles,
    getEmotionStats,
    getAverageLightness,
    getRecentCycles,
  } = useTazkiyaState();

  const [showHistory, setShowHistory] = useState(false);
  const [justFinished, setJustFinished] = useState(false);

  const todayCycle = useMemo(() => getTodayCycle(), [cycles]);
  const streak = useMemo(() => getStreak(), [cycles]);
  const total = useMemo(() => getTotalCycles(), [cycles]);
  const avgLightness = useMemo(() => getAverageLightness(), [cycles]);
  const emotionStats = useMemo(() => getEmotionStats(), [cycles]);
  const recent = useMemo(() => getRecentCycles(8), [cycles]);

  // Top emotion
  const topEmotion = useMemo(() => {
    const entries = Object.entries(emotionStats) as [EmotionTag, number][];
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[1] > 0 ? sorted[0] : null;
  }, [emotionStats]);

  const isInCycle = !!activeCycle;

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full top-[-10%] right-[-5%]"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.06), transparent 65%)" }} />
        <div className="absolute w-[300px] h-[300px] rounded-full bottom-[-8%] left-[-3%]"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.04), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-900/15 border border-violet-500/20">
              <Heart className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">تزكية</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">اعترف · سامح · اترك</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/40 border border-slate-700/30 text-slate-400"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "دورات مكتملة", value: total, icon: <Heart className="w-3 h-3" />, color: "#a78bfa" },
            { label: "أيام متتالية", value: streak, icon: <Flame className="w-3 h-3" />, color: "#fbbf24" },
            { label: "متوسط الخفة", value: avgLightness || "—", icon: <Feather className="w-3 h-3" />, color: "#10b981" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}
            >
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: s.color }}>
                {s.icon}
              </div>
              <div className="text-lg font-black text-white">{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Emotion Badge */}
      {topEmotion && (
        <div className="relative z-10 px-5 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
            background: `${EMOTION_META[topEmotion[0]].color}08`,
            border: `1px solid ${EMOTION_META[topEmotion[0]].color}20`,
          }}>
            <span className="text-sm">{EMOTION_META[topEmotion[0]].emoji}</span>
            <span className="text-[10px] text-slate-400">
              أكثر شعور تتعامل معه: <span className="font-bold" style={{ color: EMOTION_META[topEmotion[0]].color }}>
                {EMOTION_META[topEmotion[0]].label}
              </span> ({topEmotion[1]} مرة)
            </span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showHistory ? (
          /* History */
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 px-5 space-y-3">
            <h3 className="text-xs text-slate-500 font-bold mb-2">آخر الدورات</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-10">لا توجد دورات بعد</p>
            ) : (
              recent.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl p-3 space-y-2"
                  style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{fmtDate(c.startedAt)}</span>
                      <div className="flex gap-0.5">
                        {c.emotions.map((e) => (
                          <span key={e} className="text-xs" title={EMOTION_META[e].label}>{EMOTION_META[e].emoji}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(c.lightnessScore)].map((_, i) => (
                        <Feather key={i} className="w-2.5 h-2.5 text-amber-400" fill="#fbbf24" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{c.confession}</p>
                  <p className="text-[9px] text-emerald-500/70 italic">«{c.releaseAffirmation}»</p>
                </div>
              ))
            )}
          </motion.div>
        ) : isInCycle ? (
          /* Active Cycle */
          <motion.div key="cycle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            <StepProgress current={currentStep} />
            <AnimatePresence mode="wait">
              {currentStep === "confess" && (
                <ConfessStep key="s1" onNext={() => {}} />
              )}
              {currentStep === "forgive" && (
                <ForgiveStep key="s2" onNext={() => {}} />
              )}
              {currentStep === "release" && (
                <ReleaseStep key="s3" onComplete={() => setJustFinished(true)} />
              )}
            </AnimatePresence>

            <button
              onClick={cancelCycle}
              className="mx-5 mt-4 text-[10px] text-slate-600 font-medium text-center block w-full"
            >
              إلغاء الدورة
            </button>
          </motion.div>
        ) : (
          /* Home */
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            {/* Today's status */}
            {todayCycle || justFinished ? (
              <CompletionBanner />
            ) : (
              <div className="px-5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startCycle}
                  className="w-full py-5 rounded-2xl font-black text-base flex flex-col items-center gap-3 transition-all"
                  style={{
                    background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(16,185,129,0.05), rgba(251,191,36,0.05))",
                    border: "1px solid rgba(167,139,250,0.25)",
                    color: "#a78bfa",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🪞</span>
                    <span className="text-2xl">🕊️</span>
                    <span className="text-2xl">🍃</span>
                  </div>
                  ابدأ دورة التزكية
                  <span className="text-[10px] text-slate-500 font-medium">اعترف · سامح · اترك — دقيقتين فقط</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}
      >
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🕊️ التزكية تطهير يومي للقلب — اعترف بما يثقلك، سامح، واترك
        </p>
      </motion.div>
    </div>
  );
}
