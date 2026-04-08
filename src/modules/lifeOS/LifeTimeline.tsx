"use client";

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { LIFE_DOMAINS, getDomainConfig, type LifeDomainId } from "@/types/lifeDomains";
import { useLifeState } from "@/state/lifeState";

interface LifeTimelineProps {
  maxDays?: number;
}

interface TimelineEntry {
  id: string;
  type: string;
  content: string;
  domainId: LifeDomainId;
  createdAt: number;
  status: string;
  resolvedAt?: number;
  dayKey: string;
}

export const LifeTimeline = memo(function LifeTimeline({ maxDays = 14 }: LifeTimelineProps) {
  const entries = useLifeState((s) => s.entries);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Group entries by day
  const timeline = useMemo(() => {
    const dayMap: Map<string, TimelineEntry[]> = new Map();
    const now = Date.now();
    const cutoff = now - maxDays * 24 * 60 * 60 * 1000;

    const filtered = entries
      .filter(e => e.createdAt >= cutoff)
      .sort((a, b) => b.createdAt - a.createdAt);

    for (const entry of filtered) {
      const date = new Date(entry.createdAt);
      const dayKey = date.toISOString().slice(0, 10);
      if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
      dayMap.get(dayKey)!.push({ ...entry, dayKey });
    }

    return Array.from(dayMap.entries()).map(([dayKey, entries]) => ({
      dayKey,
      date: new Date(dayKey),
      entries,
      domainCounts: entries.reduce<Record<string, number>>((acc, e) => {
        acc[e.domainId] = (acc[e.domainId] ?? 0) + 1;
        return acc;
      }, {}),
      problems: entries.filter(e => e.type === "problem").length,
      decisions: entries.filter(e => e.type === "decision").length,
      wins: entries.filter(e => e.type === "win").length,
      resolved: entries.filter(e => e.status === "resolved").length
    }));
  }, [entries, maxDays]);

  const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
    thought: { label: "فكرة", color: "#8b5cf6", icon: "💡" },
    problem: { label: "مشكلة", color: "#ef4444", icon: "⚠️" },
    decision: { label: "قرار", color: "#f59e0b", icon: "🧠" },
    goal: { label: "هدف", color: "#06b6d4", icon: "🎯" },
    win: { label: "إنجاز", color: "#10b981", icon: "🏆" },
    lesson: { label: "درس", color: "#ec4899", icon: "📖" },
    note: { label: "ملاحظة", color: "#64748b", icon: "📝" }
  };

  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const isToday = (date: Date) => date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-black text-white">الخط الزمني</h3>
        <span className="text-[10px] text-white/20 font-mono">آخر {maxDays} يوم</span>
      </div>

      {/* Day dots overview */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {timeline.map((day, i) => {
          const total = day.entries.length;
          const dotSize = Math.min(32, 16 + total * 3);
          const isSelected = selectedDay === day.dayKey;
          const today = isToday(day.date);

          return (
            <motion.button
              key={day.dayKey}
              className="flex flex-col items-center gap-1 shrink-0"
              onClick={() => setSelectedDay(isSelected ? null : day.dayKey)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div
                className="rounded-full flex items-center justify-center transition-all"
                style={{
                  width: dotSize,
                  height: dotSize,
                  background: isSelected
                    ? "rgba(139,92,246,0.25)"
                    : today
                    ? "rgba(16,185,129,0.15)"
                    : `rgba(255,255,255,${0.02 + total * 0.02})`,
                  border: isSelected
                    ? "2px solid rgba(139,92,246,0.5)"
                    : today
                    ? "2px solid rgba(16,185,129,0.3)"
                    : "1px solid rgba(255,255,255,0.05)"
                }}
              >
                <span className="text-[9px] font-black font-mono"
                  style={{ color: isSelected ? "#a78bfa" : today ? "#34d399" : "rgba(255,255,255,0.3)" }}>
                  {total}
                </span>
              </div>
              <span className="text-[8px] font-bold text-white/20">
                {today ? "اليوم" : dayNames[day.date.getDay()]?.slice(0, 3)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (() => {
        const day = timeline.find(d => d.dayKey === selectedDay);
        if (!day) return null;

        return (
          <motion.div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            {/* Day header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/60">
                  {dayNames[day.date.getDay()]} — {day.date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                </span>
                {isToday(day.date) && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">اليوم</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {day.wins > 0 && <span className="text-[9px] font-bold text-emerald-400">🏆 {day.wins}</span>}
                {day.resolved > 0 && <span className="text-[9px] font-bold text-cyan-400">✓ {day.resolved}</span>}
              </div>
            </div>

            {/* Domain breakdown */}
            <div className="flex gap-1 flex-wrap">
              {Object.entries(day.domainCounts).map(([domainId, count]) => {
                const config = getDomainConfig(domainId as LifeDomainId);
                return (
                  <span key={domainId} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${config.color}12`, color: config.color }}>
                    {config.icon} {count}
                  </span>
                );
              })}
            </div>

            {/* Entries */}
            <div className="space-y-1.5">
              {day.entries.map(entry => {
                const tc = typeConfig[entry.type] ?? typeConfig.note;
                const domain = getDomainConfig(entry.domainId);
                const isResolved = entry.status === "resolved";

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${isResolved ? "opacity-40" : ""}`}
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <span className="text-[11px]">{tc.icon}</span>
                    <p className={`text-[11px] font-medium flex-1 min-w-0 truncate ${isResolved ? "line-through text-white/20" : "text-white/50"}`}>
                      {entry.content}
                    </p>
                    <span className="text-[8px] text-white/15 font-mono shrink-0">
                      {new Date(entry.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* Empty state */}
      {timeline.length === 0 && (
        <div className="text-center py-8 space-y-2">
          <Calendar className="w-8 h-8 text-white/10 mx-auto" />
          <p className="text-xs text-white/20">مفيش نشاط في آخر {maxDays} يوم</p>
          <p className="text-[10px] text-white/10">ابدأ بتسجيل أول فكرة أو مشكلة</p>
        </div>
      )}
    </div>
  );
});
