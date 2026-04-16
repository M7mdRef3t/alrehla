/**
 * سُلّم — Sullam: سلالم النمو
 *
 * حطّ أهداف صغيرة — واصعد درجة درجة:
 * - Create goals with steps (rungs)
 * - Check off rungs as you climb
 * - Visual ladder progress
 * - Area-based overview
 * - Milestones & completion badges
 * - Archive of conquered ladders
 */

import type { FC } from "react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp as Ladder, Plus, Check, Trophy, ChevronDown, Trash2,
} from "lucide-react";
import {
  useSullamState,
  AREA_META,
  type GrowthArea,
  type Goal,
} from "./store/sullam.store";
import { LanternGlow } from "./components/LanternGlow";
import { LanternDropModal } from "./components/LanternDropModal";
import { PassageRelicGenerator } from "./components/PassageRelicGenerator";
import { PassageRelic } from "./components/PassageRelic";
import { SanctuaryView } from "./components/SanctuaryView";
import { ObservatoryScreen } from "../observatory/ObservatoryScreen";
import { Moon } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "active" | "archive" | "create" | "overview" | "observatory";

const PRESET_RUNGS: Record<string, string[]> = {
  "عادة يومية": ["حدد العادة بوضوح", "نفذها أول مرة", "3 أيام متتالية", "أسبوع كامل", "21 يوم — عادة!"],
  "مهارة جديدة": ["ابحث عن مصادر التعلم", "أول درس/تجربة", "تمرين يومي لأسبوع", "مشروع تطبيقي صغير", "علّم غيرك"],
  "هدف صحي": ["حدد الهدف بالأرقام", "خطة أسبوعية", "أول أسبوع", "أول شهر", "التقييم والتعديل"],
};

/* ═══════════════════════════════════════════ */
/*           CREATE FORM                      */
/* ═══════════════════════════════════════════ */

const CreateGoalForm: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { addGoal } = useSullamState();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<GrowthArea>("personal");
  const [emoji, setEmoji] = useState("🌱");
  const [rungs, setRungs] = useState<string[]>(["", "", ""]);
  const [newRung, setNewRung] = useState("");

  const addRung = () => {
    if (newRung.trim()) {
      setRungs([...rungs, newRung.trim()]);
      setNewRung("");
    }
  };

  const removeRung = (idx: number) => {
    setRungs(rungs.filter((_, i) => i !== idx));
  };

  const updateRung = (idx: number, val: string) => {
    setRungs(rungs.map((r, i) => (i === idx ? val : r)));
  };

  const applyPreset = (key: string) => {
    setRungs(PRESET_RUNGS[key]);
  };

  const handleSubmit = () => {
    const validRungs = rungs.filter((r) => r.trim());
    if (!title.trim() || validRungs.length < 2) return;
    addGoal({ title: title.trim(), area, emoji, rungs: validRungs });
    onDone();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-4">
      {/* Title */}
      <div>
        <label className="text-[9px] text-lime-400/50 font-bold block mb-1">عنوان الهدف *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: أتعلم الطبخ"
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.05] focus:border-lime-400/20 focus:outline-none"
        />
      </div>

      {/* Area */}
      <div>
        <label className="text-[9px] text-lime-400/50 font-bold block mb-1.5">المجال</label>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(AREA_META) as GrowthArea[]).map((a) => {
            const meta = AREA_META[a];
            return (
              <button key={a} onClick={() => { setArea(a); setEmoji(meta.emoji); }}
                className="px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all"
                style={{
                  background: area === a ? `${meta.color}15` : "rgba(255,255,255,0.02)",
                  color: area === a ? meta.color : "#475569",
                  border: `1px solid ${area === a ? `${meta.color}25` : "rgba(255,255,255,0.03)"}`,
                }}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Templates */}
      <div>
        <label className="text-[9px] text-lime-400/50 font-bold block mb-1.5">قوالب جاهزة</label>
        <div className="flex gap-1.5 flex-wrap">
          {Object.keys(PRESET_RUNGS).map((key) => (
            <button key={key} onClick={() => applyPreset(key)}
              className="px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all"
              style={{ background: "rgba(255,255,255,0.02)", color: "#64748b", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              📋 {key}
            </button>
          ))}
        </div>
      </div>

      {/* Rungs */}
      <div>
        <label className="text-[9px] text-lime-400/50 font-bold block mb-1.5">الدرجات (حد أدنى 2) 🪜</label>
        <div className="space-y-1.5">
          {rungs.map((rung, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-[9px] text-slate-600 font-mono w-4 text-center">{idx + 1}</span>
              <input value={rung} onChange={(e) => updateRung(idx, e.target.value)}
                placeholder={`الدرجة ${idx + 1}...`}
                className="flex-1 px-3 py-2 rounded-lg text-[10px] text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.04] focus:outline-none"
              />
              {rungs.length > 2 && (
                <button onClick={() => removeRung(idx)} className="text-slate-700 hover:text-red-400 transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add rung */}
        <div className="flex gap-2 mt-2">
          <input value={newRung} onChange={(e) => setNewRung(e.target.value)}
            placeholder="درجة إضافية..."
            onKeyDown={(e) => e.key === "Enter" && addRung()}
            className="flex-1 px-3 py-2 rounded-lg text-[10px] text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.04] focus:outline-none"
          />
          <button onClick={addRung}
            className="px-3 py-2 rounded-lg text-[9px] font-bold"
            style={{ background: "rgba(132,204,22,0.08)", color: "#a3e635", border: "1px solid rgba(132,204,22,0.12)" }}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit}
        disabled={!title.trim() || rungs.filter((r) => r.trim()).length < 2}
        className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
        style={{ background: "rgba(132,204,22,0.12)", color: "#a3e635", border: "1px solid rgba(132,204,22,0.2)" }}
      >
        🪜 ابدأ الصعود
      </button>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*           GOAL CARD (LADDER)               */
/* ═══════════════════════════════════════════ */

const GoalCard: FC<{ goal: Goal; idx: number; onStartRelic: (goal: Goal) => void }> = ({ goal, idx, onStartRelic }) => {
  const { toggleRung, completeGoal, getProgressForGoal } = useSullamState();
  const [expanded, setExpanded] = useState(false);

  const areaMeta = AREA_META[goal.area];
  const progress = getProgressForGoal(goal.id);
  const allDone = goal.rungs.every((r) => r.done);
  const doneCount = goal.rungs.filter((r) => r.done).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: `${areaMeta.color}03`, border: `1px solid ${areaMeta.color}08` }}
    >
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center gap-3 text-right">
        <span className="text-xl">{goal.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white">{goal.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${areaMeta.color}10`, color: areaMeta.color }}
            >
              {areaMeta.emoji} {areaMeta.label}
            </span>
            <span className="text-[8px] text-slate-500">{doneCount}/{goal.rungs.length} درجات</span>
            {goal.completedAt && <span className="text-[8px] text-amber-400">🏆 مكتمل</span>}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-16 flex flex-col items-center gap-1 shrink-0">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: areaMeta.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <span className="text-[9px] font-black" style={{ color: areaMeta.color }}>{progress}%</span>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded: Ladder */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {/* Ladder visualization */}
              <div className="relative pr-4">
                {/* Vertical line */}
                <div className="absolute right-[13px] top-2 bottom-2 w-[2px] rounded-full"
                  style={{ background: `${areaMeta.color}15` }}
                />
                {/* Progress overlay */}
                <div className="absolute right-[13px] top-2 w-[2px] rounded-full transition-all duration-500"
                  style={{
                    background: areaMeta.color,
                    height: `${progress}%`,
                    maxHeight: "calc(100% - 16px)",
                    boxShadow: `0 0 8px ${areaMeta.color}40`,
                  }}
                />

                {goal.rungs.map((rung, rIdx) => (
                  <motion.div key={rung.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rIdx * 0.05 }}
                    className="flex items-center gap-3 py-2 relative"
                  >
                    {/* Rung dot */}
                    <button
                      onClick={() => !goal.completedAt && toggleRung(goal.id, rung.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all z-10"
                      style={{
                        background: rung.done ? `${areaMeta.color}25` : "rgba(255,255,255,0.03)",
                        border: `2px solid ${rung.done ? areaMeta.color : "rgba(255,255,255,0.06)"}`,
                        boxShadow: rung.done ? `0 0 10px ${areaMeta.color}30` : "none",
                      }}
                    >
                      {rung.done && <Check className="w-3 h-3" style={{ color: areaMeta.color }} />}
                    </button>

                    {/* Label */}
                    <span className={`text-[11px] font-medium transition-all ${
                      rung.done ? "line-through opacity-50" : "text-white"
                    }`}>
                      {rung.label}
                    </span>

                    {/* Step number */}
                    <span className="text-[8px] text-slate-700 font-mono mr-auto">{rIdx + 1}</span>
                  </motion.div>
                ))}
              </div>

              {/* Complete button */}
              {!goal.completedAt && allDone && (
                <div className="space-y-2 pt-2">
                  <button onClick={() => onStartRelic(goal)}
                    className="w-full py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                    style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.15)" }}
                  >
                    <Trophy className="w-3.5 h-3.5" /> 🎉 وصلت القمة، اصنع الأثر!
                  </button>
                </div>
              )}

              {/* Reflection */}
              {goal.completedAt && goal.reflection && (
                <div className="p-3 rounded-lg mt-2"
                  style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.08)" }}
                >
                  <p className="text-[9px] text-amber-400/50 font-bold mb-1">🏆 تأمل القمة</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{goal.reflection}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*           AREA OVERVIEW                    */
/* ═══════════════════════════════════════════ */

const AreaOverview: FC = () => {
  const { getAreaStats } = useSullamState();
  const stats = useMemo(() => getAreaStats(), [getAreaStats]);

  if (stats.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-xs text-slate-600">لا توجد بيانات بعد — أضف أول هدف لتبدأ</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
      {stats.map((s) => {
        const meta = AREA_META[s.area];
        const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        return (
          <div key={s.area} className="p-4 rounded-xl"
            style={{ background: `${meta.color}03`, border: `1px solid ${meta.color}06` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{meta.emoji}</span>
                <span className="text-[11px] font-bold text-white">{meta.label}</span>
              </div>
              <span className="text-[10px] font-bold" style={{ color: meta.color }}>{s.completed}/{s.total}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              <motion.div className="h-full rounded-full"
                style={{ background: meta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const SullamScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const { goals, sanctuary, getActiveGoals, getCompletedGoals, getStuckAreas, completeGoal, enterSanctuary } = useSullamState();
  
  const [lanternDropArea, setLanternDropArea] = useState<GrowthArea | null>(null);
  const [relicGeneratorGoal, setRelicGeneratorGoal] = useState<Goal | null>(null);
  const [relicGoal, setRelicGoal] = useState<Goal | null>(null);
  const [showSanctuaryPrompt, setShowSanctuaryPrompt] = useState(false);

  const activeGoals = useMemo(() => getActiveGoals(), [goals]);
  const completedGoals = useMemo(() => getCompletedGoals(), [goals]);
  const stuckAreas = useMemo(() => getStuckAreas(), [getStuckAreas]);

  const totalRungs = goals.reduce((sum, g) => sum + g.rungs.length, 0);
  const doneRungs = goals.reduce((sum, g) => sum + g.rungs.filter((r) => r.done).length, 0);

  return (
    <div className="min-h-screen pb-32 select-none relative" dir="rtl"
      style={{ background: "linear-gradient(180deg, #080c06 0%, #101c0a 40%, #080c08 100%)" }}
    >
      <SanctuaryView />

      {/* Floating Lanterns for Stuck Areas */}
      <div className="fixed top-24 left-4 z-40 flex flex-col gap-4 pointer-events-none">
        {stuckAreas.map(area => (
          <div key={area} className="pointer-events-auto">
            <LanternGlow area={area} onLightUp={() => {}} />
          </div>
        ))}
      </div>

      {relicGeneratorGoal && (
        <PassageRelicGenerator
          goal={relicGeneratorGoal}
          onClose={() => setRelicGeneratorGoal(null)}
          onSubmit={(reflection) => {
            completeGoal(relicGeneratorGoal.id, reflection);
            const finishedGoal = { ...relicGeneratorGoal, completedAt: Date.now(), reflection };
            setRelicGeneratorGoal(null);
            // Wait slightly for modal animation
            setTimeout(() => setRelicGoal(finishedGoal), 300);
          }}
        />
      )}

      {relicGoal && (
        <PassageRelic
          goal={relicGoal}
          onClose={() => {
            const area = relicGoal.area;
            setRelicGoal(null);
            setTimeout(() => setLanternDropArea(area), 400); // Ask to drop lantern
          }}
        />
      )}

      {lanternDropArea && (
        <LanternDropModal 
          area={lanternDropArea} 
          onClose={() => setLanternDropArea(null)} 
          onSuccess={() => setLanternDropArea(null)} 
        />
      )}

      {/* Sanctuary Prompt Modal */}
      <AnimatePresence>
        {showSanctuaryPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-3xl p-6 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -m-10" />
              <div className="relative text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-900/20 border border-blue-500/20 mx-auto flex items-center justify-center mb-4">
                  <Moon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">كم يوماً تحتاج للراحة؟</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  سيتم تجميد الزمن وأهدافك بالكامل حتى عودتك، دون التأثير على إحصائياتك.
                </p>
                <div className="flex gap-2 pt-4">
                  {[1, 3, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() => {
                        enterSanctuary(days);
                        setShowSanctuaryPrompt(false);
                      }}
                      className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/30 text-white font-medium transition-colors"
                    >
                      {days} {days === 1 ? "يوم" : "أيام"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowSanctuaryPrompt(false)}
                  className="w-full py-2 mt-2 text-sm text-slate-500 hover:text-slate-300"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(132,204,22,0.12)", border: "1px solid rgba(132,204,22,0.25)" }}
            >
              <Ladder className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">سُلّم</h1>
                {!sanctuary.isActive && (
                  <div className="flex gap-1.5 ml-2">
                    <button onClick={() => setShowSanctuaryPrompt(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 border border-blue-900/30 transition-all font-medium"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">الملاذ</span>
                    </button>
                    <button onClick={() => setViewMode("observatory")}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40 border border-indigo-900/30 transition-all font-medium"
                    >
                      <span className="text-sm">🕸️</span>
                      <span className="text-[10px]">المرصد</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">سلالم النمو</p>
            </div>
          </div>

          {/* Overall */}
          <div className="text-left">
            <p className="text-xl font-black text-lime-400">{doneRungs}<span className="text-sm text-slate-600">/{totalRungs}</span></p>
            <p className="text-[8px] text-slate-600 font-bold">درجات صعدتها</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "نشط", value: activeGoals.length, emoji: "🎯", color: "#10b981" },
            { label: "مكتمل", value: completedGoals.length, emoji: "🏆", color: "#fbbf24" },
            { label: "درجات", value: doneRungs, emoji: "🪜", color: "#a3e635" },
            { label: "مجالات", value: new Set(goals.map((g) => g.area)).size, emoji: "🌐", color: "#8b5cf6" },
          ].map((s) => (
            <div key={s.label} className="flex-1 p-2 rounded-xl text-center"
              style={{ background: `${s.color}06`, border: `1px solid ${s.color}10` }}
            >
              <span className="text-xs">{s.emoji}</span>
              <p className="text-sm font-black text-white mt-0.5">{s.value}</p>
              <p className="text-[7px] text-slate-500 font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {([
            { key: "active", label: "النشطة", icon: "🎯" },
            { key: "overview", label: "نظرة عامة", icon: "📊" },
            { key: "archive", label: "الأرشيف", icon: "🏆" },
            { key: "create", label: "هدف جديد", icon: "➕" },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className="flex-1 py-2 rounded-lg text-[9px] font-bold transition-all"
              style={{
                background: viewMode === tab.key ? "rgba(132,204,22,0.1)" : "rgba(255,255,255,0.02)",
                color: viewMode === tab.key ? "#a3e635" : "#475569",
                border: `1px solid ${viewMode === tab.key ? "rgba(132,204,22,0.15)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ Active View ═══ */}
      {viewMode === "active" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {activeGoals.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Ladder className="w-10 h-10 text-lime-400/10 mx-auto" />
              <p className="text-sm text-slate-500 font-bold">لا يوجد أهداف نشطة</p>
              <p className="text-xs text-slate-600">ابدأ بسُلّم جديد — درجة درجة نوصل.</p>
              <button onClick={() => setViewMode("create")}
                className="px-5 py-2 rounded-xl text-[10px] font-bold mx-auto"
                style={{ background: "rgba(132,204,22,0.1)", color: "#a3e635", border: "1px solid rgba(132,204,22,0.15)" }}
              >
                <Plus className="w-3 h-3 inline mr-1" /> أضف هدف
              </button>
            </div>
          ) : (
            activeGoals.map((g, idx) => (
              <GoalCard key={g.id} goal={g} idx={idx} onStartRelic={(goal) => setRelicGeneratorGoal(goal)} />
            ))
          )}
        </motion.div>
      )}

      {/* ═══ Overview View ═══ */}
      {viewMode === "overview" && <AreaOverview />}

      {/* ═══ Archive View ═══ */}
      {viewMode === "archive" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {completedGoals.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-8 h-8 text-lime-400/10 mx-auto mb-2" />
              <p className="text-xs text-slate-600">الأرشيف فارغ — أكمل أول سلّم ليظهر هنا</p>
            </div>
          ) : (
            completedGoals.map((g, idx) => (
              <GoalCard key={g.id} goal={g} idx={idx} onStartRelic={() => {}} />
            ))
          )}
        </motion.div>
      )}

      {/* ═══ Create View ═══ */}
      {viewMode === "create" && (
        <CreateGoalForm onDone={() => setViewMode("active")} />
      )}

      {viewMode === "observatory" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="absolute inset-0 z-40">
           <button onClick={() => setViewMode("active")} className="absolute top-8 left-6 z-50 text-indigo-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 p-2.5 px-4 rounded-full backdrop-blur-md border border-indigo-500/30 hover:border-indigo-400/50 transition-all font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]">
             عودة للسُلّم ✕
           </button>
           <ObservatoryScreen />
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(132,204,22,0.03)", border: "1px solid rgba(132,204,22,0.06)" }}
      >
        <Ladder className="w-5 h-5 text-lime-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          كل رحلة ألف ميل تبدأ بخطوة واحدة.
          <br />
          اصعد درجة درجة — والقمة أقرب مما تتخيل.
        </p>
      </motion.div>
    </div>
  );
};

export default SullamScreen;

