/**
 * ميزان — Mizan: قياس التقدم الحقيقي
 *
 * Dashboard يقيس تقدم المستخدم عبر الزمن من خلال:
 * - Gamification (XP, Level, Rank, Streak, Badges)
 * - Pulse (energy/mood trajectory)
 * - Dawayir Map (relationship health distribution)
 * - Consciousness History (awareness growth)
 * - Journal (writing consistency)
 * - Predictive (stability score)
 */

import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Scale, TrendingUp, TrendingDown, Flame, Star, Zap,
  Heart, Shield, BookOpen, Brain, Award, Target,
  BarChart3, Zap as Sparkles, ChevronUp, Activity, Clock,
  Crown, Medal, ArrowUpRight, Minus
} from "lucide-react";
import { useGamificationState, type Badge, type Rank } from "@/domains/gamification/store/gamification.store";
import { usePulseState, type PulseEntry, type PulseMood } from "@/domains/consciousness/store/pulse.store";
import { useConsciousnessHistory } from "@/domains/consciousness/store/history.store";
import { usePredictiveState } from "@/domains/consciousness/store/predictive.store";
import { useMapState } from "@/modules/map/dawayirIndex";
import { useDailyJournalState } from "@/domains/journey/store/journal.store";
import { trackEvent, AnalyticsEvents } from "@/services/analytics";
import { useEffect } from "react";

/* ═══════════════════════════════════════════ */
/*                 HELPERS                    */
/* ═══════════════════════════════════════════ */

const RANK_COLORS: Record<string, string> = {
  "مستطلع جَدِيد": "#94a3b8",
  "كشاف ميداني": "#60a5fa",
  "ملازم تعافي": "#34d399",
  "نقيب حدود": "#fbbf24",
  "رائد استقرار": "#f97316",
  "عقيد حكمة": "#a855f7",
  "عميد سلام": "#ec4899",
  "مارشال الرحلة": "#ef4444",
};

const MOOD_WEIGHTS: Record<PulseMood, number> = {
  bright: 10, hopeful: 8, calm: 7,
  anxious: 3, tense: 3, sad: 2,
  angry: 1, overwhelmed: 1,
};

function computeOverallScore(data: {
  avgEnergy: number;
  moodScore: number;
  greenRatio: number;
  streakDays: number;
  crashProb: number;
  journalConsistency: number;
  level: number;
}): number {
  // Weighted score 0-100
  const energy = (data.avgEnergy / 10) * 20;
  const mood = (data.moodScore / 10) * 15;
  const relationships = data.greenRatio * 20;
  const consistency = Math.min(data.streakDays / 30, 1) * 15;
  const stability = (1 - data.crashProb) * 15;
  const journal = data.journalConsistency * 10;
  const growth = Math.min(data.level / 15, 1) * 5;
  return Math.round(Math.min(100, energy + mood + relationships + consistency + journal + stability + growth));
}

function getScoreLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 80) return { label: "ممتاز", color: "#10b981", emoji: "🌟" };
  if (score >= 60) return { label: "جيد جداً", color: "#34d399", emoji: "✨" };
  if (score >= 40) return { label: "في تقدم", color: "#fbbf24", emoji: "🌱" };
  if (score >= 20) return { label: "بداية", color: "#f97316", emoji: "🔥" };
  return { label: "لسه بادئ", color: "#94a3b8", emoji: "🚀" };
}

function formatNumber(n: number): string {
  return n.toLocaleString("ar-EG");
}

/* ═══════════════════════════════════════════ */
/*                 SPARKLINE                  */
/* ═══════════════════════════════════════════ */

function MiniSparkLine({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return <div style={{ height }} className="flex items-center justify-center text-slate-700 text-[10px]">لا توجد بيانات كافية</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,${height} ${points} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`mg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#mg-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════ */
/*              PROGRESS RING                 */
/* ═══════════════════════════════════════════ */

function ProgressRing({ score, color, size = 160 }: { score: number; color: string; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.04)" strokeWidth={10} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          strokeDasharray={circ}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-4xl font-black"
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">من 100</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const MizanScreen: FC = () => {
  // ── Data Sources ──
  const { xp, level, rank, badges, streak, getLevelProgress } = useGamificationState();
  const pulseLogs = usePulseState((s) => s.logs);
  const consciousness = useConsciousnessHistory((s) => s.history);
  const predictive = usePredictiveState();
  const nodes = useMapState((s) => s.nodes);
  const journalEntries = useDailyJournalState((s) => s.entries);

  const levelProgress = useMemo(() => getLevelProgress(), [getLevelProgress]);
  const rankColor = RANK_COLORS[rank] ?? "#94a3b8";

  // ── Pulse Analytics ──
  const pulseAnalytics = useMemo(() => {
    const logs = pulseLogs ?? [];
    const recent = logs.slice(0, 30);
    const energies = recent.map((p) => p.energy);
    const avgEnergy = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0;

    // Mood score (weighted avg)
    const moodScores = recent.map((p) => MOOD_WEIGHTS[p.mood] ?? 5);
    const avgMoodScore = moodScores.length > 0 ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length : 5;

    // Energy trend
    const firstHalf = energies.slice(Math.floor(energies.length / 2));
    const secondHalf = energies.slice(0, Math.floor(energies.length / 2));
    const f = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const s = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const trend = s - f;

    return { avgEnergy, avgMoodScore, trend, energies: energies.slice().reverse(), total: logs.length };
  }, [pulseLogs]);

  // ── Relationship Analytics ──
  const relationshipData = useMemo(() => {
    const active = (nodes ?? []).filter((n: any) => !n.isNodeArchived);
    const green = active.filter((n: any) => n.ring === "green").length;
    const yellow = active.filter((n: any) => n.ring === "yellow").length;
    const red = active.filter((n: any) => n.ring === "red").length;
    const total = active.length;
    const greenRatio = total > 0 ? green / total : 0;
    return { total, green, yellow, red, greenRatio };
  }, [nodes]);

  // ── Journal Consistency ──
  const journalData = useMemo(() => {
    const safe = Array.isArray(journalEntries) ? journalEntries : [];
    const total = safe.filter((e) => e.answer.length > 0).length;
    const datesSet = new Set(safe.map((e) => e.date));
    // last 30 days consistency
    let activeDays = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (datesSet.has(ds)) activeDays++;
    }
    const consistency = activeDays / 30;
    const totalWords = safe.reduce((s, e) => s + e.answer.split(/\s+/).length, 0);
    return { total, activeDays, consistency, totalWords };
  }, [journalEntries]);

  // ── Overall Score ──
  const overallScore = useMemo(() => computeOverallScore({
    avgEnergy: pulseAnalytics.avgEnergy,
    moodScore: pulseAnalytics.avgMoodScore,
    greenRatio: relationshipData.greenRatio,
    streakDays: streak,
    crashProb: predictive.crashProbability,
    journalConsistency: journalData.consistency,
    level,
  }), [pulseAnalytics, relationshipData, streak, predictive, journalData, level]);

  const scoreInfo = getScoreLabel(overallScore);

  // ── Milestones ──
  const milestones = useMemo(() => {
    const m: { icon: FC<any>; label: string; value: string; color: string; achieved: boolean }[] = [
      { icon: Zap, label: "أول نبضة", value: "سجّل Pulse", color: "#60a5fa", achieved: pulseAnalytics.total > 0 },
      { icon: BookOpen, label: "أول تدوينة", value: "اكتب في وثيقة", color: "#fb923c", achieved: journalData.total > 0 },
      { icon: Heart, label: "أول علاقة", value: "أضف في الخريطة", color: "#ec4899", achieved: relationshipData.total > 0 },
      { icon: Flame, label: "أسبوع متواصل", value: "7 أيام streak", color: "#ef4444", achieved: streak >= 7 },
      { icon: Star, label: "10 نبضات", value: "سجّل 10 Pulses", color: "#fbbf24", achieved: pulseAnalytics.total >= 10 },
      { icon: Shield, label: "3 حدود", value: "حدد 3 حدود", color: "#10b981", achieved: relationshipData.green >= 3 },
      { icon: Brain, label: "وعي عميق", value: "10 نقاط وعي", color: "#8b5cf6", achieved: consciousness.length >= 10 },
      { icon: Crown, label: "الأجنحة 5", value: "نمو الأجنحة 5", color: "#f59e0b", achieved: level >= 5 },
    ];
    return m;
  }, [pulseAnalytics.total, journalData.total, relationshipData, streak, consciousness, level]);

  const achievedCount = milestones.filter((m) => m.achieved).length;

  useEffect(() => {
    trackEvent(AnalyticsEvents.MIZAN_VIEW, {
      overall_score: overallScore,
      level,
      streak,
      rank,
      achieved_milestones: achievedCount,
      total_milestones: milestones.length,
      pulse_total: pulseAnalytics.total,
      journal_total: journalData.total,
      relationships_total: relationshipData.total
    });
  }, [overallScore, level, streak, rank, achievedCount, milestones.length, pulseAnalytics.total, journalData.total, relationshipData.total]);

  // ── Dimension Scores ──
  const dimensions = useMemo(() => [
    { id: "energy", label: "الطاقة", score: Math.round((pulseAnalytics.avgEnergy / 10) * 100), color: "#60a5fa", icon: Zap },
    { id: "mood", label: "المزاج", score: Math.round((pulseAnalytics.avgMoodScore / 10) * 100), color: "#a855f7", icon: Heart },
    { id: "relationships", label: "العلاقات", score: Math.round(relationshipData.greenRatio * 100), color: "#10b981", icon: Shield },
    { id: "consistency", label: "الاستمرارية", score: Math.round(Math.min(streak / 30, 1) * 100), color: "#f97316", icon: Flame },
    { id: "stability", label: "الاستقرار", score: Math.round((1 - predictive.crashProbability) * 100), color: "#34d399", icon: Target },
    { id: "journaling", label: "التوثيق", score: Math.round(journalData.consistency * 100), color: "#fb923c", icon: BookOpen },
  ], [pulseAnalytics, relationshipData, streak, predictive, journalData]);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #0d1117 40%, #0a0a1a 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <Scale className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">ميزان</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">أنت فين من بداية رحلتك؟</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            style={{ background: `${rankColor}15`, border: `1px solid ${rankColor}30`, color: rankColor }}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{rank}</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ Overall Score Ring ═══ */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="flex flex-col items-center py-6"
      >
        <ProgressRing score={overallScore} color={scoreInfo.color} />
        <div className="flex items-center gap-2 mt-4">
          <span className="text-2xl">{scoreInfo.emoji}</span>
          <span className="text-lg font-black" style={{ color: scoreInfo.color }}>{scoreInfo.label}</span>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">النتيجة الكلية لرحلتك</p>
      </motion.div>

      <div className="px-5 space-y-5">

        {/* ═══ 6-Dimension Radar ═══ */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="p-5 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-3 h-3" /> أبعاد التقدم
          </p>
          <div className="space-y-3">
            {dimensions.map((dim) => (
              <div key={dim.id} className="flex items-center gap-3">
                <dim.icon className="w-4 h-4 shrink-0" style={{ color: dim.color }} />
                <span className="text-xs font-bold text-white/60 w-20 shrink-0">{dim.label}</span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dim.score}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${dim.color}80, ${dim.color})` }}
                  />
                </div>
                <span className="text-xs font-black w-8 text-left" style={{ color: dim.color }}>{dim.score}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══ Key Metrics Grid ═══ */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {/* XP & Level */}
          <div className="p-4 rounded-2xl" style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.12)" }}>
            <Award className="w-4 h-4 text-purple-400 mb-2" />
            <p className="text-2xl font-black text-white">{formatNumber(xp)}</p>
            <p className="text-[9px] font-bold text-purple-400/60 uppercase tracking-widest mt-0.5">إجمالي النقاط</p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(168,85,247,0.1)" }}>
              <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.round(levelProgress.progress * 100)}%` }} />
            </div>
            <p className="text-[9px] text-slate-600 mt-1">الأجنحة {level} ← {level + 1}</p>
          </div>

          {/* Streak */}
          <div className="p-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <Flame className="w-4 h-4 text-red-400 mb-2" />
            <p className="text-2xl font-black text-white">{streak}</p>
            <p className="text-[9px] font-bold text-red-400/60 uppercase tracking-widest mt-0.5">يوم متواصل</p>
            <div className="mt-2 flex gap-0.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < Math.min(streak, 7) ? "#ef4444" : "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
            <p className="text-[9px] text-slate-600 mt-1">{streak >= 7 ? "أسبوع كامل! 🎉" : `${7 - streak} يوم للأسبوع`}</p>
          </div>

          {/* Pulse Count */}
          <div className="p-4 rounded-2xl" style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.12)" }}>
            <Activity className="w-4 h-4 text-blue-400 mb-2" />
            <p className="text-2xl font-black text-white">{formatNumber(pulseAnalytics.total)}</p>
            <p className="text-[9px] font-bold text-blue-400/60 uppercase tracking-widest mt-0.5">نبضة مسجّلة</p>
            <div className="mt-2 flex items-center gap-1">
              {pulseAnalytics.trend > 0.5 ? (
                <><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-[9px] text-emerald-400">صاعد</span></>
              ) : pulseAnalytics.trend < -0.5 ? (
                <><TrendingDown className="w-3 h-3 text-rose-400" /><span className="text-[9px] text-rose-400">هابط</span></>
              ) : (
                <><Minus className="w-3 h-3 text-slate-500" /><span className="text-[9px] text-slate-500">مستقر</span></>
              )}
            </div>
          </div>

          {/* Journal Entries */}
          <div className="p-4 rounded-2xl" style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.12)" }}>
            <BookOpen className="w-4 h-4 text-orange-400 mb-2" />
            <p className="text-2xl font-black text-white">{formatNumber(journalData.total)}</p>
            <p className="text-[9px] font-bold text-orange-400/60 uppercase tracking-widest mt-0.5">تدوينة</p>
            <p className="text-[9px] text-slate-600 mt-2">{formatNumber(journalData.totalWords)} كلمة</p>
          </div>
        </motion.div>

        {/* ═══ Energy Timeline ═══ */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="p-5 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3" /> مسار الطاقة عبر الزمن
          </p>
          <MiniSparkLine data={pulseAnalytics.energies} color="#60a5fa" height={60} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-slate-600">الأقدم</span>
            <span className="text-xs font-black text-blue-400">المتوسط: {pulseAnalytics.avgEnergy.toFixed(1)}/10</span>
            <span className="text-[9px] text-slate-600">الأحدث</span>
          </div>
        </motion.div>

        {/* ═══ Relationship Health ═══ */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
          className="p-5 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Heart className="w-3 h-3" /> صحة العلاقات
          </p>
          {relationshipData.total === 0 ? (
            <p className="text-xs text-slate-700 text-center py-4">أضف علاقات في خريطة الرحلة أولاً</p>
          ) : (
            <>
              {/* Ring distribution bar */}
              <div className="h-4 rounded-full overflow-hidden flex mb-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                {relationshipData.green > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(relationshipData.green / relationshipData.total) * 100}%` }}
                    transition={{ duration: 0.6 }} className="h-full" style={{ background: "#10b981" }} />
                )}
                {relationshipData.yellow > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(relationshipData.yellow / relationshipData.total) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }} className="h-full" style={{ background: "#fbbf24" }} />
                )}
                {relationshipData.red > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(relationshipData.red / relationshipData.total) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }} className="h-full" style={{ background: "#ef4444" }} />
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <p className="text-lg font-black text-emerald-400">{relationshipData.green}</p>
                  <p className="text-[9px] text-slate-500 font-bold">آمنة 🟢</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <p className="text-lg font-black text-amber-400">{relationshipData.yellow}</p>
                  <p className="text-[9px] text-slate-500 font-bold">متذبذبة 🟡</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <p className="text-lg font-black text-rose-400">{relationshipData.red}</p>
                  <p className="text-[9px] text-slate-500 font-bold">سامة 🔴</p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* ═══ Milestones ═══ */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="p-5 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <Medal className="w-3 h-3" /> محطات الرحلة
            </p>
            <span className="text-xs font-black text-emerald-400">{achievedCount}/{milestones.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {milestones.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-2.5 p-3 rounded-xl transition-all"
                style={{
                  background: m.achieved ? `${m.color}08` : "rgba(255,255,255,0.015)",
                  border: `1px solid ${m.achieved ? `${m.color}20` : "rgba(255,255,255,0.03)"}`,
                  opacity: m.achieved ? 1 : 0.5,
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: m.achieved ? `${m.color}15` : "rgba(255,255,255,0.03)" }}
                >
                  <m.icon className="w-4 h-4" style={{ color: m.achieved ? m.color : "rgba(148,163,184,0.3)" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold truncate" style={{ color: m.achieved ? "rgba(255,255,255,0.85)" : "rgba(148,163,184,0.4)" }}>
                    {m.label}
                  </p>
                  <p className="text-[9px] font-medium truncate" style={{ color: m.achieved ? `${m.color}80` : "rgba(148,163,184,0.25)" }}>
                    {m.achieved ? "✓ محقّق" : m.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ Badges ═══ */}
        {badges.length > 0 && (
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
            className="p-5 rounded-3xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Award className="w-3 h-3" /> الأوسمة ({badges.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {badges.slice(0, 12).map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)" }}
                >
                  <span className="text-base">{badge.icon}</span>
                  <span className="text-[11px] font-bold text-white/70">{badge.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ Journey Summary ═══ */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
          className="p-5 rounded-3xl relative overflow-hidden"
          style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.1)" }}
        >
          <div className="absolute -bottom-6 -left-6 opacity-5"><Sparkles className="w-28 h-28 text-emerald-400" /></div>
          <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest mb-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> ملخص رحلتك
          </p>
          <p className="text-sm text-white/70 leading-relaxed font-medium relative z-10">
            {overallScore >= 70
              ? `رحلتك مبهرة — ${formatNumber(xp)} نقطة خبرة، ${streak} يوم متواصل، و${journalData.total} تدوينة. أنت في مرحلة الأجنحة ${level} (${rank}). الأرقام بتقول إنك جاد في التغيير.`
              : overallScore >= 40
              ? `أنت في الطريق الصح — أجنحتك في المرحلة ${level} مع ${formatNumber(xp)} نقطة. كل يوم بتقرّب أكتر. استمر في التوثيق والنبض.`
              : overallScore >= 10
              ? `بدأت رحلتك — وده أهم خطوة. سجّل نبضك يومياً، اكتب في وثيقة، وشوف الميزان بيتحرك.`
              : `لسه ما بدأتش — اكتب أول تدوينة، سجّل أول نبضة، أضف أول علاقة. الميزان مستنيك.`
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MizanScreen;
