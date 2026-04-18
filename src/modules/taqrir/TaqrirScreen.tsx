/**
 * تقرير — Taqrir: التقرير الذكي
 *
 * Aggregates ALL platform data into a visual report card:
 * - Weekly/Monthly summary with trends
 * - Energy & mood heatmap
 * - Relationship health snapshot
 * - Gamification progress
 * - Journal consistency
 * - Coach brief mode
 * - Shareable visual cards
 *
 * Sources: Pulse · Gamification · Dawayir · Predictive · Watheeqa · Mizan · Rifaq
 */

import type { FC } from "react";
import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, TrendingUp, TrendingDown, Minus, Calendar,
  Heart, Flame, Target, Brain, Users, BookOpen, Zap,
  Download, Share2, ChevronDown, BarChart3, Activity,
  Shield, Star, Clock, Copy, Check, Eye, ArrowRight,
  Sparkles, Award, PieChart,
} from "lucide-react";
import { usePulseState, type PulseMood } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useMapState } from "@/modules/map/dawayirIndex";
import { usePredictiveState } from "@/domains/consciousness/store/predictive.store";
import { useDailyJournalState } from "@/domains/journey/store/journal.store";
import { useRifaqState } from "@/modules/rifaq/store/rifaq.store";

/* ═══════════════════════════════════════════ */
/*                 CONSTANTS                  */
/* ═══════════════════════════════════════════ */

const MOOD_LABELS: Record<PulseMood, string> = {
  bright: "مشرق", hopeful: "متفائل", calm: "هادئ",
  anxious: "قلق", tense: "متوتر", sad: "حزين",
  angry: "غاضب", overwhelmed: "مرهق",
};

const MOOD_POSITIVITY: Record<PulseMood, number> = {
  bright: 10, hopeful: 8, calm: 7,
  anxious: 3, tense: 3, sad: 2,
  angry: 1, overwhelmed: 1,
};

const MOOD_COLORS: Record<PulseMood, string> = {
  bright: "#fbbf24", hopeful: "#34d399", calm: "#60a5fa",
  anxious: "#f97316", tense: "#ef4444", sad: "#8b5cf6",
  angry: "#dc2626", overwhelmed: "#64748b",
};

type PeriodId = "week" | "month" | "all";

const PERIODS: { id: PeriodId; label: string; days: number }[] = [
  { id: "week", label: "أسبوع", days: 7 },
  { id: "month", label: "شهر", days: 30 },
  { id: "all", label: "الكل", days: 9999 },
];

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

function trend(current: number, previous: number): "up" | "down" | "stable" {
  const diff = current - previous;
  if (diff > 0.5) return "up";
  if (diff < -0.5) return "down";
  return "stable";
}

function TrendIcon({ t }: { t: "up" | "down" | "stable" }) {
  if (t === "up") return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  if (t === "down") return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const TaqrirScreen: FC = () => {
  const [period, setPeriod] = useState<PeriodId>("week");
  const [copied, setCopied] = useState(false);
  const [coachMode, setCoachMode] = useState(false);

  // ── Data Sources ──
  const rawLogs = usePulseState((s) => s.logs);
  const logs = useMemo(() => rawLogs ?? [], [rawLogs]);
  const { xp, level, streak, badges } = useGamificationState();
  const rawNodes = useMapState((s) => s.nodes);
  const nodes = useMemo(() => rawNodes ?? [], [rawNodes]);
  const { crashProbability } = usePredictiveState();
  const rawJournalEntries = useDailyJournalState((s) => s.entries);
  const journalEntries = useMemo(() => rawJournalEntries ?? [], [rawJournalEntries]);
  const { buddies } = useRifaqState();

  const cutoff = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)?.days ?? 7;
    return Date.now() - days * 86400000;
  }, [period]);

  // ── Pulse Analytics ──
  const pulseData = useMemo(() => {
    const filtered = logs.filter((l) => l.timestamp >= cutoff);
    if (filtered.length === 0) return null;

    const energies = filtered.map((l) => l.energy);
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
    const maxEnergy = Math.max(...energies);
    const minEnergy = Math.min(...energies);

    // Mood distribution
    const moodCounts: Partial<Record<PulseMood, number>> = {};
    filtered.forEach((l) => { moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1; });
    const topMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as PulseMood | undefined;

    // Positivity ratio
    const positiveCount = filtered.filter((l) => MOOD_POSITIVITY[l.mood] >= 7).length;
    const positivityRatio = pct(positiveCount, filtered.length);

    // Trend (compare first half vs second half)
    const mid = Math.floor(filtered.length / 2);
    const firstHalf = filtered.slice(mid);
    const secondHalf = filtered.slice(0, mid);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b.energy, 0) / firstHalf.length : avgEnergy;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b.energy, 0) / secondHalf.length : avgEnergy;

    return {
      count: filtered.length,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      maxEnergy, minEnergy,
      topMood,
      moodCounts,
      positivityRatio,
      energyTrend: trend(secondAvg, firstAvg),
    };
  }, [logs, cutoff]);

  // ── Relationships ──
  const relData = useMemo(() => {
    const active = nodes.filter((n: any) => !n.isNodeArchived);
    const green = active.filter((n: any) => n.ring === "green").length;
    const yellow = active.filter((n: any) => n.ring === "yellow").length;
    const red = active.filter((n: any) => n.ring === "red").length;
    return { total: active.length, green, yellow, red };
  }, [nodes]);

  // ── Journal ──
  const journalData = useMemo(() => {
    const written = journalEntries.filter((e) => e.answer.length > 0);
    const recentWritten = written.filter((e) => {
      const ts = typeof e.date === "string" ? new Date(e.date).getTime() : e.date;
      return ts >= cutoff;
    });
    return { total: written.length, recent: recentWritten.length };
  }, [journalEntries, cutoff]);

  // ── Rifaq ──
  const rifaqData = useMemo(() => {
    const active = buddies.filter((b) => b.status === "active");
    return { total: active.length };
  }, [buddies]);

  // ── Overall Score (simplified from Mizan) ──
  const overallScore = useMemo(() => {
    let score = 0;
    let factors = 0;

    if (pulseData) {
      score += (pulseData.avgEnergy / 10) * 100;
      factors++;
      score += pulseData.positivityRatio;
      factors++;
    }

    if (relData.total > 0) {
      score += pct(relData.green, relData.total);
      factors++;
    }

    if (streak > 0) {
      score += Math.min(100, streak * 5);
      factors++;
    }

    if (crashProbability !== undefined) {
      score += (1 - crashProbability) * 100;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }, [pulseData, relData, streak, crashProbability]);

  // ── Copy Report ──
  const handleCopyReport = useCallback(() => {
    const lines = [
      `📄 تقرير الرحلة — ${period === "week" ? "أسبوعي" : period === "month" ? "شهري" : "كامل"}`,
      `━━━━━━━━━━━━━━━━━━`,
      `📊 النتيجة الكلية: ${overallScore}/100`,
      ``,
      pulseData ? [
        `⚡ الطاقة: ${pulseData.avgEnergy}/10 (${pulseData.count} نبضة)`,
        `🎭 المزاج السائد: ${pulseData.topMood ? MOOD_LABELS[pulseData.topMood] : "—"}`,
        `☀️ نسبة الإيجابية: ${pulseData.positivityRatio}%`,
      ].join("\n") : "⚡ لا توجد بيانات نبض",
      ``,
      `🔥 Streak: ${streak} يوم`,
      `⭐ المستوى: ${level} (${xp} XP)`,
      `🏅 الأوسمة: ${badges.length}`,
      ``,
      `💚 علاقات صحية: ${relData.green}/${relData.total}`,
      `🔴 علاقات سامة: ${relData.red}/${relData.total}`,
      ``,
      `📝 تدوينات: ${journalData.recent} (هذه الفترة)`,
      `🤝 رفاق نشطين: ${rifaqData.total}`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `🧭 من منصة الرحلة — alrehla.com`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [period, overallScore, pulseData, streak, level, xp, badges, relData, journalData, rifaqData]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #0d1225 40%, #0a0a1a 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}
            >
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">تقرير</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">بياناتك في صفحة واحدة</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCoachMode(!coachMode)}
              className="p-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                background: coachMode ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${coachMode ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <Eye className={`w-4 h-4 ${coachMode ? "text-emerald-400" : "text-slate-500"}`} />
            </button>
            <button
              onClick={handleCopyReport}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              style={{
                background: copied ? "rgba(16,185,129,0.12)" : "rgba(6,182,212,0.1)",
                border: `1px solid ${copied ? "rgba(16,185,129,0.25)" : "rgba(6,182,212,0.2)"}`,
                color: copied ? "#10b981" : "#06b6d4",
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "تم" : "انسخ"}
            </button>
          </div>
        </div>

        {/* Coach Mode Banner */}
        <AnimatePresence>
          {coachMode && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <p className="text-[10px] text-emerald-400/80 font-bold">وضع الكوتش — ملخص مختصر للمعالج/الكوتش قبل الجلسة</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Period Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: period === p.id ? "rgba(6,182,212,0.12)" : "transparent",
                color: period === p.id ? "#06b6d4" : "rgba(148,163,184,0.4)",
                border: period === p.id ? "1px solid rgba(6,182,212,0.2)" : "1px solid transparent",
              }}
            >
              <Calendar className="w-3 h-3" />
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ Overall Score Card ═══ */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible"
        className="mx-5 mb-5 p-5 rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(139,92,246,0.06) 100%)",
          border: "1px solid rgba(6,182,212,0.12)",
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="relative flex items-center gap-5">
          {/* Score Ring */}
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none"
                stroke={overallScore >= 70 ? "#10b981" : overallScore >= 40 ? "#fbbf24" : "#ef4444"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 213.6} 213.6`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white">{overallScore}</span>
              <span className="text-[7px] text-slate-500 font-bold">/ 100</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-xs text-slate-500 font-bold mb-1">النتيجة الكلية</p>
            <p className="text-lg font-black text-white">
              {overallScore >= 80 ? "ممتاز — رحلتك واضحة 🌟" :
               overallScore >= 60 ? "جيد — تقدم ملموس 📈" :
               overallScore >= 40 ? "متوسط — فيه مجال للتحسن 🌱" :
               "بداية — كل خطوة تفرق 💪"}
            </p>
            {pulseData?.energyTrend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon t={pulseData.energyTrend} />
                <span className="text-[10px] text-slate-500">
                  {pulseData.energyTrend === "up" ? "اتجاه صاعد" : pulseData.energyTrend === "down" ? "اتجاه هابط" : "مستقر"}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ Metrics Grid ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mx-5 mb-5"
      >
        {/* Energy */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            {pulseData && <TrendIcon t={pulseData.energyTrend} />}
          </div>
          <p className="text-xl font-black text-white">{pulseData?.avgEnergy ?? "—"}</p>
          <p className="text-[9px] text-slate-500 font-bold">متوسط الطاقة /10</p>
          {pulseData && (
            <p className="text-[8px] text-slate-600 mt-1">
              أعلى {pulseData.maxEnergy} · أدنى {pulseData.minEnergy}
            </p>
          )}
        </div>

        {/* Streak */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-4 h-4 text-red-400" />
            <Star className="w-3 h-3 text-amber-400/30" />
          </div>
          <p className="text-xl font-black text-white">{streak}</p>
          <p className="text-[9px] text-slate-500 font-bold">يوم متواصل</p>
          <p className="text-[8px] text-slate-600 mt-1">
            مستوى {level} · {xp} XP
          </p>
        </div>

        {/* Pulses Count */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.1)" }}>
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-black text-white">{pulseData?.count ?? 0}</p>
          <p className="text-[9px] text-slate-500 font-bold">نبضة مسجّلة</p>
          {pulseData && (
            <p className="text-[8px] text-slate-600 mt-1">
              إيجابية {pulseData.positivityRatio}%
            </p>
          )}
        </div>

        {/* Journal */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.1)" }}>
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xl font-black text-white">{journalData.recent}</p>
          <p className="text-[9px] text-slate-500 font-bold">تدوينة هذه الفترة</p>
          <p className="text-[8px] text-slate-600 mt-1">
            الكل: {journalData.total}
          </p>
        </div>
      </motion.div>

      {/* ═══ Mood Distribution ═══ */}
      {pulseData && Object.keys(pulseData.moodCounts).length > 0 && (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }}
          className="mx-5 mb-5 p-4 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
            <PieChart className="w-3 h-3" /> توزيع المزاج
          </p>
          <div className="space-y-2">
            {Object.entries(pulseData.moodCounts)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([mood, count]) => {
                const percentage = pct(count as number, pulseData.count);
                return (
                  <div key={mood} className="flex items-center gap-2">
                    <span className="text-[10px] w-14 text-slate-400 font-bold truncate">{MOOD_LABELS[mood as PulseMood]}</span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: MOOD_COLORS[mood as PulseMood] }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold w-8 text-left">{percentage}%</span>
                  </div>
                );
              })}
          </div>
          {pulseData.topMood && (
            <p className="text-[10px] text-slate-500 mt-3">
              المزاج السائد: <span className="font-black" style={{ color: MOOD_COLORS[pulseData.topMood] }}>{MOOD_LABELS[pulseData.topMood]}</span>
            </p>
          )}
        </motion.div>
      )}

      {/* ═══ Relationships ═══ */}
      {relData.total > 0 && (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}
          className="mx-5 mb-5 p-4 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
            <Heart className="w-3 h-3" /> صحة العلاقات
          </p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-3 rounded-xl text-center" style={{ background: "rgba(16,185,129,0.06)" }}>
              <p className="text-lg font-black text-emerald-400">{relData.green}</p>
              <p className="text-[8px] text-slate-500 font-bold">آمنة 💚</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: "rgba(251,191,36,0.06)" }}>
              <p className="text-lg font-black text-amber-400">{relData.yellow}</p>
              <p className="text-[8px] text-slate-500 font-bold">محايدة 🟡</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.06)" }}>
              <p className="text-lg font-black text-red-400">{relData.red}</p>
              <p className="text-[8px] text-slate-500 font-bold">سامة 🔴</p>
            </div>
          </div>

          {/* Health Bar */}
          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
            {relData.green > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pct(relData.green, relData.total)}%` }} />}
            {relData.yellow > 0 && <div className="h-full bg-amber-400" style={{ width: `${pct(relData.yellow, relData.total)}%` }} />}
            {relData.red > 0 && <div className="h-full bg-red-500" style={{ width: `${pct(relData.red, relData.total)}%` }} />}
          </div>
        </motion.div>
      )}

      {/* ═══ Badges & Social ═══ */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.25 }}
        className="grid grid-cols-2 gap-3 mx-5 mb-5"
      >
        {/* Badges */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}>
          <Award className="w-4 h-4 text-violet-400 mb-2" />
          <p className="text-xl font-black text-white">{badges.length}</p>
          <p className="text-[9px] text-slate-500 font-bold">أوسمة مكتسبة</p>
          {badges.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {badges.slice(-3).map((b) => (
                <span key={b.id} className="text-sm" title={b.name}>{b.icon}</span>
              ))}
            </div>
          )}
        </div>

        {/* Rifaq */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(236,72,153,0.04)", border: "1px solid rgba(236,72,153,0.1)" }}>
          <Users className="w-4 h-4 text-pink-400 mb-2" />
          <p className="text-xl font-black text-white">{rifaqData.total}</p>
          <p className="text-[9px] text-slate-500 font-bold">رفاق نشطين</p>
          <p className="text-[8px] text-slate-600 mt-1">
            {rifaqData.total === 0 ? "ادعُ رفيقك الأول" : "شبكة دعم فعّالة"}
          </p>
        </div>
      </motion.div>

      {/* ═══ Risk Level ═══ */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}
        className="mx-5 mb-5 p-4 rounded-2xl"
        style={{
          background: crashProbability > 0.7 ? "rgba(239,68,68,0.06)" : crashProbability > 0.4 ? "rgba(251,191,36,0.06)" : "rgba(16,185,129,0.06)",
          border: `1px solid ${crashProbability > 0.7 ? "rgba(239,68,68,0.12)" : crashProbability > 0.4 ? "rgba(251,191,36,0.12)" : "rgba(16,185,129,0.12)"}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${crashProbability > 0.7 ? "text-red-400" : crashProbability > 0.4 ? "text-amber-400" : "text-emerald-400"}`} />
            <p className="text-xs font-bold text-white">مستوى الاستقرار</p>
          </div>
          <span className="text-xs font-black" style={{ color: crashProbability > 0.7 ? "#ef4444" : crashProbability > 0.4 ? "#fbbf24" : "#10b981" }}>
            {crashProbability > 0.7 ? "خطر" : crashProbability > 0.4 ? "متوسط" : "مستقر"}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${(1 - crashProbability) * 100}%`,
              background: crashProbability > 0.7 ? "#ef4444" : crashProbability > 0.4 ? "#fbbf24" : "#10b981",
            }}
          />
        </div>
        <p className="text-[9px] text-slate-500 mt-1.5">
          احتمال الانهيار: {Math.round(crashProbability * 100)}%
        </p>
      </motion.div>

      {/* ═══ Coach Summary (when coach mode is on) ═══ */}
      <AnimatePresence>
        {coachMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mx-5 mb-5 overflow-hidden"
          >
            <div className="p-5 rounded-2xl space-y-3"
              style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}
            >
              <p className="text-xs font-black text-emerald-400 flex items-center gap-2">
                <Eye className="w-4 h-4" /> ملخص للكوتش
              </p>
              <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                <p>• <strong>الطاقة:</strong> {pulseData ? `${pulseData.avgEnergy}/10 (${pulseData.energyTrend === "up" ? "صاعد" : pulseData.energyTrend === "down" ? "هابط" : "مستقر"})` : "لم يسجّل بعد"}</p>
                <p>• <strong>المزاج السائد:</strong> {pulseData?.topMood ? MOOD_LABELS[pulseData.topMood] : "—"} ({pulseData?.positivityRatio ?? 0}% إيجابية)</p>
                <p>• <strong>الالتزام:</strong> {streak} يوم متواصل, مستوى {level}</p>
                <p>• <strong>العلاقات:</strong> {relData.green} آمنة, {relData.yellow} محايدة, {relData.red} سامة</p>
                <p>• <strong>الاستقرار:</strong> احتمال انهيار {Math.round(crashProbability * 100)}%</p>
                <p>• <strong>التوثيق:</strong> {journalData.recent} تدوينة هذه الفترة</p>
                <p>• <strong>الدعم الاجتماعي:</strong> {rifaqData.total} رفيق نشط</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mx-5 mt-4 p-4 rounded-2xl text-center"
        style={{ background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.06)" }}
      >
        <FileText className="w-5 h-5 text-cyan-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed">
          التقرير يُحدّث تلقائياً مع كل نبضة جديدة.
          <br />
          انسخه وشاركه مع الكوتش أو احتفظ به لنفسك.
        </p>
      </motion.div>
    </div>
  );
};

export default TaqrirScreen;
