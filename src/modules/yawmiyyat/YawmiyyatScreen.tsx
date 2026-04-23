/**
 * يوميّات — Yawmiyyat Screen
 * Unified Daily Timeline & Journal
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useYawmiyyatState,
  ENTRY_TYPE_META,
  MOOD_META,
  type EntryType,
  type MoodLevel,
  type DayEntry,
} from "./store/yawmiyyat.store";
import {
  CalendarDays, Plus, Pin, Trash2, X, ChevronLeft, ChevronRight, Flame,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*           ADD ENTRY MODAL                  */
/* ═══════════════════════════════════════════ */

function AddEntryModal({ onClose }: { onClose: () => void }) {
  const { addEntry } = useYawmiyyatState();
  const [type, setType] = useState<EntryType>("note");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [tags, setTags] = useState("");

  const meta = ENTRY_TYPE_META[type];

  const handleSubmit = () => {
    if (!content.trim() && !mood) return;
    addEntry({
      type,
      content: content.trim(),
      emoji: meta.emoji,
      mood: mood ?? undefined,
      tags: tags.trim() ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5 relative"
        style={{ background: "#0a0f1f", border: `1px solid ${meta.color}20` }}
        onClick={(e) => e.stopPropagation()}>

        <div className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${meta.color}06, transparent 55%)` }} />

        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500 z-10">
          <X className="w-3.5 h-3.5" />
        </button>

        <h2 className="text-base font-black text-white mb-4 text-center relative z-10">📅 لحظة جديدة</h2>

        {/* Type picker */}
        <div className="relative z-10 flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {(Object.keys(ENTRY_TYPE_META) as EntryType[]).map((t) => {
            const m = ENTRY_TYPE_META[t];
            const active = type === t;
            return (
              <button key={t} onClick={() => setType(t)}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all"
                style={{
                  background: active ? `${m.color}15` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? `${m.color}30` : "rgba(51,65,85,0.2)"}`,
                  color: active ? m.color : "#64748b",
                }}>
                {m.emoji} {m.label}
              </button>
            );
          })}
        </div>

        {/* Mood selector (always visible for mood type, optional for others) */}
        <div className="relative z-10 mb-3">
          <span className="text-[9px] text-slate-500 font-bold block mb-1.5">
            {type === "mood" ? "كيف حالك الآن؟" : "المزاج (اختياري)"}
          </span>
          <div className="flex gap-2 justify-center">
            {([1, 2, 3, 4, 5] as MoodLevel[]).map((m) => {
              const meta = MOOD_META[m];
              const active = mood === m;
              return (
                <button key={m} onClick={() => setMood(active ? null : m)}
                  className="w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all"
                  style={{
                    background: active ? `${meta.color}15` : "rgba(30,41,59,0.4)",
                    border: `1.5px solid ${active ? meta.color : "rgba(51,65,85,0.2)"}`,
                    transform: active ? "scale(1.1)" : "scale(1)",
                  }}>
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-[6px] font-bold" style={{ color: active ? meta.color : "#475569" }}>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={meta.placeholder}
          rows={3}
          className="relative z-10 w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500/30 resize-none" />

        {/* Tags */}
        <input value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder="وسوم (افصل بفاصلة)..."
          className="relative z-10 w-full bg-slate-900/50 border border-slate-700/30 rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-slate-600 mb-3 outline-none focus:border-indigo-500/30" />

        <button onClick={handleSubmit} disabled={!content.trim() && !mood}
          className="relative z-10 w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25`, color: meta.color }}>
          سجّل اللحظة ✨
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*          ENTRY CARD                        */
/* ═══════════════════════════════════════════ */

function EntryCard({ entry, onDelete }: { entry: DayEntry; onDelete: (id: string) => void }) {
  const { togglePin } = useYawmiyyatState();
  const meta = ENTRY_TYPE_META[entry.type];
  const moodMeta = entry.mood ? MOOD_META[entry.mood] : null;
  const time = new Date(entry.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className="relative rounded-xl p-3.5 group transition-all"
      style={{
        background: entry.pinned ? `${meta.color}06` : "rgba(15,23,42,0.4)",
        border: `1px solid ${entry.pinned ? `${meta.color}15` : "rgba(51,65,85,0.2)"}`,
      }}>

      {/* Timeline dot */}
      <div className="absolute right-0 top-4 w-2.5 h-2.5 rounded-full -mr-[5.5px] ring-2 ring-slate-950"
        style={{ background: meta.color }} />

      <div className="flex items-start gap-2.5">
        {/* Emoji */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}15` }}>
          <span className="text-base">{entry.emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${meta.color}10`, color: meta.color }}>{meta.label}</span>
            {moodMeta && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${moodMeta.color}10`, color: moodMeta.color }}>
                {moodMeta.emoji} {moodMeta.label}
              </span>
            )}
            <span className="text-[8px] text-slate-600 mr-auto">{time}</span>
          </div>

          {/* Content */}
          {entry.content && (
            <p className="text-xs text-white/85 leading-relaxed mb-1.5">{entry.content}</p>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800/50 text-slate-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => togglePin(entry.id)}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ color: entry.pinned ? "#f59e0b" : "#475569", background: entry.pinned ? "#f59e0b10" : "transparent" }}>
            <Pin className="w-2.5 h-2.5" />
          </button>
          <button onClick={() => onDelete(entry.id)}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-700 hover:text-red-400 transition-colors">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function YawmiyyatScreen() {
  const { entries, getToday, getByDate, getStreak, getDaySummary, getRecentDays, getTotalEntries, removeEntry } = useYawmiyyatState();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterType, setFilterType] = useState<EntryType | "all" | "pinned">("all");

  const todayKey = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === todayKey;
  const streak = useMemo(() => getStreak(), [getStreak]);
  const totalEntries = useMemo(() => getTotalEntries(), [getTotalEntries]);
  const todayEntries = useMemo(() => getToday(), [getToday]);
  const dayEntries = useMemo(() => getByDate(selectedDate), [getByDate, selectedDate]);
  const daySummary = useMemo(() => getDaySummary(selectedDate), [getDaySummary, selectedDate]);

  // Build 7-day mini calendar
  const weekDays = useMemo(() => {
    const days = [];
    const now = new Date(selectedDate);
    for (let i = -3; i <= 3; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const count = entries.filter((e) => e.date === key).length;
      days.push({
        key,
        day: d.toLocaleDateString("ar-EG", { weekday: "short" }),
        num: d.getDate(),
        count,
        isToday: key === todayKey,
        isSelected: key === selectedDate,
      });
    }
    return days;
  }, [selectedDate, entries, todayKey]);

  const filtered = useMemo(() => {
    let list = dayEntries;
    if (filterType === "pinned") return entries.filter((e) => e.pinned);
    if (filterType !== "all") list = list.filter((e) => e.type === filterType);
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [dayEntries, filterType, entries]);

  const navigateDay = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const avgMoodEmoji = daySummary.avgMood > 0
    ? MOOD_META[Math.round(daySummary.avgMood) as MoodLevel]?.emoji || ""
    : "—";

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.05), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-900/15 border border-amber-500/20">
              <CalendarDays className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">يوميّات</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">سجّل لحظات يومك</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-3">
          {[
            { label: "اليوم", value: todayEntries.length, icon: "📝", color: "#6366f1" },
            { label: "الإجمالي", value: totalEntries, icon: "📚", color: "#f59e0b" },
            { label: "سلسلة", value: `${streak} يوم`, icon: "🔥", color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-sm font-black" style={{ color: s.color }}>{s.icon} {s.value}</div>
              <div className="text-[8px] text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="relative z-10 px-5 mb-4">
        <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(51,65,85,0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigateDay(-7)} className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-white">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-slate-400">
              {new Date(selectedDate).toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => navigateDay(7)} className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-white">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-1.5 justify-between">
            {weekDays.map((d) => (
              <button key={d.key} onClick={() => setSelectedDate(d.key)}
                className="flex-1 flex flex-col items-center py-1.5 rounded-lg transition-all"
                style={{
                  background: d.isSelected ? "rgba(245,158,11,0.12)" : d.isToday ? "rgba(99,102,241,0.06)" : "transparent",
                  border: `1px solid ${d.isSelected ? "rgba(245,158,11,0.25)" : "transparent"}`,
                }}>
                <span className="text-[7px] text-slate-600 font-bold">{d.day}</span>
                <span className={`text-sm font-black mt-0.5 ${d.isSelected ? "text-amber-400" : d.isToday ? "text-indigo-400" : "text-white/60"}`}>
                  {d.num}
                </span>
                {d.count > 0 && (
                  <div className="flex gap-[2px] mt-1">
                    {Array.from({ length: Math.min(d.count, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-amber-400/60" />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day Summary */}
      {daySummary.entryCount > 0 && (
        <div className="relative z-10 px-5 mb-3">
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg p-2 text-center" style={{ background: "rgba(15,23,42,0.3)", border: "1px solid rgba(51,65,85,0.15)" }}>
              <span className="text-lg block">{avgMoodEmoji}</span>
              <span className="text-[7px] text-slate-600">متوسط المزاج</span>
            </div>
            <div className="flex-1 rounded-lg p-2 text-center" style={{ background: "rgba(15,23,42,0.3)", border: "1px solid rgba(51,65,85,0.15)" }}>
              <span className="text-lg block">{ENTRY_TYPE_META[daySummary.dominantType].emoji}</span>
              <span className="text-[7px] text-slate-600">النوع السائد</span>
            </div>
            <div className="flex-1 rounded-lg p-2 text-center" style={{ background: "rgba(15,23,42,0.3)", border: "1px solid rgba(51,65,85,0.15)" }}>
              <span className="text-lg font-black text-amber-400 block">{daySummary.entryCount}</span>
              <span className="text-[7px] text-slate-600">تسجيل</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: "all", label: "الكل" },
            { key: "pinned", label: "📌 مثبت" },
            ...Object.entries(ENTRY_TYPE_META).map(([k, v]) => ({ key: k, label: `${v.emoji} ${v.label}` })),
          ].map(({ key, label }) => {
            const active = filterType === key;
            const color = key in ENTRY_TYPE_META ? ENTRY_TYPE_META[key as EntryType].color : "#f59e0b";
            return (
              <button key={key} onClick={() => setFilterType(key as any)}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all"
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

      {/* Timeline */}
      <div className="relative z-10 px-5">
        {/* Timeline line */}
        {filtered.length > 0 && (
          <div className="absolute right-[24.5px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-amber-500/20 via-slate-700/20 to-transparent" />
        )}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(245,158,11,0.04)", border: "1px dashed rgba(245,158,11,0.2)" }}>
              <span className="text-5xl block mb-3">📅</span>
              <p className="text-sm text-white/80 font-bold mb-1">
                {isToday ? "ابدأ يومك — سجّل أول لحظة" : "لا توجد تسجيلات في هذا اليوم"}
              </p>
              <p className="text-[10px] text-slate-500">
                {isToday ? "ملاحظة، مزاج، امتنان، درس — كل لحظة مهمة" : "انتقل ليوم آخر أو أضف تسجيل جديد"}
              </p>
              {isToday && (
                <button onClick={() => setShowAdd(true)}
                  className="mt-3 px-4 py-2 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                  <Plus className="w-3 h-3 inline ml-1" /> لحظة جديدة
                </button>
              )}
            </motion.div>
          ) : (
            filtered.map((entry, idx) => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}>
                <EntryCard entry={entry} onDelete={removeEntry} />
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          📅 يوميّات — كل يوم قصة، وكل لحظة تستحق التسجيل
        </p>
      </motion.div>

      {/* FAB */}
      {isToday && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 left-5 w-12 h-12 rounded-2xl flex items-center justify-center z-40 shadow-lg shadow-amber-500/20"
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "1px solid rgba(245,158,11,0.4)" }}>
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showAdd && <AddEntryModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
