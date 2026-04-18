/**
 * ورد — Wird Screen
 * Smart Dhikr & Tasbeeh Counter
 */

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useWirdState,
  CATEGORY_META,
  type DhikrCategory,
  type Dhikr,
} from "./store/wird.store";
import { Plus, X, RotateCcw, Check } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*          COUNTER MODAL                     */
/* ═══════════════════════════════════════════ */

function CounterModal({ dhikr, onClose }: { dhikr: Dhikr; onClose: () => void }) {
  const { getTodayCount, incrementCount, resetCount } = useWirdState();
  const count = getTodayCount(dhikr.id);
  const pct = Math.min((count / dhikr.target) * 100, 100);
  const completed = count >= dhikr.target;

  const handleTap = useCallback(() => {
    if (!completed) incrementCount(dhikr.id);
  }, [completed, dhikr.id, incrementCount]);

  const catMeta = CATEGORY_META[dhikr.category];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
        className="w-full max-w-sm rounded-3xl p-6 space-y-5 select-none"
        style={{ background: "#0a0f1f", border: `1px solid ${catMeta.color}20` }}
        onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase text-slate-600">{catMeta.label}</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dhikr Text */}
        <div className="text-center">
          <p className="text-xl font-black text-white leading-relaxed mb-1">{dhikr.text}</p>
          {dhikr.transliteration && (
            <p className="text-[10px] text-slate-500 italic">{dhikr.transliteration}</p>
          )}
          {dhikr.reward && (
            <p className="text-[9px] mt-2 px-3 py-1.5 rounded-lg inline-block"
              style={{ background: `${catMeta.color}10`, color: catMeta.color }}>
              🎁 {dhikr.reward}
            </p>
          )}
        </div>

        {/* Counter Circle — TAP AREA */}
        <motion.div whileTap={{ scale: 0.92 }} onClick={handleTap}
          className="relative w-48 h-48 mx-auto cursor-pointer flex items-center justify-center">

          {/* Background ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(51,65,85,0.2)" strokeWidth="6" />
            <motion.circle cx="96" cy="96" r="88" fill="none"
              stroke={completed ? "#22c55e" : catMeta.color}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - pct / 100)}
              transition={{ duration: 0.3 }} />
          </svg>

          {/* Glow */}
          {completed && (
            <div className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(34,197,94,0.08), transparent 65%)" }} />
          )}

          {/* Count */}
          <div className="text-center z-10">
            <motion.span key={count} initial={{ scale: 1.3, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black block"
              style={{ color: completed ? "#22c55e" : "#fff" }}>
              {count}
            </motion.span>
            <span className="text-[10px] text-slate-500 font-bold">/ {dhikr.target}</span>
          </div>
        </motion.div>

        {/* Completed badge */}
        <AnimatePresence>
          {completed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center">
              <span className="text-xs font-black text-green-400">✅ اكتمل الورد — بارك الله فيك</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => resetCount(dhikr.id)}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1"
            style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.3)", color: "#94a3b8" }}>
            <RotateCcw className="w-3 h-3" /> إعادة
          </button>
          <div className="flex-1 py-2.5 rounded-xl text-[10px] font-bold text-center"
            style={{ background: `${catMeta.color}08`, border: `1px solid ${catMeta.color}15`, color: catMeta.color }}>
            اضغط الدائرة للتسبيح
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*       ADD CUSTOM DHIKR MODAL               */
/* ═══════════════════════════════════════════ */

function AddDhikrModal({ onClose }: { onClose: () => void }) {
  const { addCustomDhikr } = useWirdState();
  const [text, setText] = useState("");
  const [target, setTarget] = useState("33");

  const handleAdd = () => {
    if (!text.trim()) return;
    addCustomDhikr({ text: text.trim(), target: parseInt(target) || 33 });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="w-full max-w-md rounded-3xl p-5 space-y-4"
        style={{ background: "#0f172a", border: "1px solid rgba(51,65,85,0.4)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white">✨ إضافة ذكر مخصص</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input value={text} onChange={(e) => setText(e.target.value)}
          placeholder="النص — مثلاً: سبحان الله العظيم"
          className="w-full bg-slate-800/30 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
          dir="rtl" />

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-bold">الهدف:</span>
          {["10", "33", "100"].map((v) => (
            <button key={v} onClick={() => setTarget(v)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: target === v ? "rgba(139,92,246,0.15)" : "rgba(30,41,59,0.4)",
                border: `1px solid ${target === v ? "rgba(139,92,246,0.3)" : "rgba(51,65,85,0.3)"}`,
                color: target === v ? "#8b5cf6" : "#64748b",
              }}>
              {v}
            </button>
          ))}
          <input value={target} onChange={(e) => setTarget(e.target.value)}
            className="w-16 bg-slate-800/30 border border-slate-700/30 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"
            type="number" min="1" />
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd}
          disabled={!text.trim()}
          className="w-full py-3 rounded-2xl text-sm font-black disabled:opacity-30 transition-all"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#8b5cf6" }}>
          ✨ أضف
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function WirdScreen() {
  const {
    adhkar, getTodayCount, getDailyTotal, getStreak,
    getTotalCompleted, setActiveCounter, activeCounterId,
    removeDhikr,
  } = useWirdState();

  const [showAdd, setShowAdd] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DhikrCategory | "all">("all");

  const dailyTotal = useMemo(() => getDailyTotal(), [getDailyTotal]);
  const streak = useMemo(() => getStreak(), [getStreak]);
  const totalCompleted = useMemo(() => getTotalCompleted(), [getTotalCompleted]);
  const activeDhikr = useMemo(() => adhkar.find((d) => d.id === activeCounterId), [adhkar, activeCounterId]);

  const filtered = useMemo(
    () => activeFilter === "all" ? adhkar : adhkar.filter((d) => d.category === activeFilter),
    [adhkar, activeFilter]
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-900/15 border border-purple-500/20">
            <span className="text-2xl">📿</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">ورد</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">أذكارك اليومية وتسبيحاتك</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "تسبيحة اليوم", value: dailyTotal, color: "#8b5cf6" },
            { label: "أوراد مكتملة", value: totalCompleted, color: "#22c55e" },
            { label: "سلسلة", value: `${streak} يوم`, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setActiveFilter("all")}
            className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: activeFilter === "all" ? "rgba(139,92,246,0.15)" : "rgba(30,41,59,0.4)",
              border: `1px solid ${activeFilter === "all" ? "rgba(139,92,246,0.3)" : "rgba(51,65,85,0.3)"}`,
              color: activeFilter === "all" ? "#8b5cf6" : "#64748b",
            }}>
            الكل
          </button>
          {(Object.keys(CATEGORY_META) as DhikrCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const active = activeFilter === cat;
            return (
              <button key={cat} onClick={() => setActiveFilter(cat)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                style={{
                  background: active ? `${meta.color}15` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? `${meta.color}30` : "rgba(51,65,85,0.3)"}`,
                  color: active ? meta.color : "#64748b",
                }}>
                <span>{meta.emoji}</span> {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Adhkar Grid */}
      <div className="relative z-10 px-5 space-y-2">
        {filtered.map((dhikr, idx) => {
          const count = getTodayCount(dhikr.id);
          const pct = Math.min((count / dhikr.target) * 100, 100);
          const completed = count >= dhikr.target;
          const catMeta = CATEGORY_META[dhikr.category];

          return (
            <motion.button key={dhikr.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setActiveCounter(dhikr.id)}
              className="w-full rounded-xl p-3.5 flex items-center gap-3 transition-all active:scale-[0.98] group relative overflow-hidden text-right"
              style={{
                background: completed ? "rgba(34,197,94,0.04)" : `${catMeta.color}03`,
                border: `1px solid ${completed ? "rgba(34,197,94,0.15)" : `${catMeta.color}10`}`,
              }}>

              {/* Progress bar background */}
              <div className="absolute inset-0 opacity-30"
                style={{
                  background: `linear-gradient(to left, ${completed ? "#22c55e" : catMeta.color}08, transparent)`,
                  width: `${pct}%`,
                }} />

              {/* Counter badge */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative z-10"
                style={{
                  background: completed ? "rgba(34,197,94,0.12)" : `${catMeta.color}10`,
                  border: `1px solid ${completed ? "rgba(34,197,94,0.2)" : `${catMeta.color}15`}`,
                }}>
                {completed ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <span className="text-sm font-black" style={{ color: catMeta.color }}>{count}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 relative z-10">
                <span className="text-sm font-bold text-white block truncate">{dhikr.text}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] font-bold" style={{ color: catMeta.color }}>
                    {catMeta.emoji} {completed ? "اكتمل" : `${count}/${dhikr.target}`}
                  </span>
                  {dhikr.isCustom && (
                    <button onClick={(e) => { e.stopPropagation(); removeDhikr(dhikr.id); }}
                      className="text-[8px] text-red-500/50 opacity-0 group-hover:opacity-100">
                      حذف
                    </button>
                  )}
                </div>
              </div>

              {/* Mini progress */}
              <div className="w-8 relative z-10">
                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      background: completed ? "#22c55e" : catMeta.color,
                    }} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          📿 ورد — لسانك رطب بذكر الله — أقرب ما يكون العبد من ربه
        </p>
      </motion.div>

      {/* FAB */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)}
        className="fixed bottom-24 left-5 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", boxShadow: "0 4px 20px rgba(139,92,246,0.3)" }}>
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {activeDhikr && <CounterModal dhikr={activeDhikr} onClose={() => setActiveCounter(null)} />}
        {showAdd && <AddDhikrModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
