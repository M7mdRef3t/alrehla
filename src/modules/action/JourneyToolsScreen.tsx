import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Star, BookOpen, Wind, ShieldAlert, Sparkles, Activity, Radar, Fingerprint, Database } from "lucide-react";
import { getJourneyToolsView } from "@/data/journeyTools";
import { useJourneyProgress, trackingService } from "@/domains/journey";
import { useMapState } from '@/modules/map/dawayirIndex';
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getGoalLabel, getLastGoalMeta } from "@/utils/goalLabel";
import { getGoalMeta, getGoalOrderIndex } from "@/data/goalMeta";
import type { FeatureFlagKey } from "@/config/features";
import { NextStepCard } from '@/modules/exploration/NextStepCard';
import type { NextStepDecisionV1 } from "../recommendation/types";
import { getMarayaStoryLaunchHref, getMarayaStoryPath } from "@/utils/marayaStoryJourney";

const getToolIcon = (id: string, className = "w-6 h-6") => {
  switch (id) {
    case "dawayir": return <Radar className={className} />;
    case "mirror": return <Fingerprint className={className} />;
    case "journal": return <Database className={className} />;
    default: return <Compass className={className} />;
  }
};

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
  const { baselineCompletedAt, goalId: lastGoalId, category: lastGoalCategory, lastGoalById } = useJourneyProgress();
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const lastGoalMeta = getGoalMeta(lastGoalRecord?.goalId);
  const [badgePulse, setBadgePulse] = useState(false);
  const lastGoalRef = useRef<string | null>(lastGoalLabel ?? null);
  const unlockedIds = useAchievementState((s) => s.unlockedIds);
  const journeyPaths = useAdminState((s) => s.journeyPaths);
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
  
  const dawayirTool = tools.find(t => t.id === 'dawayir');
  const otherTools = tools.filter(t => t.id !== 'dawayir');
  const marayaPath = useMemo(() => getMarayaStoryPath(journeyPaths), [journeyPaths]);

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

  const handleOpenMirrorStory = () => {
    if (typeof window === "undefined") return;
    trackingService.recordFlow("mirror_journey_started", { meta: { surface: "journey-tools" } });
    window.location.assign(
      getMarayaStoryLaunchHref(marayaPath, {
        surface: "journey-tools"
      })
    );
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
      className="w-full max-w-2xl mx-auto py-10 md:py-14 space-y-12 font-sans"
      dir="rtl"
    >
      {/* Header */}
      <motion.header
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
          <Activity className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-teal-400 tracking-wide">ترسانة الأدوات</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-md">
          أدوات الرحلة
        </h1>
        <p className="text-sm leading-relaxed max-w-sm mx-auto text-white/50">
          مركز السيطرة الخاص بك. استغل الأدوات المتاحة لمواجهة التحديات الداخلية.
        </p>
      </motion.header>

      {/* Emergency Tools (Top) */}
      {(onOpenExitScripts || onOpenGrounding) && (
        <motion.section
          className="text-right"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="rounded-2xl p-4 bg-red-950/20 border border-red-500/20 relative overflow-hidden backdrop-blur-md shadow-[0_0_20px_-5px_rgba(239,68,68,0.15)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <h2 className="text-xs font-bold mb-4 flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-4 h-4" />
              أدوات الطوارئ والحماية
            </h2>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              {onOpenExitScripts && (
                <button type="button" onClick={onOpenExitScripts}
                  className="rounded-xl px-4 py-4 text-right transition-all bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 group relative overflow-hidden shadow-inner flex flex-col justify-between"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-2 mb-2 relative z-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/20 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-sm font-bold text-white">جمل الخروج</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-200/50 relative z-10 font-medium">
                    24 جملة انسحاب آمن
                  </p>
                </button>
              )}
              {onOpenGrounding && (
                <button type="button" onClick={onOpenGrounding}
                  className="rounded-xl px-4 py-4 text-right transition-all bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 group relative overflow-hidden shadow-inner flex flex-col justify-between"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-2 mb-2 relative z-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500/20 group-hover:scale-110 transition-transform">
                      <Wind className="w-4 h-4 text-sky-400" />
                    </div>
                    <span className="text-sm font-bold text-white">تهدئة الجسم</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-sky-200/50 relative z-10 font-medium">
                    تنفّس وحواس ومسح
                  </p>
                </button>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Core Tool: Dawayir (Hero Card) */}
      {dawayirTool && (
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/30 to-emerald-500/30 rounded-[2rem] blur-xl opacity-40 animate-pulse" />
          <button
            type="button"
            onClick={() => {
              if (dawayirTool.locked && onFeatureLocked && dawayirTool.featureKey) {
                onFeatureLocked(dawayirTool.featureKey);
              } else {
                handleOpenDawayir();
              }
            }}
            className="w-full relative rounded-3xl p-6 text-right transition-all overflow-hidden group bg-slate-900 border border-teal-500/30 hover:border-teal-400/60 shadow-[0_0_30px_-5px_rgba(20,184,166,0.3)] block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent opacity-50" />
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shadow-[inset_0_0_20px_rgba(20,184,166,0.2)] group-hover:scale-105 transition-transform duration-300 shrink-0 text-teal-200">
                  <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{getToolIcon(dawayirTool.id, "w-8 h-8")}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    {dawayirTool.name}
                    <Sparkles className="w-5 h-5 text-teal-400" />
                  </h2>
                  <p className="text-sm text-teal-200/70 mt-1 font-medium">{dawayirTool.tagline}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/20 flex items-center gap-2">
                  النواة
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,1)]" />
                </span>
                <span className="text-[10px] text-teal-500/80 font-bold px-1">جاهزة الان</span>
              </div>
            </div>
            <p className="text-sm mt-5 text-white/60 leading-relaxed max-w-lg relative z-10 pt-4 border-t border-teal-500/10">
              {dawayirTool.description || "مساحتك الافتراضية لرسم خريطة الموارد والمصادر وتحليل الجهات المتشابكة مع قراراتك."}
            </p>
          </button>
        </motion.section>
      )}

      {nextStepDecision && onTakeNextStep && onRefreshNextStep && (
        <NextStepCard decision={nextStepDecision} onTakeAction={onTakeNextStep} onRefresh={onRefreshNextStep} />
      )}

      {/* Sub-systems / Other Tools */}
      {otherTools.length > 0 && (
        <motion.section
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center gap-3 mb-4 px-2">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">أنظمة الدعم الفرعية</h3>
            <div className="h-px bg-gradient-to-l from-white/10 to-transparent flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherTools.map((tool) => (
              <motion.button
                key={tool.id}
                type="button"
                onClick={() => {
                  if (tool.locked) {
                    if (tool.featureKey && onFeatureLocked) onFeatureLocked(tool.featureKey);
                    return;
                  }

                  if (tool.id === "mirror") {
                    handleOpenMirrorStory();
                  }
                }}
                className={`w-full rounded-2xl p-4 text-right transition-all flex flex-col justify-between min-h-[140px] border backdrop-blur-md relative overflow-hidden group ${
                  tool.locked 
                    ? 'bg-white/[0.02] border-white/5 cursor-not-allowed hover:bg-white/[0.03]' 
                    : 'bg-teal-900/10 border-teal-500/20 hover:border-teal-500/40 cursor-pointer shadow-[0_4px_20px_-10px_rgba(20,184,166,0.1)]'
                }`}
                variants={cardVariants}
                whileHover={tool.locked ? {} : { y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {!tool.locked && (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="flex justify-between items-start w-full relative z-10">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform ${
                      tool.locked ? 'bg-white/[0.03] border-white/5 text-white/30' : 'bg-teal-500/10 border-teal-500/20 text-teal-300 group-hover:scale-105 group-hover:bg-teal-500/20'
                    }`}
                  >
                    <span aria-hidden="true" className={!tool.locked ? 'drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'opacity-50'}>{getToolIcon(tool.id, "w-6 h-6")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!tool.locked && (
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap bg-emerald-500/10 text-emerald-400">✓</span>
                    )}
                    <span
                      className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 whitespace-nowrap border ${
                        tool.locked ? 'bg-white/[0.03] border-white/5 text-white/30' : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                      }`}
                    >
                      {tool.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4 relative z-10 text-right w-full">
                  <h4 className={`text-base font-bold truncate ${tool.locked ? 'text-white/40' : 'text-white'}`}>{tool.name}</h4>
                  <p className="text-[11px] truncate mt-1 text-white/50">{tool.tagline}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Active Missions (Saved Goals) */}
      {savedGoals.length > 0 && (
        <motion.section 
          className="mt-8 relative text-right bg-white/[0.015] border border-white/[0.05] rounded-2xl p-5 shadow-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              أهدافك النشطة
            </h2>
            <span className="text-[10px] font-semibold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">مسارات محفوظة</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedGoals.map((goal) => (
              <button
                key={goal.goalId}
                type="button"
                onClick={() => handleOpenGoal(goal.goalId, goal.category)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all bg-white/[0.03] border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10"
              >
                {goal.meta ? <goal.meta.icon className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5 text-teal-400" />}
                {goal.label}
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* -- Action Buttons -- */}
      <motion.div
        className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-white/5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.5 }}
      >
        {lastGoalLabel && lastGoalId && lastGoalCategory && (
          <button
            onClick={() => handleOpenGoal(lastGoalId, lastGoalCategory)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-bold transition-all hover:bg-emerald-500/20 ${badgePulseClass} bg-emerald-500/10 border border-emerald-500/20 text-emerald-400`}
          >
            {lastGoalMeta ? <lastGoalMeta.icon className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            متابعة الهدف: {lastGoalLabel}
            <ArrowRight className="w-3.5 h-3.5 mr-1" />
          </button>
        )}
        {onOpenDawayirSetup && (
          <button type="button" onClick={handleSetup}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold transition-all bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
          >
            إعادة تهيئة الغرفة
          </button>
        )}
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold transition-all bg-transparent text-white/40 hover:text-white/80"
        >
          رجوع
        </button>
      </motion.div>
    </main>
  );
};

