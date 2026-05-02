/**
 * رواية — Riwaya: خط زمن الرحلة
 *
 * Transforms all platform data into a visual journey story:
 * - Interactive timeline with milestones
 * - Peaks & valleys detection
 * - Monthly chapters auto-generated
 * - Before/After comparison
 * - Journey narrative summary
 *
 * Sources: Pulse · Gamification · Dawayir · Watheeqa · Bawsala
 */

import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Calendar, TrendingUp, TrendingDown, Mountain,
  Star, Flame, Heart, Zap, PenLine, ChevronDown,
  Award, Clock, Zap as Sparkles, ArrowUp, ArrowDown, Minus,
  Flag, MapPin, Sun, Moon,
} from "lucide-react";
import { usePulseState, type PulseMood } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useMapState } from "@/modules/map/dawayirIndex";
import { useDailyJournalState } from "@/domains/journey/store/journal.store";
import { platform } from "@/shared/platform";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

const MOOD_LABELS: Record<PulseMood, string> = {
  bright: "مشرق", hopeful: "متفائل", calm: "هادئ",
  anxious: "قلق", tense: "متوتر", sad: "حزين",
  angry: "غاضب", overwhelmed: "مرهق",
};

const MOOD_COLORS: Record<PulseMood, string> = {
  bright: "#fbbf24", hopeful: "#34d399", calm: "#60a5fa",
  anxious: "#f97316", tense: "#ef4444", sad: "#8b5cf6",
  angry: "#dc2626", overwhelmed: "#64748b",
};

const MOOD_POSITIVITY: Record<PulseMood, number> = {
  bright: 10, hopeful: 8, calm: 7,
  anxious: 3, tense: 3, sad: 2,
  angry: 1, overwhelmed: 1,
};

type ViewMode = "timeline" | "chapters" | "summary";

interface TimelineEvent {
  id: string;
  date: number;
  type: "pulse" | "badge" | "journal" | "decision" | "milestone";
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  energy?: number;
  mood?: PulseMood;
}

interface Chapter {
  month: string;
  monthKey: string;
  events: TimelineEvent[];
  avgEnergy: number;
  topMood: PulseMood | null;
  positivityRatio: number;
  trend: "up" | "down" | "stable";
  highlights: string[];
}

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

function formatMonthYear(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
}

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const RiwayaScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  // ── Data Sources ──
  const rawLogs = usePulseState((s) => s.logs);
  const logs = useMemo(() => rawLogs ?? [], [rawLogs]);
  const { badges, streak, level, xp } = useGamificationState();
  const rawNodes = useMapState((s) => s.nodes);
  const nodes = useMemo(() => rawNodes ?? [], [rawNodes]);
  const rawJournalEntries = useDailyJournalState((s) => s.entries);
  const journalEntries = useMemo(() => rawJournalEntries ?? [], [rawJournalEntries]);
  const bawsalaData = useMemo(() => platform.bawsala(), []);
  const decisions = bawsalaData.rawDecisions;

  // ── Build Timeline Events ──
  const events = useMemo<TimelineEvent[]>(() => {
    const all: TimelineEvent[] = [];

    // Pulse logs
    logs.forEach((log) => {
      all.push({
        id: `p_${log.timestamp}`,
        date: log.timestamp,
        type: "pulse",
        title: `طاقة ${log.energy}/10`,
        subtitle: MOOD_LABELS[log.mood],
        emoji: log.energy >= 7 ? "⚡" : log.energy >= 4 ? "🌤️" : "🌧️",
        color: MOOD_COLORS[log.mood],
        energy: log.energy,
        mood: log.mood,
      });
    });

    // Badges
    badges.forEach((badge) => {
      all.push({
        id: `b_${badge.id}`,
        date: badge.earnedAt ?? Date.now(),
        type: "badge",
        title: `وسام: ${badge.name}`,
        subtitle: badge.description ?? "إنجاز جديد",
        emoji: badge.icon,
        color: "#fbbf24",
      });
    });

    // Journal entries
    journalEntries.forEach((entry) => {
      if (!entry.answer || entry.answer.length === 0) return;
      const ts = typeof entry.date === "string" ? new Date(entry.date).getTime() : entry.date;
      all.push({
        id: `j_${entry.id}`,
        date: ts,
        type: "journal",
        title: "تدوينة جديدة",
        subtitle: entry.answer.substring(0, 60) + (entry.answer.length > 60 ? "..." : ""),
        emoji: "📝",
        color: "#f97316",
      });
    });

    // Decisions
    decisions.filter((d) => d.status !== "active").forEach((d) => {
      const chosen = d.options.find((o) => o.id === d.chosenOptionId);
      all.push({
        id: `d_${d.id}`,
        date: d.decidedAt ?? d.createdAt,
        type: "decision",
        title: d.question,
        subtitle: chosen ? `اختار: ${chosen.label}` : "تم القرار",
        emoji: "🧭",
        color: "#06b6d4",
      });
    });

    // Sort by date descending
    return all.sort((a, b) => b.date - a.date);
  }, [logs, badges, journalEntries, decisions]);

  // ── Chapters (grouped by month) ──
  const chapters = useMemo<Chapter[]>(() => {
    const grouped = new Map<string, TimelineEvent[]>();
    events.forEach((e) => {
      const key = monthKey(e.date);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(e);
    });

    const result: Chapter[] = [];
    const sortedKeys = [...grouped.keys()].sort().reverse();

    sortedKeys.forEach((key, idx) => {
      const evts = grouped.get(key)!;
      const pulses = evts.filter((e) => e.type === "pulse" && e.energy !== undefined);
      const energies = pulses.map((e) => e.energy!);
      const avgEnergy = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0;

      // Top mood
      const moodCounts: Partial<Record<PulseMood, number>> = {};
      pulses.forEach((e) => { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
      const topMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as PulseMood | null ?? null;

      // Positivity
      const positiveCount = pulses.filter((e) => e.mood && MOOD_POSITIVITY[e.mood] >= 7).length;
      const positivityRatio = pulses.length > 0 ? Math.round((positiveCount / pulses.length) * 100) : 0;

      // Trend vs previous month
      const prevKey = sortedKeys[idx + 1];
      const prevEvts = prevKey ? grouped.get(prevKey) : null;
      let trend: "up" | "down" | "stable" = "stable";
      if (prevEvts) {
        const prevPulses = prevEvts.filter((e) => e.type === "pulse" && e.energy !== undefined);
        const prevAvg = prevPulses.length > 0 ? prevPulses.map((e) => e.energy!).reduce((a, b) => a + b, 0) / prevPulses.length : 0;
        if (avgEnergy - prevAvg > 0.5) trend = "up";
        else if (prevAvg - avgEnergy > 0.5) trend = "down";
      }

      // Highlights
      const highlights: string[] = [];
      const badgeCount = evts.filter((e) => e.type === "badge").length;
      const journalCount = evts.filter((e) => e.type === "journal").length;
      const decisionCount = evts.filter((e) => e.type === "decision").length;
      if (badgeCount > 0) highlights.push(`🏅 ${badgeCount} وسام`);
      if (journalCount > 0) highlights.push(`📝 ${journalCount} تدوينة`);
      if (decisionCount > 0) highlights.push(`🧭 ${decisionCount} قرار`);
      if (pulses.length > 0) highlights.push(`💓 ${pulses.length} نبضة`);

      result.push({
        month: formatMonthYear(evts[0].date),
        monthKey: key,
        events: evts,
        avgEnergy: Math.round(avgEnergy * 10) / 10,
        topMood,
        positivityRatio,
        trend,
        highlights,
      });
    });

    return result;
  }, [events]);

  // ── Summary Stats ──
  const summary = useMemo(() => {
    const totalPulses = logs.length;
    const totalBadges = badges.length;
    const totalJournals = journalEntries.filter((e) => e.answer.length > 0).length;
    const totalDecisions = decisions.filter((d) => d.status !== "active").length;
    const allEnergies = logs.map((l) => l.energy);
    const avgEnergy = allEnergies.length > 0 ? Math.round((allEnergies.reduce((a, b) => a + b, 0) / allEnergies.length) * 10) / 10 : 0;
    const peakEnergy = allEnergies.length > 0 ? Math.max(...allEnergies) : 0;
    const lowestEnergy = allEnergies.length > 0 ? Math.min(...allEnergies) : 0;
    const daysSinceStart = logs.length > 0 ? Math.ceil((Date.now() - Math.min(...logs.map((l) => l.timestamp))) / 86400000) : 0;

    // Journey phase
    let phase = "البداية 🌱";
    if (totalPulses >= 50 && totalBadges >= 5) phase = "الاستكشاف 🌍";
    if (totalPulses >= 100 && streak >= 7) phase = "البناء 🏗️";
    if (totalPulses >= 200 && totalBadges >= 10) phase = "التمكّن 🌟";

    // Narrative
    const narrativeLines: string[] = [];
    if (daysSinceStart > 0) narrativeLines.push(`بدأت رحلتك من ${daysSinceStart} يوم.`);
    if (totalPulses > 0) narrativeLines.push(`سجّلت ${totalPulses} نبضة بمتوسط طاقة ${avgEnergy}/10.`);
    if (totalBadges > 0) narrativeLines.push(`حصلت على ${totalBadges} وسام في الطريق.`);
    if (streak > 0) narrativeLines.push(`أطول سلسلة التزام: ${streak} يوم متواصل.`);
    if (totalJournals > 0) narrativeLines.push(`وثّقت ${totalJournals} لحظة في يومياتك.`);
    if (totalDecisions > 0) narrativeLines.push(`اتخذت ${totalDecisions} قرار مدروس.`);

    return {
      totalPulses, totalBadges, totalJournals, totalDecisions,
      avgEnergy, peakEnergy, lowestEnergy, daysSinceStart,
      phase, streak, level, xp, narrative: narrativeLines,
    };
  }, [logs, badges, journalEntries, decisions, streak, level, xp]);

  // ── Peaks & Valleys ──
  const peaksAndValleys = useMemo(() => {
    if (logs.length < 3) return { peaks: [] as TimelineEvent[], valleys: [] as TimelineEvent[] };
    const sorted = [...logs].sort((a, b) => b.energy - a.energy);
    const peaks = sorted.slice(0, 3).map((l) => events.find((e) => e.id === `p_${l.timestamp}`)).filter(Boolean) as TimelineEvent[];
    const valleys = sorted.slice(-3).reverse().map((l) => events.find((e) => e.id === `p_${l.timestamp}`)).filter(Boolean) as TimelineEvent[];
    return { peaks, valleys };
  }, [logs, events]);

  const viewTabs: { id: ViewMode; label: string; icon: typeof BookOpen }[] = [
    { id: "timeline", label: "الخط الزمني", icon: Clock },
    { id: "chapters", label: "الفصول", icon: BookOpen },
    { id: "summary", label: "ملخص الرحلة", icon: Sparkles },
  ];

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #0d1225 40%, #080c1a 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.25)" }}
            >
              <BookOpen className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">رواية</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">رحلتك كقصة — من البداية لهنا</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.15)" }}>
            <p className="text-[10px] font-black text-orange-400">{summary.phase}</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {viewTabs.map((tab) => (
            <button key={tab.id} onClick={() => setViewMode(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: viewMode === tab.id ? "rgba(251,146,60,0.12)" : "transparent",
                color: viewMode === tab.id ? "#fb923c" : "rgba(148,163,184,0.4)",
                border: viewMode === tab.id ? "1px solid rgba(251,146,60,0.2)" : "1px solid transparent",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ VIEW: Timeline ═══ */}
      {viewMode === "timeline" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5">
          {events.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-orange-400/15 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">القصة لم تبدأ بعد</p>
              <p className="text-[10px] text-slate-600">سجّل أول نبضة — وابدأ روايتك</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute right-5 top-0 bottom-0 w-px bg-white/5" />

              <div className="space-y-1">
                {events.slice(0, 50).map((event, idx) => {
                  const showDate = idx === 0 || formatDate(events[idx - 1].date) !== formatDate(event.date);
                  return (
                    <motion.div key={event.id} variants={itemVariants} initial="hidden" animate="visible"
                      transition={{ delay: idx * 0.02 }}
                    >
                      {showDate && (
                        <div className="flex items-center gap-2 py-2 pr-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10 relative z-10" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                            {formatDate(event.date)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-3 pr-2 py-1">
                        {/* Dot */}
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 relative z-10"
                          style={{ background: event.color, boxShadow: `0 0 6px ${event.color}40` }}
                        />
                        {/* Content */}
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{event.emoji}</span>
                            <span className="text-[11px] font-bold text-white">{event.title}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 pr-5">{event.subtitle}</p>
                        </div>
                        {/* Energy bar for pulses */}
                        {event.energy !== undefined && (
                          <div className="flex items-center gap-1 shrink-0 mt-1">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                              <div className="h-full rounded-full" style={{ width: `${event.energy * 10}%`, background: event.color }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {events.length > 50 && (
                <p className="text-center text-[10px] text-slate-600 py-4">+ {events.length - 50} حدث آخر</p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ VIEW: Chapters ═══ */}
      {viewMode === "chapters" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {chapters.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-orange-400/15 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">لا توجد فصول بعد</p>
            </div>
          ) : (
            chapters.map((ch) => (
              <motion.div key={ch.monthKey} variants={itemVariants} initial="hidden" animate="visible"
                className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(251,146,60,0.03)", border: "1px solid rgba(251,146,60,0.08)" }}
              >
                <button onClick={() => setExpandedChapter(expandedChapter === ch.monthKey ? null : ch.monthKey)}
                  className="w-full p-4 flex items-center gap-3 text-right"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(251,146,60,0.08)" }}
                  >
                    <Calendar className="w-5 h-5 text-orange-400/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white">{ch.month}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-slate-500">{ch.events.length} حدث</span>
                      {ch.avgEnergy > 0 && <span className="text-[9px] text-slate-500">⚡ {ch.avgEnergy}</span>}
                      <span className="text-[9px] text-slate-500">☀️ {ch.positivityRatio}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ch.trend === "up" && <ArrowUp className="w-3 h-3 text-emerald-400" />}
                    {ch.trend === "down" && <ArrowDown className="w-3 h-3 text-red-400" />}
                    {ch.trend === "stable" && <Minus className="w-3 h-3 text-slate-500" />}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${expandedChapter === ch.monthKey ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedChapter === ch.monthKey && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                        {/* Highlights */}
                        <div className="flex flex-wrap gap-1.5">
                          {ch.highlights.map((h, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg text-[9px] font-bold text-slate-400"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                            >{h}</span>
                          ))}
                        </div>

                        {/* Top mood */}
                        {ch.topMood && (
                          <p className="text-[10px] text-slate-500">
                            المزاج السائد: <span className="font-bold" style={{ color: MOOD_COLORS[ch.topMood] }}>{MOOD_LABELS[ch.topMood]}</span>
                          </p>
                        )}

                        {/* Mini timeline */}
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {ch.events.slice(0, 10).map((e) => (
                            <div key={e.id} className="flex items-center gap-2 text-[10px]">
                              <span>{e.emoji}</span>
                              <span className="text-slate-400 flex-1 truncate">{e.title}</span>
                              <span className="text-slate-600 text-[8px]">{formatDate(e.date)}</span>
                            </div>
                          ))}
                          {ch.events.length > 10 && (
                            <p className="text-[8px] text-slate-600 text-center">+{ch.events.length - 10} أحداث</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* ═══ VIEW: Summary ═══ */}
      {viewMode === "summary" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-5">
          {/* Journey Phase */}
          <div className="p-5 rounded-2xl text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(168,85,247,0.06) 100%)", border: "1px solid rgba(251,146,60,0.12)" }}
          >
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-orange-500/5 blur-3xl" />
            <p className="text-3xl mb-2">{summary.phase.split(" ")[1]}</p>
            <p className="text-lg font-black text-white">{summary.phase.split(" ")[0]}</p>
            <p className="text-[10px] text-slate-500 mt-1">
              {summary.daysSinceStart > 0 ? `${summary.daysSinceStart} يوم في الرحلة` : "الرحلة تبدأ الآن"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "نبضات", value: summary.totalPulses, emoji: "💓", color: "#ef4444" },
              { label: "أوسمة", value: summary.totalBadges, emoji: "🏅", color: "#fbbf24" },
              { label: "تدوينات", value: summary.totalJournals, emoji: "📝", color: "#f97316" },
              { label: "قرارات", value: summary.totalDecisions, emoji: "🧭", color: "#06b6d4" },
              { label: "streak", value: summary.streak, emoji: "🔥", color: "#ef4444" },
              { label: "مستوى", value: summary.level, emoji: "⭐", color: "#a855f7" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl text-center"
                style={{ background: `${s.color}08`, border: `1px solid ${s.color}12` }}
              >
                <p className="text-sm mb-0.5">{s.emoji}</p>
                <p className="text-lg font-black text-white">{s.value}</p>
                <p className="text-[8px] text-slate-500 font-bold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Peaks & Valleys */}
          {(peaksAndValleys.peaks.length > 0 || peaksAndValleys.valleys.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Peaks */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.08)" }}>
                <p className="text-[10px] text-emerald-400/60 font-bold flex items-center gap-1 mb-2">
                  <Mountain className="w-3 h-3" /> أعلى قمم
                </p>
                <div className="space-y-1.5">
                  {peaksAndValleys.peaks.map((p) => (
                    <div key={p.id} className="text-[10px]">
                      <span className="text-white font-bold">⚡ {p.energy}/10</span>
                      <span className="text-slate-500 mr-1">{formatDate(p.date)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valleys */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.08)" }}>
                <p className="text-[10px] text-blue-400/60 font-bold flex items-center gap-1 mb-2">
                  <TrendingDown className="w-3 h-3" /> أدنى وديان
                </p>
                <div className="space-y-1.5">
                  {peaksAndValleys.valleys.map((v) => (
                    <div key={v.id} className="text-[10px]">
                      <span className="text-white font-bold">💧 {v.energy}/10</span>
                      <span className="text-slate-500 mr-1">{formatDate(v.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Narrative */}
          <div className="p-5 rounded-2xl"
            style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.1)" }}
          >
            <p className="text-[10px] text-orange-400/60 font-bold flex items-center gap-1 mb-3">
              <Sparkles className="w-3 h-3" /> رحلتك في كلمات
            </p>
            <div className="space-y-2">
              {summary.narrative.length > 0 ? (
                summary.narrative.map((line, i) => (
                  <p key={i} className="text-xs text-slate-300 leading-relaxed">{line}</p>
                ))
              ) : (
                <p className="text-xs text-slate-500">ابدأ بتسجيل أول نبضة — وراقب القصة وهي تتكوّن 🌱</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(251,146,60,0.03)", border: "1px solid rgba(251,146,60,0.06)" }}
      >
        <BookOpen className="w-5 h-5 text-orange-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          كل نبضة تسجّلها — تصبح سطراً في روايتك.
          <br />
          هذه القصة لا يكتبها أحد غيرك.
        </p>
      </motion.div>
    </div>
  );
};

export default RiwayaScreen;
