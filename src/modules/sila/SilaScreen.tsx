import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSilaState, RELATION_META, QUALITY_META, METHOD_META, type RelationshipType, type ConnectionQuality, type ContactLog } from "./store/sila.store";
import { Users, Plus, X, MessageCircle } from "lucide-react";

function AddPersonModal({ onClose }: { onClose: () => void }) {
  const { addPerson } = useSilaState();
  const [name, setName] = useState("");
  const [type, setType] = useState<RelationshipType>("family");
  const [notes, setNotes] = useState("");
  const handleSubmit = () => { if (!name.trim()) return; addPerson(name, type, notes); onClose(); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: "1px solid rgba(34,197,94,0.12)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-base font-black text-white mb-4 text-center">🔗 شخص مهم جديد</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الشخص..." className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none" />
        <div className="flex gap-1.5 flex-wrap mb-2">
          {(Object.keys(RELATION_META) as RelationshipType[]).map(t => { const m = RELATION_META[t]; const a = type === t; return (
            <button key={t} onClick={() => setType(t)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all" style={{ background: a ? `${m.color}15` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}30` : "rgba(51,65,85,0.15)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظة (اختياري)..." className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none" />
        <button onClick={handleSubmit} disabled={!name.trim()} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>أضف الشخص 🔗</button>
      </motion.div>
    </motion.div>
  );
}

function LogContactModal({ personId, personName, onClose }: { personId: string; personName: string; onClose: () => void }) {
  const { logContact } = useSilaState();
  const [quality, setQuality] = useState<ConnectionQuality>(4);
  const [method, setMethod] = useState<ContactLog["method"]>("face");
  const [note, setNote] = useState("");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="w-full max-w-md rounded-3xl p-5 relative" style={{ background: "#0a0f1f", border: "1px solid rgba(34,197,94,0.12)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500"><X className="w-3.5 h-3.5" /></button>
        <h2 className="text-sm font-black text-white mb-1 text-center">💬 تسجيل تواصل</h2>
        <p className="text-[10px] text-slate-500 text-center mb-3">مع {personName}</p>
        <div className="flex gap-1.5 mb-3">
          {(Object.keys(METHOD_META) as ContactLog["method"][]).map(m => { const mm = METHOD_META[m]; const a = method === m; return (
            <button key={m} onClick={() => setMethod(m)} className="flex-1 py-2 rounded-lg text-center transition-all" style={{ background: a ? "rgba(34,197,94,0.1)" : "rgba(30,41,59,0.4)", border: `1px solid ${a ? "rgba(34,197,94,0.2)" : "rgba(51,65,85,0.15)"}` }}>
              <span className="text-base block">{mm.emoji}</span><span className="text-[6px] font-bold" style={{ color: a ? "#22c55e" : "#475569" }}>{mm.label}</span>
            </button>
          ); })}
        </div>
        <div className="flex gap-1.5 mb-3">
          {([1,2,3,4,5] as ConnectionQuality[]).map(q => { const qm = QUALITY_META[q]; const a = quality === q; return (
            <button key={q} onClick={() => setQuality(q)} className="flex-1 py-2 rounded-lg text-center transition-all" style={{ background: a ? `${qm.color}12` : "rgba(30,41,59,0.4)", border: `1.5px solid ${a ? qm.color : "rgba(51,65,85,0.15)"}` }}>
              <span className="text-sm block">{qm.emoji}</span><span className="text-[5px] font-bold" style={{ color: a ? qm.color : "#475569" }}>{qm.label}</span>
            </button>
          ); })}
        </div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظة (اختياري)..." className="w-full bg-slate-900/50 border border-slate-700/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-3 outline-none" />
        <button onClick={() => { logContact(personId, quality, method, note); onClose(); }} className="w-full py-2.5 rounded-xl text-xs font-bold" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>سجّل التواصل 💬</button>
      </motion.div>
    </motion.div>
  );
}

export default function SilaScreen() {
  const { people, getOverallHealth, getNeglected, getTotalPeople } = useSilaState();
  const [showAdd, setShowAdd] = useState(false);
  const [logTarget, setLogTarget] = useState<{ id: string; name: string } | null>(null);
  const [filterType, setFilterType] = useState<RelationshipType | "all">("all");
  const health = useMemo(() => getOverallHealth(), [getOverallHealth]);
  const neglected = useMemo(() => getNeglected(7), [getNeglected]);
  const total = useMemo(() => getTotalPeople(), [getTotalPeople]);
  const filtered = filterType === "all" ? people : people.filter(p => p.type === filterType);
  const healthColor = health >= 60 ? "#22c55e" : health >= 30 ? "#f59e0b" : "#ef4444";

  const daysSince = (d: string) => { const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return diff === 0 ? "اليوم" : diff === 1 ? "أمس" : `${diff} يوم`; };

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.05), transparent 65%)" }} /></div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-900/15 border border-emerald-500/20"><Users className="w-6 h-6 text-emerald-400" /></div>
            <div><h1 className="text-2xl font-black text-white tracking-tight">صلة</h1><p className="text-xs text-slate-500 font-medium mt-0.5">رفاق الطريق — جودة علاقاتك</p></div>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><Plus className="w-4 h-4" /></button>
        </div>
      </motion.div>

      {/* Health score */}
      <div className="relative z-10 px-5 mb-4">
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.1)" }}>
          <div className="relative z-10 flex items-center justify-between">
            <div><span className="text-[8px] font-black uppercase tracking-widest" style={{ color: healthColor }}>صحة العلاقات</span><p className="text-[9px] text-slate-600 mt-0.5">جودة تواصلك مع أهم أشخاصك</p></div>
            <div className="text-3xl font-black" style={{ color: healthColor }}>{health}%</div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden mt-3"><motion.div initial={{ width: 0 }} animate={{ width: `${health}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, #064e3b, ${healthColor})` }} /></div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-4 flex gap-3">
        {[
          { label: "أشخاص", value: total, color: "#22c55e" },
          { label: "بحاجة تواصل", value: neglected.length, color: neglected.length > 0 ? "#ef4444" : "#22c55e" },
          { label: "أنواع", value: new Set(people.map(p => p.type)).size, color: "#06b6d4" },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[8px] text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Neglected alert */}
      {neglected.length > 0 && (
        <div className="relative z-10 px-5 mb-3">
          <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <p className="text-[10px] text-red-400 font-bold mb-1">⚠ أشخاص لم تتواصل معهم منذ أسبوع+</p>
            <div className="flex gap-1.5 flex-wrap">{neglected.map(p => (
              <button key={p.id} onClick={() => setLogTarget({ id: p.id, name: p.name })} className="px-2 py-1 rounded-lg text-[8px] font-bold bg-red-500/8 border border-red-500/12 text-red-300">{RELATION_META[p.type].emoji} {p.name}</button>
            ))}</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="relative z-10 px-5 mb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button onClick={() => setFilterType("all")} className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold" style={{ background: filterType === "all" ? "rgba(34,197,94,0.12)" : "rgba(30,41,59,0.4)", border: `1px solid ${filterType === "all" ? "rgba(34,197,94,0.25)" : "rgba(51,65,85,0.15)"}`, color: filterType === "all" ? "#22c55e" : "#64748b" }}>الكل</button>
          {(Object.keys(RELATION_META) as RelationshipType[]).map(t => { const m = RELATION_META[t]; const a = filterType === t; return (
            <button key={t} onClick={() => setFilterType(a ? "all" : t)} className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold" style={{ background: a ? `${m.color}12` : "rgba(30,41,59,0.4)", border: `1px solid ${a ? `${m.color}25` : "rgba(51,65,85,0.15)"}`, color: a ? m.color : "#64748b" }}>{m.emoji} {m.label}</button>
          ); })}
        </div>
      </div>

      {/* People cards */}
      <div className="relative z-10 px-5 space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(34,197,94,0.04)", border: "1px dashed rgba(34,197,94,0.15)" }}>
            <span className="text-5xl block mb-3">🔗</span>
            <p className="text-sm text-white/80 font-bold">أضف أهم أشخاصك</p>
            <p className="text-[10px] text-slate-500 mt-1">رفاق الطريق هم الرحلة ذاتها</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 px-4 py-2 rounded-xl text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15">أضف أول شخص 🔗</button>
          </div>
        ) : filtered.map((person, idx) => {
          const rm = RELATION_META[person.type]; const qm = QUALITY_META[person.quality]; const ds = daysSince(person.lastContact); const isNeglected = neglected.some(n => n.id === person.id);
          return (
            <motion.div key={person.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: isNeglected ? "rgba(239,68,68,0.03)" : "rgba(15,23,42,0.4)", border: `1px solid ${isNeglected ? "rgba(239,68,68,0.1)" : "rgba(51,65,85,0.15)"}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${rm.color}10`, border: `1px solid ${rm.color}15` }}><span className="text-lg">{rm.emoji}</span></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-black text-white truncate">{person.name}</span><span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${qm.color}10`, color: qm.color }}>{qm.emoji} {qm.label}</span></div>
                <div className="flex items-center gap-2 text-[8px] text-slate-600"><span>آخر تواصل: {ds}</span><span>·</span><span>{person.contactCount} مرة</span></div>
              </div>
              <button onClick={() => setLogTarget({ id: person.id, name: person.name })} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/8 border border-emerald-500/12 text-emerald-400"><MessageCircle className="w-3.5 h-3.5" /></button>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600">🔗 صلة — رفاق الطريق هم الرحلة ذاتها</p>
      </motion.div>

      <AnimatePresence>
        {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} />}
        {logTarget && <LogContactModal personId={logTarget.id} personName={logTarget.name} onClose={() => setLogTarget(null)} />}
      </AnimatePresence>
    </div>
  );
}
