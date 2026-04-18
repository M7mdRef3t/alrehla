/**
 * وِرد — Wird: الطقوس اليومية
 *
 * كل يوم عنده طقس — والطقس يبني العادة:
 * - Morning Ritual — نبضة + نية
 * - Evening Ritual — تدوينة + شكر
 * - Micro-Actions — أفعال صغيرة
 * - Ritual Streak — streak خاص
 * - Consistency Score — مقياس الالتزام
 * - Completion Celebrations
 */

import type { FC } from "react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Zap, Flame, Star, Check, Plus, Trash2,
  Calendar, TrendingUp, Award, Sparkles, Target,
  Heart, PenLine, X, ChevronDown,
} from "lucide-react";
import { useWirdState, type Ritual } from "./store/wird.store";
import { trackEvent, AnalyticsEvents } from "@/services/analytics";
import { useEffect } from "react";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "today" | "rituals" | "stats";

const TIME_CONFIG = {
  morning: { label: "صباحي", icon: Sun, color: "#fbbf24", bg: "rgba(251,191,36," },
  evening: { label: "مسائي", icon: Moon, color: "#8b5cf6", bg: "rgba(139,92,246," },
  anytime: { label: "أي وقت", icon: Zap, color: "#06b6d4", bg: "rgba(6,182,212," },
};

const TYPE_EMOJIS = {
  pulse: "💓", journal: "📝", action: "⚡", gratitude: "🙏", intention: "🎯",
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const WirdScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [showAddRitual, setShowAddRitual] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState<Ritual["time"]>("anytime");
  const [newType, setNewType] = useState<Ritual["type"]>("action");
  const [intentionInput, setIntentionInput] = useState("");
  const [gratitudeInput, setGratitudeInput] = useState("");

  const {
    rituals, history, streak, bestStreak, dailyDirective,
    completeRitual, addRitual, removeRitual, toggleRitual,
    setIntention, setGratitude, getTodayCompletion, fetchAIGeneratedWird
  } = useWirdState();

  const today = useMemo(() => getTodayCompletion(), [getTodayCompletion]);
  const enabledRituals = useMemo(() => rituals.filter((r) => r.enabled), [rituals]);
  const completedCount = today.completedRituals.length;
  const totalEnabled = enabledRituals.length;
  const progress = totalEnabled > 0 ? Math.round((completedCount / totalEnabled) * 100) : 0;
  const allDone = completedCount >= totalEnabled && totalEnabled > 0;

  const morningRituals = useMemo(() => enabledRituals.filter((r) => r.time === "morning"), [enabledRituals]);
  const eveningRituals = useMemo(() => enabledRituals.filter((r) => r.time === "evening"), [enabledRituals]);
  const anytimeRituals = useMemo(() => enabledRituals.filter((r) => r.time === "anytime"), [enabledRituals]);

  // ── Weekly dots (last 7 days) ──
  const weekDots = useMemo(() => {
    const dots = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = history.find((h) => h.dateKey === key);
      const dayNames = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
      dots.push({
        key,
        label: i === 0 ? "اليوم" : dayNames[d.getDay()],
        completed: entry ? entry.completedRituals.length >= totalEnabled && totalEnabled > 0 : false,
        partial: entry ? entry.completedRituals.length > 0 : false,
      });
    }
    return dots;
  }, [history, totalEnabled]);

  // ── Consistency Score (last 30 days) ──
  const consistencyScore = useMemo(() => {
    let completed = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = history.find((h) => h.dateKey === key);
      if (entry && entry.completedRituals.length >= totalEnabled && totalEnabled > 0) completed++;
    }
    return totalEnabled > 0 ? Math.round((completed / 30) * 100) : 0;
  }, [history, totalEnabled]);

  // ── Analytics ──
  useEffect(() => {
    trackEvent(AnalyticsEvents.WIRD_VIEW, {
      streak,
      progress,
      total_rituals: totalEnabled,
      completed_count: completedCount
    });
  }, []); // Only once on mount

  useEffect(() => {
    trackEvent(AnalyticsEvents.WIRD_MODE_CHANGE, {
      new_mode: viewMode
    });
  }, [viewMode]);

  useEffect(() => {
    // Generate AI daily wird/directive automatically
    void fetchAIGeneratedWird();
  }, [fetchAIGeneratedWird]);

  const handleAddRitual = useCallback(() => {
    if (!newTitle.trim()) return;
    addRitual({ title: newTitle.trim(), emoji: TYPE_EMOJIS[newType], time: newTime, type: newType, enabled: true });
    setNewTitle(""); setShowAddRitual(false);
  }, [newTitle, newTime, newType, addRitual]);

  const handleSaveIntention = () => { 
    setIntention(intentionInput); 
    trackEvent(AnalyticsEvents.WIRD_INTENTION_SAVE, { text_length: intentionInput.length });
  };
  const handleSaveGratitude = () => { 
    setGratitude(gratitudeInput); 
    trackEvent(AnalyticsEvents.WIRD_GRATITUDE_SAVE, { text_length: gratitudeInput.length });
  };

  const viewTabs: { id: ViewMode; label: string; icon: typeof Sun }[] = [
    { id: "today", label: "اليوم", icon: Sun },
    { id: "rituals", label: "طقوسي", icon: Target },
    { id: "stats", label: "الالتزام", icon: TrendingUp },
  ];

  const renderRitualGroup = (title: string, icon: typeof Sun, color: string, groupRituals: Ritual[]) => {
    if (groupRituals.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-bold flex items-center gap-1.5 pr-1" style={{ color: `${color}90` }}>
          {(() => { const Icon = icon; return <Icon className="w-3 h-3" />; })()}
          {title}
        </p>
        {groupRituals.map((ritual) => {
          const isDone = today.completedRituals.includes(ritual.id);
          return (
            <motion.button key={ritual.id} layout
              onClick={() => {
                if (!isDone) {
                  completeRitual(ritual.id);
                  trackEvent(AnalyticsEvents.WIRD_RITUAL_COMPLETE, {
                    ritual_id: ritual.id,
                    ritual_title: ritual.title,
                    ritual_type: ritual.type,
                    ritual_time: ritual.time
                  });
                }
              }}
              className="w-full p-3.5 rounded-xl flex items-center gap-3 text-right transition-all active:scale-98"
              style={{
                background: isDone ? `${color}08` : "rgba(255,255,255,0.02)",
                border: `1px solid ${isDone ? `${color}15` : "rgba(255,255,255,0.05)"}`,
              }}
            >
              {/* Check Circle */}
              <motion.div
                animate={{ scale: isDone ? [1, 1.2, 1] : 1 }}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: isDone ? `${color}15` : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isDone ? `${color}30` : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {isDone ? (
                  <Check className="w-4 h-4" style={{ color }} />
                ) : (
                  <span className="text-sm">{ritual.emoji}</span>
                )}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${isDone ? "line-through opacity-40" : "text-white"}`}>{ritual.title}</p>
              </div>

              {isDone && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color }} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0a0a12 0%, #0d1020 40%, #08091a 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}
            >
              <Flame className="w-6 h-6 text-amber-400" />
              {allDone && (
                <motion.div className="absolute inset-0 bg-amber-400/10"
                  animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">وِرد</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">كل يوم طقس — والطقس يبني العادة</p>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm font-black text-amber-400">{streak}</span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {viewTabs.map((tab) => (
            <button key={tab.id} onClick={() => setViewMode(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: viewMode === tab.id ? "rgba(251,191,36,0.12)" : "transparent",
                color: viewMode === tab.id ? "#fbbf24" : "rgba(148,163,184,0.4)",
                border: viewMode === tab.id ? "1px solid rgba(251,191,36,0.2)" : "1px solid transparent",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* AI Daily Directive */}
        {dailyDirective && (
           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 p-4 rounded-xl relative overflow-hidden"
              style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)" }}
           >
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0" />
              <p className="text-[10px] text-teal-500 font-bold flex items-center gap-1.5 mb-2">
                 <Sparkles className="w-3 h-3" /> بوصلة اليوم المخصصة لك
              </p>
              <p className="text-sm font-bold text-white leading-relaxed">{dailyDirective}</p>
           </motion.div>
        )}
      </motion.div>

      {/* ═══ VIEW: Today ═══ */}
      {viewMode === "today" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-5">
          {/* Progress Ring */}
          <div className="p-5 rounded-2xl text-center relative overflow-hidden"
            style={{
              background: allDone ? "rgba(16,185,129,0.04)" : "rgba(251,191,36,0.03)",
              border: `1px solid ${allDone ? "rgba(16,185,129,0.1)" : "rgba(251,191,36,0.08)"}`,
            }}
          >
            {allDone && (
              <motion.div className="absolute inset-0"
                style={{ background: "radial-gradient(circle at center, rgba(16,185,129,0.06) 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            )}

            <div className="w-28 h-28 mx-auto relative mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                <motion.circle cx="50" cy="50" r="42" fill="none"
                  stroke={allDone ? "#10b981" : "#fbbf24"} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 264} 264`}
                  initial={{ strokeDasharray: "0 264" }}
                  animate={{ strokeDasharray: `${(progress / 100) * 264} 264` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                {allDone ? (
                  <>
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl">✨</motion.span>
                    <p className="text-[9px] text-emerald-400 font-bold mt-0.5">يوم مكتمل!</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-black text-white">{progress}%</p>
                    <p className="text-[9px] text-slate-500">{completedCount}/{totalEnabled}</p>
                  </>
                )}
              </div>
            </div>

            {/* Weekly Dots */}
            <div className="flex justify-center gap-2 mt-3">
              {weekDots.map((dot) => (
                <div key={dot.key} className="text-center">
                  <div className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center ${
                    dot.completed ? "bg-emerald-500/20" : dot.partial ? "bg-amber-500/15" : "bg-white/4"
                  }`}>
                    {dot.completed ? <Check className="w-2.5 h-2.5 text-emerald-400" /> :
                     dot.partial ? <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> :
                     <div className="w-1 h-1 rounded-full bg-white/10" />}
                  </div>
                  <p className="text-[7px] text-slate-600 mt-0.5">{dot.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Morning Rituals */}
          {renderRitualGroup("طقوس الصباح", Sun, "#fbbf24", morningRituals)}

          {/* Intention */}
          {morningRituals.length > 0 && (
            <div className="p-4 rounded-xl space-y-2"
              style={{ background: "rgba(251,191,36,0.03)", border: "1px solid rgba(251,191,36,0.06)" }}
            >
              <p className="text-[10px] text-amber-400/50 font-bold flex items-center gap-1">
                <Target className="w-3 h-3" /> نية اليوم
              </p>
              {today.intention ? (
                <p className="text-xs text-white font-medium">"{today.intention}"</p>
              ) : (
                <div className="flex gap-2">
                  <input value={intentionInput} onChange={(e) => setIntentionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveIntention()}
                    placeholder='مثلاً: "أركّز على اللي أقدر أتحكم فيه"'
                    className="flex-1 px-3 py-2 rounded-lg text-[10px] text-white placeholder:text-slate-600 outline-none"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  />
                  <button onClick={handleSaveIntention} disabled={!intentionInput.trim()}
                    className="px-3 rounded-lg disabled:opacity-30"
                    style={{ background: "rgba(251,191,36,0.1)" }}
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Anytime Rituals */}
          {renderRitualGroup("أي وقت", Zap, "#06b6d4", anytimeRituals)}

          {/* Evening Rituals */}
          {renderRitualGroup("طقوس المساء", Moon, "#8b5cf6", eveningRituals)}

          {/* Gratitude */}
          {eveningRituals.length > 0 && (
            <div className="p-4 rounded-xl space-y-2"
              style={{ background: "rgba(139,92,246,0.03)", border: "1px solid rgba(139,92,246,0.06)" }}
            >
              <p className="text-[10px] text-violet-400/50 font-bold flex items-center gap-1">
                <Heart className="w-3 h-3" /> شكر اليوم
              </p>
              {today.gratitude ? (
                <p className="text-xs text-white font-medium">"{today.gratitude}"</p>
              ) : (
                <div className="flex gap-2">
                  <input value={gratitudeInput} onChange={(e) => setGratitudeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveGratitude()}
                    placeholder='مثلاً: "ممتن إن عندي وقت لنفسي"'
                    className="flex-1 px-3 py-2 rounded-lg text-[10px] text-white placeholder:text-slate-600 outline-none"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  />
                  <button onClick={handleSaveGratitude} disabled={!gratitudeInput.trim()}
                    className="px-3 rounded-lg disabled:opacity-30"
                    style={{ background: "rgba(139,92,246,0.1)" }}
                  >
                    <Check className="w-3.5 h-3.5 text-violet-400" />
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ VIEW: My Rituals ═══ */}
      {viewMode === "rituals" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          <p className="text-[10px] text-slate-500 font-bold">طقوسك — عدّلها حسب يومك</p>

          {rituals.map((ritual) => (
            <div key={ritual.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: ritual.enabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
                border: `1px solid ${ritual.enabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)"}`,
                opacity: ritual.enabled ? 1 : 0.4,
              }}
            >
              <span className="text-lg">{ritual.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{ritual.title}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {TIME_CONFIG[ritual.time].label}
                </p>
              </div>
              <button onClick={() => toggleRitual(ritual.id)}
                className="px-2.5 py-1 rounded-lg text-[9px] font-bold"
                style={{
                  background: ritual.enabled ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
                  color: ritual.enabled ? "#10b981" : "#64748b",
                }}
              >
                {ritual.enabled ? "مفعّل" : "معطّل"}
              </button>
              <button onClick={() => removeRitual(ritual.id)} className="p-1 opacity-20 hover:opacity-50">
                <Trash2 className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          ))}

          {/* Add Ritual */}
          <AnimatePresence>
            {showAddRitual && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                className="p-4 rounded-2xl space-y-3"
                style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-amber-400">طقس جديد</p>
                  <button onClick={() => setShowAddRitual(false)}><X className="w-3.5 h-3.5 text-slate-500" /></button>
                </div>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder='مثلاً: "10 دقايق مشي"'
                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
                <div className="flex gap-2">
                  {(["morning", "evening", "anytime"] as const).map((t) => (
                    <button key={t} onClick={() => setNewTime(t)}
                      className="flex-1 py-2 rounded-lg text-[10px] font-bold"
                      style={{
                        background: newTime === t ? `${TIME_CONFIG[t].bg}0.1)` : "rgba(255,255,255,0.02)",
                        color: newTime === t ? TIME_CONFIG[t].color : "#64748b",
                        border: `1px solid ${newTime === t ? `${TIME_CONFIG[t].bg}0.2)` : "rgba(255,255,255,0.04)"}`,
                      }}
                    >{TIME_CONFIG[t].label}</button>
                  ))}
                </div>
                <button onClick={handleAddRitual} disabled={!newTitle.trim()}
                  className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-30 transition-all active:scale-95"
                  style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}
                >أضف الطقس</button>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddRitual && (
            <button onClick={() => setShowAddRitual(true)}
              className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.1)", color: "#fbbf24" }}
            >
              <Plus className="w-3.5 h-3.5" /> أضف طقس جديد
            </button>
          )}
        </motion.div>
      )}

      {/* ═══ VIEW: Stats ═══ */}
      {viewMode === "stats" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          {/* Consistency Score */}
          <div className="p-5 rounded-2xl text-center"
            style={{
              background: consistencyScore >= 60 ? "rgba(16,185,129,0.04)" : "rgba(251,191,36,0.04)",
              border: `1px solid ${consistencyScore >= 60 ? "rgba(16,185,129,0.1)" : "rgba(251,191,36,0.1)"}`,
            }}
          >
            <p className="text-[10px] text-slate-500 font-bold mb-3">مقياس الالتزام (30 يوم)</p>
            <div className="w-24 h-24 mx-auto relative mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                <motion.circle cx="50" cy="50" r="42" fill="none"
                  stroke={consistencyScore >= 60 ? "#10b981" : "#fbbf24"} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${(consistencyScore / 100) * 264} 264`}
                  initial={{ strokeDasharray: "0 264" }}
                  animate={{ strokeDasharray: `${(consistencyScore / 100) * 264} 264` }}
                  transition={{ duration: 1.2 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-black" style={{ color: consistencyScore >= 60 ? "#10b981" : "#fbbf24" }}>
                  {consistencyScore}%
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {consistencyScore >= 80 ? "ثبات استثنائي 🌟" :
               consistencyScore >= 60 ? "التزام قوي 💪" :
               consistencyScore >= 30 ? "بداية جيدة 🌱" :
               "ابدأ اليوم — كل يوم يحسب"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl text-center"
              style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}
            >
              <Flame className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-xl font-black text-white">{streak}</p>
              <p className="text-[8px] text-slate-500 font-bold">Streak حالي</p>
            </div>
            <div className="p-4 rounded-xl text-center"
              style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.08)" }}
            >
              <Award className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xl font-black text-white">{bestStreak}</p>
              <p className="text-[8px] text-slate-500 font-bold">أعلى Streak</p>
            </div>
            <div className="p-4 rounded-xl text-center"
              style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.08)" }}
            >
              <Calendar className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-xl font-black text-white">{history.length}</p>
              <p className="text-[8px] text-slate-500 font-bold">أيام مسجّلة</p>
            </div>
            <div className="p-4 rounded-xl text-center"
              style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.08)" }}
            >
              <Star className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-xl font-black text-white">{enabledRituals.length}</p>
              <p className="text-[8px] text-slate-500 font-bold">طقوس مفعّلة</p>
            </div>
          </div>

          {/* 30-Day Grid */}
          <div className="p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <p className="text-[10px] text-slate-500 font-bold mb-3">آخر 30 يوم</p>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                const entry = history.find((h) => h.dateKey === key);
                const done = entry ? entry.completedRituals.length >= totalEnabled && totalEnabled > 0 : false;
                const partial = entry ? entry.completedRituals.length > 0 : false;
                return (
                  <div key={i} className="aspect-square rounded-sm"
                    style={{
                      background: done ? "rgba(16,185,129,0.3)" : partial ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.03)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(251,191,36,0.03)", border: "1px solid rgba(251,191,36,0.06)" }}
      >
        <Flame className="w-5 h-5 text-amber-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          مش لازم يوم مثالي — يكفي إنك تحاول.
          <br />
          الطقس الصغير المتكرر — أقوى من الإنجاز الكبير المتقطع.
        </p>
      </motion.div>
    </div>
  );
};

export default WirdScreen;
