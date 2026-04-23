/**
 * راية — Raya Screen
 * 90-Day Vision Board & Long-Term Goals
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRayaState,
  CATEGORY_META,
  type GoalCategory,
  type VisionGoal,
} from "./store/raya.store";
import { Flag, Plus, Check, Pause, Play, X, ChevronDown, Trash2 } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*         GOAL DETAIL MODAL                  */
/* ═══════════════════════════════════════════ */

function GoalModal({ goal, onClose }: { goal: VisionGoal; onClose: () => void }) {
  const { toggleMilestone, completeGoal, pauseGoal, resumeGoal, getDaysRemaining } = useRayaState();
  const cat = CATEGORY_META[goal.category];
  const daysLeft = useMemo(() => getDaysRemaining(goal.id), [getDaysRemaining, goal.id]);
  const elapsed = Math.floor((Date.now() - goal.startedAt) / 86400000);
  const totalM = goal.milestones.length;
  const doneM = goal.milestones.filter((m) => m.completed).length;
  const pct = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.95 }}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5 relative"
        style={{ background: "#0a0f1f", border: `1px solid ${cat.color}20` }}
        onClick={(e) => e.stopPropagation()}>

        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{ background: `radial-gradient(circle at 50% 0%, ${cat.color}08, transparent 60%)` }} />

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500 z-10">
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4 relative z-10">
          <span className="text-4xl block mb-2">{goal.emoji}</span>
          <h2 className="text-lg font-black text-white mb-1">{goal.title}</h2>
          <p className="text-[11px] text-slate-400 italic leading-relaxed">"{goal.vision}"</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${cat.color}12`, color: cat.color, border: `1px solid ${cat.color}20` }}>
              {cat.emoji} {cat.label}
            </span>
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-slate-800/50 text-slate-400">
              {daysLeft} يوم متبقي
            </span>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative z-10 rounded-xl p-4 mb-4"
          style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(51,65,85,0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-bold">التقدم الكلي</span>
            <span className="text-sm font-black" style={{ color: cat.color }}>{pct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full" style={{ background: cat.color }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[8px] text-slate-600">يوم {elapsed} من {goal.targetDays}</span>
            <span className="text-[8px] text-slate-600">{doneM}/{totalM} محطات</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="relative z-10 space-y-2 mb-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">محطات الرحلة</h3>
          {goal.milestones.map((m, idx) => (
            <button key={m.id}
              onClick={() => toggleMilestone(goal.id, m.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right"
              style={{
                background: m.completed ? `${cat.color}06` : "rgba(15,23,42,0.3)",
                border: `1px solid ${m.completed ? `${cat.color}15` : "rgba(51,65,85,0.15)"}`,
              }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: m.completed ? `${cat.color}20` : "rgba(30,41,59,0.5)",
                  border: `1.5px solid ${m.completed ? cat.color : "rgba(51,65,85,0.3)"}`,
                }}>
                {m.completed && <Check className="w-3 h-3" style={{ color: cat.color }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${m.completed ? "text-white/80 line-through" : "text-white"}`}>{m.title}</p>
                <span className="text-[8px] text-slate-600">يوم {m.dueDay}</span>
              </div>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: m.completed ? "#22c55e15" : "rgba(30,41,59,0.4)", color: m.completed ? "#22c55e" : "#64748b" }}>
                {idx + 1}/{totalM}
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="relative z-10 flex gap-2">
          {goal.status === "active" ? (
            <>
              <button onClick={() => pauseGoal(goal.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                <Pause className="w-3 h-3" /> إيقاف مؤقت
              </button>
              <button onClick={() => { completeGoal(goal.id); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20">
                <Check className="w-3 h-3" /> تحقق الهدف
              </button>
            </>
          ) : goal.status === "paused" ? (
            <button onClick={() => resumeGoal(goal.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
              <Play className="w-3 h-3" /> استأنف
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*          ADD GOAL MODAL                    */
/* ═══════════════════════════════════════════ */

function AddGoalModal({ onClose }: { onClose: () => void }) {
  const { addGoal } = useRayaState();
  const [title, setTitle] = useState("");
  const [vision, setVision] = useState("");
  const [category, setCategory] = useState<GoalCategory>("self");
  const [emoji, setEmoji] = useState("🏴");

  const handleSubmit = () => {
    if (!title.trim()) return;
    addGoal({
      title: title.trim(),
      vision: vision.trim() || `بعد 90 يوم سأحقق: ${title.trim()}`,
      category,
      emoji,
      targetDays: 90,
      notes: "",
      milestones: [
        { id: "a1", title: "بداية الرحلة — أول خطوة", completed: false, completedAt: null, dueDay: 7 },
        { id: "a2", title: "تقدم ملموس — ربع الطريق", completed: false, completedAt: null, dueDay: 23 },
        { id: "a3", title: "منتصف الرحلة — مراجعة", completed: false, completedAt: null, dueDay: 45 },
        { id: "a4", title: "الدفعة الأخيرة — 75%", completed: false, completedAt: null, dueDay: 68 },
        { id: "a5", title: "الوصول — تحقق الهدف", completed: false, completedAt: null, dueDay: 90 },
      ],
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
        className="w-full max-w-md rounded-3xl p-5 relative"
        style={{ background: "#0a0f1f", border: "1px solid rgba(99,102,241,0.15)" }}
        onClick={(e) => e.stopPropagation()}>

        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
          <X className="w-3.5 h-3.5" />
        </button>

        <h2 className="text-base font-black text-white mb-4 text-center">🏴 راية جديدة</h2>

        {/* Emoji picker */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar">
          {["🏴","🎯","⭐","🌟","💪","🔥","🌱","🚀","💎","🦁"].map((e) => (
            <button key={e} onClick={() => setEmoji(e)}
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-lg transition-all"
              style={{ background: emoji === e ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.4)", border: `1.5px solid ${emoji === e ? "rgba(99,102,241,0.3)" : "rgba(51,65,85,0.2)"}` }}>
              {e}
            </button>
          ))}
        </div>

        {/* Title */}
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان الهدف..."
          className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500/30" />

        {/* Vision */}
        <textarea value={vision} onChange={(e) => setVision(e.target.value)}
          placeholder="بعد 90 يوم سأكون..."
          rows={2}
          className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-[11px] text-white placeholder:text-slate-600 mb-3 outline-none focus:border-indigo-500/30 resize-none" />

        {/* Category */}
        <div className="flex gap-2 flex-wrap mb-4">
          {(Object.keys(CATEGORY_META) as GoalCategory[]).map((c) => {
            const meta = CATEGORY_META[c];
            const active = category === c;
            return (
              <button key={c} onClick={() => setCategory(c)}
                className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all"
                style={{
                  background: active ? `${meta.color}15` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? `${meta.color}30` : "rgba(51,65,85,0.2)"}`,
                  color: active ? meta.color : "#64748b",
                }}>
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>

        <button onClick={handleSubmit} disabled={!title.trim()}
          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
          ارفع الراية 🏴
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function RayaScreen() {
  const { goals, activeVision, getActive, getCompleted, getOverallProgress, getDaysRemaining } = useRayaState();
  const [selectedGoal, setSelectedGoal] = useState<VisionGoal | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<GoalCategory | "all" | "completed">("all");

  const overallPct = useMemo(() => getOverallProgress(), [getOverallProgress]);
  const activeGoals = useMemo(() => getActive(), [getActive]);
  const completedGoals = useMemo(() => getCompleted(), [getCompleted]);

  const filtered = useMemo(() => {
    if (filter === "all") return goals.filter((g) => g.status !== "completed");
    if (filter === "completed") return completedGoals;
    return goals.filter((g) => g.category === filter && g.status !== "completed");
  }, [goals, filter, completedGoals]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full top-[-20%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-900/15 border border-indigo-500/20">
              <Flag className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">راية</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">رؤيتك طويلة المدى — 90 يوم</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Vision Statement */}
      <div className="relative z-10 px-5 mb-5">
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.12)" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-12 -mt-12" />
          <div className="relative z-10">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">الرؤية الكبرى</span>
            <p className="text-sm text-white/90 font-medium mt-1 leading-relaxed italic">"{activeVision}"</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "أهداف نشطة", value: activeGoals.length, color: "#6366f1" },
            { label: "محققة", value: completedGoals.length, color: "#22c55e" },
            { label: "التقدم الكلي", value: `${overallPct}%`, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Overall bar */}
        <div className="mt-3 rounded-xl p-3"
          style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-slate-500 font-bold">تقدم كل الأهداف</span>
            <span className="text-xs font-black text-indigo-400">{overallPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: "all", label: "الكل" },
            { key: "completed", label: "✅ محققة" },
            ...Object.entries(CATEGORY_META).map(([k, v]) => ({ key: k, label: `${v.emoji} ${v.label}` })),
          ].map(({ key, label }) => {
            const active = filter === key;
            const color = key in CATEGORY_META ? CATEGORY_META[key as GoalCategory].color : "#6366f1";
            return (
              <button key={key} onClick={() => setFilter(key as any)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${color}15` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? `${color}30` : "rgba(51,65,85,0.3)"}`,
                  color: active ? color : "#64748b",
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Goals List */}
      <div className="relative z-10 px-5 space-y-3">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.2)" }}>
            <span className="text-5xl block mb-3">🏴</span>
            <p className="text-sm text-white/80 font-bold mb-1">لا رايات بعد</p>
            <p className="text-[10px] text-slate-500">ارفع أول راية — حدد هدفك لـ 90 يوم</p>
            <button onClick={() => setShowAdd(true)}
              className="mt-3 px-4 py-2 rounded-xl text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
              <Plus className="w-3 h-3 inline ml-1" /> راية جديدة
            </button>
          </motion.div>
        ) : (
          filtered.map((goal, idx) => {
            const cat = CATEGORY_META[goal.category];
            const totalM = goal.milestones.length;
            const doneM = goal.milestones.filter((m) => m.completed).length;
            const pct = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;
            const daysLeft = getDaysRemaining(goal.id);

            return (
              <motion.button key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedGoal(goal)}
                className="w-full rounded-xl p-4 text-right relative overflow-hidden group transition-all active:scale-[0.98]"
                style={{
                  background: goal.status === "completed" ? "rgba(34,197,94,0.04)" : `${cat.color}04`,
                  border: `1px solid ${goal.status === "completed" ? "rgba(34,197,94,0.12)" : `${cat.color}12`}`,
                }}>

                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(circle at 80% 30%, ${cat.color}06, transparent 60%)` }} />

                <div className="flex items-start gap-3 relative z-10">
                  {/* Emoji */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cat.color}10`, border: `1.5px solid ${cat.color}20` }}>
                    <span className="text-2xl">{goal.emoji}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-black text-white truncate">{goal.title}</span>
                      {goal.status === "paused" && (
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">متوقف</span>
                      )}
                      {goal.status === "completed" && (
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">✅ تحقق</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mb-2">{goal.vision}</p>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: goal.status === "completed" ? "#22c55e" : cat.color }} />
                      </div>
                      <span className="text-[8px] font-bold shrink-0" style={{ color: cat.color }}>{pct}%</span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[8px] text-slate-600">{doneM}/{totalM} محطات</span>
                      <span className="text-[8px] text-slate-600">{daysLeft} يوم متبقي</span>
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${cat.color}08`, color: cat.color }}>
                        {cat.emoji} {cat.label}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 -rotate-90 shrink-0 mt-1" />
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🏴 راية — ارفع رايتك وحدد وجهتك — كل رحلة تبدأ برؤية واضحة
        </p>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {selectedGoal && <GoalModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} />}
        {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
