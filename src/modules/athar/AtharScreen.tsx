/**
 * أثر — Athar Screen
 * Life Impact Log: timeline of your journey actions + manual journal + stats
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAtharState,
  CATEGORY_META,
  type ImpactCategory,
  type ImpactEntry,
} from "./store/athar.store";

// Cross-ecosystem imports for auto-collection
import { useTazkiyaState } from "@/modules/tazkiya/store/tazkiya.store";
import { useJisrState } from "@/modules/jisr/store/jisr.store";
import { useKanzState } from "@/modules/kanz/store/kanz.store";
import { useWarshaState } from "@/modules/warsha/store/warsha.store";
import { useMithaqState } from "@/modules/mithaq/store/mithaq.store";

import {
  BookOpen,
  Star,
  Plus,
  X,
  Filter,
  Calendar,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*         AUTO-SYNC HOOK                     */
/* ═══════════════════════════════════════════ */

function useAutoSync() {
  const { addEntry, entries } = useAtharState();
  const tazkiyaCycles = useTazkiyaState((s) => s.cycles);
  const bridges = useJisrState((s) => s.bridges);
  const gems = useKanzState((s) => s.gems);
  const completedChallenges = useWarshaState((s) => s.completedChallenges);
  const pledges = useMithaqState((s) => s.pledges);

  useEffect(() => {
    const ids = new Set(entries.map((e) => e.meta?.sourceId as string).filter(Boolean));

    // Tazkiya cycles
    tazkiyaCycles.filter((c) => c.isComplete && !ids.has(`tazkiya-${c.id}`)).forEach((c) => {
      addEntry({
        content: `أتممت دورة تزكية — خفة ${c.lightnessScore || 0}%`,
        category: "purification",
        meta: { sourceId: `tazkiya-${c.id}` },
      });
    });

    // Jisr bridges completed
    bridges.filter((b) => b.isComplete && !ids.has(`jisr-${b.id}`)).forEach((b) => {
      addEntry({
        content: `بنيت جسر إصلاح مع ${b.personName}`,
        category: "repair",
        meta: { sourceId: `jisr-${b.id}` },
      });
    });

    // Kanz gems (last 5 only to avoid flooding)
    gems.slice(0, 5).filter((g) => !ids.has(`kanz-${g.id}`)).forEach((g) => {
      addEntry({
        content: `حفظت جوهرة: "${g.content.slice(0, 60)}${g.content.length > 60 ? "..." : ""}"`,
        category: "wisdom",
        meta: { sourceId: `kanz-${g.id}` },
      });
    });

    // Warsha completed
    completedChallenges.filter((c) => !ids.has(`warsha-${c.templateId}`)).forEach((c) => {
      addEntry({
        content: `أكملت تحدي ورشة 7 أيام`,
        category: "challenge",
        meta: { sourceId: `warsha-${c.templateId}` },
      });
    });

    // Mithaq pledges completed
    pledges.filter((p) => p.status === "completed" && !ids.has(`mithaq-${p.id}`)).forEach((p) => {
      addEntry({
        content: `وفيت بعهد: "${p.title}"`,
        category: "pledge",
        meta: { sourceId: `mithaq-${p.id}` },
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tazkiyaCycles.length, bridges.length, gems.length, completedChallenges.length, pledges.length]);
}

/* ═══════════════════════════════════════════ */
/*          ADD ENTRY MODAL                   */
/* ═══════════════════════════════════════════ */

function AddEntryModal({ onClose }: { onClose: () => void }) {
  const { addEntry } = useAtharState();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ImpactCategory>("reflection");

  const handleSave = () => {
    if (!content.trim()) return;
    addEntry({ content: content.trim(), category });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4"
      style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="w-full max-w-md rounded-3xl p-5 space-y-4"
        style={{ background: "#0f172a", border: "1px solid rgba(51,65,85,0.4)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white">سجّل أثرك ✨</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1.5">
          {(["reflection", "manual", "milestone"] as ImpactCategory[]).map((cat) => {
            const m = CATEGORY_META[cat];
            const active = category === cat;
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${m.color}20` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                  color: active ? m.color : "#94a3b8",
                }}>
                <span>{m.emoji}</span><span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="ما الأثر الذي تركته اليوم؟ لحظة، قرار، أو تأمل..."
          rows={4}
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
          dir="rtl" />

        {/* Save */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          disabled={!content.trim()}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.06))",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "#10b981",
          }}>
          📜 احفظ الأثر
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*          ENTRY CARD                        */
/* ═══════════════════════════════════════════ */

function EntryCard({ entry, onStar, onRemove }: {
  entry: ImpactEntry;
  onStar: () => void;
  onRemove: () => void;
}) {
  const catMeta = CATEGORY_META[entry.category];
  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} layout
      className="flex gap-3 group">
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: catMeta.color, boxShadow: `0 0 8px ${catMeta.color}40` }} />
        <div className="w-0.5 flex-1 bg-slate-800/50 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="rounded-xl px-3 py-2.5"
          style={{ background: `${catMeta.color}06`, border: `1px solid ${catMeta.color}12` }}>
          <div className="flex items-start justify-between mb-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: `${catMeta.color}15`, color: catMeta.color }}>
              {catMeta.emoji} {catMeta.label}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={onStar}
                className="w-6 h-6 rounded flex items-center justify-center transition-all opacity-60 hover:opacity-100">
                <Star className="w-3 h-3"
                  style={{ color: entry.isStarred ? "#fbbf24" : "#475569", fill: entry.isStarred ? "#fbbf24" : "none" }} />
              </button>
              <button onClick={onRemove}
                className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 transition-all text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">{entry.content}</p>
          <span className="text-[8px] text-slate-600 mt-1 block">{timeStr}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function AtharScreen() {
  useAutoSync();

  const {
    entries,
    toggleStar,
    removeEntry,
    getTimeline,
    getCategoryBreakdown,
    getTotalCount,
    getStarred,
  } = useAtharState();

  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState<ImpactCategory | "all" | "starred">("all");

  const totalCount = useMemo(() => getTotalCount(), [entries]);
  const starredCount = useMemo(() => getStarred().length, [entries]);
  const breakdown = useMemo(() => getCategoryBreakdown(), [entries]);
  const timeline = useMemo(() => getTimeline(), [entries]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    if (filterCat === "all") return timeline;
    if (filterCat === "starred") {
      return timeline
        .map((day) => ({ ...day, entries: day.entries.filter((e) => e.isStarred) }))
        .filter((day) => day.entries.length > 0);
    }
    return timeline
      .map((day) => ({ ...day, entries: day.entries.filter((e) => e.category === filterCat) }))
      .filter((day) => day.entries.length > 0);
  }, [timeline, filterCat]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full top-[-10%] right-[-5%]"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.05), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-900/15 border border-emerald-500/20">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">أثر</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">سجل حياتك في الرحلة</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <Plus className="w-5 h-5 text-emerald-400" />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-3">
          {[
            { label: "أثر", value: totalCount, color: "#10b981" },
            { label: "مميز", value: starredCount, color: "#fbbf24" },
            { label: "أيام", value: timeline.length, color: "#8b5cf6" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      {breakdown.length > 0 && (
        <div className="relative z-10 px-5 mb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setFilterCat("all")}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all"
              style={{
                background: filterCat === "all" ? "rgba(16,185,129,0.15)" : "rgba(30,41,59,0.4)",
                border: `1px solid ${filterCat === "all" ? "#10b981" : "rgba(51,65,85,0.3)"}`,
                color: filterCat === "all" ? "#10b981" : "#94a3b8",
              }}>
              📜 الكل
            </button>
            <button onClick={() => setFilterCat("starred")}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all"
              style={{
                background: filterCat === "starred" ? "rgba(251,191,36,0.15)" : "rgba(30,41,59,0.4)",
                border: `1px solid ${filterCat === "starred" ? "#fbbf24" : "rgba(51,65,85,0.3)"}`,
                color: filterCat === "starred" ? "#fbbf24" : "#94a3b8",
              }}>
              ⭐ المميزة
            </button>
            {breakdown.map((b) => {
              const m = CATEGORY_META[b.category];
              const active = filterCat === b.category;
              return (
                <button key={b.category} onClick={() => setFilterCat(b.category)}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                  style={{
                    background: active ? `${m.color}15` : "rgba(30,41,59,0.4)",
                    border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                    color: active ? m.color : "#94a3b8",
                  }}>
                  {m.emoji} {b.count}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative z-10 px-5">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">📜</span>
            <p className="text-sm text-slate-500 font-bold mb-1">
              {totalCount === 0 ? "سجل أثرك فارغ" : "لا نتائج بهذا الفلتر"}
            </p>
            <p className="text-[10px] text-slate-600 mb-4">
              {totalCount === 0
                ? "استخدم أدوات الرحلة — كل فعل يُسجّل تلقائياً هنا"
                : "جرّب فلتر آخر"}
            </p>
            {totalCount === 0 && (
              <button onClick={() => setShowAdd(true)}
                className="text-xs font-bold px-4 py-2 rounded-xl"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                ✍️ سجّل أول أثر يدوياً
              </button>
            )}
          </div>
        ) : (
          filteredTimeline.map((day) => (
            <div key={day.date} className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500">
                  {new Date(day.date).toLocaleDateString("ar-EG", { weekday: "long", month: "short", day: "numeric" })}
                </span>
                <div className="flex-1 h-px bg-slate-800/50" />
                <span className="text-[9px] text-slate-600">{day.entries.length} أثر</span>
              </div>

              {day.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onStar={() => toggleStar(entry.id)}
                  onRemove={() => removeEntry(entry.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          📜 أثر — كل فعل في رحلتك يُكتب هنا تلقائياً ليصبح قصة حياتك
        </p>
      </motion.div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 left-5 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
        }}>
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && <AddEntryModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
