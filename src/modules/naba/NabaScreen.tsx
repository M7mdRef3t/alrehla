/**
 * نبع — Nab'a: مولّد الإلهام اليومي
 *
 * كل يوم — رشفة إلهام من رحلتك:
 * - Daily Card with reveal animation
 * - Shuffle for random inspiration
 * - Favorites collection
 * - History timeline
 * - Streak counter
 */

import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets, Heart, Shuffle, Clock, Flame,
  Zap as Sparkles, BookOpen, HelpCircle, Dumbbell,
  Lightbulb, Star,
} from "lucide-react";
import { useNabaState, type InspirationKind, type InspirationCard } from "./store/naba.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "today" | "favorites" | "history";

const KIND_META: Record<InspirationKind, { label: string; emoji: string; color: string; gradient: string }> = {
  quote: { label: "اقتباس", emoji: "📜", color: "#a855f7", gradient: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(99,102,241,0.04) 100%)" },
  question: { label: "سؤال", emoji: "❓", color: "#06b6d4", gradient: "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(59,130,246,0.04) 100%)" },
  challenge: { label: "تحدي", emoji: "🎯", color: "#f97316", gradient: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(251,191,36,0.04) 100%)" },
  wisdom: { label: "حكمة", emoji: "🌿", color: "#10b981", gradient: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.04) 100%)" },
  exercise: { label: "تمرين", emoji: "🧘", color: "#ec4899", gradient: "linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(168,85,247,0.04) 100%)" },
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const NabaScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [shuffledCard, setShuffledCard] = useState<InspirationCard | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const {
    todayCard, history, favorites, streak,
    generateToday, shuffle, toggleFavorite,
  } = useNabaState();

  // Generate today's card on mount
  useEffect(() => {
    generateToday();
  }, []);

  const activeCard = shuffledCard || todayCard;

  const handleShuffle = () => {
    setIsRevealing(true);
    setTimeout(() => {
      const card = shuffle();
      setShuffledCard(card);
      setIsRevealing(false);
    }, 400);
  };

  const handleBackToToday = () => {
    setShuffledCard(null);
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #080612 0%, #100a1c 40%, #080614 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}
            >
              <Droplets className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">نبع</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">رشفة إلهام يومية</p>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.1)" }}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black text-amber-400">{streak}</span>
            <span className="text-[8px] text-slate-600 font-bold">يوم</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {([
            { key: "today", label: "اليوم", icon: "💧" },
            { key: "favorites", label: "المحفوظ", icon: "❤️" },
            { key: "history", label: "السابق", icon: "📚" },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: viewMode === tab.key ? "rgba(6,182,212,0.1)" : "rgba(255,255,255,0.02)",
                color: viewMode === tab.key ? "#22d3ee" : "#475569",
                border: `1px solid ${viewMode === tab.key ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ Today View ═══ */}
      {viewMode === "today" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-5">
          {/* Main Card */}
          {activeCard ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard.id}
                initial={{ opacity: 0, scale: 0.95, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.95, rotateY: -90 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="p-8 rounded-3xl relative overflow-hidden"
                style={{
                  background: KIND_META[activeCard.kind].gradient,
                  border: `1px solid ${KIND_META[activeCard.kind].color}15`,
                  minHeight: "240px",
                }}
              >
                {/* Decorative orbs */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl"
                  style={{ background: `${KIND_META[activeCard.kind].color}08` }} />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl"
                  style={{ background: `${KIND_META[activeCard.kind].color}05` }} />

                {/* Kind badge */}
                <div className="flex items-center gap-1.5 mb-6">
                  <span className="px-3 py-1 rounded-full text-[9px] font-bold"
                    style={{ background: `${KIND_META[activeCard.kind].color}12`, color: KIND_META[activeCard.kind].color }}
                  >
                    {KIND_META[activeCard.kind].emoji} {KIND_META[activeCard.kind].label}
                  </span>
                  {shuffledCard && (
                    <button onClick={handleBackToToday}
                      className="px-2 py-1 rounded-full text-[8px] font-bold text-slate-500 hover:text-slate-300 transition-all"
                    >↩ عودة لبطاقة اليوم</button>
                  )}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <span className="text-3xl mb-4 block">{activeCard.emoji}</span>
                  <p className="text-lg font-bold text-white leading-relaxed mb-3">
                    {activeCard.text}
                  </p>
                  {activeCard.author && (
                    <p className="text-[11px] font-medium" style={{ color: `${KIND_META[activeCard.kind].color}90` }}>
                      — {activeCard.author}
                    </p>
                  )}
                </div>

                {/* Favorite */}
                <button onClick={() => toggleFavorite(activeCard.id)}
                  className="absolute bottom-6 left-6 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: activeCard.favorited ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <Heart className="w-5 h-5" style={{
                    color: activeCard.favorited ? "#ef4444" : "#334155",
                    fill: activeCard.favorited ? "#ef4444" : "none",
                  }} />
                </button>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="py-20 text-center">
              <Droplets className="w-10 h-10 text-cyan-400/10 mx-auto mb-3" />
              <p className="text-sm text-slate-500">جاري التحميل...</p>
            </div>
          )}

          {/* Shuffle Button */}
          <motion.button
            onClick={handleShuffle}
            disabled={isRevealing}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-30"
            style={{
              background: "rgba(6,182,212,0.06)",
              border: "1px solid rgba(6,182,212,0.1)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Shuffle className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400">رشفة أخرى</span>
          </motion.button>

          {/* Kind Legend */}
          <div className="flex gap-1.5 flex-wrap justify-center">
            {(Object.keys(KIND_META) as InspirationKind[]).map((kind) => (
              <span key={kind} className="px-2.5 py-1 rounded-lg text-[8px] font-bold"
                style={{ background: `${KIND_META[kind].color}06`, color: `${KIND_META[kind].color}80` }}
              >
                {KIND_META[kind].emoji} {KIND_META[kind].label}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "streak", value: streak, emoji: "🔥", color: "#fbbf24" },
              { label: "رشفات", value: history.length, emoji: "💧", color: "#06b6d4" },
              { label: "محفوظ", value: favorites.length, emoji: "❤️", color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl text-center"
                style={{ background: `${s.color}04`, border: `1px solid ${s.color}08` }}
              >
                <span className="text-sm">{s.emoji}</span>
                <p className="text-lg font-black text-white">{s.value}</p>
                <p className="text-[7px] text-slate-500 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ Favorites View ═══ */}
      {viewMode === "favorites" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-2.5">
          {favorites.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Heart className="w-10 h-10 text-red-400/10 mx-auto" />
              <p className="text-sm text-slate-500 font-bold">لا توجد رشفات محفوظة</p>
              <p className="text-xs text-slate-600">اضغط ❤️ على أي بطاقة لحفظها هنا.</p>
            </div>
          ) : (
            favorites.map((card, idx) => (
              <motion.div key={card.id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="p-4 rounded-xl relative"
                style={{ background: KIND_META[card.kind].gradient, border: `1px solid ${KIND_META[card.kind].color}08` }}
              >
                <button onClick={() => toggleFavorite(card.id)}
                  className="absolute top-3 left-3"
                >
                  <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                </button>

                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">{card.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white leading-relaxed">{card.text}</p>
                    {card.author && (
                      <p className="text-[9px] mt-1" style={{ color: `${KIND_META[card.kind].color}70` }}>— {card.author}</p>
                    )}
                    <span className="text-[7px] font-bold mt-1 block" style={{ color: `${KIND_META[card.kind].color}50` }}>
                      {KIND_META[card.kind].emoji} {KIND_META[card.kind].label}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* ═══ History View ═══ */}
      {viewMode === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-2">
          {history.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="w-8 h-8 text-cyan-400/10 mx-auto mb-2" />
              <p className="text-xs text-slate-600">السجل فارغ — ابدأ بأول رشفة</p>
            </div>
          ) : (
            history.slice(0, 30).map((card, idx) => {
              const meta = KIND_META[card.kind];
              return (
                <motion.div key={card.id}
                  initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="p-3 rounded-xl flex items-center gap-2.5"
                  style={{ background: `${meta.color}03`, border: `1px solid ${meta.color}06` }}
                >
                  <span className="text-sm">{card.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">{card.text}</p>
                    <span className="text-[7px]" style={{ color: `${meta.color}60` }}>{meta.label}</span>
                  </div>
                  <button onClick={() => toggleFavorite(card.id)} className="p-1.5">
                    <Heart className="w-3.5 h-3.5" style={{
                      color: card.favorited ? "#ef4444" : "#1e293b",
                      fill: card.favorited ? "#ef4444" : "none",
                    }} />
                  </button>
                  <span className="text-[8px] text-slate-600 shrink-0">{formatDate(card.seenAt)}</span>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.06)" }}
      >
        <Droplets className="w-5 h-5 text-cyan-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          النبع لا ينضب.
          <br />
          كل يوم — رشفة جديدة تغذي روحك وتنعش عقلك.
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
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "اليوم";
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export default NabaScreen;
