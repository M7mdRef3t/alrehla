/**
 * صدى — Sada Screen
 * Smart Nudges & Behavior-Driven Notifications
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSadaState,
  NUDGE_TYPE_META,
  type NudgeType,
  type Nudge,
} from "./store/sada.store";
import { Bell, Check, X, Trash2, ChevronLeft } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*           NUDGE CARD                       */
/* ═══════════════════════════════════════════ */

function NudgeCard({ nudge, onAction }: { nudge: Nudge; onAction?: (screen: string) => void }) {
  const { markRead, dismiss } = useSadaState();
  const meta = NUDGE_TYPE_META[nudge.type];
  const isNew = !nudge.read;

  const handleTap = () => {
    if (!nudge.read) markRead(nudge.id);
  };

  const handleAction = () => {
    if (nudge.actionScreen) {
      window.location.hash = `#${nudge.actionScreen}`;
      onAction?.(nudge.actionScreen);
    }
  };

  const timeAgo = useMemo(() => {
    const diff = Date.now() - nudge.createdAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} س`;
    return `${Math.floor(hrs / 24)} ي`;
  }, [nudge.createdAt]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      layout
      onClick={handleTap}
      className="rounded-xl p-3.5 relative overflow-hidden group transition-all cursor-pointer"
      style={{
        background: isNew ? `${meta.color}06` : "rgba(15,23,42,0.3)",
        border: `1px solid ${isNew ? `${meta.color}15` : "rgba(51,65,85,0.15)"}`,
      }}
    >
      {/* Unread indicator */}
      {isNew && (
        <div className="absolute top-3 left-3 w-2 h-2 rounded-full animate-pulse"
          style={{ background: meta.color }} />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}18` }}>
          <span className="text-lg">{nudge.emoji}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-black text-white truncate">{nudge.title}</span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: `${meta.color}12`, color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{nudge.body}</p>

          {/* Action + time */}
          <div className="flex items-center justify-between mt-2">
            {nudge.actionLabel && nudge.actionScreen ? (
              <button onClick={(e) => { e.stopPropagation(); handleAction(); }}
                className="text-[9px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}18`, color: meta.color }}>
                {nudge.actionLabel} <ChevronLeft className="w-2.5 h-2.5" />
              </button>
            ) : <span />}
            <span className="text-[8px] text-slate-600">{timeAgo}</span>
          </div>
        </div>

        {/* Dismiss */}
        <button onClick={(e) => { e.stopPropagation(); dismiss(nudge.id); }}
          className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 text-slate-500 shrink-0 transition-opacity">
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function SadaScreen() {
  const {
    getActive, getUnreadCount, dismissAll,
    generateDailyNudges, clearExpired,
  } = useSadaState();

  const [filter, setFilter] = useState<NudgeType | "all">("all");

  // Auto-generate daily nudges on mount
  useEffect(() => {
    clearExpired();
    generateDailyNudges();
  }, [clearExpired, generateDailyNudges]);

  const active = useMemo(() => getActive(), [getActive]);
  const unreadCount = useMemo(() => getUnreadCount(), [getUnreadCount]);

  const filtered = useMemo(
    () => filter === "all" ? active : active.filter((n) => n.type === filter),
    [active, filter]
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-900/15 border border-indigo-500/20 relative">
              <Bell className="w-6 h-6 text-indigo-400" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{unreadCount}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">صدى</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">تنبيهات ذكية من رحلتك</p>
            </div>
          </div>

          {active.length > 0 && (
            <button onClick={dismissAll}
              className="flex items-center gap-1 text-[9px] font-bold text-slate-600 px-2 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/20">
              <Trash2 className="w-3 h-3" /> مسح الكل
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "غير مقروءة", value: unreadCount, color: "#ef4444" },
            { label: "نشطة", value: active.length, color: "#6366f1" },
            { label: "أنواع", value: Object.keys(NUDGE_TYPE_META).length, color: "#14b8a6" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setFilter("all")}
            className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: filter === "all" ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.4)",
              border: `1px solid ${filter === "all" ? "rgba(99,102,241,0.3)" : "rgba(51,65,85,0.3)"}`,
              color: filter === "all" ? "#6366f1" : "#64748b",
            }}>
            الكل
          </button>
          {(Object.keys(NUDGE_TYPE_META) as NudgeType[]).map((t) => {
            const meta = NUDGE_TYPE_META[t];
            const isActive = filter === t;
            return (
              <button key={t} onClick={() => setFilter(t)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                style={{
                  background: isActive ? `${meta.color}15` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${isActive ? `${meta.color}30` : "rgba(51,65,85,0.3)"}`,
                  color: isActive ? meta.color : "#64748b",
                }}>
                <span>{meta.emoji}</span> {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nudges List */}
      <div className="relative z-10 px-5 space-y-2">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.2)" }}>
            <span className="text-5xl block mb-3">🔔</span>
            <p className="text-sm text-white/80 font-bold mb-1">لا صدى بعد</p>
            <p className="text-[10px] text-slate-500">
              {filter === "all"
                ? "ستظهر تنبيهات ذكية بناءً على نشاطك في الرحلة"
                : `لا توجد تنبيهات من نوع "${NUDGE_TYPE_META[filter as NudgeType]?.label}"`}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((nudge) => (
              <NudgeCard key={nudge.id} nudge={nudge} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🔔 صدى — المنصة تتكلم معاك — تنبيهات مبنية على بياناتك الحقيقية
        </p>
      </motion.div>
    </div>
  );
}
