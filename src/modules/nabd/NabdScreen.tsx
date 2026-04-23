import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNabdState, MOOD_META, ENERGY_META, type MoodLevel, type EnergyLevel } from "./store/nabd.store";
import { Activity, Flame, X } from "lucide-react";

function PulseModal({ onClose }: { onClose: () => void }) {
  const { addPulse } = useNabdState();
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [note, setNote] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const handleSubmit = () => { if (mood && energy) { addPulse(mood, energy, note); onClose(); } };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.92)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="w-full max-w-sm rounded-3xl p-6 relative" style={{ background: "#0a0f1f", border: "1px solid rgba(239,68,68,0.12)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500 z-10"><X className="w-3.5 h-3.5" /></button>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
            <span className="text-4xl block mb-3">💓</span>
            <h2 className="text-lg font-black text-white mb-1">كيف مزاجك الآن؟</h2>
            <p className="text-[10px] text-slate-500 mb-5">اختر اللي يوصف حالتك</p>
            <div className="flex gap-2 justify-center">
              {([1,2,3,4,5] as MoodLevel[]).map(m => { const meta = MOOD_META[m]; const a = mood === m; return (
                <button key={m} onClick={() => { setMood(m); setTimeout(() => setStep(2), 200); }} className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all" style={{ background: a ? `${meta.color}18` : "rgba(30,41,59,0.5)", border: `2px solid ${a ? meta.color : "rgba(51,65,85,0.2)"}`, transform: a ? "scale(1.15)" : "scale(1)" }}>
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-[6px] font-bold mt-0.5" style={{ color: a ? meta.color : "#475569" }}>{meta.label}</span>
                </button>
              ); })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
            <span className="text-4xl block mb-3">⚡</span>
            <h2 className="text-lg font-black text-white mb-1">مستوى طاقتك؟</h2>
            <p className="text-[10px] text-slate-500 mb-5">كم عندك طاقة دلوقتي</p>
            <div className="flex gap-2 justify-center">
              {([1,2,3,4,5] as EnergyLevel[]).map(e => { const meta = ENERGY_META[e]; const a = energy === e; return (
                <button key={e} onClick={() => { setEnergy(e); setTimeout(() => setStep(3), 200); }} className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all" style={{ background: a ? `${meta.color}18` : "rgba(30,41,59,0.5)", border: `2px solid ${a ? meta.color : "rgba(51,65,85,0.2)"}`, transform: a ? "scale(1.15)" : "scale(1)" }}>
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-[6px] font-bold mt-0.5" style={{ color: a ? meta.color : "#475569" }}>{meta.label}</span>
                </button>
              ); })}
            </div>
            <button onClick={() => setStep(1)} className="mt-3 text-[9px] text-slate-600 underline">رجوع</button>
          </motion.div>
        )}

        {step === 3 && mood && energy && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
            <div className="flex justify-center gap-3 mb-3">
              <span className="text-3xl">{MOOD_META[mood].emoji}</span>
              <span className="text-3xl">{ENERGY_META[energy].emoji}</span>
            </div>
            <h2 className="text-base font-black text-white mb-1">حابب تضيف ملاحظة؟</h2>
            <p className="text-[10px] text-slate-500 mb-3">(اختياري)</p>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="كلمة أو جملة..." className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white text-center placeholder:text-slate-600 mb-3 outline-none" />
            <button onClick={handleSubmit} className="w-full py-3 rounded-xl text-sm font-bold transition-all" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>سجّل النبض 💓</button>
            <button onClick={() => setStep(2)} className="mt-2 text-[9px] text-slate-600 underline">رجوع</button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function NabdScreen() {
  const { pulses, getToday, getTodayAvg, getWeekTrend, getStreak, getTotalPulses, hasCheckedToday } = useNabdState();
  const [showPulse, setShowPulse] = useState(false);
  const todayPulses = useMemo(() => getToday(), [getToday]);
  const todayAvg = useMemo(() => getTodayAvg(), [getTodayAvg]);
  const weekTrend = useMemo(() => getWeekTrend(), [getWeekTrend]);
  const streak = useMemo(() => getStreak(), [getStreak]);
  const checked = useMemo(() => hasCheckedToday(), [hasCheckedToday]);
  const moodColor = todayAvg.mood >= 4 ? "#22c55e" : todayAvg.mood >= 2.5 ? "#f59e0b" : todayAvg.mood > 0 ? "#ef4444" : "#334155";
  const energyColor = todayAvg.energy >= 4 ? "#22c55e" : todayAvg.energy >= 2.5 ? "#f59e0b" : todayAvg.energy > 0 ? "#ef4444" : "#334155";

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.05), transparent 65%)" }} /></div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-900/15 border border-red-500/20"><Activity className="w-6 h-6 text-red-400" /></div>
            <div><h1 className="text-2xl font-black text-white tracking-tight">نبض</h1><p className="text-xs text-slate-500 font-medium mt-0.5">فحص مزاجك وطاقتك — 5 ثواني</p></div>
          </div>
          <button onClick={() => setShowPulse(true)} className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all" style={{ background: checked ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.12)", border: `1px solid ${checked ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: checked ? "#22c55e" : "#f87171" }}>
            {checked ? "✅ سجّلت" : "💓 سجّل نبضك"}
          </button>
        </div>
      </motion.div>

      {/* Today pulse */}
      <div className="relative z-10 px-5 mb-4">
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.1)" }}>
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-12 -mt-12 bg-red-500/5" />
          {todayAvg.mood > 0 ? (
            <div className="relative z-10 flex items-center justify-around">
              <div className="text-center">
                <span className="text-3xl block">{MOOD_META[Math.round(todayAvg.mood) as MoodLevel]?.emoji || "😐"}</span>
                <div className="text-xl font-black mt-1" style={{ color: moodColor }}>{todayAvg.mood}</div>
                <span className="text-[8px] text-slate-500 font-bold">المزاج</span>
              </div>
              <div className="w-px h-12 bg-slate-800" />
              <div className="text-center">
                <span className="text-3xl block">{ENERGY_META[Math.round(todayAvg.energy) as EnergyLevel]?.emoji || "⚡"}</span>
                <div className="text-xl font-black mt-1" style={{ color: energyColor }}>{todayAvg.energy}</div>
                <span className="text-[8px] text-slate-500 font-bold">الطاقة</span>
              </div>
              <div className="w-px h-12 bg-slate-800" />
              <div className="text-center">
                <span className="text-3xl block">📊</span>
                <div className="text-xl font-black mt-1 text-white">{todayPulses.length}</div>
                <span className="text-[8px] text-slate-500 font-bold">نبضات اليوم</span>
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center py-4">
              <span className="text-4xl block mb-2">💓</span>
              <p className="text-sm text-white/80 font-bold">لم تسجّل نبضك اليوم</p>
              <p className="text-[10px] text-slate-500 mt-1">5 ثواني فقط — اضغط الزر وسجّل</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-3">
          {[
            { label: "إجمالي النبضات", value: getTotalPulses(), color: "#6366f1" },
            { label: "سلسلة", value: `${streak} 🔥`, color: "#ef4444" },
            { label: "نبضات اليوم", value: todayPulses.length, color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Week Trend */}
      <div className="relative z-10 px-5 mb-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">اتجاه الأسبوع</h3>
        <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(51,65,85,0.2)" }}>
          <div className="flex gap-1 items-end justify-between h-24">
            {weekTrend.map((d, i) => {
              const mH = d.mood > 0 ? (d.mood / 5) * 100 : 5;
              const eH = d.energy > 0 ? (d.energy / 5) * 100 : 5;
              const dayName = new Date(d.date).toLocaleDateString("ar-EG", { weekday: "short" });
              const isToday = d.date === new Date().toISOString().slice(0, 10);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex gap-[2px] items-end h-16">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${mH}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} className="w-2.5 rounded-full" style={{ background: d.mood > 0 ? (d.mood >= 4 ? "#22c55e" : d.mood >= 2.5 ? "#f59e0b" : "#ef4444") : "rgba(51,65,85,0.3)", minHeight: "3px" }} />
                    <motion.div initial={{ height: 0 }} animate={{ height: `${eH}%` }} transition={{ delay: i * 0.05 + 0.1, duration: 0.5 }} className="w-2.5 rounded-full" style={{ background: d.energy > 0 ? (d.energy >= 4 ? "#6366f1" : d.energy >= 2.5 ? "#8b5cf6" : "#a855f7") : "rgba(51,65,85,0.3)", minHeight: "3px" }} />
                  </div>
                  <span className={`text-[7px] font-bold ${isToday ? "text-red-400" : "text-slate-600"}`}>{dayName}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="text-[7px] text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> مزاج</span>
            <span className="text-[7px] text-slate-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> طاقة</span>
          </div>
        </div>
      </div>

      {/* Recent pulses */}
      <div className="relative z-10 px-5">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">آخر النبضات</h3>
        <div className="space-y-2">
          {pulses.slice(0, 10).map((p, idx) => {
            const mm = MOOD_META[p.mood]; const em = ENERGY_META[p.energy];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.15)" }}>
                <div className="flex gap-1"><span className="text-lg">{mm.emoji}</span><span className="text-lg">{em.emoji}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${mm.color}10`, color: mm.color }}>{mm.label}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${em.color}10`, color: em.color }}>{em.label}</span>
                  </div>
                  {p.note && <p className="text-[10px] text-white/60 mt-0.5 truncate">{p.note}</p>}
                </div>
                <div className="text-left shrink-0"><span className="text-[8px] text-slate-600 block">{p.time}</span><span className="text-[7px] text-slate-700">{p.date}</span></div>
              </motion.div>
            );
          })}
          {pulses.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(239,68,68,0.04)", border: "1px dashed rgba(239,68,68,0.2)" }}>
              <span className="text-5xl block mb-3">💓</span>
              <p className="text-sm text-white/80 font-bold">سجّل أول نبض</p>
              <p className="text-[10px] text-slate-500 mt-1">5 ثواني فقط — مزاج + طاقة = نبض</p>
            </div>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600">⚡ نبض — خمس ثواني تكشف حالتك الحقيقية</p>
      </motion.div>

      {/* FAB */}
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} onClick={() => setShowPulse(true)} className="fixed bottom-24 left-5 w-14 h-14 rounded-2xl flex items-center justify-center z-40 shadow-lg shadow-red-500/20" style={{ background: "linear-gradient(135deg, #ef4444, #f97316)", border: "1px solid rgba(239,68,68,0.4)" }}>
        <Activity className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>{showPulse && <PulseModal onClose={() => setShowPulse(false)} />}</AnimatePresence>
    </div>
  );
}
