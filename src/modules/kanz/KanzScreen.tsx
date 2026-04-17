/**
 * كنز — Kanz Screen
 * Personal Wisdom Bank: add, browse, favorite, and filter gems
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useKanzState,
  CATEGORY_META,
  SOURCE_META,
  type GemCategory,
  type Gem,
} from "./store/kanz.store";
import {
  Plus,
  Heart,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  Gem as GemIcon,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*              ADD GEM MODAL                 */
/* ═══════════════════════════════════════════ */

function AddGemModal({ onClose }: { onClose: () => void }) {
  const { addGem } = useKanzState();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<GemCategory>("lesson");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleSave = () => {
    if (!content.trim()) return;
    addGem({ content: content.trim(), category, tags });
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
          <h3 className="text-sm font-black text-white">أضف جوهرة جديدة 💎</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_META) as GemCategory[]).map((cat) => {
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
          placeholder="اكتب جوهرتك... درس، اقتباس، لحظة، أو بصيرة"
          rows={4}
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
          dir="rtl" />

        {/* Tags */}
        <div>
          <div className="flex gap-2">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder="أضف وسم..."
              className="flex-1 bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-1.5 text-white text-[11px] placeholder-slate-600 focus:outline-none"
              dir="rtl" />
            <button onClick={handleAddTag}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-700/30 border border-slate-600/30 text-slate-400">
              +
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((t) => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-400 border border-amber-800/20 flex items-center gap-1">
                  #{t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-amber-600">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
          disabled={!content.trim()}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))",
            border: "1px solid rgba(245,158,11,0.3)",
            color: "#f59e0b",
          }}>
          💎 احفظ الجوهرة
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*              GEM CARD                      */
/* ═══════════════════════════════════════════ */

function GemCard({ gem, onFav, onDelete }: {
  gem: Gem;
  onFav: () => void;
  onDelete: () => void;
}) {
  const catMeta = CATEGORY_META[gem.category];
  const srcMeta = SOURCE_META[gem.source];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="rounded-2xl p-4 space-y-2.5 group relative"
      style={{ background: `${catMeta.color}06`, border: `1px solid ${catMeta.color}18` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: `${catMeta.color}15`, color: catMeta.color }}>
          {catMeta.emoji} {catMeta.label}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onFav}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: gem.isFavorite ? "rgba(239,68,68,0.1)" : "rgba(30,41,59,0.3)",
              border: `1px solid ${gem.isFavorite ? "rgba(239,68,68,0.3)" : "rgba(51,65,85,0.2)"}`,
            }}>
            <Heart className="w-3 h-3" style={{ color: gem.isFavorite ? "#ef4444" : "#475569", fill: gem.isFavorite ? "#ef4444" : "none" }} />
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-slate-800/30 border border-slate-700/20 text-slate-600">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-white/85 leading-relaxed">{gem.content}</p>

      {/* Tags */}
      {gem.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {gem.tags.map((t) => (
            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800/40 text-slate-500 border border-slate-700/20">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[8px] text-slate-600">{srcMeta.emoji} {srcMeta.label}</span>
        <span className="text-[8px] text-slate-600">
          {new Date(gem.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function KanzScreen() {
  const {
    gems,
    toggleFavorite,
    removeGem,
    getFavorites,
    getTotalCount,
    getCategoryStats,
  } = useKanzState();

  const [showAdd, setShowAdd] = useState(false);
  const [activeFilter, setActiveFilter] = useState<GemCategory | "all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalCount = useMemo(() => getTotalCount(), [gems]);
  const favCount = useMemo(() => getFavorites().length, [gems]);
  const catStats = useMemo(() => getCategoryStats(), [gems]);

  const filteredGems = useMemo(() => {
    let result = gems;
    if (activeFilter === "favorites") {
      result = result.filter((g) => g.isFavorite);
    } else if (activeFilter !== "all") {
      result = result.filter((g) => g.category === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) =>
        g.content.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [gems, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full top-[-10%] right-[-5%]"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.05), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-900/15 border border-amber-500/20">
              <GemIcon className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">كنز</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">بنك حكمتك الشخصي</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <Plus className="w-5 h-5 text-amber-400" />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-3">
          {[
            { label: "جوهرة", value: totalCount, color: "#f59e0b" },
            { label: "مفضلة", value: favCount, color: "#ef4444" },
            { label: "تصنيف", value: catStats.filter((c) => c.count > 0).length, color: "#8b5cf6" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative z-10 px-5 mb-3">
        <div className="flex items-center gap-2 bg-slate-800/30 border border-slate-700/30 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-slate-600" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في كنزك..."
            className="flex-1 bg-transparent text-white text-[11px] placeholder-slate-600 focus:outline-none"
            dir="rtl" />
        </div>
      </div>

      {/* Filters */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setActiveFilter("all")}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all"
            style={{
              background: activeFilter === "all" ? "rgba(245,158,11,0.15)" : "rgba(30,41,59,0.4)",
              border: `1px solid ${activeFilter === "all" ? "#f59e0b" : "rgba(51,65,85,0.3)"}`,
              color: activeFilter === "all" ? "#f59e0b" : "#94a3b8",
            }}>
            🪙 الكل
          </button>
          <button onClick={() => setActiveFilter("favorites")}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all"
            style={{
              background: activeFilter === "favorites" ? "rgba(239,68,68,0.15)" : "rgba(30,41,59,0.4)",
              border: `1px solid ${activeFilter === "favorites" ? "#ef4444" : "rgba(51,65,85,0.3)"}`,
              color: activeFilter === "favorites" ? "#ef4444" : "#94a3b8",
            }}>
            ❤️ المفضلة
          </button>
          {(Object.keys(CATEGORY_META) as GemCategory[]).map((cat) => {
            const m = CATEGORY_META[cat];
            const active = activeFilter === cat;
            return (
              <button key={cat} onClick={() => setActiveFilter(cat)}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${m.color}15` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                  color: active ? m.color : "#94a3b8",
                }}>
                {m.emoji} {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gems */}
      <div className="relative z-10 px-5 space-y-3">
        {filteredGems.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">💎</span>
            <p className="text-sm text-slate-500 font-bold mb-1">
              {totalCount === 0 ? "كنزك فارغ" : "لا نتائج"}
            </p>
            <p className="text-[10px] text-slate-600 mb-4">
              {totalCount === 0
                ? "ابدأ بإضافة أول جوهرة — درس، اقتباس، أو لحظة من رحلتك"
                : "جرّب تصفية أخرى أو بحث مختلف"}
            </p>
            {totalCount === 0 && (
              <button onClick={() => setShowAdd(true)}
                className="text-xs font-bold px-4 py-2 rounded-xl"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
                ✨ أضف جوهرتك الأولى
              </button>
            )}
          </div>
        ) : (
          filteredGems.map((gem) => (
            <GemCard
              key={gem.id}
              gem={gem}
              onFav={() => toggleFavorite(gem.id)}
              onDelete={() => removeGem(gem.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🪙 كنز — كل حكمة وموقف ولحظة في رحلتك تستحق أن تُحفظ
        </p>
      </motion.div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 left-5 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
        }}>
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && <AddGemModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
