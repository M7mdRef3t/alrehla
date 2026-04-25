"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Snowflake, Crown, Trophy, TrendingUp, Shield, Zap } from "lucide-react";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";

// ─── Types ─────────────────────────────────────────────────────────────

interface FrostEntry {
  rank: number;
  name: string;
  frostPoints: number;
  totalFreezes: number;
  badge: string;
  isCurrentUser?: boolean;
}

// ─── Local Leaderboard Data ─────────────────────────────────────────────
// Local-first: الشبكة الاجتماعية ستُبنى لاحقاً مع Supabase Real-time

function generateLeaderboard(userFP: number, userFreezes: number): FrostEntry[] {
  const competitors: Omit<FrostEntry, "rank">[] = [
    { name: "سيف الرحلة", frostPoints: 2400, totalFreezes: 28, badge: "🏔️" },
    { name: "نور القيادة", frostPoints: 1980, totalFreezes: 22, badge: "⭐" },
    { name: "عمر الصقيع", frostPoints: 1750, totalFreezes: 19, badge: "❄️" },
    { name: "رنا الحدود", frostPoints: 1400, totalFreezes: 15, badge: "🛡️" },
    { name: "أنت", frostPoints: Math.max(userFP, 0), totalFreezes: Math.max(userFreezes, 0), badge: "👤", isCurrentUser: true },
    { name: "خالد الوعي", frostPoints: 1100, totalFreezes: 12, badge: "🌊" },
    { name: "مريم القرار", frostPoints: 890, totalFreezes: 10, badge: "💎" },
    { name: "ياسر الصمت", frostPoints: 650, totalFreezes: 7, badge: "🌙" },
  ];

  return competitors
    .sort((a, b) => b.frostPoints - a.frostPoints)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ─── Rank Badge ─────────────────────────────────────────────────────────

function getRankStyle(rank: number) {
  if (rank === 1) return { icon: <Crown className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" };
  if (rank === 2) return { icon: <Trophy className="w-4 h-4" />, color: "text-slate-300", bg: "bg-slate-400/10 border-slate-400/20" };
  if (rank === 3) return { icon: <Trophy className="w-4 h-4" />, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" };
  return { icon: <span className="text-xs font-black">#{rank}</span>, color: "text-white/30", bg: "bg-white/[0.02] border-white/5" };
}

// ─── FrostBoard Component ───────────────────────────────────────────────

export function FrostBoard() {
  const frostPoints = useGamificationState((s) => s.frostPoints);
  const freezeStats = useGamificationState((s) => s.freezeStats);

  const leaderboard = useMemo(
    () => generateLeaderboard(frostPoints, freezeStats.totalFreezes),
    [frostPoints, freezeStats.totalFreezes]
  );

  const currentUser = leaderboard.find((e) => e.isCurrentUser);

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl bg-cyan-500/[0.06] border border-cyan-500/20 p-4 text-center">
          <div className="text-2xl font-black text-cyan-300 mb-1">{frostPoints}</div>
          <div className="text-[10px] font-bold text-cyan-400/50 uppercase tracking-widest">نقاط الصقيع ❄️</div>
        </div>
        <div className="rounded-2xl bg-blue-500/[0.06] border border-blue-500/15 p-4 text-center">
          <div className="text-2xl font-black text-blue-300 mb-1">{freezeStats.totalFreezes}</div>
          <div className="text-[10px] font-bold text-blue-400/50 uppercase tracking-widest">تجميد فعّال 🧊</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 text-center">
          <div className="text-2xl font-black text-white mb-1">#{currentUser?.rank ?? "—"}</div>
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">مركزك الآن</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {leaderboard.map((entry, i) => {
          const rankStyle = getRankStyle(entry.rank);
          const isUser = entry.isCurrentUser;

          return (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: isUser ? -8 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all
                ${isUser
                  ? "bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                }
              `}
            >
              {/* Rank */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-xl border text-xs ${rankStyle.bg} ${rankStyle.color}`}>
                {rankStyle.icon}
              </div>

              {/* Badge + Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg">{entry.badge}</span>
                <div className="min-w-0">
                  <div className={`text-sm font-black truncate ${isUser ? "text-cyan-300" : "text-white/80"}`}>
                    {entry.name}
                    {isUser && <span className="text-[10px] text-cyan-400/60 mr-2">(أنت)</span>}
                  </div>
                  <div className="text-[10px] text-white/25 font-medium">
                    {entry.totalFreezes} تجميد
                  </div>
                </div>
              </div>

              {/* Frost Points */}
              <div className="flex items-center gap-1.5">
                <Snowflake className={`w-3.5 h-3.5 ${isUser ? "text-cyan-400" : "text-white/30"}`} />
                <span className={`text-sm font-black tabular-nums ${isUser ? "text-cyan-300" : "text-white/60"}`}>
                  {entry.frostPoints.toLocaleString("ar-SA")}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Season Info */}
      <div className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-800/20 p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black text-white/70">موسم الصقيع الأول</div>
          <div className="text-[10px] text-white/30">ينتهي في 30 مايو 2026 · أعلى نقاط صقيع يفوز</div>
        </div>
        <div className="text-xs font-black text-cyan-400">الموسم 1</div>
      </div>
    </div>
  );
}
