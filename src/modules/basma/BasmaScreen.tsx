import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBasmaState, CATEGORY_META, type TraitCategory } from "./store/basma.store";
import { Fingerprint, Plus, X, Star, Quote } from "lucide-react";

function AddTraitModal({ onClose }: { onClose: () => void }) {
  const { addTrait } = useBasmaState();
  const [cat, setCat] = useState<TraitCategory>("cognitive");
  const [name, setName] = useState("");
  const [strength, setStrength] = useState(7);
  const [source, setSource] = useState("");
  const [evidence, setEvidence] = useState("");
  const m = CATEGORY_META[cat];
  const handleSubmit = () => { if (!name.trim()) return; addTrait({ category: cat, name: name.trim(), strength, source: source.trim() || "manual", evidence: evidence.trim() }); onClose(); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.92)" }} onClick={onClose}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: `1px solid ${m.color}15` }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-base font-black text-white mb-4 text-center">🧬 سمة جديدة</h2>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {(Object.keys(CATEGORY_META) as TraitCategory[]).map(c => { const cm = CATEGORY_META[c]; const a = cat === c; return (
            <button key={c} onClick={() => setCat(c)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all" style={{ background: a ? `${cm.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${cm.color}30` : "rgba(51,65,85,0.15)"}`, color: a ? cm.color : "#64748b" }}>{cm.emoji} {cm.label}</button>
          ); })}
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم السمة مثال: التفكير التحليلي" className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <div className="mb-2"><span className="text-[9px] text-slate-500 font-bold">القوة: {strength}/10</span><input type="range" min={1} max={10} value={strength} onChange={e => setStrength(Number(e.target.value))} className="w-full accent-indigo-500 h-2 mt-1" /></div>
        <input value={source} onChange={e => setSource(e.target.value)} placeholder="المصدر: أي أداة أو ملاحظة ذاتية" className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <input value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="الدليل: موقف أو سلوك يثبتها" className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none" />
        <button onClick={handleSubmit} disabled={!name.trim()} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30" style={{ background: `${m.color}12`, border: `1px solid ${m.color}20`, color: m.color }}>أضف السمة 🧬</button>
      </motion.div>
    </motion.div>
  );
}

function AddValueModal({ onClose }: { onClose: () => void }) {
  const { addValue } = useBasmaState();
  const [value, setValue] = useState("");
  const [rank, setRank] = useState(1);
  const [why, setWhy] = useState("");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: "1px solid rgba(245,158,11,0.12)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-sm font-black text-white mb-3 text-center">⭐ قيمة جوهرية</h2>
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="القيمة مثال: الصدق، الحرية، العائلة..." className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <div className="mb-2"><span className="text-[9px] text-slate-500 font-bold">الأهمية: {rank}/5</span><div className="flex gap-1.5 mt-1">{[1,2,3,4,5].map(r => (<button key={r} onClick={() => setRank(r)} className="flex-1 py-2 rounded-lg text-sm transition-all" style={{ background: rank >= r ? "rgba(245,158,11,0.12)" : "rgba(30,41,59,0.4)", border: `1px solid ${rank >= r ? "rgba(245,158,11,0.25)" : "rgba(51,65,85,0.15)"}`, color: rank >= r ? "#f59e0b" : "#475569" }}>⭐</button>))}</div></div>
        <input value={why} onChange={e => setWhy(e.target.value)} placeholder="لماذا هي مهمة لك؟" className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none" />
        <button onClick={() => { if (value.trim()) { addValue(value, rank, why); onClose(); } }} disabled={!value.trim()} className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-30" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>أضف القيمة ⭐</button>
      </motion.div>
    </motion.div>
  );
}

function AddStatementModal({ onClose }: { onClose: () => void }) {
  const { addStatement } = useBasmaState();
  const [text, setText] = useState("أنا شخص ");
  const [conf, setConf] = useState(4);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: "1px solid rgba(139,92,246,0.12)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-sm font-black text-white mb-3 text-center">💬 بيان هوية</h2>
        <input value={text} onChange={e => setText(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <div className="mb-3"><span className="text-[9px] text-slate-500 font-bold">الثقة: {conf}/5</span><input type="range" min={1} max={5} value={conf} onChange={e => setConf(Number(e.target.value))} className="w-full accent-purple-500 h-2 mt-1" /></div>
        <button onClick={() => { if (text.trim().length > 5) { addStatement(text, conf); onClose(); } }} disabled={text.trim().length <= 5} className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-30" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>أضف البيان 💬</button>
      </motion.div>
    </motion.div>
  );
}

export default function BasmaScreen() {
  const { traits, values, statements, getIdentityScore, getCategoryStrengths, getTopTraits, getUniqueSignature } = useBasmaState();
  const [modal, setModal] = useState<"trait" | "value" | "statement" | null>(null);
  const score = useMemo(() => getIdentityScore(), [getIdentityScore]);
  const catStrengths = useMemo(() => getCategoryStrengths(), [getCategoryStrengths]);
  const topTraits = useMemo(() => getTopTraits(5), [getTopTraits]);
  const signature = useMemo(() => getUniqueSignature(), [getUniqueSignature]);
  const scoreColor = score >= 60 ? "#22c55e" : score >= 30 ? "#f59e0b" : "#64748b";
  const maxCat = Math.max(...Object.values(catStrengths), 1);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05), transparent 65%)" }} /></div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-900/15 border border-indigo-500/20"><Fingerprint className="w-6 h-6 text-indigo-400" /></div>
            <div><h1 className="text-2xl font-black text-white tracking-tight">بصمة</h1><p className="text-xs text-slate-500 font-medium mt-0.5">حمضك النفسي — هويتك الفريدة</p></div>
          </div>
        </div>
      </motion.div>

      {/* Signature */}
      <div className="relative z-10 px-5 mb-4">
        <div className="rounded-2xl p-5 relative overflow-hidden text-center" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.12)" }}>
          <div className="absolute top-0 right-0 w-40 h-40 blur-3xl rounded-full -mr-16 -mt-16 bg-indigo-500/5" />
          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">بصمتك الفريدة</span>
          <p className="text-base font-black text-white mt-2 leading-relaxed">{signature}</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div><span className="text-xl font-black" style={{ color: scoreColor }}>{score}%</span><p className="text-[7px] text-slate-600 mt-0.5">وضوح الهوية</p></div>
            <div className="w-px h-8 bg-slate-800" />
            <div><span className="text-xl font-black text-white">{traits.length}</span><p className="text-[7px] text-slate-600 mt-0.5">سمة</p></div>
            <div className="w-px h-8 bg-slate-800" />
            <div><span className="text-xl font-black text-amber-400">{values.length}</span><p className="text-[7px] text-slate-600 mt-0.5">قيمة</p></div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="relative z-10 px-5 mb-4 flex gap-2">
        {[
          { key: "trait" as const, label: "سمة", emoji: "🧬", color: "#6366f1" },
          { key: "value" as const, label: "قيمة", emoji: "⭐", color: "#f59e0b" },
          { key: "statement" as const, label: "بيان", emoji: "💬", color: "#8b5cf6" },
        ].map(a => (
          <button key={a.key} onClick={() => setModal(a.key)} className="flex-1 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all" style={{ background: `${a.color}08`, border: `1px solid ${a.color}15`, color: a.color }}><Plus className="w-3 h-3" />{a.emoji} {a.label}</button>
        ))}
      </div>

      {/* Category Radar */}
      <div className="relative z-10 px-5 mb-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">خريطة الشخصية</h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(CATEGORY_META) as TraitCategory[]).map(c => {
            const cm = CATEGORY_META[c]; const val = catStrengths[c]; const pct = maxCat > 0 ? Math.round((val / maxCat) * 100) : 0;
            return (
              <div key={c} className="rounded-xl p-3 text-center" style={{ background: val > 0 ? `${cm.color}06` : "rgba(15,23,42,0.4)", border: `1px solid ${val > 0 ? `${cm.color}15` : "rgba(51,65,85,0.15)"}` }}>
                <span className="text-xl block">{cm.emoji}</span>
                <span className="text-[9px] font-bold text-white/80 block mt-1">{cm.label}</span>
                <div className="text-sm font-black mt-1" style={{ color: val > 0 ? cm.color : "#334155" }}>{val || "—"}</div>
                <div className="w-full h-1 rounded-full bg-slate-800 mt-1.5 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cm.color }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Traits */}
      {topTraits.length > 0 && (
        <div className="relative z-10 px-5 mb-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">أقوى سماتك</h3>
          <div className="space-y-1.5">{topTraits.map((t, idx) => { const cm = CATEGORY_META[t.category]; return (
            <motion.div key={t.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className="rounded-lg p-2.5 flex items-center gap-2.5" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.15)" }}>
              <span className="text-base">{cm.emoji}</span>
              <div className="flex-1 min-w-0"><p className="text-[11px] text-white/80 font-bold truncate">{t.name}</p>{t.evidence && <p className="text-[8px] text-slate-600 truncate">{t.evidence}</p>}</div>
              <span className="text-xs font-black shrink-0" style={{ color: cm.color }}>{t.strength}/10</span>
            </motion.div>
          ); })}</div>
        </div>
      )}

      {/* Core Values */}
      {values.length > 0 && (
        <div className="relative z-10 px-5 mb-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">⭐ القيم الجوهرية</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{values.sort((a, b) => b.rank - a.rank).map(v => (
            <div key={v.id} className="shrink-0 rounded-xl p-3 min-w-[90px] text-center" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
              <div className="flex justify-center gap-0.5 mb-1">{Array(v.rank).fill(0).map((_, i) => <Star key={i} className="w-2 h-2 text-amber-400 fill-amber-400" />)}</div>
              <span className="text-[11px] font-black text-white/80 block">{v.value}</span>
              {v.why && <p className="text-[7px] text-slate-600 mt-0.5 truncate">{v.why}</p>}
            </div>
          ))}</div>
        </div>
      )}

      {/* Identity Statements */}
      {statements.length > 0 && (
        <div className="relative z-10 px-5 mb-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">💬 بيانات الهوية</h3>
          <div className="space-y-1.5">{statements.slice(0, 5).map((s, idx) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="rounded-lg p-2.5 flex items-start gap-2" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.1)" }}>
              <Quote className="w-3 h-3 text-purple-400/50 shrink-0 mt-0.5" />
              <div className="flex-1"><p className="text-[11px] text-white/70 leading-relaxed">{s.statement}</p><span className="text-[7px] text-slate-700">{s.date} · ثقة {s.confidence}/5</span></div>
            </motion.div>
          ))}</div>
        </div>
      )}

      {traits.length === 0 && values.length === 0 && (
        <div className="relative z-10 mx-5 rounded-2xl p-8 text-center" style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.15)" }}>
          <span className="text-5xl block mb-3">🧬</span>
          <p className="text-sm text-white/80 font-bold">بصمتك في انتظار الاكتشاف</p>
          <p className="text-[10px] text-slate-500 mt-1">أضف سماتك وقيمك لتبني هويتك الفريدة</p>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600">🧬 بصمة — لا أحد في العالم مثلك تماماً</p>
      </motion.div>

      <AnimatePresence>
        {modal === "trait" && <AddTraitModal onClose={() => setModal(null)} />}
        {modal === "value" && <AddValueModal onClose={() => setModal(null)} />}
        {modal === "statement" && <AddStatementModal onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
