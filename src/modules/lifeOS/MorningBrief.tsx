"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Target, TrendingUp, Flame, Moon, CalendarDays } from "lucide-react";
import { type LifeScore, type MorningPriority, getDomainConfig } from "@/types/lifeDomains";
import { loadStreak } from "@/services/streakSystem";
import { resolveDisplayName } from "@/services/userMemory";
import { useRitualState } from "@/domains/journey/store/ritual.store";
import { useLifeState } from '@/modules/map/dawayirIndex';
import { getTodayRituals, getDailyCompletionStats } from "@/services/ritualsEngine";


interface MorningBriefProps {
  lifeScore: LifeScore | null;
  priorities?: MorningPriority[];
  patternInsight?: string;
}

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  const name = resolveDisplayName();
  const greeting = name ? `يا ${name}` : "";

  if (hour >= 5 && hour < 12) {
    return { text: `صباح الخير ${greeting} ☀️`, icon: <Sparkles className="w-5 h-5 text-amber-400" /> };
  }
  if (hour >= 12 && hour < 17) {
    return { text: `مساء النور ${greeting} 🌤️`, icon: <TrendingUp className="w-5 h-5 text-orange-400" /> };
  }
  if (hour >= 17 && hour < 21) {
    return { text: `مساء الخير ${greeting} 🌅`, icon: <Flame className="w-5 h-5 text-rose-400" /> };
  }
  return { text: `ليلة سعيدة ${greeting} 🌙`, icon: <Moon className="w-5 h-5 text-indigo-400" /> };
}

function getScoreMessage(score: number): string {
  if (score >= 80) return "حياتك في وضع ممتاز! حافظ على الزخم 🚀";
  if (score >= 60) return "الأمور ماشية كويس. فوكس على نقطة ضعفك 💪";
  if (score >= 40) return "في مجالات محتاجة انتباه. خذ خطوة واحدة بس 🎯";
  if (score >= 20) return "الضغط عالي شوية. ركز على اللي تقدر تتحكم فيه 🛡️";
  return "يوم صعب، لكن إنت قدها. خطوة واحدة كفاية النهاردة 🤍";
}

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  problem: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  decision: <Target className="w-3.5 h-3.5 text-amber-400" />,
  goal: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />,
  routine: <Flame className="w-3.5 h-3.5 text-orange-400" />,
  relationship: <Sparkles className="w-3.5 h-3.5 text-pink-400" />
};

export const MorningBrief = memo(function MorningBrief({
  lifeScore,
  priorities = [],
  patternInsight
}: MorningBriefProps) {
  const greeting = useMemo(() => getGreeting(), []);
  const streak = useMemo(() => loadStreak(), []);
  const brief = useLifeState((s) => s.morningBrief);
  const dailyMission = brief?.dailyMission ?? null;
  const scoreMsg = useMemo(() => {
    return lifeScore ? getScoreMessage(lifeScore.overall) : "ابدأ يومك بتقييم سريع 🎯";
  }, [lifeScore]);

  const weakDomainConfig = useMemo(() => {
    if (!lifeScore) return null;
    return getDomainConfig(lifeScore.weakestDomain);
  }, [lifeScore]);

  // ─── Weekly Insight (كل الأحد + أي وقت) ───
  const rituals = useRitualState((s) => s.rituals);
  const logs = useRitualState((s) => s.logs);

  const weeklyInsight = useMemo(() => {
    if (rituals.length === 0) return null;
    const today = new Date();
    const isMonday = today.getDay() === 0; // Sunday in Egypt = start of week

    // حساب إحصائيات آخر 7 أيام
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });

    const activeLogs = logs.filter((l) => last7Days.includes(l.logDate));
    const totalPossible = rituals.filter((r) => r.isActive).length * 7;
    const totalDone = activeLogs.length;
    const pct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    // أكثر عادة متكررة
    const ritualCount: Record<string, number> = {};
    for (const l of activeLogs) {
      ritualCount[l.ritualId] = (ritualCount[l.ritualId] ?? 0) + 1;
    }
    const topId = Object.entries(ritualCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topRitual = topId ? rituals.find((r) => r.id === topId) : null;

    return { pct, totalDone, totalPossible, topRitual, isMonday };
  }, [rituals, logs]);

  return (
    <motion.div
      className="w-full rounded-3xl overflow-hidden relative"
      style={{
        background: "rgba(8, 10, 22, 0.85)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        backdropFilter: "blur(24px)"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Top gradient accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      {/* Content */}
      <div className="p-6 space-y-5" dir="rtl">
        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {greeting.icon}
              <h2 className="text-lg font-black text-white">{greeting.text}</h2>
            </div>
            <p className="text-sm text-white/40 font-medium">{scoreMsg}</p>
          </div>

          {/* Streak badge */}
          {streak.currentStreak > 0 && (
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(249, 115, 22, 0.12)",
                border: "1px solid rgba(249, 115, 22, 0.25)"
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-black text-orange-300 font-mono">{streak.currentStreak}</span>
            </motion.div>
          )}
        </div>

        {/* Daily Mission */}
        {dailyMission && (
          <motion.div
            className="rounded-2xl p-4 overflow-hidden relative border"
            style={{
              background: `${getDomainConfig(dailyMission.domainId).color}08`,
              borderColor: `${getDomainConfig(dailyMission.domainId).color}25`
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
              <Target className="w-16 h-16" />
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">مهمة اليوم المقترحة</span>
              </div>
              <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[9px] font-black text-emerald-400">+{dailyMission.rewardXp} XP</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">
                {getDomainConfig(dailyMission.domainId).icon} {dailyMission.label}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-[90%]">
                {dailyMission.description}
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick stats row */}
        {lifeScore && (
          <div className="grid grid-cols-3 gap-3">
            {/* Weakest domain */}
            {weakDomainConfig && (
              <div
                className="rounded-2xl p-3 flex flex-col gap-1"
                style={{
                  background: `${weakDomainConfig.color}08`,
                  border: `1px solid ${weakDomainConfig.color}20`
                }}
              >
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">يحتاج اهتمام</span>
                <div className="flex items-center gap-1.5">
                  <span>{weakDomainConfig.icon}</span>
                  <span className="text-xs font-black" style={{ color: weakDomainConfig.color }}>
                    {weakDomainConfig.label}
                  </span>
                </div>
                <span className="text-lg font-black font-mono" style={{ color: weakDomainConfig.color }}>
                  {lifeScore.domains[lifeScore.weakestDomain]}%
                </span>
              </div>
            )}

            {/* Active problems */}
            <div
              className="rounded-2xl p-3 flex flex-col gap-1"
              style={{
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.15)"
              }}
            >
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">مشاكل مفتوحة</span>
              <span className="text-lg font-black font-mono text-red-400">{lifeScore.activeProblems}</span>
            </div>

            {/* Pending decisions */}
            <div
              className="rounded-2xl p-3 flex flex-col gap-1"
              style={{
                background: "rgba(245, 158, 11, 0.06)",
                border: "1px solid rgba(245, 158, 11, 0.15)"
              }}
            >
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">قرارات معلقة</span>
              <span className="text-lg font-black font-mono text-amber-400">{lifeScore.pendingDecisions}</span>
            </div>
          </div>
        )}

        {/* Today's priorities */}
        {priorities.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">أولويات النهاردة</h3>
            <div className="space-y-1.5">
              {priorities.slice(0, 3).map((priority, i) => {
                const domainConfig = getDomainConfig(priority.domainId);
                return (
                  <motion.div
                    key={priority.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.05)"
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: `${domainConfig.color}15`,
                        border: `1px solid ${domainConfig.color}25`
                      }}
                    >
                      {PRIORITY_ICONS[priority.type] ?? <Target className="w-3.5 h-3.5 text-white/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white/80 truncate">{priority.label}</p>
                      <p className="text-[10px] text-white/25 font-medium truncate">{priority.reason}</p>
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: domainConfig.color }}>{domainConfig.icon}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Insight — ملخص أسبوعي */}
        {weeklyInsight && weeklyInsight.totalPossible > 0 && (
          <motion.div
            className="rounded-2xl p-4 space-y-2"
            style={{
              background: "rgba(6,182,212,0.05)",
              border: "1px solid rgba(6,182,212,0.15)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">
                  {weeklyInsight.isMonday ? "ملخص الأسبوع الماضي" : "آخر 7 أيام"}
                </span>
              </div>
              <span
                className="text-sm font-black font-mono"
                style={{
                  color: weeklyInsight.pct >= 70 ? "#10b981"
                       : weeklyInsight.pct >= 40 ? "#f59e0b"
                       : "#f87171"
                }}
              >
                {weeklyInsight.pct}%
              </span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: weeklyInsight.pct >= 70 ? "#10b981"
                             : weeklyInsight.pct >= 40 ? "#f59e0b"
                             : "#f87171"
                }}
                initial={{ width: 0 }}
                animate={{ width: `${weeklyInsight.pct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
              />
            </div>
            {weeklyInsight.topRitual && (
              <p className="text-[10px] text-white/30">
                أكثر عادة: <span className="text-white/60 font-bold">
                  {weeklyInsight.topRitual.icon} {weeklyInsight.topRitual.name}
                </span>
              </p>
            )}
          </motion.div>
        )}

        {/* Pattern insight */}
        {patternInsight && (
          <motion.div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: "rgba(139, 92, 246, 0.06)",
              border: "1px solid rgba(139, 92, 246, 0.15)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider">نمط مكتشف</span>
              <p className="text-xs text-white/60 font-medium leading-relaxed">{patternInsight}</p>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
});
