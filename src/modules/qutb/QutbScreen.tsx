import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQutbState, PILLAR_META, ALIGNMENT_META, type PillarCategory, type AlignmentLevel } from "./store/qutb.store";
import { Navigation, Plus, X, Star, Edit3 } from "lucide-react";

function NorthStarModal({ onClose }: { onClose: () => void }) {
  const { northStar, setNorthStar } = useQutbState();
  const [text, setText] = useState(northStar?.statement || "");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.92)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md rounded-3xl p-6 relative" style={{ background: "#08081a", border: "1px solid rgba(245,158,11,0.15)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <div className="text-center mb-4"><span className="text-4xl block mb-2">⭐</span><h2 className="text-base font-black text-white">نجمك القطبي</h2><p className="text-[9px] text-slate-500 mt-1">الهدف الأعلى الذي يوجّه كل شيء في حياتك</p></div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="مثال: أعيش حياة ذات معنى أُلهم فيها الآخرين ليكتشفوا أنفسهم..." rows={3} className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white text-center placeholder:text-slate-600 mb-3 outline-none resize-none leading-relaxed" />
        <button onClick={() => { if (text.trim().length > 5) { setNorthStar(text); onClose(); } }} disabled={text.trim().length <= 5} className="w-full py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-30" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>{northStar ? "تحديث القطب ⭐" : "ثبّت قطبك ⭐"}</button>
      </motion.div>
    </motion.div>
  );
}

function AddPillarModal({ onClose }: { onClose: () => void }) {
  const { addPillar } = useQutbState();
  const [cat, setCat] = useState<PillarCategory>("being");
  const [name, setName] = useState("");
  const [why, setWhy] = useState("");
  const m = PILLAR_META[cat];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#08081a", border: `1px solid ${m.color}15` }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-base font-black text-white mb-3 text-center">🏛️ ركيزة جديدة</h2>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {(Object.keys(PILLAR_META) as PillarCategory[]).map(c => { const cm = PILLAR_META[c]; const a = cat === c; return (
            <button key={c} onClick={() => setCat(c)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all" style={{ background: a ? `${cm.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${cm.color}30` : "rgba(51,65,85,0.15)"}`, color: a ? cm.color : "#64748b" }}>{cm.emoji} {cm.label}</button>
          ); })}
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الركيزة..." className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <input value={why} onChange={e => setWhy(e.target.value)} placeholder="لماذا هي مهمة لقطبك؟" className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none" />
        <button onClick={() => { if (name.trim()) { addPillar(cat, name, why); onClose(); } }} disabled={!name.trim()} className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-30" style={{ background: `${m.color}12`, border: `1px solid ${m.color}20`, color: m.color }}>أضف الركيزة 🏛️</button>
      </motion.div>
    </motion.div>
  );
}

function AlignCheckModal({ pillars, onClose }: { pillars: { id: string; name: string }[]; onClose: () => void }) {
  const { addCheck } = useQutbState();
  const [action, setAction] = useState("");
  const [alignment, setAlignment] = useState<AlignmentLevel>(3);
  const [pillarId, setPillarId] = useState("");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#08081a", border: "1px solid rgba(245,158,11,0.12)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-sm font-black text-white mb-3 text-center">🧭 فحص المحاذاة</h2>
        <input value={action} onChange={e => setAction(e.target.value)} placeholder="ماذا فعلت؟ مثال: قرأت كتاب، ساعدت شخص..." className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <div className="flex gap-1.5 mb-2">{([1,2,3,4,5] as AlignmentLevel[]).map(a => { const am = ALIGNMENT_META[a]; const active = alignment === a; return (
          <button key={a} onClick={() => setAlignment(a)} className="flex-1 py-2 rounded-lg text-center transition-all" style={{ background: active ? `${am.color}15` : "rgba(30,41,59,0.4)", border: `1.5px solid ${active ? am.color : "rgba(51,65,85,0.15)"}` }}>
            <span className="text-sm block">{am.emoji}</span><span className="text-[5px] font-bold" style={{ color: active ? am.color : "#475569" }}>{am.label}</span>
          </button>
        ); })}</div>
        {pillars.length > 0 && <select value={pillarId} onChange={e => setPillarId(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2 text-[11px] text-white mb-3 outline-none"><option value="">ركيزة (اختياري)</option>{pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
        <button onClick={() => { if (action.trim()) { addCheck(action, alignment, pillarId || undefined); onClose(); } }} disabled={!action.trim()} className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-30" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>سجّل الفحص 🧭</button>
      </motion.div>
    </motion.div>
  );
}

export default function QutbScreen() {
  const { northStar, pillars, checks, getOverallAlignment, getTodayChecks, getWeekAlignment, getStrongestPillar, getWeakestPillar, updatePillarAlignment } = useQutbState();
  const [modal, setModal] = useState<"star" | "pillar" | "check" | null>(null);
  const alignment = useMemo(() => getOverallAlignment(), [getOverallAlignment]);
  const todayChecks = useMemo(() => getTodayChecks(), [getTodayChecks]);
  const weekTrend = useMemo(() => getWeekAlignment(), [getWeekAlignment]);
  const strongest = useMemo(() => getStrongestPillar(), [getStrongestPillar]);
  const weakest = useMemo(() => getWeakestPillar(), [getWeakestPillar]);
  const alignColor = alignment >= 60 ? "#22c55e" : alignment >= 30 ? "#f59e0b" : alignment > 0 ? "#ef4444" : "#334155";

  return (
    <div className="min-h-screen bg-[#050510] font-sans pb-32" dir="rtl">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-[600px] h-[600px] rounded-full top-[-20%] left-[50%] -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.04), transparent 65%)" }} /></div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}><Navigation className="w-6 h-6 text-amber-400" /></div>
            <div><h1 className="text-2xl font-black text-white tracking-tight">قطب</h1><p className="text-xs text-slate-600 font-medium mt-0.5">نجمك القطبي — الهدف الأعلى</p></div>
          </div>
        </div>
      </motion.div>

      {/* North Star */}
      <div className="relative z-10 px-5 mb-4">
        <div className="rounded-2xl p-5 relative overflow-hidden text-center cursor-pointer" style={{ background: northStar ? "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(234,179,8,0.03))" : "rgba(15,10,40,0.4)", border: `1px solid ${northStar ? "rgba(245,158,11,0.15)" : "rgba(51,65,85,0.15)"}` }} onClick={() => setModal("star")}>
          <div className="absolute top-0 right-0 w-40 h-40 blur-3xl rounded-full -mr-16 -mt-16 bg-amber-500/5" />
          {northStar ? (
            <div className="relative z-10">
              <Star className="w-8 h-8 text-amber-400 mx-auto mb-2 fill-amber-400/20" />
              <p className="text-sm font-black text-white leading-relaxed mb-2">"{northStar.statement}"</p>
              <div className="flex items-center justify-center gap-1"><Edit3 className="w-2.5 h-2.5 text-slate-600" /><span className="text-[7px] text-slate-600">اضغط للتعديل · {northStar.revisedCount > 0 ? `عُدّل ${northStar.revisedCount} مرات` : "النسخة الأولى"}</span></div>
            </div>
          ) : (
            <div className="relative z-10 py-4">
              <Star className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-white/70 font-bold">حدد نجمك القطبي</p>
              <p className="text-[10px] text-slate-600 mt-1">الهدف الأعلى الذي يوجّه كل قرار في حياتك</p>
            </div>
          )}
        </div>
      </div>

      {/* Alignment + Stats */}
      <div className="relative z-10 px-5 mb-4 flex gap-3">
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,10,40,0.5)", border: "1px solid rgba(51,65,85,0.15)" }}>
          <div className="text-2xl font-black" style={{ color: alignColor }}>{alignment}%</div>
          <div className="text-[7px] text-slate-600 font-medium">المحاذاة الكلية</div>
        </div>
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,10,40,0.5)", border: "1px solid rgba(51,65,85,0.15)" }}>
          <div className="text-2xl font-black text-white">{pillars.length}</div>
          <div className="text-[7px] text-slate-600 font-medium">ركائز</div>
        </div>
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,10,40,0.5)", border: "1px solid rgba(51,65,85,0.15)" }}>
          <div className="text-2xl font-black text-amber-400">{todayChecks.length}</div>
          <div className="text-[7px] text-slate-600 font-medium">فحوصات اليوم</div>
        </div>
      </div>

      {/* Actions */}
      <div className="relative z-10 px-5 mb-4 flex gap-2">
        <button onClick={() => setModal("pillar")} className="flex-1 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", color: "#a78bfa" }}><Plus className="w-3 h-3" />🏛️ ركيزة</button>
        <button onClick={() => setModal("check")} className="flex-1 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b" }}><Plus className="w-3 h-3" />🧭 فحص</button>
      </div>

      {/* Pillars */}
      {pillars.length > 0 && (
        <div className="relative z-10 px-5 mb-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">🏛️ ركائز القطب</h3>
          <div className="space-y-2">{pillars.map((p, idx) => { const pm = PILLAR_META[p.category]; const am = ALIGNMENT_META[p.alignment]; return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="rounded-xl p-3 flex items-center gap-3" style={{ background: `${pm.color}04`, border: `1px solid ${pm.color}10` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${pm.color}10` }}><span className="text-lg">{pm.emoji}</span></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-[11px] font-black text-white truncate">{p.name}</span><span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${am.color}10`, color: am.color }}>{am.emoji} {am.label}</span></div>
                {p.why && <p className="text-[8px] text-slate-600 truncate">{p.why}</p>}
              </div>
              <div className="flex gap-0.5 shrink-0">{([1,2,3,4,5] as AlignmentLevel[]).map(a => (
                <button key={a} onClick={() => updatePillarAlignment(p.id, a)} className="w-4 h-4 rounded-full transition-all" style={{ background: p.alignment >= a ? am.color : "rgba(51,65,85,0.3)", transform: p.alignment >= a ? "scale(1)" : "scale(0.7)" }} />
              ))}</div>
            </motion.div>
          ); })}</div>
        </div>
      )}

      {/* Week trend */}
      <div className="relative z-10 px-5 mb-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">اتجاه الأسبوع</h3>
        <div className="rounded-xl p-4" style={{ background: "rgba(15,10,40,0.4)", border: "1px solid rgba(51,65,85,0.1)" }}>
          <div className="flex gap-1 items-end justify-between h-16">
            {weekTrend.map((d, i) => {
              const pct = d.avg > 0 ? (d.avg / 5) * 100 : 5;
              const dayName = new Date(d.date).toLocaleDateString("ar-EG", { weekday: "short" });
              const isToday = d.date === new Date().toISOString().slice(0, 10);
              const barColor = d.avg >= 4 ? "#22c55e" : d.avg >= 2.5 ? "#f59e0b" : d.avg > 0 ? "#ef4444" : "rgba(51,65,85,0.3)";
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} className="w-3 rounded-full" style={{ background: barColor, minHeight: "3px" }} />
                  <span className={`text-[6px] font-bold ${isToday ? "text-amber-400" : "text-slate-700"}`}>{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {pillars.length === 0 && !northStar && (
        <div className="relative z-10 mx-5 rounded-2xl p-8 text-center" style={{ background: "rgba(245,158,11,0.03)", border: "1px dashed rgba(245,158,11,0.12)" }}>
          <span className="text-5xl block mb-3">⭐</span>
          <p className="text-sm text-white/80 font-bold">ابدأ بتحديد نجمك القطبي</p>
          <p className="text-[10px] text-slate-600 mt-1">الهدف الأعلى → الركائز → فحص المحاذاة يومياً</p>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(15,10,40,0.3)", border: "1px solid rgba(51,65,85,0.1)" }}>
        <p className="text-[10px] text-slate-700">⭐ قطب — كل شيء يدور حول نجمك القطبي</p>
      </motion.div>

      <AnimatePresence>
        {modal === "star" && <NorthStarModal onClose={() => setModal(null)} />}
        {modal === "pillar" && <AddPillarModal onClose={() => setModal(null)} />}
        {modal === "check" && <AlignCheckModal pillars={pillars.map(p => ({ id: p.id, name: p.name }))} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
