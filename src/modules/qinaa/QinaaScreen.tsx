import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQinaaState, CONTEXT_META, INTENSITY_META, type LifeContext, type MaskIntensity, type MaskLayer } from "./store/qinaa.store";
import { Theater, Plus, X, Eye, EyeOff, Check } from "lucide-react";

function AddMaskModal({ onClose }: { onClose: () => void }) {
  const { addMask } = useQinaaState();
  const [ctx, setCtx] = useState<LifeContext>("work");
  const [whatIShow, setWhatIShow] = useState("");
  const [whatIHide, setWhatIHide] = useState("");
  const [whyIMask, setWhyIMask] = useState("");
  const [intensity, setIntensity] = useState<MaskIntensity>(3);
  const meta = CONTEXT_META[ctx];
  const handleSubmit = () => {
    if (!whatIShow.trim()) return;
    addMask({ context: ctx, whatIShow: whatIShow.trim(), whatIHide: whatIHide.trim(), whyIMask: whyIMask.trim(), intensity });
    onClose();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: `1px solid ${meta.color}20` }} onClick={e => e.stopPropagation()}>
        <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${meta.color}06, transparent 55%)` }} />
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500 z-10"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-base font-black text-white mb-4 text-center relative z-10">🎭 كشف قناع جديد</h2>
        <div className="relative z-10 flex gap-1.5 flex-wrap mb-3">
          {(Object.keys(CONTEXT_META) as LifeContext[]).map(c => { const m = CONTEXT_META[c]; const a = ctx === c; return (
            <button key={c} onClick={() => setCtx(c)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all" style={{ background: a ? `${m.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}30` : "rgba(51,65,85,0.2)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
        <div className="relative z-10 mb-3">
          <span className="text-[9px] text-slate-500 font-bold block mb-1">شدة القناع</span>
          <div className="flex gap-2 justify-center">
            {([1,2,3,4,5] as MaskIntensity[]).map(i => { const im = INTENSITY_META[i]; const a = intensity === i; return (
              <button key={i} onClick={() => setIntensity(i)} className="flex-1 py-2 rounded-lg text-center transition-all" style={{ background: a ? `${im.color}15` : "rgba(30,41,59,0.4)", border: `1.5px solid ${a ? im.color : "rgba(51,65,85,0.2)"}` }}>
                <span className="text-sm block">{im.emoji}</span>
                <span className="text-[6px] font-bold" style={{ color: a ? im.color : "#475569" }}>{im.label}</span>
              </button>
            ); })}
          </div>
        </div>
        <input value={whatIShow} onChange={e => setWhatIShow(e.target.value)} placeholder="أُظهر للناس أنني..." className="relative z-10 w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500/30" />
        <input value={whatIHide} onChange={e => setWhatIHide(e.target.value)} placeholder="لكنني في الحقيقة أشعر بـ..." className="relative z-10 w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500/30" />
        <input value={whyIMask} onChange={e => setWhyIMask(e.target.value)} placeholder="لأنني أخاف من..." className="relative z-10 w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none focus:border-indigo-500/30" />
        <button onClick={handleSubmit} disabled={!whatIShow.trim()} className="relative z-10 w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25`, color: meta.color }}>اكشف القناع 🎭</button>
      </motion.div>
    </motion.div>
  );
}

function AddAuthenticModal({ onClose }: { onClose: () => void }) {
  const { addAuthenticMoment } = useQinaaState();
  const [ctx, setCtx] = useState<LifeContext>("alone");
  const [moment, setMoment] = useState("");
  const [feeling, setFeeling] = useState("");
  const handleSubmit = () => { if (!moment.trim()) return; addAuthenticMoment({ context: ctx, moment: moment.trim(), feeling: feeling.trim() }); onClose(); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: "1px solid rgba(34,197,94,0.15)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500 z-10"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-base font-black text-white mb-4 text-center relative z-10">🪞 لحظة حقيقية</h2>
        <div className="relative z-10 flex gap-1.5 flex-wrap mb-3">
          {(Object.keys(CONTEXT_META) as LifeContext[]).map(c => { const m = CONTEXT_META[c]; const a = ctx === c; return (
            <button key={c} onClick={() => setCtx(c)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all" style={{ background: a ? `${m.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}30` : "rgba(51,65,85,0.2)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
        <textarea value={moment} onChange={e => setMoment(e.target.value)} placeholder="كنت حقيقي تماماً عندما..." rows={2} className="relative z-10 w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none resize-none" />
        <input value={feeling} onChange={e => setFeeling(e.target.value)} placeholder="وشعرت بـ..." className="relative z-10 w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none" />
        <button onClick={handleSubmit} disabled={!moment.trim()} className="relative z-10 w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>سجّل اللحظة 🪞</button>
      </motion.div>
    </motion.div>
  );
}

export default function QinaaScreen() {
  const { masks, authenticMoments, getAllProfiles, getOverallAuthenticity, getMostMasked, getMostAuthentic, removeMask } = useQinaaState();
  const [showAddMask, setShowAddMask] = useState(false);
  const [showAddAuth, setShowAddAuth] = useState(false);
  const [activeCtx, setActiveCtx] = useState<LifeContext | "all">("all");
  const profiles = useMemo(() => getAllProfiles(), [getAllProfiles]);
  const authenticity = useMemo(() => getOverallAuthenticity(), [getOverallAuthenticity]);
  const mostMasked = useMemo(() => getMostMasked(), [getMostMasked]);
  const mostAuth = useMemo(() => getMostAuthentic(), [getMostAuthentic]);
  const filtered = useMemo(() => activeCtx === "all" ? masks : masks.filter(m => m.context === activeCtx), [masks, activeCtx]);
  const authColor = authenticity >= 70 ? "#22c55e" : authenticity >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05), transparent 65%)" }} /></div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-900/15 border border-purple-500/20"><Theater className="w-6 h-6 text-purple-400" /></div>
            <div><h1 className="text-2xl font-black text-white tracking-tight">قناع</h1><p className="text-xs text-slate-500 font-medium mt-0.5">اكشف الفجوة بين ذاتك الحقيقية وأقنعتك</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddAuth(true)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-500/10 border border-green-500/20 text-green-400"><Eye className="w-4 h-4" /></button>
            <button onClick={() => setShowAddMask(true)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/10 border border-purple-500/20 text-purple-400"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      </motion.div>

      {/* Authenticity Score */}
      <div className="relative z-10 px-5 mb-4">
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `${authColor}04`, border: `1px solid ${authColor}15` }}>
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-12 -mt-12" style={{ background: `${authColor}08` }} />
          <div className="relative z-10 flex items-center justify-between">
            <div><span className="text-[8px] font-black uppercase tracking-widest" style={{ color: authColor }}>مؤشر الأصالة</span><p className="text-[10px] text-slate-500 mt-0.5">كم أنت قريب من ذاتك الحقيقية؟</p></div>
            <div className="text-center"><div className="text-3xl font-black" style={{ color: authColor }}>{authenticity}%</div></div>
          </div>
          <div className="relative z-10 w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-3">
            <motion.div initial={{ width: 0 }} animate={{ width: `${authenticity}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: authColor }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-3">
          {[
            { label: "أقنعة مكتشفة", value: masks.length, icon: "🎭", color: "#8b5cf6" },
            { label: "لحظات حقيقية", value: authenticMoments.length, icon: "🪞", color: "#22c55e" },
            { label: mostMasked ? `أكثر تقنّع: ${CONTEXT_META[mostMasked].label}` : "لا بيانات", value: mostMasked ? CONTEXT_META[mostMasked].emoji : "—", color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[7px] text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Context Radar */}
      <div className="relative z-10 px-5 mb-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">خريطة الأقنعة حسب السياق</h3>
        <div className="grid grid-cols-3 gap-2">
          {profiles.map(p => { const cm = CONTEXT_META[p.context]; const gapColor = p.gap > 60 ? "#ef4444" : p.gap > 30 ? "#f59e0b" : "#22c55e"; return (
            <button key={p.context} onClick={() => setActiveCtx(activeCtx === p.context ? "all" : p.context)} className="rounded-xl p-3 text-center transition-all" style={{ background: activeCtx === p.context ? `${cm.color}08` : "rgba(15,23,42,0.4)", border: `1px solid ${activeCtx === p.context ? `${cm.color}20` : "rgba(51,65,85,0.2)"}` }}>
              <span className="text-xl block">{cm.emoji}</span>
              <span className="text-[9px] font-bold text-white/80 block mt-1">{cm.label}</span>
              {p.maskCount > 0 ? (<>
                <div className="w-full h-1 rounded-full bg-slate-800 mt-1.5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.gap}%`, background: gapColor }} /></div>
                <span className="text-[7px] font-bold mt-1 block" style={{ color: gapColor }}>فجوة {p.gap}%</span>
              </>) : <span className="text-[7px] text-slate-600 block mt-1">لا بيانات</span>}
            </button>
          ); })}
        </div>
      </div>

      {/* Filter */}
      <div className="relative z-10 px-5 mb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveCtx("all")} className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all" style={{ background: activeCtx === "all" ? "rgba(139,92,246,0.15)" : "rgba(30,41,59,0.4)", border: `1px solid ${activeCtx === "all" ? "rgba(139,92,246,0.3)" : "rgba(51,65,85,0.3)"}`, color: activeCtx === "all" ? "#a78bfa" : "#64748b" }}>الكل</button>
          {(Object.keys(CONTEXT_META) as LifeContext[]).map(c => { const m = CONTEXT_META[c]; const a = activeCtx === c; return (
            <button key={c} onClick={() => setActiveCtx(a ? "all" : c)} className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all" style={{ background: a ? `${m.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}30` : "rgba(51,65,85,0.3)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
      </div>

      {/* Masks List */}
      <div className="relative z-10 px-5 space-y-2">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-8 text-center" style={{ background: "rgba(139,92,246,0.04)", border: "1px dashed rgba(139,92,246,0.2)" }}>
            <span className="text-5xl block mb-3">🎭</span>
            <p className="text-sm text-white/80 font-bold mb-1">لم تكتشف أقنعة بعد</p>
            <p className="text-[10px] text-slate-500">اسأل نفسك: أين أتصرف بشكل مختلف عن حقيقتي؟</p>
            <button onClick={() => setShowAddMask(true)} className="mt-3 px-4 py-2 rounded-xl text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20"><Plus className="w-3 h-3 inline ml-1" />اكشف قناع</button>
          </motion.div>
        ) : filtered.map((mask, idx) => {
          const cm = CONTEXT_META[mask.context]; const im = INTENSITY_META[mask.intensity];
          return (
            <motion.div key={mask.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="rounded-xl p-4 relative group" style={{ background: `${cm.color}04`, border: `1px solid ${cm.color}10` }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cm.color}10`, border: `1px solid ${cm.color}15` }}><span className="text-lg">{cm.emoji}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${cm.color}10`, color: cm.color }}>{cm.label}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${im.color}10`, color: im.color }}>{im.emoji} {im.label}</span>
                  </div>
                  <div className="space-y-1 mb-1">
                    <p className="text-[11px] text-white/85"><EyeOff className="w-3 h-3 inline ml-1 text-slate-500" /><strong>أُظهر:</strong> {mask.whatIShow}</p>
                    {mask.whatIHide && <p className="text-[11px] text-white/60"><Eye className="w-3 h-3 inline ml-1 text-slate-500" /><strong>أُخفي:</strong> {mask.whatIHide}</p>}
                    {mask.whyIMask && <p className="text-[11px] text-white/40 italic">💭 {mask.whyIMask}</p>}
                  </div>
                  <span className="text-[7px] text-slate-600">{new Date(mask.createdAt).toLocaleDateString("ar-EG")}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">🎭 قناع — اعرف أقنعتك... لتختار متى تلبسها ومتى تخلعها</p>
      </motion.div>

      <AnimatePresence>
        {showAddMask && <AddMaskModal onClose={() => setShowAddMask(false)} />}
        {showAddAuth && <AddAuthenticModal onClose={() => setShowAddAuth(false)} />}
      </AnimatePresence>
    </div>
  );
}
