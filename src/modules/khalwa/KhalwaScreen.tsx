/**
 * خلوة — Khalwa Screen
 * Deep Focus Mode — enter isolation, set intention, flow, reflect
 * First Principles Redesign: No timers, no distractions, pure OLED black, organic exit.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  useKhalwaState,
  INTENTION_META,
  type KhalwaIntention,
} from "./store/khalwa.store";
import { Moon, Sun, History, Star, Zap } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

/* ═══════════════════════════════════════════ */
/*         ACTIVE SESSION (THE VOID)          */
/* ═══════════════════════════════════════════ */

function ActiveSessionView({ onExit }: { onExit: () => void }) {
  const { activeSession, exitKhalwa } = useKhalwaState();
  const [exiting, setExiting] = useState(false);
  const [reflection, setReflection] = useState("");
  const [clarity, setClarity] = useState(3);
  
  // Exit gesture state
  const [isHolding, setIsHolding] = useState(false);
  const holdProgress = useAnimation();
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!activeSession) return null;
  const meta = INTENTION_META[activeSession.intention];

  const handleExitComplete = () => {
    exitKhalwa(reflection, clarity);
    onExit();
  };

  const startHold = () => {
    setIsHolding(true);
    holdProgress.start({
      scale: 1,
      opacity: 1,
      transition: { duration: 3, ease: "linear" }
    });
    
    holdTimerRef.current = setTimeout(() => {
      // 3 seconds reached!
      setExiting(true);
    }, 3000);
  };

  const cancelHold = () => {
    setIsHolding(false);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdProgress.start({
      scale: 0,
      opacity: 0,
      transition: { duration: 0.3 }
    });
  };

  if (exiting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-6 gap-6"
        dir="rtl"
      >
        <Sun className="w-10 h-10 text-amber-400" />
        <h2 className="text-xl font-black text-white">العودة من الخلوة</h2>
        <p className="text-xs text-slate-500">مرحباً بعودتك للواقع.</p>

        {/* Clarity Score */}
        <div className="w-full max-w-xs mt-6">
          <label className="text-xs text-slate-500 font-bold mb-2 block text-center">ما مستوى الوضوح بعد الخلوة؟</label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setClarity(v)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: v <= clarity ? "rgba(251,191,36,0.15)" : "rgba(30,41,59,0.5)",
                  border: `1px solid ${v <= clarity ? "#fbbf24" : "rgba(51,65,85,0.3)"}`,
                  color: v <= clarity ? "#fbbf24" : "#64748b",
                }}
              >
                <Star className="w-4 h-4" fill={v <= clarity ? "#fbbf24" : "none"} />
              </button>
            ))}
          </div>
        </div>

        {/* Reflection */}
        <div className="w-full max-w-xs">
          <label className="text-xs text-slate-500 font-bold mb-2 block">ما الذي اتضح لك؟</label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="تأمل ختامي..."
            rows={3}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleExitComplete}
          className="w-full max-w-xs py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "#10b981",
          }}
        >
          <Sun className="w-4 h-4" />
          تأكيد الخروج
        </motion.button>
      </motion.div>
    );
  }

  // Immersive Void View (NO NUMBERS, PURE OLED BLACK)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
      style={{ background: "#000000" }} // Pure OLED Black
      dir="rtl"
    >
      {/* Intention note faded in the background temporarily */}
      <AnimatePresence>
        {!isHolding && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 text-xs font-medium text-white max-w-[200px] text-center tracking-widest"
          >
            {activeSession.intentionNote || meta.label}
          </motion.p>
        )}
      </AnimatePresence>

      {/* The Breathing Void */}
      <div 
        className="relative flex items-center justify-center w-64 h-64 touch-none cursor-pointer"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onContextMenu={(e) => e.preventDefault()} // prevent context menu on mobile hold
      >
        {/* Core Breathing Orb (4-7-8 rhythm) */}
        <motion.div
          className="absolute rounded-full mix-blend-screen blur-xl"
          style={{ background: meta.color }}
          animate={{ 
            scale: [0.8, 1.2, 1.2, 0.8], // Inhale (4s), Hold (7s), Exhale (8s)
            opacity: [0.3, 0.6, 0.6, 0.3]
          }}
          transition={{ 
            duration: 19, 
            times: [0, 0.21, 0.58, 1], // rough approximation of 4-7-8
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />

        {/* Exit Progress Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4"
          style={{ borderColor: meta.color, opacity: 0, scale: 0 }}
          animate={holdProgress}
        />

        {/* Inner solid core */}
        <motion.div
          className="w-16 h-16 rounded-full relative z-10"
          style={{ background: meta.color, opacity: 0.8, boxShadow: `0 0 40px ${meta.color}` }}
          animate={{ scale: isHolding ? 0.9 : [1, 1.05, 1] }}
          transition={isHolding ? { duration: 0.2 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Hint for organic exit */}
      <motion.p
        className="absolute bottom-20 text-[10px] text-slate-700 tracking-widest font-black uppercase"
        animate={{ opacity: isHolding ? 0 : [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        اضغط مطولاً للعودة
      </motion.p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*         ENTER KHALWA FORM                  */
/* ═══════════════════════════════════════════ */

function EnterForm({ onStart }: { onStart: () => void }) {
  const { enterKhalwa } = useKhalwaState();
  const [intention, setIntention] = useState<KhalwaIntention>("thinking");
  const [note, setNote] = useState("");

  const handleStart = () => {
    enterKhalwa(intention, note.trim());
    onStart();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-5">
      {/* Intention */}
      <div>
        <label className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-3 block text-center">اختر مقام الخلوة</label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(INTENTION_META) as KhalwaIntention[]).map((k) => {
            const m = INTENTION_META[k];
            const active = intention === k;
            return (
              <button
                key={k}
                onClick={() => setIntention(k)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                style={{
                  background: active ? `${m.color}15` : "rgba(15,23,42,0.6)",
                  border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                  boxShadow: active ? `0 0 20px ${m.color}20` : 'none'
                }}
              >
                <span className="text-2xl drop-shadow-md">{m.emoji}</span>
                <span className="text-[9px] font-black tracking-widest" style={{ color: active ? m.color : "#94a3b8" }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-3 block text-center">ما الذي تريد التركيز عليه؟ (اختياري)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="نية واحدة واضحة قبل الانعزال..."
          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-center text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors shadow-inner"
          dir="rtl"
        />
      </div>

      {/* Start */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleStart}
        className="w-full py-5 rounded-[2rem] font-black text-sm flex items-center justify-center gap-2 mt-8 group relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))",
          border: "1px solid rgba(139,92,246,0.4)",
          color: "#a78bfa",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
        <Moon className="w-5 h-5" />
        عبور بوابة الخلوة
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

type ViewMode = "home" | "history" | "active";

export default function KhalwaScreen() {
  const {
    activeSession,
    sessions,
    getTotalMinutes,
    getSessionCount,
    getStreak,
    getIntentionStats,
    getRecentSessions,
  } = useKhalwaState();

  const [viewMode, setViewMode] = useState<ViewMode>(activeSession ? "active" : "home");

  const stats = useMemo(
    () => ({
      totalMin: getTotalMinutes(),
      count: getSessionCount(),
      streak: getStreak(),
    }),
    [sessions] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const intentionStats = useMemo(() => getIntentionStats(), [sessions]); // eslint-disable-line react-hooks/exhaustive-deps
  const recent = useMemo(() => getRecentSessions(8), [sessions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSession) setViewMode("active");
  }, [activeSession]);

  if (viewMode === "active") {
    return <ActiveSessionView onExit={() => setViewMode("home")} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] font-sans pb-32 overflow-hidden relative" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-14 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-900/20 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              <Moon className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">خلوة</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">ملاذك الرقمي والصمت التام</p>
            </div>
          </div>
          <button
            onClick={() => setViewMode(viewMode === "history" ? "home" : "history")}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {viewMode === "home" ? (
            <motion.div key="home" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              {/* Stats Ribbon */}
              <div className="px-5 mb-8">
                <div className="flex justify-center gap-6 p-4 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-md">
                  <div className="text-center">
                    <span className="block text-2xl font-black text-white">{stats.totalMin}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">دقيقة عزلة</span>
                  </div>
                  <div className="w-px h-10 bg-slate-800" />
                  <div className="text-center">
                    <span className="block text-2xl font-black text-amber-400">{stats.streak}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">يوم متتالي</span>
                  </div>
                  <div className="w-px h-10 bg-slate-800" />
                  <div className="text-center">
                    <span className="block text-2xl font-black text-violet-400">{stats.count}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">خلوة</span>
                  </div>
                </div>
              </div>

              {/* Enter Form */}
              <EnterForm onStart={() => setViewMode("active")} />
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="px-5 space-y-3">
              <h3 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-4 text-center">سجل الخلوات السابقة</h3>
              {recent.length === 0 ? (
                <div className="py-20 flex flex-col items-center text-center opacity-50">
                  <Moon className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-sm text-slate-500 font-bold">لم تعبر بوابة الخلوة بعد.</p>
                </div>
              ) : (
                recent.map((s) => {
                  const m = INTENTION_META[s.intention];
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl p-4 flex items-center gap-4"
                      style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.3)" }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}
                      >
                        <span className="text-xl">{m.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-white">{m.label}</span>
                          {s.clarityScore && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-[9px] text-amber-400 font-bold">
                              <Star className="w-2.5 h-2.5" fill="#fbbf24" /> {s.clarityScore}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {fmtDate(s.startedAt)} • {fmtTime(s.durationSec)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Instructions */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.3 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-5 pointer-events-none"
      >
        <div className="p-4 rounded-2xl text-center">
          <p className="text-[10px] text-slate-600 font-black tracking-widest uppercase">
            الخلوة لا تقاس بالزمن.. بل بعمق الانقطاع
          </p>
        </div>
      </motion.div>
    </div>
  );
}
