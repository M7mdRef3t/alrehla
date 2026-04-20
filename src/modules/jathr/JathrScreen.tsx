/**
 * جذر — Jathr Screen
 * Core Values Tracker — discover what truly drives you
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useJathrState,
  VALUE_DOMAIN_META,
  ALIGNMENT_LABELS,
  type ValueDomain,
  type AlignmentLevel,
} from "./store/jathr.store";
import { TreePine, Plus, X, ChevronUp, ChevronDown } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*       ADD VALUE MODAL                      */
/* ═══════════════════════════════════════════ */

function AddValueModal({ onClose, existingDomains }: { onClose: () => void; existingDomains: ValueDomain[] }) {
  const { addValue } = useJathrState();
  const available = (Object.keys(VALUE_DOMAIN_META) as ValueDomain[]).filter((d) => !existingDomains.includes(d));

  const handleSelect = (domain: ValueDomain) => {
    addValue({ domain });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="w-full max-w-md rounded-3xl p-5 space-y-3 max-h-[80vh] overflow-y-auto"
        style={{ background: "#0f172a", border: "1px solid rgba(51,65,85,0.4)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white">🌱 أضف قيمة جذرية</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-slate-500">اختر حتى 5 قيم تمثل جذورك الحقيقية</p>

        {available.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-6">وصلت للحد الأقصى (5 قيم)</p>
        ) : (
          <div className="space-y-2">
            {available.map((d) => {
              const meta = VALUE_DOMAIN_META[d];
              return (
                <button key={d} onClick={() => handleSelect(d)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
                  style={{ border: `1px solid ${meta.color}15` }}>
                  <span className="text-xl">{meta.emoji}</span>
                  <div className="text-right flex-1">
                    <span className="text-sm font-bold text-white block">{meta.label}</span>
                    <span className="text-[10px] text-slate-500">{meta.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*       ALIGNMENT CHECK-IN                   */
/* ═══════════════════════════════════════════ */

function AlignmentCheckin({ onClose }: { onClose: () => void }) {
  const { values, logAlignment, getTodayAlignments } = useJathrState();
  const todayAlignments = getTodayAlignments();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [note, setNote] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<AlignmentLevel | null>(null);

  const currentValue = values[currentIdx];
  if (!currentValue) return null;

  const existing = todayAlignments.find((a) => a.valueId === currentValue.id);
  const meta = VALUE_DOMAIN_META[currentValue.domain];

  const handleNext = () => {
    if (selectedLevel) {
      logAlignment({ valueId: currentValue.id, level: selectedLevel, note: note.trim() });
    }
    if (currentIdx < values.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedLevel(null);
      setNote("");
    } else {
      onClose();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="w-full max-w-sm rounded-3xl p-6 space-y-5"
        style={{ background: "#0f172a", border: `1px solid ${meta.color}25` }}
        onClick={(e) => e.stopPropagation()}>

        {/* Progress */}
        <div className="flex gap-1">
          {values.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full"
              style={{ background: i <= currentIdx ? meta.color : "rgba(51,65,85,0.4)" }} />
          ))}
        </div>

        <div className="text-center">
          <span className="text-4xl block mb-2">{meta.emoji}</span>
          <h3 className="text-lg font-black text-white">{meta.label}</h3>
          <p className="text-[10px] text-slate-500 mt-1">{meta.description}</p>
        </div>

        <div>
          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-2 text-center">
            كم عشت هذه القيمة اليوم؟
          </span>
          <div className="flex gap-2 justify-center">
            {([1, 2, 3, 4, 5] as AlignmentLevel[]).map((level) => {
              const lmeta = ALIGNMENT_LABELS[level];
              const active = selectedLevel === level || (existing?.level === level && !selectedLevel);
              return (
                <button key={level} onClick={() => setSelectedLevel(level)}
                  className="w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all"
                  style={{
                    background: active ? `${lmeta.color}20` : "rgba(30,41,59,0.4)",
                    border: `2px solid ${active ? lmeta.color : "rgba(51,65,85,0.3)"}`,
                    transform: active ? "scale(1.1)" : "scale(1)",
                  }}>
                  <span className="text-sm">{lmeta.emoji}</span>
                  <span className="text-[7px] font-bold" style={{ color: active ? lmeta.color : "#64748b" }}>{level}</span>
                </button>
              );
            })}
          </div>
        </div>

        <input value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظة قصيرة (اختياري)..."
          className="w-full bg-slate-800/30 border border-slate-700/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
          dir="rtl" />

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
          disabled={!selectedLevel && !existing}
          className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
          style={{
            background: `${meta.color}12`,
            border: `1px solid ${meta.color}30`,
            color: meta.color,
          }}>
          {currentIdx < values.length - 1 ? "التالي ←" : "✅ أنهِ الفحص"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function JathrScreen() {
  const {
    values, alignments, removeValue, getOverallAlignment,
    getValueScore, getWeekTrend, getTodayAlignments, reorderValues,
  } = useJathrState();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);

  const overall = useMemo(() => getOverallAlignment(), [alignments, values]);
  const todayChecked = useMemo(() => getTodayAlignments().length, [alignments]);
  const existingDomains = useMemo(() => values.map((v) => v.domain), [values]);

  const dayLabels = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

  const moveValue = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= values.length) return;
    const ids = values.map((v) => v.id);
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    reorderValues(ids);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.06), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-900/15 border border-green-500/20">
            <TreePine className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">جذر</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">القيم التي تدفعك حقاً</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "قيمك", value: `${values.length}/5`, color: "#22c55e" },
            { label: "توافق عام", value: `${overall}%`, color: "#8b5cf6" },
            { label: "فحص اليوم", value: `${todayChecked}/${values.length}`, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Check-in CTA */}
      {values.length > 0 && todayChecked < values.length && (
        <div className="relative z-10 px-5 mb-5">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCheckin(true)}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(139,92,246,0.05))",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#22c55e",
            }}>
            🌱 فحص التوافق اليومي ({values.length - todayChecked} متبقي)
          </motion.button>
        </div>
      )}

      {/* Values List */}
      <div className="relative z-10 px-5 mb-5">
        {values.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(34,197,94,0.04)", border: "1px dashed rgba(34,197,94,0.2)" }}>
            <span className="text-5xl block mb-3">🌱</span>
            <p className="text-sm text-white/80 font-bold mb-1">اكتشف جذورك</p>
            <p className="text-[10px] text-slate-500 mb-4">اختر حتى 5 قيم تمثل ما يدفعك حقاً في الحياة</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
              🌱 أضف قيمتك الأولى
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {values.map((v, idx) => {
              const meta = VALUE_DOMAIN_META[v.domain];
              const score = getValueScore(v.id);
              const trend = getWeekTrend(v.id);

              return (
                <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout
                  className="rounded-2xl p-4 group"
                  style={{ background: `${meta.color}05`, border: `1px solid ${meta.color}12` }}>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.emoji}</span>
                      <div>
                        <span className="text-sm font-black text-white">{meta.label}</span>
                        <span className="text-[8px] text-slate-600 block">#{v.rank}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {score > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{
                            background: `${score >= 4 ? "#22c55e" : score >= 3 ? "#f59e0b" : "#ef4444"}15`,
                            color: score >= 4 ? "#22c55e" : score >= 3 ? "#f59e0b" : "#ef4444",
                          }}>
                          {score}/5
                        </span>
                      )}
                      <button onClick={() => moveValue(idx, -1)} disabled={idx === 0}
                        className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 text-slate-500 disabled:opacity-20">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveValue(idx, 1)} disabled={idx === values.length - 1}
                        className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 text-slate-500 disabled:opacity-20">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeValue(v.id)}
                        className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Week trend */}
                  <div className="flex gap-1.5 justify-between">
                    {trend.map((day, i) => {
                      const lmeta = day.level ? ALIGNMENT_LABELS[day.level] : null;
                      // Pre-calculate day index to avoid 'new Date' inside JSX if possible, 
                      // or at least keep it clean.
                      const dayIdx = new Date(day.date).getDay();
                      
                      return (
                        <div key={day.date} className="flex flex-col items-center gap-1">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px]"
                            style={{
                              background: lmeta ? `${lmeta.color}15` : "rgba(30,41,59,0.4)",
                              border: `1px solid ${lmeta ? `${lmeta.color}25` : "rgba(51,65,85,0.3)"}`,
                            }}>
                            {lmeta ? lmeta.emoji : "·"}
                          </div>
                          <span className="text-[7px] text-slate-600 font-bold">{dayLabels[dayIdx]}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overall alignment visual */}
      {values.length > 0 && overall > 0 && (
        <div className="relative z-10 px-5 mb-5">
          <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-3">مؤشر التوافق الكلي</span>
            <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${overall}%` }}
                className="h-full rounded-full"
                style={{
                  background: overall >= 80 ? "linear-gradient(90deg, #22c55e, #10b981)"
                    : overall >= 50 ? "linear-gradient(90deg, #f59e0b, #eab308)"
                    : "linear-gradient(90deg, #ef4444, #f97316)",
                }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[8px] text-slate-600">0%</span>
              <span className="text-[10px] font-black" style={{ color: overall >= 80 ? "#22c55e" : overall >= 50 ? "#f59e0b" : "#ef4444" }}>
                {overall}%
              </span>
              <span className="text-[8px] text-slate-600">100%</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🧬 جذر — اعرف ما يدفعك حقاً، وعش بتوافق مع قيمك كل يوم
        </p>
      </motion.div>

      {/* FAB */}
      {values.length < 5 && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 left-5 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 20px rgba(34,197,94,0.3)" }}>
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && <AddValueModal onClose={() => setShowAddModal(false)} existingDomains={existingDomains} />}
        {showCheckin && <AlignmentCheckin onClose={() => setShowCheckin(false)} />}
      </AnimatePresence>
    </div>
  );
}
