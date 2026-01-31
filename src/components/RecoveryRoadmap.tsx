import type { FC } from "react";
import { motion } from "framer-motion";
import { Check, Lock, ArrowRight, Sparkles } from "lucide-react";
import {
  RECOVERY_PHASES,
  calculateCurrentPhase,
  calculateOverallProgress,
  getNextPhase,
  getCompletedPhases,
  isJourneyComplete,
  type RoadmapPhase
} from "../data/recoveryRoadmap";

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
      className="mt-6 p-5 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-bold text-teal-900 mb-1">
            🗺️ خريطة رحلة التعافي
          </h3>
          <p className="text-xs text-teal-800">
            رحلتك مع {personLabel} من الاستنزاف للتعافي الكامل
          </p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-teal-900">
            التقدم الإجمالي
          </span>
          <span className="text-sm font-bold text-teal-600">
            {overallProgress}%
          </span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden border border-teal-200">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Phases List */}
      <div className="space-y-3">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-white rounded-lg border-2 border-teal-300"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{currentPhase.icon}</span>
            <h4 className="text-sm font-bold text-teal-900">
              أنت دلوقتي في: {currentPhase.title}
            </h4>
          </div>
          
          <p className="text-xs text-slate-700 mb-3 leading-relaxed">
            {currentPhase.description}
          </p>

          {/* Current Goals */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-900 mb-2">
              🎯 أهداف المرحلة دي:
            </p>
            <ul className="space-y-1.5">
              {currentPhase.goals.map((goal, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-teal-600 mt-0.5">•</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-xs font-semibold text-yellow-900 mb-2">
              💡 نصائح للمرحلة دي:
            </p>
            <ul className="space-y-1.5">
              {currentPhase.tips.slice(0, 2).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-yellow-900">
                  <span className="mt-0.5">•</span>
                  <span>{tip}</span>
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
          className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-purple-900">
              المرحلة الجاية: {nextPhase.title}
            </h4>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed">
            {nextPhase.description}
          </p>
        </motion.div>
      )}

      {/* Journey Complete */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl text-center"
        >
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-green-900 mb-2">
            مبروك! وصلت للتعافي الكامل!
          </h3>
          <p className="text-sm text-green-800 leading-relaxed mb-3">
            علاقتك مع {personLabel} دلوقتي في مكانها الصحيح، وأنت متعافي نفسياً.
            استمر في الحفاظ على الحدود وازدهر في حياتك!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold">
            <Check className="w-4 h-4" />
            رحلة مكتملة
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
      className={`relative p-3 rounded-lg border-2 transition-all ${
        isCurrent
          ? "bg-gradient-to-r from-teal-100 to-cyan-100 border-teal-400"
          : isCompleted
          ? "bg-green-50 border-green-300"
          : "bg-gray-50 border-gray-200 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon/Status */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            isCurrent
              ? "bg-teal-500 text-white ring-4 ring-teal-200"
              : isCompleted
              ? "bg-green-500 text-white"
              : "bg-gray-300 text-gray-600"
          }`}
        >
          {isCompleted ? (
            <Check className="w-5 h-5" />
          ) : isLocked ? (
            <Lock className="w-5 h-5" />
          ) : (
            <span>{phase.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={`text-sm font-bold ${
                isCurrent
                  ? "text-teal-900"
                  : isCompleted
                  ? "text-green-900"
                  : "text-gray-700"
              }`}
            >
              {phase.shortTitle}
            </h4>
            {isCurrent && (
              <span className="px-2 py-0.5 bg-teal-600 text-white text-xs font-bold rounded-full">
                أنت هنا
              </span>
            )}
          </div>

          <p
            className={`text-xs leading-relaxed ${
              isCurrent
                ? "text-teal-800"
                : isCompleted
                ? "text-green-800"
                : "text-gray-600"
            }`}
          >
            {isLocked ? "🔒 هتتفتح لما تخلص المرحلة اللي قبلها" : phase.description}
          </p>

          {(isCurrent || isCompleted) && (
            <div className="mt-2">
              <span
                className={`text-xs font-semibold ${
                  isCurrent ? "text-teal-700" : "text-green-700"
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
