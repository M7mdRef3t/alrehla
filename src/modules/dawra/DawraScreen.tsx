import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDawraState, CYCLE_META, PHASE_META, type CycleType } from "./store/dawra.store";
import { RefreshCw, Plus, X } from "lucide-react";

const DAYS_SHORT = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

function AddCycleModal({ onClose }: { onClose: () => void }) {
  const { addEntry } = useDawraState();
  const [type, setType] = useState<CycleType>("energy");
  const [value, setValue] = useState(5);
  const [note, setNote] = useState("");
  const meta = CYCLE_META[type];
  const handleSubmit = () => { addEntry(type, value, note); onClose(); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: `1px solid ${meta.color}20` }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-base font-black text-white mb-4 text-center">🔄 تسجيل دورة</h2>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {(Object.keys(CYCLE_META) as CycleType[]).map(t => { const m = CYCLE_META[t]; const a = type === t; return (
            <button key={t} onClick={() => setType(t)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all" style={{ background: a ? `${m.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}30` : "rgba(51,65,85,0.2)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-1"><span>الشدة</span><span style={{ color: meta.color }}>{value}/10</span></div>
          <input type="range" min={1} max={10} value={value} onChange={e => setValue(Number(e.target.value))} className="w-full accent-amber-500 h-2" />
          <div className="flex justify-between text-[7px] text-slate-600 mt-0.5"><span>أدنى</span><span>أعلى</span></div>
        </div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظة (اختياري)..." className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none" />
        <button onClick={handleSubmit} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25`, color: meta.color }}>سجّل الدورة 🔄</button>
      </motion.div>
    </motion.div>
  );
}

export default function DawraScreen() {
  const { entries, getAllPatterns, getToday, getTotalEntries, getBestDay, getWorstDay } = useDawraState();
  const [showAdd, setShowAdd] = useState(false);
  const [activeCycle, setActiveCycle] = useState<CycleType | "all">("all");
  const patterns = useMemo(() => getAllPatterns(), [getAllPatterns]);
  const todayEntries = useMemo(() => getToday(), [getToday]);
  const total = useMemo(() => getTotalEntries(), [getTotalEntries]);
  const displayed = activeCycle === "all" ? patterns : patterns.filter(p => p.type === activeCycle);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05), transparent 65%)" }} /></div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-900/15 border border-indigo-500/20"><RefreshCw className="w-6 h-6 text-indigo-400" /></div>
            <div><h1 className="text-2xl font-black text-white tracking-tight">دورة</h1><p className="text-xs text-slate-500 font-medium mt-0.5">اكتشف إيقاعاتك الشخصية</p></div>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"><Plus className="w-4 h-4" /></button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-4 flex gap-3">
        {[
          { label: "تسجيلات", value: total, color: "#6366f1" },
          { label: "اليوم", value: todayEntries.length, color: "#22c55e" },
          { label: "دورات", value: patterns.filter(p => p.avgByDay.some(v => v > 0)).length, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[8px] text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="relative z-10 px-5 mb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveCycle("all")} className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all" style={{ background: activeCycle === "all" ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.4)", border: `1px solid ${activeCycle === "all" ? "rgba(99,102,241,0.3)" : "rgba(51,65,85,0.3)"}`, color: activeCycle === "all" ? "#818cf8" : "#64748b" }}>الكل</button>
          {(Object.keys(CYCLE_META) as CycleType[]).map(t => { const m = CYCLE_META[t]; const a = activeCycle === t; return (
            <button key={t} onClick={() => setActiveCycle(a ? "all" : t)} className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all" style={{ background: a ? `${m.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}30` : "rgba(51,65,85,0.3)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
      </div>

      {/* Cycle Cards */}
      <div className="relative z-10 px-5 space-y-3">
        {displayed.map((p, idx) => {
          const cm = CYCLE_META[p.type]; const pm = PHASE_META[p.currentPhase];
          const hasData = p.avgByDay.some(v => v > 0); const maxVal = Math.max(...p.avgByDay, 1);
          const best = getBestDay(p.type); const worst = getWorstDay(p.type);
          return (
            <motion.div key={p.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `${cm.color}04`, border: `1px solid ${cm.color}12` }}>
              <div className="absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full -mr-8 -mt-8" style={{ background: `${cm.color}06` }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cm.emoji}</span>
                    <span className="text-sm font-black text-white">{cm.label}</span>
                  </div>
                  {hasData && (
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${pm.color}15`, color: pm.color }}>{pm.emoji} {pm.label}</span>
                      <span className="text-[8px] font-bold" style={{ color: p.trend === "up" ? "#22c55e" : p.trend === "down" ? "#ef4444" : "#f59e0b" }}>{p.trend === "up" ? "📈" : p.trend === "down" ? "📉" : "➡️"}</span>
                    </div>
                  )}
                </div>
                {hasData ? (
                  <>
                    <div className="flex gap-1 items-end h-16 mb-2">
                      {p.avgByDay.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${v > 0 ? (v / maxVal) * 100 : 5}%` }} transition={{ delay: idx * 0.05 + i * 0.03, duration: 0.5 }} className="w-full rounded-t-sm" style={{ background: v > 0 ? cm.color : "rgba(51,65,85,0.3)", minHeight: "3px", opacity: v > 0 ? 0.7 : 0.3 }} />
                          <span className="text-[6px] text-slate-600 font-bold">{DAYS_SHORT[i]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 text-[8px]">
                      <span className="text-slate-500">⭐ أفضل يوم: <strong className="text-white/80">{best}</strong></span>
                      <span className="text-slate-500">⚠ أضعف يوم: <strong className="text-white/80">{worst}</strong></span>
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] text-slate-600 text-center py-3">لا بيانات — سجّل لتكتشف نمطك</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="relative z-10 mx-5 mt-4 rounded-2xl p-8 text-center" style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.2)" }}>
          <span className="text-5xl block mb-3">🔄</span>
          <p className="text-sm text-white/80 font-bold">اكتشف إيقاعاتك</p>
          <p className="text-[10px] text-slate-500 mt-1">سجّل طاقتك ومزاجك يومياً لتكتشف أنماطك المتكررة</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 px-4 py-2 rounded-xl text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">ابدأ التتبع 🔄</button>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600">🔄 دورة — اعرف إيقاعك... واستثمر ذروتك</p>
      </motion.div>

      <AnimatePresence>{showAdd && <AddCycleModal onClose={() => setShowAdd(false)} />}</AnimatePresence>
    </div>
  );
}
