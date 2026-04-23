/**
 * مرشد — Murshid: الذكاء الموجّه
 *
 * AI-like intelligence layer that reads all platform data and
 * generates personalized daily insights, smart nudges, celebrations,
 * pattern detection, predictions, and contextual guidance.
 *
 * Sources: Pulse · Gamification · Dawayir · Predictive · Watheeqa · Rifaq
 */

import type { FC } from "react";
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap as Sparkles, AlertTriangle, PartyPopper, Target,
  ChevronRight, TrendingUp, Eye, Shield, Zap, Heart,
  Lightbulb, Bell, Star, ChevronDown, ArrowRight,
  MessageCircle, Sun, Moon, Activity, RefreshCw,
} from "lucide-react";
import { generateAllInsights, type MurshidInsight, type InsightType } from "./engine/murshidEngine";

/* ═══════════════════════════════════════════ */
/*                 CONSTANTS                  */
/* ═══════════════════════════════════════════ */

const TYPE_CONFIG: Record<InsightType, { icon: typeof Brain; label: string; bg: string; border: string; badge: string }> = {
  daily: { icon: Sun, label: "رسالة اليوم", bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.12)", badge: "rgba(251,191,36,0.15)" },
  nudge: { icon: Lightbulb, label: "تنبيه ذكي", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.12)", badge: "rgba(96,165,250,0.15)" },
  celebration: { icon: PartyPopper, label: "احتفال", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.12)", badge: "rgba(16,185,129,0.15)" },
  prediction: { icon: TrendingUp, label: "تنبؤ", bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.12)", badge: "rgba(168,85,247,0.15)" },
  warning: { icon: AlertTriangle, label: "تحذير", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.12)", badge: "rgba(239,68,68,0.15)" },
  pattern: { icon: Activity, label: "نمط مكتشف", bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.12)", badge: "rgba(168,85,247,0.15)" },
};

const FILTER_TABS = [
  { id: "all" as const, label: "الكل", icon: Sparkles },
  { id: "warning" as const, label: "تحذيرات", icon: AlertTriangle },
  { id: "nudge" as const, label: "تنبيهات", icon: Lightbulb },
  { id: "celebration" as const, label: "احتفالات", icon: PartyPopper },
  { id: "pattern" as const, label: "أنماط", icon: Activity },
] as const;

type FilterId = typeof FILTER_TABS[number]["id"];

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const MurshidScreen: FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const insights = useMemo(() => {
    void refreshKey; // dependency for refresh
    return generateAllInsights();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return insights;
    return insights.filter((i) => i.type === activeFilter);
  }, [insights, activeFilter]);

  const dailyInsight = useMemo(() => insights.find((i) => i.type === "daily"), [insights]);
  const restInsights = useMemo(() =>
    filtered.filter((i) => i.type !== "daily" || activeFilter !== "all"),
    [filtered, activeFilter]
  );

  const handleAction = useCallback((screen: string) => {
    window.location.hash = screen;
  }, []);

  const counts = useMemo(() => ({
    warning: insights.filter((i) => i.type === "warning").length,
    nudge: insights.filter((i) => i.type === "nudge").length,
    celebration: insights.filter((i) => i.type === "celebration").length,
    pattern: insights.filter((i) => i.type === "pattern").length,
  }), [insights]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #070b1a 0%, #0d1225 35%, #0a0f20 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}
            >
              <Brain className="w-6 h-6 text-violet-400" />
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-2xl border border-violet-400/20 animate-ping" style={{ animationDuration: "3s" }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">مرشد</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">ذكاء يقرأ رحلتك — ويوجّهك</p>
            </div>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2.5 rounded-xl transition-all active:scale-90"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}
          >
            <RefreshCw className="w-4 h-4 text-violet-400" />
          </button>
        </div>

        {/* Sources badge */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {["Pulse", "Tajmeed", "Dawayir", "Predictive", "Watheeqa", "Rifaq"].map((src) => (
            <span key={src} className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-violet-400/40"
              style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.08)" }}
            >
              {src}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ═══ Daily Insight — Hero Card ═══ */}
      {dailyInsight && activeFilter === "all" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-5 mb-5 p-5 rounded-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.06) 100%)",
            border: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-violet-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-pink-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{dailyInsight.emoji}</span>
              <span className="text-xs font-black text-violet-300/60 uppercase tracking-wider">{dailyInsight.title}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">{dailyInsight.message}</p>
            {dailyInsight.actionLabel && (
              <button
                onClick={() => dailyInsight.actionScreen && handleAction(dailyInsight.actionScreen)}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}
              >
                {dailyInsight.actionLabel} <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ Stats Summary ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-4 gap-2 mx-5 mb-5"
      >
        {[
          { label: "تحذيرات", count: counts.warning, color: "#ef4444", icon: AlertTriangle },
          { label: "تنبيهات", count: counts.nudge, color: "#60a5fa", icon: Lightbulb },
          { label: "احتفالات", count: counts.celebration, color: "#10b981", icon: PartyPopper },
          { label: "أنماط", count: counts.pattern, color: "#a855f7", icon: Activity },
        ].map((stat) => (
          <div key={stat.label} className="py-3 px-2 rounded-xl text-center"
            style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}15` }}
          >
            <stat.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: `${stat.color}90` }} />
            <p className="text-base font-black" style={{ color: stat.color }}>{stat.count}</p>
            <p className="text-[8px] text-slate-500 font-bold">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ═══ Filter Tabs ═══ */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="flex-1 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap min-w-0"
              style={{
                background: activeFilter === tab.id ? "rgba(139,92,246,0.12)" : "transparent",
                color: activeFilter === tab.id ? "#a78bfa" : "rgba(148,163,184,0.4)",
                border: activeFilter === tab.id ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
              }}
            >
              <tab.icon className="w-3 h-3 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Insights Feed ═══ */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-5 space-y-3">
        {(activeFilter === "all" ? restInsights : filtered).length === 0 ? (
          <motion.div variants={itemVariants} className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "rgba(139,92,246,0.06)" }}>
              <Sparkles className="w-7 h-7 text-violet-400/20" />
            </div>
            <p className="text-xs text-slate-500 font-bold">لا توجد رسائل من هذا النوع حالياً</p>
            <p className="text-[10px] text-slate-600">سجّل نبضات أكتر وأضف علاقات — المرشد هيكتشف أنماطك تلقائياً</p>
          </motion.div>
        ) : (
          (activeFilter === "all" ? restInsights : filtered).map((insight) => {
            const config = TYPE_CONFIG[insight.type];
            const isExpanded = expandedId === insight.id;
            return (
              <motion.div
                key={insight.id}
                variants={itemVariants}
                layout
                className="rounded-2xl overflow-hidden transition-all"
                style={{ background: config.bg, border: `1px solid ${config.border}` }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                  className="w-full p-4 flex items-start gap-3 text-right"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: config.badge }}
                  >
                    {insight.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: config.badge, color: insight.color }}
                      >
                        {config.label}
                      </span>
                      <span className="text-[8px] text-slate-600">من {insight.source}</span>
                    </div>
                    <p className="text-sm font-black text-white leading-snug">{insight.title}</p>
                    {!isExpanded && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{insight.message}</p>
                    )}
                  </div>

                  {/* Priority indicator */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {insight.priority >= 8 && (
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: insight.color }} />
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
                        <p className="text-xs text-slate-300 leading-relaxed pt-3">{insight.message}</p>

                        {insight.actionLabel && insight.actionScreen && (
                          <button
                            onClick={() => handleAction(insight.actionScreen!)}
                            className="px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                            style={{ background: `${insight.color}15`, border: `1px solid ${insight.color}25`, color: insight.color }}
                          >
                            {insight.actionLabel} <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* ═══ Footer Wisdom ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(139,92,246,0.03)", border: "1px solid rgba(139,92,246,0.06)" }}
      >
        <Brain className="w-5 h-5 text-violet-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          المرشد يقرأ بياناتك من 7 مصادر مختلفة ويولّد رسائل مخصصة ليك.
          <br />
          كل ما استخدمت المنصة أكتر — المرشد بيفهمك أعمق.
        </p>
      </motion.div>
    </div>
  );
};

export default MurshidScreen;
