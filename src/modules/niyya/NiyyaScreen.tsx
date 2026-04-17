/**
 * نية — Niyya Screen
 * Daily Intention Setting + Commitment Tracking
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useNiyyaState,
  CATEGORY_META,
  COMMITMENT_META,
  type IntentionCategory,
  type CommitmentLevel,
} from "./store/niyya.store";
import { Target, Plus, X, CheckCircle, Star } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*       SET INTENTION MODAL                  */
/* ═══════════════════════════════════════════ */

function SetIntentionModal({ onClose }: { onClose: () => void }) {
  const { setTodayIntention } = useNiyyaState();
  const [intention, setIntention] = useState("");
  const [category, setCategory] = useState<IntentionCategory>("growth");

  const handleSave = () => {
    if (!intention.trim()) return;
    setTodayIntention({ intention: intention.trim(), category });
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
          <h3 className="text-sm font-black text-white">🎯 نيتك اليوم</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea value={intention} onChange={(e) => setIntention(e.target.value)}
          placeholder="ما النية الواحدة التي تريد أن تعيش بها اليوم؟"
          rows={3}
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
          dir="rtl" />

        {/* Category */}
        <div>
          <span className="text-[9px] text-slate-500 font-bold uppercase mb-1.5 block">مجال النية</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CATEGORY_META) as IntentionCategory[]).map((c) => {
              const meta = CATEGORY_META[c];
              const active = category === c;
              return (
                <button key={c} onClick={() => setCategory(c)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                  style={{
                    background: active ? `${meta.color}20` : "rgba(30,41,59,0.4)",
                    border: `1px solid ${active ? meta.color : "rgba(51,65,85,0.3)"}`,
                    color: active ? meta.color : "#94a3b8",
                  }}>
                  <span>{meta.emoji}</span><span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          disabled={!intention.trim()}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(99,102,241,0.06))",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "#10b981",
          }}>
          🎯 ابدأ بنيتك
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*       REFLECTION MODAL                     */
/* ═══════════════════════════════════════════ */

function ReflectionModal({ intentionId, existing, onClose }: {
  intentionId: string; existing: string; onClose: () => void;
}) {
  const { addReflection } = useNiyyaState();
  const [text, setText] = useState(existing);

  const handleSave = () => {
    addReflection(intentionId, text.trim());
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

        <h3 className="text-sm font-black text-white">📝 تأمل في نيتك</h3>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="كيف كانت تجربتك مع نية اليوم؟ ماذا تعلمت؟"
          rows={3}
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
          dir="rtl" />

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          className="w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
          💾 احفظ التأمل
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function NiyyaScreen() {
  const {
    intentions, getToday, getStreak, getFulfilledCount, getCommitmentRate,
    getCategoryBreakdown, getWeekSummary, updateCommitment, removeIntention,
  } = useNiyyaState();

  const [showSetModal, setShowSetModal] = useState(false);
  const [reflectionTarget, setReflectionTarget] = useState<{ id: string; existing: string } | null>(null);

  const todayIntention = useMemo(() => getToday(), [intentions]);
  const streak = useMemo(() => getStreak(), [intentions]);
  const fulfilled = useMemo(() => getFulfilledCount(), [intentions]);
  const rate = useMemo(() => getCommitmentRate(), [intentions]);
  const categories = useMemo(() => getCategoryBreakdown(), [intentions]);
  const weekSummary = useMemo(() => getWeekSummary(), [intentions]);

  const dayLabels = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-900/15 border border-emerald-500/20">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">نية</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">نيتك تصنع يومك</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "سلسلة وفاء", value: `${streak} يوم`, color: "#f59e0b" },
            { label: "وفّيت", value: fulfilled, color: "#10b981" },
            { label: "نسبة الالتزام", value: `${rate}%`, color: "#6366f1" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Week Summary */}
      <div className="relative z-10 px-5 mb-5">
        <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-3">آخر 7 أيام</span>
          <div className="flex gap-2 justify-between">
            {weekSummary.map((day, i) => {
              const cm = day.commitment ? COMMITMENT_META[day.commitment] : null;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{
                      background: cm ? `${cm.color}15` : "rgba(30,41,59,0.4)",
                      border: `1px solid ${cm ? `${cm.color}30` : "rgba(51,65,85,0.3)"}`,
                    }}>
                    {cm ? cm.emoji : "·"}
                  </div>
                  <span className="text-[8px] text-slate-600 font-bold">{dayLabels[new Date(day.date).getDay()]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Intention */}
      <div className="relative z-10 px-5 mb-5">
        {todayIntention ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-5" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORY_META[todayIntention.category].emoji}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${CATEGORY_META[todayIntention.category].color}15`, color: CATEGORY_META[todayIntention.category].color }}>
                  {CATEGORY_META[todayIntention.category].label}
                </span>
              </div>
              <span className="text-[8px] text-slate-600">اليوم</span>
            </div>

            <p className="text-sm text-white/90 font-bold leading-relaxed mb-4">{todayIntention.intention}</p>

            {/* Commitment buttons */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">كيف كان التزامك؟</span>
              <div className="flex gap-1.5">
                {(Object.keys(COMMITMENT_META) as CommitmentLevel[]).map((level) => {
                  const meta = COMMITMENT_META[level];
                  const active = todayIntention.commitment === level;
                  return (
                    <button key={level} onClick={() => updateCommitment(todayIntention.id, level)}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-0.5"
                      style={{
                        background: active ? `${meta.color}15` : "rgba(30,41,59,0.4)",
                        border: `1px solid ${active ? meta.color : "rgba(51,65,85,0.3)"}`,
                        color: active ? meta.color : "#94a3b8",
                      }}>
                      <span className="text-sm">{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reflection */}
            {todayIntention.reflection ? (
              <div className="mt-3 rounded-xl p-3 bg-slate-800/30 border border-slate-700/30">
                <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">📝 تأملك</span>
                <p className="text-[11px] text-white/70 leading-relaxed">{todayIntention.reflection}</p>
                <button onClick={() => setReflectionTarget({ id: todayIntention.id, existing: todayIntention.reflection })}
                  className="text-[9px] text-indigo-400 font-bold mt-1">تعديل</button>
              </div>
            ) : (
              <button onClick={() => setReflectionTarget({ id: todayIntention.id, existing: "" })}
                className="mt-3 w-full py-2 rounded-xl text-[10px] font-bold transition-all"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8" }}>
                📝 أضف تأمل
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(16,185,129,0.04)", border: "1px dashed rgba(16,185,129,0.2)" }}>
            <span className="text-5xl block mb-3">🎯</span>
            <p className="text-sm text-white/80 font-bold mb-1">لم تحدد نية اليوم بعد</p>
            <p className="text-[10px] text-slate-500 mb-4">النية الواحدة الواضحة تغيّر يومك كله</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSetModal(true)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
              🎯 حدد نية اليوم
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div className="relative z-10 px-5 mb-5">
          <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-3">أين تتركز نواياك</span>
            <div className="space-y-2">
              {categories.map((c) => {
                const meta = CATEGORY_META[c.category];
                const maxCount = Math.max(...categories.map((x) => x.count));
                const pct = maxCount > 0 ? (c.count / maxCount) * 100 : 0;
                return (
                  <div key={c.category} className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">{meta.emoji}</span>
                    <span className="text-[10px] w-10 font-bold" style={{ color: meta.color }}>{meta.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        className="h-full rounded-full" style={{ background: meta.color }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 w-6 text-left">{c.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="relative z-10 px-5">
        <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider">📜 سجل النوايا</h3>
        {intentions.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-8">ابدأ رحلة النية — سجّل أول نية لك</p>
        ) : (
          <div className="space-y-2">
            {intentions.slice(0, 20).map((i) => {
              const catMeta = CATEGORY_META[i.category];
              const cmMeta = COMMITMENT_META[i.commitment];
              const isToday = i.date === new Date().toISOString().slice(0, 10);
              return (
                <motion.div key={i.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl px-3 py-2.5 flex items-center gap-3 group"
                  style={{
                    background: isToday ? `${catMeta.color}06` : "rgba(15,23,42,0.4)",
                    border: `1px solid ${isToday ? `${catMeta.color}15` : "rgba(51,65,85,0.2)"}`,
                  }}>
                  <span className="text-sm">{catMeta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/80 truncate font-medium">{i.intention}</p>
                    <span className="text-[8px] text-slate-600">{i.date}</span>
                  </div>
                  <span className="text-sm">{cmMeta.emoji}</span>
                  <button onClick={() => removeIntention(i.id)}
                    className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-50 text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🎯 نية — "إنما الأعمال بالنيات" — ابدأ كل يوم بنية واحدة واضحة
        </p>
      </motion.div>

      {/* FAB */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowSetModal(true)}
        className="fixed bottom-24 left-5 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}>
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {showSetModal && <SetIntentionModal onClose={() => setShowSetModal(false)} />}
        {reflectionTarget && (
          <ReflectionModal
            intentionId={reflectionTarget.id}
            existing={reflectionTarget.existing}
            onClose={() => setReflectionTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
