import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRaseedState, DIMENSION_META, type CapitalDimension } from "./store/raseed.store";
import { Coins, TrendingUp, Trophy, Sparkles, Plus, X } from "lucide-react";

function AddXpModal({ onClose }: { onClose: () => void }) {
  const { addXp } = useRaseedState();
  const [dim, setDim] = useState<CapitalDimension>("awareness");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(10);
  const meta = DIMENSION_META[dim];
  const handleSubmit = () => { if (!label.trim()) return; addXp("manual", dim, amount, label.trim()); onClose(); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: `1px solid ${meta.color}20` }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-base font-black text-white mb-4 text-center">🪙 إضافة رصيد</h2>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {(Object.keys(DIMENSION_META) as CapitalDimension[]).map(d => { const m = DIMENSION_META[d]; const a = dim === d; return (
            <button key={d} onClick={() => setDim(d)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all" style={{ background: a ? `${m.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}30` : "rgba(51,65,85,0.2)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="ماذا فعلت؟ مثال: تأمل 10 دقائق" className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <div className="mb-3">
          <span className="text-[9px] text-slate-500 font-bold block mb-1">النقاط: {amount} XP</span>
          <div className="flex gap-2">
            {[5, 10, 15, 25, 50].map(v => (
              <button key={v} onClick={() => setAmount(v)} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all" style={{ background: amount === v ? `${meta.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${amount === v ? `${meta.color}30` : "rgba(51,65,85,0.2)"}`, color: amount === v ? meta.color : "#64748b" }}>+{v}</button>
            ))}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={!label.trim()} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25`, color: meta.color }}>أضف الرصيد 🪙</button>
      </motion.div>
    </motion.div>
  );
}

export default function RaseedScreen() {
  const { xp, level, capitals, achievements, getXpForNext, getTopDimension, getWeakest, getRecentEvents, getTodayXp, getBalance } = useRaseedState();
  const [showAdd, setShowAdd] = useState(false);
  const xpNext = useMemo(() => getXpForNext(), [getXpForNext]);
  const topDim = useMemo(() => getTopDimension(), [getTopDimension]);
  const weakDim = useMemo(() => getWeakest(), [getWeakest]);
  const recent = useMemo(() => getRecentEvents(15), [getRecentEvents]);
  const todayXp = useMemo(() => getTodayXp(), [getTodayXp]);
  const balance = useMemo(() => getBalance(), [getBalance]);
  const totalCap = Object.values(capitals).reduce((a, v) => a + v, 0);
  const maxCap = Math.max(...Object.values(capitals), 1);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 65%)" }} /></div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-900/15 border border-amber-500/20"><Coins className="w-6 h-6 text-amber-400" /></div>
            <div><h1 className="text-2xl font-black text-white tracking-tight">رصيد</h1><p className="text-xs text-slate-500 font-medium mt-0.5">رأس مالك النفسي</p></div>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400"><Plus className="w-4 h-4" /></button>
        </div>
      </motion.div>

      {/* Level + XP */}
      <div className="relative z-10 px-5 mb-4">
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(234,179,8,0.03))", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div className="absolute top-0 right-0 w-40 h-40 blur-3xl rounded-full -mr-16 -mt-16 bg-amber-500/8" />
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div><span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">المستوى</span><div className="text-4xl font-black text-white mt-1">{level}</div></div>
            <div className="text-left"><span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">الرصيد الكلي</span><div className="text-2xl font-black text-amber-400 mt-1">{xp.toLocaleString()} <span className="text-sm">XP</span></div></div>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between text-[8px] text-slate-500 mb-1"><span>المستوى التالي</span><span>{xpNext.current}/{xpNext.needed} XP</span></div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${xpNext.progress}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400" /></div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="relative z-10 px-5 mb-4 flex gap-3">
        {[
          { label: "اليوم", value: `+${todayXp}`, color: "#22c55e" },
          { label: "التوازن", value: `${balance}%`, color: balance >= 60 ? "#22c55e" : "#f59e0b" },
          { label: "إنجازات", value: achievements.length, color: "#ec4899" },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[8px] text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Capital Radar */}
      <div className="relative z-10 px-5 mb-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">أبعاد رأس المال النفسي</h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(DIMENSION_META) as CapitalDimension[]).map(d => {
            const m = DIMENSION_META[d]; const val = capitals[d]; const pct = maxCap > 0 ? Math.round((val / maxCap) * 100) : 0;
            const isTop = d === topDim && totalCap > 0; const isWeak = d === weakDim && totalCap > 0;
            return (
              <div key={d} className="rounded-xl p-3 text-center transition-all" style={{ background: isTop ? `${m.color}08` : "rgba(15,23,42,0.4)", border: `1px solid ${isTop ? `${m.color}20` : "rgba(51,65,85,0.2)"}` }}>
                <span className="text-xl block">{m.emoji}</span>
                <span className="text-[9px] font-bold text-white/80 block mt-1">{m.label}</span>
                <div className="text-sm font-black mt-1" style={{ color: m.color }}>{val}</div>
                <div className="w-full h-1 rounded-full bg-slate-800 mt-1.5 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: m.color }} /></div>
                {isTop && <span className="text-[6px] font-bold text-amber-400 mt-1 block">⭐ الأقوى</span>}
                {isWeak && !isTop && totalCap > 0 && <span className="text-[6px] font-bold text-red-400 mt-1 block">⚠ يحتاج تقوية</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="relative z-10 px-5 mb-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">🏆 الإنجازات</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {achievements.map(a => (
              <div key={a.id} className="shrink-0 w-20 rounded-xl p-2.5 text-center" style={{ background: `${DIMENSION_META[a.dimension].color}08`, border: `1px solid ${DIMENSION_META[a.dimension].color}15` }}>
                <span className="text-2xl block">{a.emoji}</span>
                <span className="text-[7px] font-bold text-white/80 block mt-1 truncate">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent XP */}
      <div className="relative z-10 px-5">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">آخر الأنشطة</h3>
        <div className="space-y-1.5">
          {recent.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(245,158,11,0.04)", border: "1px dashed rgba(245,158,11,0.2)" }}>
              <span className="text-5xl block mb-3">🪙</span>
              <p className="text-sm text-white/80 font-bold">رصيدك فارغ</p>
              <p className="text-[10px] text-slate-500 mt-1">كل فعل واعي يضيف لرصيدك النفسي</p>
              <button onClick={() => setShowAdd(true)} className="mt-3 px-4 py-2 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">أضف أول رصيد 🪙</button>
            </div>
          ) : recent.map((ev, idx) => {
            const dm = DIMENSION_META[ev.dimension];
            return (
              <motion.div key={ev.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }} className="rounded-lg p-2.5 flex items-center gap-2.5" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.15)" }}>
                <span className="text-base">{dm.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/80 font-medium truncate">{ev.label}</p>
                  <span className="text-[7px] text-slate-600">{ev.source} · {ev.date}</span>
                </div>
                <span className="text-xs font-black shrink-0" style={{ color: dm.color }}>+{ev.amount}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600">🪙 رصيد — كل فعل واعي يُثري رأس مالك النفسي</p>
      </motion.div>

      <AnimatePresence>{showAdd && <AddXpModal onClose={() => setShowAdd(false)} />}</AnimatePresence>
    </div>
  );
}
