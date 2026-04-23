import type { FC } from "react";
import { motion } from "framer-motion";
import { Check, Lock, ArrowRight, Zap as Sparkles } from "lucide-react";
import {
  RECOVERY_PHASES,
  calculateCurrentPhase,
  calculateOverallProgress,
  getNextPhase,
  getCompletedPhases,
  isJourneyComplete,
  type RoadmapPhase
} from "@/data/recoveryRoadmap";

interface RecoveryRoadmapProps {
  personLabel: string;
  hasAnalysis: boolean;
  hasSelectedSymptoms: boolean;
  hasWrittenSituations: boolean;
  hasCompletedTraining?: boolean;
  completedRecoverySteps: number;
  totalRecoverySteps: number;
  journeyStartDate?: number;
}

export const RecoveryRoadmap: FC<RecoveryRoadmapProps> = ({
  personLabel,
  hasAnalysis,
  hasSelectedSymptoms,
  hasWrittenSituations,
  hasCompletedTraining = false,
  completedRecoverySteps,
  totalRecoverySteps,
  journeyStartDate
}) => {
  const daysSinceStart = journeyStartDate
    ? Math.floor((Date.now() - journeyStartDate) / (1000 * 60 * 60 * 24))
    : 0;

  const currentPhaseId = calculateCurrentPhase(
    hasAnalysis,
    hasSelectedSymptoms,
    hasWrittenSituations,
    hasCompletedTraining,
    completedRecoverySteps,
    totalRecoverySteps,
    daysSinceStart
  );

  const overallProgress = calculateOverallProgress(currentPhaseId);
  const completedPhaseIds = getCompletedPhases(currentPhaseId);
  const nextPhase = getNextPhase(currentPhaseId);
  const isComplete = isJourneyComplete(currentPhaseId);
  const currentPhase = RECOVERY_PHASES.find(p => p.id === currentPhaseId);

  if (!currentPhase) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-6 bg-slate-900/40 border-2 border-teal-500/30 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none group-hover:bg-teal-500/10 transition-all duration-700" />
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30 shadow-inner">
          <Sparkles className="w-7 h-7 text-teal-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black text-white mb-1">
            🗺️ خريطة استعادة السيطرة
          </h3>
          <p className="text-sm text-slate-400 font-medium">
            رحلتك مع <span className="text-teal-400 font-bold">{personLabel}</span> من الاستنزاف لثبات السيطرة
          </p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-8 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-black text-slate-300 uppercase tracking-wider">
            التقدم الإجمالي
          </span>
          <span className="text-lg font-black text-teal-400">
            {overallProgress}%
          </span>
        </div>
        <div className="h-4 bg-slate-950/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <motion.div
            className="h-full bg-linear-to-r from-teal-500 via-cyan-400 to-emerald-400 shadow-[0_0_15px_rgba(45,212,191,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.2, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Phases List */}
      <div className="space-y-4 relative z-10">
        {RECOVERY_PHASES.map((phase, index) => {
          const isCompleted = completedPhaseIds.includes(phase.id);
          const isCurrent = phase.id === currentPhaseId;
          const isLocked = !isCompleted && !isCurrent;

          return (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isLocked={isLocked}
              index={index}
            />
          );
        })}
      </div>

      {/* Current Phase Details */}
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-md shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl filter drop-shadow-lg">{currentPhase.icon}</span>
            <h4 className="text-lg font-black text-white">
              أنت دلوقتي في محطة: <span className="text-teal-400">{currentPhase.title}</span>
            </h4>
          </div>
          
          <p className="text-sm text-slate-300 mb-6 leading-relaxed font-medium">
            {currentPhase.description}
          </p>

          {/* Current Goals */}
          <div className="mb-6">
            <p className="text-xs font-black text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-px bg-slate-600" /> 🎯 أهداف المحطة دي
            </p>
            <ul className="space-y-2">
              {currentPhase.goals.map((goal, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-200 group">
                  <span className="text-teal-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500/50 group-hover:scale-125 transition-transform" />
                  <span className="font-medium group-hover:text-white transition-colors">{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Milestones */}
          <div className="mb-6">
            <p className="text-[10px] font-black text-teal-500/70 mb-3 uppercase tracking-[0.2em]">
              🚩 المعالم (Milestones)
            </p>
            <div className="grid grid-cols-1 gap-3">
              {currentPhase.milestones.map((m, i) => (
                <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                   <span className="text-xs font-bold text-slate-200 group-hover:text-white">{m.title}</span>
                   <span className="text-[10px] font-black text-teal-500 px-2 py-1 bg-teal-500/10 rounded-lg">← {m.completed}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-2xl" />
            <p className="text-xs font-black text-amber-400 mb-3 flex items-center gap-2">
              <span className="animate-pulse">💡</span> تكتيكات المحطة دي
            </p>
            <ul className="space-y-2">
              {currentPhase.tips.slice(0, 2).map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-amber-200/80 leading-relaxed">
                  <span className="text-amber-500 mt-1">•</span>
                  <span className="font-medium">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Next Phase Preview */}
      {!isComplete && nextPhase && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-linear-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl group hover:border-indigo-500/40 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-black text-indigo-300">
              المحطة الجاية: {nextPhase.title}
            </h4>
          </div>
          <p className="text-xs text-indigo-200/60 leading-relaxed font-medium pl-11">
            {nextPhase.description}
          </p>
        </motion.div>
      )}

      {/* Journey Complete */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 p-8 bg-linear-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/30 rounded-3xl text-center backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent) pointer-events-none" />
          <div className="text-5xl mb-4 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">🎉</div>
          <h3 className="text-2xl font-black text-white mb-3">
            مبروك! استعدت السيطرة بالكامل!
          </h3>
          <p className="text-base text-slate-300 leading-relaxed mb-6 font-medium">
            جبهتك مع <span className="text-emerald-400 font-bold">{personLabel}</span> بقت في تموضع آمن ومستقر.
            حافظ على الدرع واستثمر طاقتك في الجبهات اللي بتخدمك.
          </p>
          <div className="inline-flex items-center gap-3 px-8 py-3 bg-emerald-500 text-slate-950 rounded-2xl text-sm font-black shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <Check className="w-5 h-5" />
            السيطرة اكتملت
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Phase Card Component
interface PhaseCardProps {
  phase: RoadmapPhase;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  index: number;
}

const PhaseCard: FC<PhaseCardProps> = ({
  phase,
  isCompleted,
  isCurrent,
  isLocked,
  index
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative p-4 rounded-2xl border-2 transition-all duration-500 backdrop-blur-md ${
        isCurrent
          ? "bg-teal-500/10 border-teal-500 shadow-[0_0_20px_rgba(45,212,191,0.15)] scale-[1.02]"
          : isCompleted
          ? "bg-emerald-500/5 border-emerald-500/30"
          : "bg-white/[0.01] border-white/5 opacity-40"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Icon/Status */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner transition-all duration-500 ${
            isCurrent
              ? "bg-teal-500 text-slate-950 scale-110 shadow-teal-500/50"
              : isCompleted
              ? "bg-emerald-500/80 text-white"
              : "bg-slate-800 text-slate-500"
          }`}
        >
          {isCompleted ? (
            <Check className="w-6 h-6 stroke-[3]" />
          ) : isLocked ? (
            <Lock className="w-5 h-5" />
          ) : (
            <span className="filter drop-shadow-md">{phase.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4
              className={`text-base font-black tracking-tight ${
                isCurrent
                  ? "text-white"
                  : isCompleted
                  ? "text-emerald-100"
                  : "text-slate-500"
              }`}
            >
              {phase.shortTitle}
            </h4>
            {isCurrent && (
              <motion.span 
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-2.5 py-1 bg-teal-500 text-slate-950 text-[10px] font-black rounded-lg uppercase tracking-tighter"
              >
                أنت هنا
              </motion.span>
            )}
          </div>

          <p
            className={`text-xs leading-relaxed font-medium ${
              isCurrent
                ? "text-slate-300"
                : isCompleted
                ? "text-emerald-200/60"
                : "text-slate-600"
            }`}
          >
            {isLocked ? "🔒 هتتفتح لما تخلص المرحلة اللي قبلها" : phase.description}
          </p>

          {(isCurrent || isCompleted) && (
            <div className="mt-2 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? "bg-teal-500" : "bg-emerald-500"}`} />
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  isCurrent ? "text-teal-400" : "text-emerald-400"
                }`}
              >
                ⏱️ {phase.duration}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

