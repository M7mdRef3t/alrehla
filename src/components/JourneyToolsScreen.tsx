import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Star } from "lucide-react";
import { getJourneyToolsView } from "../data/journeyTools";
import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { useAchievementState } from "../state/achievementState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta, getGoalOrderIndex } from "../data/goalMeta";
import type { FeatureFlagKey } from "../config/features";

interface JourneyToolsScreenProps {
  onBack: () => void;
  onOpenDawayir: () => void;
  onOpenDawayirSetup?: () => void;
  onOpenGoal?: (goalId: string, category: string) => void;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
  availableFeatures?: Partial<Record<FeatureFlagKey, boolean>>;
}

export const JourneyToolsScreen: FC<JourneyToolsScreenProps> = ({
  onBack,
  onOpenDawayir,
  onOpenDawayirSetup,
  onOpenGoal,
  onFeatureLocked,
  availableFeatures
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 }
  };
  const nodesCount = useMapState((s) => s.nodes.length);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const lastGoalId = useJourneyState((s) => s.goalId);
  const lastGoalCategory = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const lastGoalMeta = getGoalMeta(lastGoalRecord?.goalId);
  const [badgePulse, setBadgePulse] = useState(false);
  const lastGoalRef = useRef<string | null>(lastGoalLabel ?? null);
  const unlockedIds = useAchievementState((s) => s.unlockedIds);
  const hasMissionCompleted = useMapState((s) =>
    s.nodes.some((n) => n.missionProgress?.isCompleted)
  );
  const tools = getJourneyToolsView({
    nodesCount,
    baselineCompletedAt: baselineCompletedAt ?? null,
    unlockedIds,
    hasMissionCompleted,
    availableFeatures
  });
  const savedGoals = lastGoalById
    ? Object.entries(lastGoalById)
        .map(([goalId, meta]) => ({
          goalId,
          category: meta.category,
          label: getGoalLabel(goalId),
          updatedAt: meta.updatedAt,
          meta: getGoalMeta(goalId)
        }))
        .filter((item) => item.label)
        .sort((a, b) => {
          const recentDiff = b.updatedAt - a.updatedAt;
          if (recentDiff !== 0) return recentDiff;
          return getGoalOrderIndex(a.goalId) - getGoalOrderIndex(b.goalId);
        })
    : [];

  const handleOpenDawayir = () => {
    onOpenDawayir();
  };
  const handleSetup = () => {
    onOpenDawayirSetup?.();
  };
  const handleOpenGoal = (goalId: string, category: string) => {
    onOpenGoal?.(goalId, category);
  };

  useEffect(() => {
    if (!lastGoalLabel) return;
    if (lastGoalRef.current && lastGoalRef.current !== lastGoalLabel) {
      setBadgePulse(true);
      const t = setTimeout(() => setBadgePulse(false), 700);
      lastGoalRef.current = lastGoalLabel;
      return () => clearTimeout(t);
    }
    lastGoalRef.current = lastGoalLabel;
  }, [lastGoalLabel]);

  const badgePulseClass = badgePulse ? "animate-bounce" : "";
  const fallbackBadgeClasses =
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200";

  return (
    <main className="w-full max-w-2xl py-10 md:py-14 text-center">
      <motion.header
        className="space-y-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex items-center justify-center gap-2 text-teal-600">
          <Compass className="w-6 h-6" />
          <span className="text-sm font-semibold">فضاء الرحلة</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          أدوات الرحلة
        </h1>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
          كل أداة هي خطوة. البداية من <strong className="text-slate-800">دواير</strong>،
          والباقي يتفعل مع تقدّمك في المدارات.
        </p>
      </motion.header>

      <motion.section
        className="mt-8 space-y-3 text-right"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
              {tools.map((tool) => (
          <motion.button
            key={tool.id}
            type="button"
            onClick={() => {
              if (!tool.locked || !tool.featureKey || !onFeatureLocked) return;
              onFeatureLocked(tool.featureKey);
            }}
            className={`w-full rounded-2xl border px-5 py-4 shadow-sm text-right ${
              tool.locked
                ? "border-slate-200 bg-white"
                : "border-teal-200 bg-teal-50/70"
            }`}
            variants={cardVariants}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    tool.locked
                      ? "bg-slate-100 text-slate-600"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  <span aria-hidden="true">{tool.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{tool.name}</p>
                  <p className="text-xs text-slate-500 truncate">{tool.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold rounded-full px-3 py-1 whitespace-nowrap ${
                    tool.locked
                      ? "bg-slate-100 text-slate-500"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {tool.status}
                </span>
                {!tool.locked && tool.id !== "dawayir" && (
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700 whitespace-nowrap">
                    مفعّلة
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              {tool.description}
            </p>
          </motion.button>
        ))}
      </motion.section>

      {savedGoals.length > 0 && (
        <section className="mt-6 text-right">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-700">تبديل المسار</h2>
            <span className="text-[11px] text-slate-500">خطوة سريعة</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedGoals.map((goal) => (
              <button
                key={goal.goalId}
                type="button"
                onClick={() => handleOpenGoal(goal.goalId, goal.category)}
                className={`inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold transition-all ${
                  goal.meta?.buttonClasses ?? "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                {goal.meta ? <goal.meta.icon className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5 text-teal-600" />}
                {goal.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <motion.div
        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={handleOpenDawayir}
          className="inline-flex items-center gap-2 rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold shadow-md hover:bg-teal-700 transition-all"
        >
          افتح غرفة دواير
          <ArrowRight className="w-4 h-4" />
        </button>
        {lastGoalLabel && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              lastGoalMeta?.badgeClasses ?? fallbackBadgeClasses
            } ${badgePulseClass}`}
          >
            {lastGoalMeta ? <lastGoalMeta.icon className="w-3 h-3" /> : <Star className="w-3 h-3" />}
            آخر هدف محفوظ: {lastGoalLabel}
          </span>
        )}
        {onOpenDawayirSetup && (
          <button
            type="button"
            onClick={handleSetup}
            className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-6 py-3 text-sm font-semibold text-teal-700 hover:border-teal-300 hover:bg-teal-100 transition-all"
          >
            جهّز غرفة دواير
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
        >
          رجوع
        </button>
      </motion.div>
    </main>
  );
};
