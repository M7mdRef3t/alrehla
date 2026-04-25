"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Eye, Clock, CheckCircle2, Lock, Flame } from "lucide-react";
import { useGamification } from "@/domains/gamification";

// ─── Types ─────────────────────────────────────────────────────────────

type ChallengeCategory = "daily" | "weekly" | "sovereign";
type ChallengeDifficulty = "easy" | "medium" | "hard" | "legendary";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  frostPointsReward: number;
  xpReward: number;
  actionKey: string;
  completionCondition: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  expiresIn?: string; // "22 ساعة" etc
}

// ─── Challenge Definitions ──────────────────────────────────────────────

const DAILY_CHALLENGES: Challenge[] = [
  {
    id: "ch_daily_freeze_one",
    title: "الصقيع الأول",
    description: "جمّد علاقة واحدة مستنزفة اليوم",
    icon: "❄️",
    category: "daily",
    difficulty: "easy",
    frostPointsReward: 75,
    xpReward: 40,
    actionKey: "freeze_today",
    completionCondition: "freeze_count_today >= 1",
    expiresIn: "تجدد كل يوم",
  },
  {
    id: "ch_daily_review_frozen",
    title: "مراجعة المجمّدين",
    description: "راجع قائمة العلاقات المجمدة وقرر: هل حان الذوبان الواعي؟",
    icon: "🔍",
    category: "daily",
    difficulty: "easy",
    frostPointsReward: 50,
    xpReward: 25,
    actionKey: "frost_review",
    completionCondition: "frost_review_completed",
    expiresIn: "تجدد كل يوم",
  },
  {
    id: "ch_daily_boundary",
    title: "حارس اليوم",
    description: "ضع حدًا واضحًا مع شخص في المدار الأحمر أو الأصفر",
    icon: "🛡️",
    category: "daily",
    difficulty: "medium",
    frostPointsReward: 100,
    xpReward: 50,
    actionKey: "boundary_set",
    completionCondition: "boundary_set_today >= 1",
    expiresIn: "تجدد كل يوم",
  },
];

const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: "ch_weekly_triple_freeze",
    title: "العاصفة الأسبوعية",
    description: "جمّد 3 علاقات مستنزفة خلال هذا الأسبوع (كومبو × 2)",
    icon: "🌨️",
    category: "weekly",
    difficulty: "medium",
    frostPointsReward: 300,
    xpReward: 150,
    actionKey: "weekly_freeze_combo",
    completionCondition: "weekly_freezes >= 3",
    expiresIn: "7 أيام",
  },
  {
    id: "ch_weekly_pattern_hunter",
    title: "صائد الأنماط",
    description: "اكتشف 5 أنماط علائقية متكررة هذا الأسبوع",
    icon: "👁️",
    category: "weekly",
    difficulty: "hard",
    frostPointsReward: 400,
    xpReward: 200,
    actionKey: "weekly_patterns",
    completionCondition: "weekly_patterns_detected >= 5",
    expiresIn: "7 أيام",
  },
  {
    id: "ch_weekly_ring_upgrade",
    title: "إعادة الترتيب القيادي",
    description: "حرّك 2 شخص من مدار أحمر لمدار أفضل",
    icon: "🌈",
    category: "weekly",
    difficulty: "medium",
    frostPointsReward: 250,
    xpReward: 120,
    actionKey: "weekly_ring_upgrade",
    completionCondition: "ring_upgrades_this_week >= 2",
    expiresIn: "7 أيام",
  },
];

const SOVEREIGN_CHALLENGES: Challenge[] = [
  {
    id: "ch_sovereign_absolute_zero",
    title: "الصفر المطلق",
    description: "جمّد 5 علاقات مستنزفة خلال موسم واحد",
    icon: "🧊",
    category: "sovereign",
    difficulty: "hard",
    frostPointsReward: 1000,
    xpReward: 500,
    actionKey: "sovereign_5_freezes",
    completionCondition: "total_freezes >= 5",
    isLocked: false,
  },
  {
    id: "ch_sovereign_fortress",
    title: "بنّاء القلعة",
    description: "ضع 25 حد قيادي عبر موسمك الأول",
    icon: "🏰",
    category: "sovereign",
    difficulty: "legendary",
    frostPointsReward: 2500,
    xpReward: 1000,
    actionKey: "sovereign_fortress",
    completionCondition: "total_boundaries >= 25",
    isLocked: false,
  },
  {
    id: "ch_sovereign_energy_shield",
    title: "درع الطاقة الأسطوري",
    description: "حافظ على streak 30 يوم مع 10 تجميدات فعّالة",
    icon: "💠",
    category: "sovereign",
    difficulty: "legendary",
    frostPointsReward: 5000,
    xpReward: 2000,
    actionKey: "sovereign_energy_shield",
    completionCondition: "streak >= 30 && total_freezes >= 10",
    isLocked: true,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<ChallengeDifficulty, { label: string; color: string; bg: string }> = {
  easy:      { label: "سهل",    color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  medium:    { label: "متوسط", color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20" },
  hard:      { label: "صعب",   color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20" },
  legendary: { label: "أسطوري", color: "text-purple-400",  bg: "bg-purple-400/10 border-purple-400/30" },
};

// ─── Challenge Card ──────────────────────────────────────────────────────

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { addFrostPoints, addXP } = useGamification();
  const [localCompleted, setLocalCompleted] = useState(false);

  const diff = DIFFICULTY_CONFIG[challenge.difficulty];
  const isCompleted = challenge.isCompleted || localCompleted;
  const isLocked = challenge.isLocked;

  const handleClaim = () => {
    if (isCompleted || isLocked) return;
    setLocalCompleted(true);
    addFrostPoints(challenge.frostPointsReward, `تحدي: ${challenge.title}`);
    addXP(challenge.xpReward, `تحدي: ${challenge.title}`);
  };

  return (
    <motion.div
      layout
      className={`
        relative rounded-2xl border p-4 transition-all
        ${isCompleted ? "bg-white/[0.015] border-white/5 opacity-60" : ""}
        ${isLocked ? "bg-white/[0.01] border-white/5 opacity-40" : ""}
        ${!isCompleted && !isLocked ? "bg-white/[0.03] border-white/8 hover:bg-white/[0.05] hover:border-white/15" : ""}
      `}
    >
      {/* Completed badge */}
      {isCompleted && (
        <div className="absolute top-3 left-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-3 left-3">
          <Lock className="w-4 h-4 text-white/20" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          text-2xl w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0
          ${challenge.category === "sovereign" ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/[0.03] border border-white/5"}
        `}>
          {challenge.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + Difficulty */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-black text-white/90">{challenge.title}</h4>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${diff.bg} ${diff.color}`}>
              {diff.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-[11px] text-white/40 leading-relaxed mb-3">{challenge.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* FP Reward */}
              <div className="flex items-center gap-1 text-cyan-400/80">
                <span className="text-[10px]">❄️</span>
                <span className="text-xs font-black">{challenge.frostPointsReward} نقطة</span>
              </div>
              {/* XP Reward */}
              <div className="flex items-center gap-1 text-indigo-400/60">
                <Zap className="w-3 h-3" />
                <span className="text-xs font-bold">{challenge.xpReward} نقطة</span>
              </div>
              {/* Expiry */}
              {challenge.expiresIn && (
                <div className="flex items-center gap-1 text-white/20">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px]">{challenge.expiresIn}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            {!isCompleted && !isLocked && (
              <button
                onClick={handleClaim}
                className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/25 transition-all active:scale-95"
              >
                المطالبة بالمكافأة
              </button>
            )}
            {isCompleted && (
              <span className="text-[10px] font-black text-emerald-400/70">تم ✓</span>
            )}
            {isLocked && (
              <span className="text-[10px] font-black text-white/20">مقفول</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ChallengeBoard Component ────────────────────────────────────────────

export function ChallengeBoard() {
  const [activeTab, setActiveTab] = useState<ChallengeCategory>("daily");
  const { freezeStats } = useGamification();

  const challengesMap: Record<ChallengeCategory, Challenge[]> = {
    daily: DAILY_CHALLENGES,
    weekly: WEEKLY_CHALLENGES,
    sovereign: SOVEREIGN_CHALLENGES,
  };

  const activeChallenges = challengesMap[activeTab];

  const TABS: { id: ChallengeCategory; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "daily",     label: "اليوم",        icon: <Flame className="w-3.5 h-3.5" />,  count: DAILY_CHALLENGES.length },
    { id: "weekly",    label: "الأسبوع",       icon: <Shield className="w-3.5 h-3.5" />, count: WEEKLY_CHALLENGES.length },
    { id: "sovereign", label: "القيادية",      icon: <Eye className="w-3.5 h-3.5" />,   count: SOVEREIGN_CHALLENGES.length },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-950/40 to-amber-950/30 border border-orange-800/20 p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-orange-500/10">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-black text-white/70">
            {freezeStats.totalFreezes > 0
              ? `${freezeStats.totalFreezes} تجميد فعّال — أنت في المسار الصحيح 🔥`
              : "ابدأ رحلتك بتجميد أول علاقة مستنزفة ❄️"}
          </div>
          <div className="text-[10px] text-white/25 mt-0.5">
            التحديات تتجدد يومياً — الثبات هو اللعبة الحقيقية
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 p-1 bg-white/[0.02] rounded-2xl border border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all
              ${activeTab === tab.id
                ? "bg-white/10 text-white border border-white/15 shadow-md"
                : "text-white/30 hover:text-white/50"
              }
            `}
          >
            {tab.icon}
            {tab.label}
            <span className={`
              text-[9px] px-1.5 py-0.5 rounded-full font-black
              ${activeTab === tab.id ? "bg-white/10 text-white/60" : "bg-white/5 text-white/20"}
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Challenge List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {activeChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
