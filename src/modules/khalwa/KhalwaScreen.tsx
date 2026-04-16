/**
 * خلوة — Khalwa Screen
 * Deep Focus Mode — enter isolation, set intention, flow, reflect
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useKhalwaState,
  INTENTION_META,
  type KhalwaIntention,
} from "./store/khalwa.store";
import {
  Moon,
  Sun,
  Timer,
  Star,
  X,
  Play,
  History,
  Zap,
} from "lucide-react";

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
/*         ACTIVE SESSION (IMMERSIVE)         */
/* ═══════════════════════════════════════════ */

function ActiveSessionView({ onExit }: { onExit: () => void }) {
  const { activeSession } = useKhalwaState();
  const [elapsed, setElapsed] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [reflection, setReflection] = useState("");
  const [clarity, setClarity] = useState(3);
  const { exitKhalwa } = useKhalwaState();

  useEffect(() => {
    if (!activeSession) return;
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeSession.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [activeSession]);

  if (!activeSession) return null;
  const meta = INTENTION_META[activeSession.intention];

  const handleExit = () => {
    exitKhalwa(reflection, clarity);
    onExit();
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
        <p className="text-xs text-slate-500">قضيت {fmtTime(elapsed)} في {meta.label}</p>

        {/* Clarity Score */}
        <div className="w-full max-w-xs">
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
          onClick={handleExit}
          className="w-full max-w-xs py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "#10b981",
          }}
        >
          <Sun className="w-4 h-4" />
          إنهاء الخلوة
        </motion.button>
      </motion.div>
    );
  }

  // Immersive flow view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(circle at 50% 40%, rgba(30,20,60,0.98), #020617)" }}
      dir="rtl"
    >
      {/* Breathing ambient particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1 + "px",
            height: Math.random() * 3 + 1 + "px",
            background: meta.color,
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
          }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      {/* Timer orb */}
      <motion.div
        className="relative w-44 h-44 rounded-full flex items-center justify-center"
        style={{
          background: `${meta.color}08`,
          border: `2px solid ${meta.color}30`,
          boxShadow: `0 0 80px ${meta.color}15`,
        }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${meta.color}` }}
          animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="text-center">
          <span className="text-4xl font-mono font-black text-white tracking-wider">{fmtTime(elapsed)}</span>
          <p className="text-[10px] mt-1 font-medium" style={{ color: meta.color }}>
            {meta.emoji} {meta.label}
          </p>
        </div>
      </motion.div>

      {/* Intention note */}
      {activeSession.intentionNote && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 text-sm text-slate-400 max-w-xs text-center leading-relaxed"
        >
          «{activeSession.intentionNote}»
        </motion.p>
      )}

      {/* Exit button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setExiting(true)}
        className="mt-12 px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8",
        }}
      >
        <Sun className="w-3.5 h-3.5" />
        الخروج من الخلوة
      </motion.button>
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
        <label className="text-xs text-slate-500 font-bold mb-3 block">نية الخلوة</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(INTENTION_META) as KhalwaIntention[]).map((k) => {
            const m = INTENTION_META[k];
            const active = intention === k;
            return (
              <button
                key={k}
                onClick={() => setIntention(k)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                style={{
                  background: active ? `${m.color}15` : "rgba(15,23,42,0.6)",
                  border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                }}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[10px] font-bold" style={{ color: active ? m.color : "#94a3b8" }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="text-xs text-slate-500 font-bold mb-2 block">ما الذي تريد التركيز عليه؟</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="اختياري — نية واحدة واضحة..."
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
          dir="rtl"
        />
      </div>

      {/* Start */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleStart}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))",
          border: "1px solid rgba(139,92,246,0.3)",
          color: "#a78bfa",
        }}
      >
        <Moon className="w-4 h-4" />
        ادخل الخلوة
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
    [sessions]
  );

  const intentionStats = useMemo(() => getIntentionStats(), [sessions]);
  const recent = useMemo(() => getRecentSessions(8), [sessions]);

  // If there's an active session on mount, show it
  useEffect(() => {
    if (activeSession) setViewMode("active");
  }, [activeSession]);

  if (viewMode === "active") {
    return <ActiveSessionView onExit={() => setViewMode("home")} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.06),transparent_60%)] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-900/20 border border-violet-500/20">
              <Moon className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">خلوة</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">وضع التركيز العميق</p>
            </div>
          </div>
          <button
            onClick={() => setViewMode(viewMode === "history" ? "home" : "history")}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/40 border border-slate-700/30 text-slate-400"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "إجمالي الدقائق", value: stats.totalMin, icon: <Timer className="w-3.5 h-3.5" />, color: "#a78bfa" },
            { label: "جلسات", value: stats.count, icon: <Moon className="w-3.5 h-3.5" />, color: "#8b5cf6" },
            { label: "أيام متتالية", value: stats.streak, icon: <Zap className="w-3.5 h-3.5" />, color: "#fbbf24" },
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

      <AnimatePresence mode="wait">
        {viewMode === "home" ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Intention distribution */}
            {stats.count > 0 && (
              <div className="px-5 mb-5">
                <h3 className="text-xs text-slate-500 font-bold mb-3">توزيع النيات</h3>
                <div className="flex gap-1.5">
                  {(Object.keys(INTENTION_META) as KhalwaIntention[]).map((k) => {
                    const m = INTENTION_META[k];
                    const count = intentionStats[k];
                    const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <motion.div
                        key={k}
                        className="rounded-lg h-8 flex items-center justify-center"
                        style={{
                          width: `${Math.max(pct, 12)}%`,
                          background: `${m.color}20`,
                          border: `1px solid ${m.color}40`,
                        }}
                        title={`${m.label}: ${count}`}
                      >
                        <span className="text-xs">{m.emoji}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Enter Form */}
            <EnterForm onStart={() => setViewMode("active")} />
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 space-y-3">
            <h3 className="text-xs text-slate-500 font-bold mb-2">آخر الجلسات</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-10">لا توجد جلسات بعد</p>
            ) : (
              recent.map((s) => {
                const m = INTENTION_META[s.intention];
                return (
                  <div
                    key={s.id}
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}
                    >
                      <span className="text-sm">{m.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{m.label}</span>
                        {s.clarityScore && (
                          <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                            <Star className="w-2.5 h-2.5" fill="#fbbf24" /> {s.clarityScore}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {fmtDate(s.startedAt)} • {fmtTime(s.durationSec)}
                      </p>
                    </div>
                    {s.exitReflection && (
                      <p className="text-[9px] text-slate-400 max-w-[100px] truncate">{s.exitReflection}</p>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}
      >
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🧘 الخلوة مساحة للعزلة الواعية — ادخل بنية، واخرج بوضوح
        </p>
      </motion.div>
    </div>
  );
}
