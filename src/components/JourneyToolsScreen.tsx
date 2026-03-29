import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Star, BookOpen, Wind } from "lucide-react";
import { getJourneyToolsView } from "../data/journeyTools";
import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { useAchievementState } from "../state/achievementState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta, getGoalOrderIndex } from "../data/goalMeta";
import type { FeatureFlagKey } from "../config/features";
import { NextStepCard } from "./NextStepCard";
import type { NextStepDecisionV1 } from "../modules/recommendation/types";

interface JourneyToolsScreenProps {
  onBack: () => void;
  onOpenDawayir: () => void;
  onOpenDawayirSetup?: () => void;
  onOpenGoal?: (goalId: string, category: string) => void;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
  availableFeatures?: Partial<Record<FeatureFlagKey, boolean>>;
  nextStepDecision?: NextStepDecisionV1 | null;
  onTakeNextStep?: (decision: NextStepDecisionV1) => void;
  onRefreshNextStep?: () => void;
  onOpenExitScripts?: () => void;
  onOpenGrounding?: () => void;
}

export const JourneyToolsScreen: FC<JourneyToolsScreenProps> = ({
  onBack,
  onOpenDawayir,
  onOpenDawayirSetup,
  onOpenGoal,
  onFeatureLocked,
  availableFeatures,
  nextStepDecision = null,
  onTakeNextStep,
  onRefreshNextStep,
  onOpenExitScripts,
  onOpenGrounding
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

  return (
    <main
      className="w-full max-w-2xl py-10 md:py-14"
      dir="rtl"
      style={{ fontFamily: "IBM Plex Sans Arabic, Tajawal, sans-serif" }}
    >
      {/* Header */}
      <motion.header
        className="text-center space-y-3 mb-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)" }}>
          <Compass className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-teal-400">فضاء الرحلة</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white">أدوات الرحلة</h1>
        <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
          كل أداة خطوة: تبدأ من <span className="text-teal-400 font-bold">دواير</span>، والباقي يتفعّل مع تقدّمك.
        </p>
      </motion.header>

      {/* Tools list */}
      <motion.section
        className="space-y-3 text-right"
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
            className="w-full rounded-2xl px-5 py-4 text-right transition-all"
            style={{
              background: tool.locked ? "rgba(255,255,255,0.02)" : "rgba(20,184,166,0.06)",
              border: `1px solid ${tool.locked ? "rgba(255,255,255,0.06)" : "rgba(20,184,166,0.2)"}`,
              backdropFilter: "blur(12px)",
            }}
            variants={cardVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: tool.locked ? "rgba(255,255,255,0.04)" : "rgba(20,184,166,0.12)",
                    border: `1px solid ${tool.locked ? "rgba(255,255,255,0.06)" : "rgba(20,184,166,0.25)"}`,
                  }}
                >
                  <span aria-hidden="true">{tool.icon}</span>
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-sm font-bold text-white truncate">{tool.name}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{tool.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-[11px] font-semibold rounded-full px-3 py-1 whitespace-nowrap"
                  style={{
                    background: tool.locked ? "rgba(255,255,255,0.05)" : "rgba(20,184,166,0.15)",
                    color: tool.locked ? "rgba(255,255,255,0.3)" : "#34d399",
                  }}
                >
                  {tool.status}
                </span>
                {!tool.locked && tool.id !== "dawayir" && (
                  <span className="text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap"
                    style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}>✓</span>
                )}
              </div>
            </div>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
              {tool.description}
            </p>
          </motion.button>
        ))}
      </motion.section>

      {/* Protection tools */}
      {(onOpenExitScripts || onOpenGrounding) && (
        <motion.section
          className="mt-6 text-right"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="rounded-2xl p-4"
            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <h2 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: "#a78bfa" }}>
              أدوات الحماية الذاتية
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {onOpenExitScripts && (
                <button type="button" onClick={onOpenExitScripts}
                  className="rounded-xl px-4 py-4 text-right transition-all"
                  style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(167,139,250,0.15)" }}>
                      <BookOpen className="w-4 h-4" style={{ color: "#a78bfa" }} />
                    </div>
                    <span className="text-sm font-bold text-white">جمل الخروج</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                    24 جملة + AI لكل موقف صعب
                  </p>
                </button>
              )}
              {onOpenGrounding && (
                <button type="button" onClick={onOpenGrounding}
                  className="rounded-xl px-4 py-4 text-right transition-all"
                  style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(56,189,248,0.15)" }}>
                      <Wind className="w-4 h-4" style={{ color: "#38bdf8" }} />
                    </div>
                    <span className="text-sm font-bold text-white">تهدئة الجسم</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                    تنفّس + حواس + مسح الجسم
                  </p>
                </button>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {nextStepDecision && onTakeNextStep && onRefreshNextStep && (
        <NextStepCard decision={nextStepDecision} onTakeAction={onTakeNextStep} onRefresh={onRefreshNextStep} />
      )}

      {savedGoals.length > 0 && (
        <section className="mt-6 text-right">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>تبديل المسار</h2>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>خطوة سريعة</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedGoals.map((goal) => (
              <button
                key={goal.goalId}
                type="button"
                onClick={() => handleOpenGoal(goal.goalId, goal.category)}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)"
                }}
              >
                {goal.meta ? <goal.meta.icon className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5 text-teal-400" />}
                {goal.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* -- Action Buttons -- */}
      <motion.div
        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={handleOpenDawayir}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
        >
          افتح غرفة دواير <ArrowRight className="w-4 h-4" />
        </button>
        {lastGoalLabel && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgePulseClass}`}
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}
          >
            {lastGoalMeta ? <lastGoalMeta.icon className="w-3 h-3" /> : <Star className="w-3 h-3" />}
            آخر هدف: {lastGoalLabel}
          </span>
        )}
        {onOpenDawayirSetup && (
          <button type="button" onClick={handleSetup}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
            style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#34d399" }}
          >
            جهّز غرفة دواير
          </button>
        )}
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
        >
          رجوع
        </button>
      </motion.div>
    </main>
  );
};

