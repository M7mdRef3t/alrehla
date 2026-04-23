/**
 * حافظ — Hafiz: خزنة الذكريات
 *
 * أهم لحظاتك — محفوظة وقابلة للاسترجاع:
 * - Bookmark moments from any product
 * - Tag with emotions (فرح/إنجاز/درس/ألم)
 * - Collections & starred memories
 * - "On This Day" flashback
 * - Search across all memories
 * - Highlight Reel — top moments
 */

import type { FC } from "react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gem, Star, Bookmark, Search, Plus, X, Hash,
  Calendar, Zap as Sparkles, Folder, Tag, Clock, Trash2,
  Heart, ChevronDown, Filter,
} from "lucide-react";
import {
  useHafizState,
  type MemoryTag,
  type MemorySource,
  type Memory,
} from "./store/hafiz.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "feed" | "add" | "collections" | "search";

const TAG_META: Record<MemoryTag, { label: string; emoji: string; color: string }> = {
  joy: { label: "فرح", emoji: "😊", color: "#fbbf24" },
  achievement: { label: "إنجاز", emoji: "🏆", color: "#10b981" },
  lesson: { label: "درس", emoji: "📚", color: "#06b6d4" },
  pain: { label: "ألم", emoji: "💔", color: "#ef4444" },
  gratitude: { label: "امتنان", emoji: "🙏", color: "#a855f7" },
  turning_point: { label: "نقطة تحوّل", emoji: "🔄", color: "#f97316" },
  custom: { label: "مخصص", emoji: "🏷️", color: "#64748b" },
};

const SOURCE_META: Record<MemorySource, { label: string; emoji: string }> = {
  pulse: { label: "نبض", emoji: "💓" },
  wird: { label: "وِرد", emoji: "🔥" },
  bawsala: { label: "بوصلة", emoji: "🧭" },
  watheeqa: { label: "وثيقة", emoji: "📝" },
  nadhir: { label: "نذير", emoji: "🛡️" },
  riwaya: { label: "رواية", emoji: "📖" },
  manual: { label: "يدوي", emoji: "✍️" },
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const HafizScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<MemoryTag | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Add form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newEmoji, setNewEmoji] = useState("💎");
  const [newTags, setNewTags] = useState<MemoryTag[]>([]);
  const [newSource, setNewSource] = useState<MemorySource>("manual");

  // Collection form
  const [newCollName, setNewCollName] = useState("");
  const [newCollEmoji, setNewCollEmoji] = useState("📁");

  const {
    memories, collections,
    addMemory, removeMemory, toggleStar,
    addCollection, removeCollection,
    searchMemories, getOnThisDay, getStarred,
  } = useHafizState();

  // ── Filtered Memories ──
  const filteredMemories = useMemo(() => {
    let result = memories;
    if (showStarredOnly) result = result.filter((m) => m.starred);
    if (selectedTag) result = result.filter((m) => m.tags.includes(selectedTag));
    if (searchQuery.trim()) result = searchMemories(searchQuery);
    return result;
  }, [memories, showStarredOnly, selectedTag, searchQuery, searchMemories]);

  const onThisDay = useMemo(() => getOnThisDay(), [getOnThisDay]);

  // ── Handlers ──
  const handleAddMemory = () => {
    if (!newTitle.trim()) return;
    addMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      source: newSource,
      tags: newTags.length > 0 ? newTags : ["joy"],
      emoji: newEmoji,
      timestamp: Date.now(),
      starred: false,
    });
    setNewTitle("");
    setNewContent("");
    setNewEmoji("💎");
    setNewTags([]);
    setNewSource("manual");
    setViewMode("feed");
  };

  const handleAddCollection = () => {
    if (!newCollName.trim()) return;
    addCollection(newCollName.trim(), newCollEmoji);
    setNewCollName("");
    setNewCollEmoji("📁");
  };

  const toggleTag = (tag: MemoryTag) => {
    setNewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ── Stats ──
  const stats = useMemo(() => ({
    total: memories.length,
    starred: memories.filter((m) => m.starred).length,
    thisMonth: memories.filter((m) => {
      const d = new Date(m.savedAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    collections: collections.length,
  }), [memories, collections]);

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0a0612 0%, #120a1e 40%, #0a0618 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}
            >
              <Gem className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">حافظ</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">خزنة الذكريات — {stats.total} ذكرى</p>
            </div>
          </div>

          {/* Add Button */}
          <button onClick={() => setViewMode(viewMode === "add" ? "feed" : "add")}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: viewMode === "add" ? "rgba(168,85,247,0.15)" : "rgba(168,85,247,0.08)",
              border: `1px solid ${viewMode === "add" ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.12)"}`,
            }}
          >
            {viewMode === "add" ? <X className="w-4 h-4 text-purple-400" /> : <Plus className="w-4 h-4 text-purple-400" />}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "ذكرى", value: stats.total, emoji: "💎", color: "#a855f7" },
            { label: "مميّزة", value: stats.starred, emoji: "⭐", color: "#fbbf24" },
            { label: "هذا الشهر", value: stats.thisMonth, emoji: "📅", color: "#06b6d4" },
            { label: "مجموعة", value: stats.collections, emoji: "📁", color: "#10b981" },
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

        {/* Navigation Tabs */}
        <div className="flex gap-1.5">
          {([
            { key: "feed", label: "الكل", icon: "💎" },
            { key: "collections", label: "مجموعات", icon: "📁" },
            { key: "search", label: "بحث", icon: "🔍" },
          ] as const).map((tab) => (
            <button key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: viewMode === tab.key ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.02)",
                color: viewMode === tab.key ? "#c084fc" : "#475569",
                border: `1px solid ${viewMode === tab.key ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ On This Day ═══ */}
      {viewMode === "feed" && onThisDay.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-5 mb-4 p-4 rounded-xl"
          style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(168,85,247,0.04) 100%)", border: "1px solid rgba(251,191,36,0.1)" }}
        >
          <p className="text-[10px] text-amber-400/70 font-bold flex items-center gap-1 mb-2">
            <Calendar className="w-3 h-3" /> في مثل هذا اليوم
          </p>
          {onThisDay.map((m) => (
            <div key={m.id} className="flex items-center gap-2 py-1">
              <span className="text-sm">{m.emoji}</span>
              <p className="text-[11px] text-slate-300 flex-1">{m.title}</p>
              <span className="text-[8px] text-slate-600">{new Date(m.timestamp).getFullYear()}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ Feed View ═══ */}
      {viewMode === "feed" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {/* Tag Filter Bar */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => { setSelectedTag(null); setShowStarredOnly(false); }}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all"
              style={{
                background: !selectedTag && !showStarredOnly ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.03)",
                color: !selectedTag && !showStarredOnly ? "#c084fc" : "#475569",
              }}
            >الكل</button>

            <button onClick={() => { setShowStarredOnly(!showStarredOnly); setSelectedTag(null); }}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all"
              style={{
                background: showStarredOnly ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)",
                color: showStarredOnly ? "#fbbf24" : "#475569",
              }}
            >⭐ مميّزة</button>

            {(Object.keys(TAG_META) as MemoryTag[]).filter((t) => t !== "custom").map((tag) => (
              <button key={tag} onClick={() => { setSelectedTag(tag); setShowStarredOnly(false); }}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all"
                style={{
                  background: selectedTag === tag ? `${TAG_META[tag].color}15` : "rgba(255,255,255,0.03)",
                  color: selectedTag === tag ? TAG_META[tag].color : "#475569",
                }}
              >
                {TAG_META[tag].emoji} {TAG_META[tag].label}
              </button>
            ))}
          </div>

          {/* Memory Cards */}
          {filteredMemories.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Gem className="w-10 h-10 text-purple-400/10 mx-auto" />
              <p className="text-sm text-slate-500 font-bold">لا توجد ذكريات بعد</p>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                كل لحظة مهمة تستحق الحفظ.
                <br />
                اضغط + لإضافة أول ذكرى.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredMemories.map((memory, idx) => (
                <motion.div key={memory.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-4 rounded-xl relative"
                  style={{ background: "rgba(168,85,247,0.03)", border: "1px solid rgba(168,85,247,0.06)" }}
                >
                  {/* Star */}
                  <button onClick={() => toggleStar(memory.id)} className="absolute top-3 left-3 transition-all active:scale-90">
                    <Star className="w-4 h-4" style={{ color: memory.starred ? "#fbbf24" : "#1e293b", fill: memory.starred ? "#fbbf24" : "none" }} />
                  </button>

                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{memory.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{memory.title}</p>
                      {memory.content && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{memory.content}</p>
                      )}

                      {/* Tags + Meta */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {memory.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded text-[8px] font-bold"
                            style={{ background: `${TAG_META[tag].color}10`, color: TAG_META[tag].color }}
                          >
                            {TAG_META[tag].emoji} {TAG_META[tag].label}
                          </span>
                        ))}
                        <span className="text-[8px] text-slate-600 mr-auto">
                          {SOURCE_META[memory.source].emoji} {formatDate(memory.timestamp)}
                        </span>
                        <button onClick={() => removeMemory(memory.id)} className="p-1 opacity-15 hover:opacity-40">
                          <Trash2 className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {/* ═══ Add Memory View ═══ */}
      {viewMode === "add" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          <p className="text-[10px] text-purple-400/60 font-bold flex items-center gap-1">
            <Plus className="w-3 h-3" /> ذكرى جديدة
          </p>

          {/* Emoji Picker (quick) */}
          <div className="flex gap-2 justify-center">
            {["💎", "🌟", "🎯", "💡", "🌈", "🔥", "❤️", "🏆", "🌱", "✨"].map((e) => (
              <button key={e} onClick={() => setNewEmoji(e)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all"
                style={{
                  background: newEmoji === e ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.02)",
                  border: newEmoji === e ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                }}
              >{e}</button>
            ))}
          </div>

          {/* Title */}
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="عنوان الذكرى..."
            className="w-full p-3.5 rounded-xl text-sm text-white font-bold placeholder-slate-600 outline-none"
            style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.08)" }}
          />

          {/* Content */}
          <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)}
            placeholder="تفاصيل اللحظة — ماذا حصل؟ كيف شعرت؟"
            rows={3}
            className="w-full p-3.5 rounded-xl text-[11px] text-slate-300 placeholder-slate-600 outline-none resize-none leading-relaxed"
            style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.08)" }}
          />

          {/* Tags */}
          <div>
            <p className="text-[9px] text-slate-500 font-bold mb-2">التصنيف</p>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(TAG_META) as MemoryTag[]).filter((t) => t !== "custom").map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                  style={{
                    background: newTags.includes(tag) ? `${TAG_META[tag].color}15` : "rgba(255,255,255,0.03)",
                    color: newTags.includes(tag) ? TAG_META[tag].color : "#475569",
                    border: `1px solid ${newTags.includes(tag) ? `${TAG_META[tag].color}20` : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  {TAG_META[tag].emoji} {TAG_META[tag].label}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <p className="text-[9px] text-slate-500 font-bold mb-2">المصدر</p>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(SOURCE_META) as MemorySource[]).map((src) => (
                <button key={src} onClick={() => setNewSource(src)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: newSource === src ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.03)",
                    color: newSource === src ? "#c084fc" : "#475569",
                  }}
                >
                  {SOURCE_META[src].emoji} {SOURCE_META[src].label}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button onClick={handleAddMemory}
            disabled={!newTitle.trim()}
            className="w-full py-3.5 rounded-xl text-sm font-black transition-all active:scale-98 disabled:opacity-30"
            style={{
              background: newTitle.trim() ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
              color: newTitle.trim() ? "#c084fc" : "#334155",
              border: `1px solid ${newTitle.trim() ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.04)"}`,
            }}
          >
            💎 احفظ الذكرى
          </button>
        </motion.div>
      )}

      {/* ═══ Collections View ═══ */}
      {viewMode === "collections" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {/* Add Collection */}
          <div className="flex gap-2">
            <div className="flex gap-1">
              {["📁", "💫", "🌿", "🎭", "📮"].map((e) => (
                <button key={e} onClick={() => setNewCollEmoji(e)}
                  className="w-8 h-8 rounded-lg text-sm flex items-center justify-center"
                  style={{ background: newCollEmoji === e ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.02)" }}
                >{e}</button>
              ))}
            </div>
            <input value={newCollName} onChange={(e) => setNewCollName(e.target.value)}
              placeholder="اسم المجموعة"
              className="flex-1 px-3 py-2 rounded-xl text-[11px] text-white placeholder-slate-600 outline-none"
              style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.08)" }}
            />
            <button onClick={handleAddCollection}
              disabled={!newCollName.trim()}
              className="px-4 py-2 rounded-xl text-[10px] font-bold disabled:opacity-30"
              style={{ background: "rgba(168,85,247,0.1)", color: "#c084fc" }}
            >+</button>
          </div>

          {/* Collection list */}
          {collections.length === 0 ? (
            <div className="py-12 text-center">
              <Folder className="w-8 h-8 text-purple-400/10 mx-auto mb-2" />
              <p className="text-xs text-slate-600">أنشئ مجموعة لتنظيم ذكرياتك</p>
            </div>
          ) : (
            collections.map((coll) => (
              <div key={coll.id} className="p-4 rounded-xl flex items-center gap-3"
                style={{ background: "rgba(168,85,247,0.03)", border: "1px solid rgba(168,85,247,0.06)" }}
              >
                <span className="text-xl">{coll.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{coll.name}</p>
                  <p className="text-[9px] text-slate-500">{coll.memoryIds.length} ذكرى</p>
                </div>
                <button onClick={() => removeCollection(coll.id)} className="p-1 opacity-20 hover:opacity-50">
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* ═══ Search View ═══ */}
      {viewMode === "search" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في ذكرياتك..."
              autoFocus
              className="w-full pr-10 pl-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none"
              style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.08)" }}
            />
          </div>

          {searchQuery.trim() && (
            <p className="text-[10px] text-slate-500">
              {filteredMemories.length} نتيجة لـ "{searchQuery}"
            </p>
          )}

          {filteredMemories.map((memory) => (
            <div key={memory.id} className="p-3 rounded-xl flex items-center gap-2.5"
              style={{ background: "rgba(168,85,247,0.03)", border: "1px solid rgba(168,85,247,0.06)" }}
            >
              <span className="text-lg">{memory.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{memory.title}</p>
                <p className="text-[9px] text-slate-500">{formatDate(memory.timestamp)}</p>
              </div>
              {memory.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ Highlight Reel CTA ═══ */}
      {viewMode === "feed" && memories.length >= 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mx-5 mt-5 p-4 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(251,191,36,0.04) 100%)", border: "1px solid rgba(168,85,247,0.12)" }}
        >
          <div className="absolute top-0 left-0 w-20 h-20 rounded-full bg-purple-500/5 blur-3xl" />
          <p className="text-[10px] text-purple-400/60 font-bold flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3" /> أبرز لحظاتك
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {memories.filter((m) => m.starred).slice(0, 5).map((m) => (
              <div key={m.id} className="shrink-0 px-3 py-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="text-sm">{m.emoji}</span>
                <p className="text-[9px] text-white font-bold mt-1 max-w-[80px] truncate">{m.title}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(168,85,247,0.03)", border: "1px solid rgba(168,85,247,0.06)" }}
      >
        <Gem className="w-5 h-5 text-purple-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          الذكريات هي كنز رحلتك.
          <br />
          كل لحظة حفظتها — ستعود لك يوماً وتذكّرك بمن كنت.
        </p>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

function formatDate(ts: number): string {
  const d = new Date(ts);
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default HafizScreen;
