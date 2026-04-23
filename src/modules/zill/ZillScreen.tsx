import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useZillState, SHADOW_META, INTEGRATION_META, type ShadowType, type IntegrationLevel } from "./store/zill.store";
import { Eclipse, Plus, X, MessageCircle } from "lucide-react";

function AddShadowModal({ onClose }: { onClose: () => void }) {
  const { addShadow } = useZillState();
  const [type, setType] = useState<ShadowType>("emotion");
  const [trigger, setTrigger] = useState("");
  const [hiddenNeed, setHiddenNeed] = useState("");
  const [origin, setOrigin] = useState("");
  const [integration, setIntegration] = useState<IntegrationLevel>(1);
  const meta = SHADOW_META[type];
  const handleSubmit = () => { if (!trigger.trim()) return; addShadow({ type, trigger: trigger.trim(), hiddenNeed: hiddenNeed.trim(), origin: origin.trim(), integration }); onClose(); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.92)" }} onClick={onClose}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5 relative" style={{ background: "#08081a", border: `1px solid ${meta.color}15` }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-base font-black text-white mb-1 text-center">🕳️ كشف ظل جديد</h2>
        <p className="text-[9px] text-slate-600 text-center mb-4">هذا مساحة آمنة — لا أحكام هنا</p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {(Object.keys(SHADOW_META) as ShadowType[]).map(t => { const m = SHADOW_META[t]; const a = type === t; return (
            <button key={t} onClick={() => setType(t)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all" style={{ background: a ? `${m.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}30` : "rgba(51,65,85,0.15)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
        <p className="text-[9px] text-slate-500 mb-1 italic">{meta.prompt}</p>
        <input value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="ما الذي يحفّز هذا الظل؟" className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <input value={hiddenNeed} onChange={e => setHiddenNeed(e.target.value)} placeholder="ما الحاجة الخفية وراءه؟" className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="من أين أتى؟ (اختياري)" className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none" />
        <div className="mb-3">
          <span className="text-[9px] text-slate-500 font-bold block mb-1">مستوى الدمج</span>
          <div className="flex gap-1.5">
            {([1,2,3,4,5] as IntegrationLevel[]).map(i => { const im = INTEGRATION_META[i]; const a = integration === i; return (
              <button key={i} onClick={() => setIntegration(i)} className="flex-1 py-2 rounded-lg text-center transition-all" style={{ background: a ? `${im.color}20` : "rgba(30,41,59,0.4)", border: `1.5px solid ${a ? im.color : "rgba(51,65,85,0.15)"}` }}>
                <span className="text-sm block">{im.emoji}</span>
                <span className="text-[5px] font-bold" style={{ color: a ? im.color : "#475569" }}>{im.label}</span>
              </button>
            ); })}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={!trigger.trim()} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30" style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}20`, color: meta.color }}>واجه الظل 🕳️</button>
      </motion.div>
    </motion.div>
  );
}

function ReflectModal({ shadow, onClose }: { shadow: { id: string; type: ShadowType }; onClose: () => void }) {
  const { addReflection } = useZillState();
  const [text, setText] = useState("");
  const meta = SHADOW_META[shadow.type];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#08081a", border: `1px solid ${meta.color}15` }} onClick={e => e.stopPropagation()}>
        <h2 className="text-sm font-black text-white mb-3 text-center">💭 تأمل جديد</h2>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="ماذا اكتشفت عن هذا الظل اليوم؟" rows={3} className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none resize-none" />
        <button onClick={() => { if (text.trim()) { addReflection(shadow.id, text); onClose(); } }} disabled={!text.trim()} className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-30" style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}20`, color: meta.color }}>أضف التأمل 💭</button>
      </motion.div>
    </motion.div>
  );
}

export default function ZillScreen() {
  const { shadows, getIntegrationScore, getMostRepressed, getTotalShadows, updateIntegration } = useZillState();
  const [showAdd, setShowAdd] = useState(false);
  const [reflectTarget, setReflectTarget] = useState<{ id: string; type: ShadowType } | null>(null);
  const [activeType, setActiveType] = useState<ShadowType | "all">("all");
  const score = useMemo(() => getIntegrationScore(), [getIntegrationScore]);
  const repressed = useMemo(() => getMostRepressed(), [getMostRepressed]);
  const total = useMemo(() => getTotalShadows(), [getTotalShadows]);
  const filtered = activeType === "all" ? shadows : shadows.filter(s => s.type === activeType);
  const scoreColor = score >= 60 ? "#a78bfa" : score >= 30 ? "#7c3aed" : "#4c1d95";

  return (
    <div className="min-h-screen bg-[#050510] font-sans pb-32" dir="rtl">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.04), transparent 65%)" }} /></div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(30,27,75,0.5)", border: "1px solid rgba(99,102,241,0.15)" }}><Eclipse className="w-6 h-6 text-indigo-300" /></div>
            <div><h1 className="text-2xl font-black text-white tracking-tight">ظل</h1><p className="text-xs text-slate-600 font-medium mt-0.5">واجه ظلالك — واحتضنها</p></div>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(30,27,75,0.5)", border: "1px solid rgba(99,102,241,0.15)", color: "#818cf8" }}><Plus className="w-4 h-4" /></button>
        </div>
      </motion.div>

      {/* Integration score */}
      <div className="relative z-10 px-5 mb-4">
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "rgba(15,10,40,0.6)", border: `1px solid ${scoreColor}15` }}>
          <div className="relative z-10 flex items-center justify-between">
            <div><span className="text-[8px] font-black uppercase tracking-widest" style={{ color: scoreColor }}>مؤشر الدمج</span><p className="text-[9px] text-slate-600 mt-0.5">كم من ظلالك أصبحت واعياً بها؟</p></div>
            <div className="text-3xl font-black" style={{ color: scoreColor }}>{score}%</div>
          </div>
          <div className="relative z-10 w-full h-2 rounded-full bg-slate-900 overflow-hidden mt-3"><motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, #1e1b4b, ${scoreColor})` }} /></div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-4 flex gap-3">
        {[
          { label: "ظلال مكتشفة", value: total, color: "#6366f1" },
          { label: "تأملات", value: shadows.reduce((a, s) => a + s.reflections.length, 0), color: "#a78bfa" },
          { label: repressed ? `الأكثر كبتاً: ${SHADOW_META[repressed].label}` : "لا بيانات", value: repressed ? SHADOW_META[repressed].emoji : "—", color: "#4c1d95" },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,10,40,0.5)", border: "1px solid rgba(51,65,85,0.15)" }}>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[7px] text-slate-600 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="relative z-10 px-5 mb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveType("all")} className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold" style={{ background: activeType === "all" ? "rgba(99,102,241,0.12)" : "rgba(30,41,59,0.3)", border: `1px solid ${activeType === "all" ? "rgba(99,102,241,0.25)" : "rgba(51,65,85,0.15)"}`, color: activeType === "all" ? "#818cf8" : "#475569" }}>الكل</button>
          {(Object.keys(SHADOW_META) as ShadowType[]).map(t => { const m = SHADOW_META[t]; const a = activeType === t; return (
            <button key={t} onClick={() => setActiveType(a ? "all" : t)} className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold" style={{ background: a ? `${m.color}12` : "rgba(30,41,59,0.3)", border: `1px solid ${a ? `${m.color}25` : "rgba(51,65,85,0.15)"}`, color: a ? m.color : "#475569" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
      </div>

      {/* Shadow Cards */}
      <div className="relative z-10 px-5 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(15,10,40,0.4)", border: "1px dashed rgba(99,102,241,0.15)" }}>
            <span className="text-5xl block mb-3">🕳️</span>
            <p className="text-sm text-white/70 font-bold">لم تكتشف ظلالاً بعد</p>
            <p className="text-[10px] text-slate-600 mt-1">الظل ليس عدوك — هو جزء منك ينتظر أن تراه</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 px-4 py-2 rounded-xl text-[10px] font-bold text-indigo-400 bg-indigo-500/8 border border-indigo-500/15">واجه ظلك الأول 🕳️</button>
          </div>
        ) : filtered.map((shadow, idx) => {
          const sm = SHADOW_META[shadow.type]; const im = INTEGRATION_META[shadow.integration];
          return (
            <motion.div key={shadow.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="rounded-xl p-4 relative group" style={{ background: `rgba(15,10,40,0.5)`, border: `1px solid ${sm.color}10` }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${sm.color}08`, border: `1px solid ${sm.color}10` }}><span className="text-lg">{sm.emoji}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${sm.color}10`, color: sm.color }}>{sm.label}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${im.color}20`, color: im.color }}>{im.emoji} {im.label}</span>
                  </div>
                  <p className="text-[11px] text-white/75 mb-1"><strong>المحفّز:</strong> {shadow.trigger}</p>
                  {shadow.hiddenNeed && <p className="text-[11px] text-white/50 mb-1"><strong>الحاجة:</strong> {shadow.hiddenNeed}</p>}
                  {shadow.origin && <p className="text-[10px] text-white/30 italic mb-1">🔙 {shadow.origin}</p>}
                  {shadow.reflections.length > 0 && (
                    <div className="mt-1.5 space-y-1">{shadow.reflections.slice(-2).map((r, i) => (
                      <p key={i} className="text-[9px] text-indigo-300/50 pr-3 border-r border-indigo-500/15">💭 {r}</p>
                    ))}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => setReflectTarget({ id: shadow.id, type: shadow.type })} className="text-[8px] text-indigo-400/60 hover:text-indigo-400 flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" /> تأمل</button>
                    <span className="text-[7px] text-slate-700">{shadow.date}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(15,10,40,0.4)", border: "1px solid rgba(51,65,85,0.1)" }}>
        <p className="text-[10px] text-slate-700">🕳️ ظل — ما تقاومه يستمر... وما تواجهه يتحول</p>
      </motion.div>

      <AnimatePresence>
        {showAdd && <AddShadowModal onClose={() => setShowAdd(false)} />}
        {reflectTarget && <ReflectModal shadow={reflectTarget} onClose={() => setReflectTarget(null)} />}
      </AnimatePresence>
    </div>
  );
}
