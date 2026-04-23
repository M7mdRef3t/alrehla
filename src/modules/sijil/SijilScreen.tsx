/**
 * سِجل — Sijil: السجل المفتوح
 *
 * كل حركة في المنصة — موثّقة في timeline واحد:
 * - Activity Timeline with source filters
 * - GitHub-style Activity Heatmap (30 days)
 * - Usage Trends (top products)
 * - Engagement Score
 * - Auto-sync from stores on mount
 */

import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ScrollText, Filter, Calendar, BarChart3,
  TrendingUp, Zap, Clock, Flame,
} from "lucide-react";
import { useSijilState, type ActivitySource } from "./store/sijil.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useWirdState } from "@/modules/wird/store/wird.store";
import { useBawsalaState } from "@/modules/bawsala/store/bawsala.store";
import { useHafizState } from "@/modules/hafiz/store/hafiz.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "timeline" | "heatmap" | "trends";

const SOURCE_META: Record<string, { label: string; emoji: string; color: string }> = {
  pulse: { label: "نبض", emoji: "💓", color: "#ef4444" },
  wird: { label: "وِرد", emoji: "🔥", color: "#fbbf24" },
  bawsala: { label: "بوصلة", emoji: "🧭", color: "#06b6d4" },
  watheeqa: { label: "وثيقة", emoji: "📝", color: "#f97316" },
  nadhir: { label: "نذير", emoji: "🛡️", color: "#ef4444" },
  hafiz: { label: "حافظ", emoji: "💎", color: "#a855f7" },
  mirah: { label: "مرآة", emoji: "🪞", color: "#c084fc" },
  markaz: { label: "مركز", emoji: "📊", color: "#6366f1" },
  sada: { label: "صدى", emoji: "🔔", color: "#06b6d4" },
  riwaya: { label: "رواية", emoji: "📖", color: "#fb923c" },
  rifaq: { label: "رفاق", emoji: "🤝", color: "#ec4899" },
  baseera: { label: "بصيرة", emoji: "👁️", color: "#6366f1" },
  atmosfera: { label: "أتموسفيرا", emoji: "🌌", color: "#0ea5e9" },
  masarat: { label: "مسارات", emoji: "🛤️", color: "#10b981" },
  dawayir: { label: "دوائر", emoji: "🔵", color: "#3b82f6" },
  murshid: { label: "مرشد", emoji: "🧠", color: "#8b5cf6" },
  taqrir: { label: "تقرير", emoji: "📊", color: "#06b6d4" },
  gamification: { label: "أوسمة", emoji: "🏅", color: "#fbbf24" },
  system: { label: "نظام", emoji: "⚙️", color: "#64748b" },
};

/* ═══════════════════════════════════════════ */
/*         AUTO-SYNC FROM STORES              */
/* ═══════════════════════════════════════════ */

function useAutoSync() {
  const { events, logEvent } = useSijilState();
  const logs = usePulseState((s) => s.logs) ?? [];
  const { badges } = useGamificationState();
  const wirdState = useWirdState();
  const { decisions } = useBawsalaState();
  const { memories } = useHafizState();

  useEffect(() => {
    // Only sync if empty (first time) to avoid duplicates
    if (events.length > 0) return;

    // Seed from pulse logs
    logs.slice(0, 20).forEach((l) => {
      logEvent({
        source: "pulse",
        emoji: "💓",
        action: "سجّل نبضة",
        detail: `طاقة ${l.energy}/10 · ${l.mood}`,
      });
    });

    // Seed from decisions
    decisions.slice(0, 10).forEach((d) => {
      logEvent({
        source: "bawsala",
        emoji: "🧭",
        action: d.status === "decided" ? "اتّخذ قرار" : "فتح قرار للتفكير",
        detail: d.question,
      });
    });

    // Seed from memories
    memories.slice(0, 10).forEach((m) => {
      logEvent({
        source: "hafiz",
        emoji: "💎",
        action: "حفظ ذكرى",
        detail: m.title,
      });
    });

    // Seed from badges
    badges.slice(0, 5).forEach((b) => {
      logEvent({
        source: "gamification",
        emoji: "🏅",
        action: "حصل على وسام",
        detail: b.id,
      });
    });

    // Wird streak
    if (wirdState.streak > 0) {
      logEvent({
        source: "wird",
        emoji: "🔥",
        action: `streak: ${wirdState.streak} يوم`,
      });
    }
  }, []);
}

/* ═══════════════════════════════════════════ */
/*           HEATMAP COMPONENT                */
/* ═══════════════════════════════════════════ */

const ActivityHeatmap: FC<{ data: Record<string, number> }> = ({ data }) => {
  const days = useMemo(() => {
    const result: { key: string; count: number; day: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      result.push({ key, count: data[key] || 0, day: d.getDay() });
    }
    return result;
  }, [data]);

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1 justify-center">
        {days.map((d) => {
          const intensity = d.count / maxCount;
          return (
            <motion.div key={d.key}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.random() * 0.3 }}
              className="w-[18px] h-[18px] rounded-[3px] relative group cursor-default"
              style={{
                background: d.count === 0
                  ? "rgba(255,255,255,0.03)"
                  : `rgba(16,185,129,${0.15 + intensity * 0.6})`,
                border: `1px solid ${d.count === 0 ? "rgba(255,255,255,0.02)" : `rgba(16,185,129,${0.1 + intensity * 0.3})`}`,
              }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[8px] text-white bg-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {d.key}: {d.count} حدث
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-1 pt-1">
        <span className="text-[7px] text-slate-600">أقل</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div key={v} className="w-3 h-3 rounded-[2px]"
            style={{ background: v === 0 ? "rgba(255,255,255,0.03)" : `rgba(16,185,129,${0.15 + v * 0.6})` }}
          />
        ))}
        <span className="text-[7px] text-slate-600">أكثر</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const SijilScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [sourceFilter, setSourceFilter] = useState<ActivitySource | null>(null);

  const { events, getHeatmapData, getSourceStats } = useSijilState();

  useAutoSync();

  const filteredEvents = useMemo(() => {
    if (!sourceFilter) return events;
    return events.filter((e) => e.source === sourceFilter);
  }, [events, sourceFilter]);

  const heatmapData = useMemo(() => getHeatmapData(), [events]);
  const sourceStats = useMemo(() => getSourceStats(), [events]);

  // Engagement Score
  const engagementScore = useMemo(() => {
    const last7days = events.filter((e) => Date.now() - e.timestamp < 7 * 24 * 3600000);
    const uniqueDays = new Set(
      last7days.map((e) => new Date(e.timestamp).toDateString())
    ).size;
    const uniqueSources = new Set(last7days.map((e) => e.source)).size;
    const dailyAvg = last7days.length / 7;

    return Math.min(
      Math.round((uniqueDays / 7) * 40 + (uniqueSources / 10) * 30 + Math.min(dailyAvg / 5, 1) * 30),
      100
    );
  }, [events]);

  // Today count
  const todayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return events.filter((e) => new Date(e.timestamp).toDateString() === todayStr).length;
  }, [events]);

  // Group by date
  const groupedEvents = useMemo(() => {
    const groups: { label: string; events: typeof events }[] = [];
    const todayStr = new Date().toDateString();
    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

    const today: typeof events = [];
    const yesterday: typeof events = [];
    const earlier: typeof events = [];

    filteredEvents.forEach((e) => {
      const dStr = new Date(e.timestamp).toDateString();
      if (dStr === todayStr) today.push(e);
      else if (dStr === yesterdayStr) yesterday.push(e);
      else earlier.push(e);
    });

    if (today.length) groups.push({ label: "اليوم", events: today });
    if (yesterday.length) groups.push({ label: "أمس", events: yesterday });
    if (earlier.length) groups.push({ label: "سابقاً", events: earlier.slice(0, 30) });
    return groups;
  }, [filteredEvents]);

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #060a10 0%, #0a1018 40%, #060a12 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <ScrollText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">سِجل</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{events.length} حدث مسجّل</p>
            </div>
          </div>

          {/* Engagement Score */}
          <div className="w-14 h-14 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
              <motion.circle cx={50} cy={50} r={40} fill="none" stroke="#10b981"
                strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${(engagementScore / 100) * 251} 251`}
                initial={{ strokeDasharray: "0 251" }}
                animate={{ strokeDasharray: `${(engagementScore / 100) * 251} 251` }}
                transition={{ duration: 1.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-emerald-400">{engagementScore}%</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "اليوم", value: todayCount, emoji: "📅", color: "#10b981" },
            { label: "إجمالي", value: events.length, emoji: "📜", color: "#06b6d4" },
            { label: "مصادر", value: sourceStats.length, emoji: "🔗", color: "#a855f7" },
            { label: "تفاعل", value: `${engagementScore}%`, emoji: "⚡", color: "#fbbf24" },
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
            { key: "timeline", label: "التسلسل", icon: "📜" },
            { key: "heatmap", label: "خريطة حرارية", icon: "🗓️" },
            { key: "trends", label: "الاتجاهات", icon: "📈" },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: viewMode === tab.key ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.02)",
                color: viewMode === tab.key ? "#34d399" : "#475569",
                border: `1px solid ${viewMode === tab.key ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ Timeline View ═══ */}
      {viewMode === "timeline" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {/* Source Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSourceFilter(null)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold"
              style={{
                background: !sourceFilter ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                color: !sourceFilter ? "#34d399" : "#475569",
              }}
            >الكل</button>
            {sourceStats.slice(0, 8).map(({ source }) => {
              const meta = SOURCE_META[source] || { label: source, emoji: "📌", color: "#64748b" };
              return (
                <button key={source} onClick={() => setSourceFilter(source)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold"
                  style={{
                    background: sourceFilter === source ? `${meta.color}15` : "rgba(255,255,255,0.03)",
                    color: sourceFilter === source ? meta.color : "#475569",
                  }}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>

          {/* Event Groups */}
          {events.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ScrollText className="w-10 h-10 text-emerald-400/10 mx-auto" />
              <p className="text-sm text-slate-500 font-bold">السِجل فارغ</p>
              <p className="text-xs text-slate-600">تفاعل مع المنتجات — وسيبدأ السِجل بالتوثيق تلقائياً.</p>
            </div>
          ) : (
            groupedEvents.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <p className="text-[10px] text-emerald-400/50 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {group.label}
                </p>
                {group.events.map((event, idx) => {
                  const meta = SOURCE_META[event.source] || { label: event.source, emoji: "📌", color: "#64748b" };
                  return (
                    <motion.div key={event.id}
                      initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-3 rounded-xl flex items-center gap-2.5"
                      style={{ background: `${meta.color}03`, border: `1px solid ${meta.color}06` }}
                    >
                      <span className="text-sm">{event.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white">{event.action}</p>
                        {event.detail && (
                          <p className="text-[9px] text-slate-500 truncate">{event.detail}</p>
                        )}
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-[8px] text-slate-600">{formatTime(event.timestamp)}</p>
                        <p className="text-[7px] font-bold" style={{ color: meta.color }}>{meta.label}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* ═══ Heatmap View ═══ */}
      {viewMode === "heatmap" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          <div className="p-5 rounded-2xl"
            style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.06)" }}
          >
            <p className="text-[10px] text-emerald-400/50 font-bold flex items-center gap-1 mb-4">
              <Calendar className="w-3 h-3" /> نشاطك آخر 30 يوم
            </p>
            <ActivityHeatmap data={heatmapData} />
          </div>

          {/* Daily Average */}
          <div className="p-4 rounded-xl"
            style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.06)" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              {(() => {
                const last7 = events.filter((e) => Date.now() - e.timestamp < 7 * 86400000);
                const last30 = events.filter((e) => Date.now() - e.timestamp < 30 * 86400000);
                const activeDays = new Set(last30.map((e) => new Date(e.timestamp).toDateString())).size;
                return [
                  { label: "معدل يومي", value: (last7.length / 7).toFixed(1), emoji: "📊" },
                  { label: "أيام نشطة", value: `${activeDays}/30`, emoji: "🗓️" },
                  { label: "ذروة", value: Math.max(...Object.values(heatmapData), 0), emoji: "🔥" },
                ];
              })().map((s) => (
                <div key={s.label}>
                  <span className="text-sm">{s.emoji}</span>
                  <p className="text-lg font-black text-white">{s.value}</p>
                  <p className="text-[8px] text-slate-500 font-bold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Trends View ═══ */}
      {viewMode === "trends" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          <p className="text-[10px] text-emerald-400/50 font-bold flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> أكثر المنتجات استخداماً
          </p>

          {sourceStats.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart3 className="w-8 h-8 text-emerald-400/10 mx-auto mb-2" />
              <p className="text-xs text-slate-600">لا توجد بيانات كافية</p>
            </div>
          ) : (
            sourceStats.slice(0, 10).map((stat, idx) => {
              const meta = SOURCE_META[stat.source] || { label: stat.source, emoji: "📌", color: "#64748b" };
              const maxCount = sourceStats[0]?.count || 1;
              const pct = Math.round((stat.count / maxCount) * 100);
              return (
                <motion.div key={stat.source}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 rounded-xl"
                  style={{ background: `${meta.color}03`, border: `1px solid ${meta.color}06` }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-sm">{meta.emoji}</span>
                    <p className="text-[11px] font-bold text-white flex-1">{meta.label}</p>
                    <p className="text-sm font-black" style={{ color: meta.color }}>{stat.count}</p>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1.5 rounded-full bg-white/3 overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: meta.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                    />
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Engagement Breakdown */}
          <div className="p-4 rounded-xl mt-3"
            style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.06)" }}
          >
            <p className="text-[10px] text-emerald-400/50 font-bold mb-2">تحليل التفاعل</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "تنوع المصادر", value: `${sourceStats.length} منتج`, emoji: "🔗" },
                { label: "أكثر منتج", value: sourceStats[0] ? SOURCE_META[sourceStats[0].source]?.label || sourceStats[0].source : "—", emoji: "👑" },
                { label: "أحداث/أسبوع", value: events.filter((e) => Date.now() - e.timestamp < 7 * 86400000).length, emoji: "📈" },
                { label: "درجة التفاعل", value: `${engagementScore}%`, emoji: "⚡" },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <span className="text-xs">{s.emoji}</span>
                  <p className="text-sm font-black text-white">{s.value}</p>
                  <p className="text-[7px] text-slate-500 font-bold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.06)" }}
      >
        <ScrollText className="w-5 h-5 text-emerald-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          السِجل لا ينسى.
          <br />
          كل حركة في رحلتك — موثّقة هنا عشان تشوف الصورة الكاملة.
        </p>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export default SijilScreen;
