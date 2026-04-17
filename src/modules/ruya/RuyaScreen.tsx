/**
 * رؤيا — Ruya Screen
 * Dream Journal + Night Reflections
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRuyaState,
  DREAM_MOOD_META,
  DREAM_CLARITY_META,
  REFLECTION_META,
  type DreamMood,
  type DreamClarity,
  type ReflectionType,
  type DreamEntry,
} from "./store/ruya.store";
import {
  Moon,
  Star,
  Plus,
  X,
  Repeat,
  Filter,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*          ADD DREAM MODAL                   */
/* ═══════════════════════════════════════════ */

function AddDreamModal({ onClose }: { onClose: () => void }) {
  const { addDream } = useRuyaState();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<DreamMood>("neutral");
  const [clarity, setClarity] = useState<DreamClarity>("moderate");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(""); }
  };

  const handleSave = () => {
    if (!content.trim()) return;
    addDream({ content: content.trim(), mood, clarity, tags, isRecurring });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="w-full max-w-md rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        style={{ background: "#0f172a", border: "1px solid rgba(51,65,85,0.4)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white">🌙 سجّل حلمك</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="ماذا رأيت في حلمك؟ اكتب كل ما تتذكره..."
          rows={4}
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
          dir="rtl" />

        {/* Mood */}
        <div>
          <span className="text-[9px] text-slate-500 font-bold uppercase mb-1.5 block">شعور الحلم</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(DREAM_MOOD_META) as DreamMood[]).map((m) => {
              const meta = DREAM_MOOD_META[m];
              const active = mood === m;
              return (
                <button key={m} onClick={() => setMood(m)}
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

        {/* Clarity */}
        <div>
          <span className="text-[9px] text-slate-500 font-bold uppercase mb-1.5 block">وضوح الحلم</span>
          <div className="flex gap-2">
            {(Object.keys(DREAM_CLARITY_META) as DreamClarity[]).map((c) => {
              const meta = DREAM_CLARITY_META[c];
              const active = clarity === c;
              return (
                <button key={c} onClick={() => setClarity(c)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all"
                  style={{
                    background: active ? "rgba(139,92,246,0.15)" : "rgba(30,41,59,0.4)",
                    border: `1px solid ${active ? "#8b5cf6" : "rgba(51,65,85,0.3)"}`,
                    color: active ? "#8b5cf6" : "#94a3b8",
                  }}>
                  <span>{meta.emoji}</span><span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div>
          <span className="text-[9px] text-slate-500 font-bold uppercase mb-1.5 block">كلمات مفتاحية</span>
          <div className="flex gap-2">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="أضف كلمة..."
              className="flex-1 bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none" dir="rtl" />
            <button onClick={handleAddTag} className="px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold">+</button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((t) => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                  {t} <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-purple-500">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recurring */}
        <button onClick={() => setIsRecurring(!isRecurring)}
          className="flex items-center gap-2 text-[10px] font-bold transition-all"
          style={{ color: isRecurring ? "#f59e0b" : "#64748b" }}>
          <Repeat className="w-3.5 h-3.5" />
          {isRecurring ? "✓ حلم متكرر" : "حلم متكرر؟"}
        </button>

        {/* Save */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          disabled={!content.trim()}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.06))",
            border: "1px solid rgba(139,92,246,0.3)",
            color: "#8b5cf6",
          }}>
          🌙 احفظ الحلم
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*       ADD REFLECTION MODAL                  */
/* ═══════════════════════════════════════════ */

function AddReflectionModal({ onClose }: { onClose: () => void }) {
  const { addReflection } = useRuyaState();
  const [content, setContent] = useState("");
  const [type, setType] = useState<ReflectionType>("gratitude");

  const handleSave = () => {
    if (!content.trim()) return;
    addReflection({ type, content: content.trim() });
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
          <h3 className="text-sm font-black text-white">🌅 تأمل ليلي</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(REFLECTION_META) as ReflectionType[]).map((t) => {
            const meta = REFLECTION_META[t];
            const active = type === t;
            return (
              <button key={t} onClick={() => setType(t)}
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

        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="ما الذي تريد أن تتأمله الليلة قبل النوم؟"
          rows={3}
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
          dir="rtl" />

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          disabled={!content.trim()}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(99,102,241,0.06))",
            border: "1px solid rgba(6,182,212,0.3)",
            color: "#06b6d4",
          }}>
          🌅 احفظ التأمل
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*          DREAM CARD                        */
/* ═══════════════════════════════════════════ */

function DreamCard({ dream, onStar, onRemove }: {
  dream: DreamEntry;
  onStar: () => void;
  onRemove: () => void;
}) {
  const moodMeta = DREAM_MOOD_META[dream.mood];
  const clarityMeta = DREAM_CLARITY_META[dream.clarity];
  const time = new Date(dream.timestamp);
  const dateStr = time.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
  const timeStr = time.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout
      className="rounded-2xl p-4 group"
      style={{ background: `${moodMeta.color}05`, border: `1px solid ${moodMeta.color}15` }}>

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{moodMeta.emoji}</span>
          <div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${moodMeta.color}15`, color: moodMeta.color }}>
              {moodMeta.label}
            </span>
            <span className="text-[9px] text-slate-600 mr-2">{clarityMeta.emoji} {clarityMeta.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dream.isRecurring && <span className="text-[8px] text-amber-400">🔄</span>}
          <button onClick={onStar} className="w-6 h-6 rounded flex items-center justify-center opacity-60 hover:opacity-100">
            <Star className="w-3 h-3" style={{ color: dream.isStarred ? "#fbbf24" : "#475569", fill: dream.isStarred ? "#fbbf24" : "none" }} />
          </button>
          <button onClick={onRemove} className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 text-slate-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <p className="text-xs text-white/80 leading-relaxed mb-2">{dream.content}</p>

      {dream.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {dream.tags.map((t) => (
            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">
              #{t}
            </span>
          ))}
        </div>
      )}

      <span className="text-[8px] text-slate-600">{dateStr} · {timeStr}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

type TabView = "dreams" | "reflections" | "stats";

export default function RuyaScreen() {
  const {
    dreams, reflections,
    toggleStarDream, removeDream, removeReflection,
    getStreak, getMoodBreakdown, getTopTags, getRecurringDreams, getTonightReflections,
  } = useRuyaState();

  const [tab, setTab] = useState<TabView>("dreams");
  const [showAddDream, setShowAddDream] = useState(false);
  const [showAddReflection, setShowAddReflection] = useState(false);
  const [moodFilter, setMoodFilter] = useState<DreamMood | "all">("all");

  const streak = useMemo(() => getStreak(), [dreams]);
  const moodBreakdown = useMemo(() => getMoodBreakdown(), [dreams]);
  const topTags = useMemo(() => getTopTags(), [dreams]);
  const recurringCount = useMemo(() => getRecurringDreams().length, [dreams]);
  const tonightReflections = useMemo(() => getTonightReflections(), [reflections]);

  const filteredDreams = useMemo(() => {
    if (moodFilter === "all") return dreams;
    return dreams.filter((d) => d.mood === moodFilter);
  }, [dreams, moodFilter]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-900/15 border border-purple-500/20">
              <Moon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">رؤيا</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">مفكرة أحلامك وتأملاتك</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-3">
          {[
            { label: "أحلام", value: dreams.length, color: "#8b5cf6" },
            { label: "سلسلة", value: `${streak} يوم`, color: "#f59e0b" },
            { label: "متكرر", value: recurringCount, color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-2 bg-slate-900/40 rounded-xl p-1">
          {([
            { id: "dreams", label: "🌙 أحلام" },
            { id: "reflections", label: "🌅 تأملات" },
            { id: "stats", label: "📊 إحصائيات" },
          ] as { id: TabView; label: string }[]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: tab === t.id ? "rgba(139,92,246,0.15)" : "transparent",
                color: tab === t.id ? "#a78bfa" : "#64748b",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-5">
        {/* DREAMS TAB */}
        {tab === "dreams" && (
          <>
            {/* Mood Filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
              <button onClick={() => setMoodFilter("all")}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold"
                style={{
                  background: moodFilter === "all" ? "rgba(139,92,246,0.15)" : "rgba(30,41,59,0.4)",
                  border: `1px solid ${moodFilter === "all" ? "#8b5cf6" : "rgba(51,65,85,0.3)"}`,
                  color: moodFilter === "all" ? "#8b5cf6" : "#94a3b8",
                }}>
                🌙 الكل
              </button>
              {moodBreakdown.map((m) => {
                const meta = DREAM_MOOD_META[m.mood];
                const active = moodFilter === m.mood;
                return (
                  <button key={m.mood} onClick={() => setMoodFilter(m.mood)}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: active ? `${meta.color}15` : "rgba(30,41,59,0.4)",
                      border: `1px solid ${active ? meta.color : "rgba(51,65,85,0.3)"}`,
                      color: active ? meta.color : "#94a3b8",
                    }}>
                    {meta.emoji} {m.count}
                  </button>
                );
              })}
            </div>

            {filteredDreams.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-3">🌙</span>
                <p className="text-sm text-slate-500 font-bold mb-1">لا أحلام بعد</p>
                <p className="text-[10px] text-slate-600 mb-4">سجّل حلمك فور الاستيقاظ — قبل أن تتلاشى التفاصيل</p>
                <button onClick={() => setShowAddDream(true)}
                  className="text-xs font-bold px-4 py-2 rounded-xl"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#8b5cf6" }}>
                  ✍️ سجّل أول حلم
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDreams.map((d) => (
                  <DreamCard key={d.id} dream={d}
                    onStar={() => toggleStarDream(d.id)}
                    onRemove={() => removeDream(d.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* REFLECTIONS TAB */}
        {tab === "reflections" && (
          <>
            {tonightReflections.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] text-slate-500 font-bold block mb-2">🌅 تأملات الليلة</span>
                <div className="space-y-2">
                  {tonightReflections.map((r) => {
                    const meta = REFLECTION_META[r.type];
                    return (
                      <div key={r.id} className="rounded-xl p-3 flex items-start gap-2 group"
                        style={{ background: `${meta.color}06`, border: `1px solid ${meta.color}12` }}>
                        <span className="text-lg">{meta.emoji}</span>
                        <div className="flex-1">
                          <span className="text-[9px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                          <p className="text-xs text-white/80 leading-relaxed mt-0.5">{r.content}</p>
                        </div>
                        <button onClick={() => removeReflection(r.id)}
                          className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 text-slate-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All reflections */}
            {reflections.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-3">🌅</span>
                <p className="text-sm text-slate-500 font-bold mb-1">لا تأملات بعد</p>
                <p className="text-[10px] text-slate-600 mb-4">قبل النوم — تأمل في يومك وسجّل شعورك</p>
                <button onClick={() => setShowAddReflection(true)}
                  className="text-xs font-bold px-4 py-2 rounded-xl"
                  style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: "#06b6d4" }}>
                  🌅 أضف تأمل ليلي
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {reflections.filter((r) => !tonightReflections.some((t) => t.id === r.id)).map((r) => {
                  const meta = REFLECTION_META[r.type];
                  return (
                    <div key={r.id} className="rounded-xl px-3 py-2 flex items-center gap-2"
                      style={{ background: `${meta.color}04`, border: `1px solid ${meta.color}10` }}>
                      <span>{meta.emoji}</span>
                      <p className="text-[11px] text-white/70 flex-1 truncate">{r.content}</p>
                      <span className="text-[8px] text-slate-600">{r.date}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* STATS TAB */}
        {tab === "stats" && (
          <div className="space-y-4">
            {/* Mood chart */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-3">توزيع المشاعر</span>
              {moodBreakdown.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">سجّل أحلامك لتظهر الإحصائيات</p>
              ) : (
                <div className="space-y-2">
                  {moodBreakdown.map((m) => {
                    const meta = DREAM_MOOD_META[m.mood];
                    const maxCount = Math.max(...moodBreakdown.map((x) => x.count));
                    const pct = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
                    return (
                      <div key={m.mood} className="flex items-center gap-2">
                        <span className="text-sm w-6 text-center">{meta.emoji}</span>
                        <span className="text-[10px] w-10 font-bold" style={{ color: meta.color }}>{meta.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            className="h-full rounded-full" style={{ background: meta.color }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 w-6 text-left">{m.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top tags */}
            {topTags.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-3">أكثر الكلمات تكراراً</span>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map((t) => (
                    <span key={t.tag} className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15 font-bold">
                      #{t.tag} <span className="text-purple-500">({t.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🌙 رؤيا — سجّل أحلامك وتأملاتك قبل النوم وبعد الاستيقاظ
        </p>
      </motion.div>

      {/* FABs */}
      <div className="fixed bottom-24 left-5 z-40 flex flex-col gap-2">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddReflection(true)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", boxShadow: "0 4px 15px rgba(6,182,212,0.3)" }}>
          <span className="text-lg">🌅</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddDream(true)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", boxShadow: "0 4px 20px rgba(139,92,246,0.3)" }}>
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddDream && <AddDreamModal onClose={() => setShowAddDream(false)} />}
        {showAddReflection && <AddReflectionModal onClose={() => setShowAddReflection(false)} />}
      </AnimatePresence>
    </div>
  );
}
