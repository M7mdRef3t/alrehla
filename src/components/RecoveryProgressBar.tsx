import type { FC } from "react";
import { motion } from "framer-motion";
import type { MapNode, Ring } from "../modules/map/mapTypes";
import { mapCopy } from "../copy/map";

const RING_LABELS: Record<Ring, string> = {
  green: mapCopy.legendGreen,
  yellow: mapCopy.legendYellow,
  red: mapCopy.legendRed
};

const GOAL_LABELS: Record<Ring, string> = {
  red: "استعادة السيطرة",
  yellow: "تثبيت الحدود",
  green: "استقرار آمن"
};

/** مراحل الرحلة — مرتبة؛ كل مرحلة تعتمد على البيانات الفعلية */
const MILESTONES = [
  { id: "awareness", label: "وعي", icon: "👁️" },
  { id: "understanding", label: "فك النمط", icon: "💭" },
  { id: "firstStep", label: "أول خطوة", icon: "🎯" },
  { id: "situations", label: "تقارير", icon: "📝" },
  { id: "plan", label: "بروتوكول", icon: "📋" },
  { id: "training", label: "مناورات", icon: "💪" },
  { id: "recovery", label: "سيطرة", icon: "🌱" }
] as const;

function getMilestoneStatus(node: MapNode): Record<string, boolean> {
  const situationsCount = node.firstStepProgress?.stepInputs
    ? Object.values(node.firstStepProgress.stepInputs).flat().filter((s) => s?.trim()).length
    : 0;
  const hasFirstStep =
    (node.firstStepProgress?.completedFirstSteps?.length ?? 0) > 0 ||
    Boolean(node.firstStepProgress?.stepInputs && Object.values(node.firstStepProgress.stepInputs).flat().some((s) => s?.trim()));
  const hasSituations = situationsCount >= 2;
  const hasPlan =
    hasSituations &&
    ((node.recoveryProgress?.completedSteps?.length ?? 0) > 0 || (node.dynamicPlanGenerated === true) || node.lastViewedStep === "recoveryPlan");
  const hasTraining = node.hasCompletedTraining === true;
  const recoverySteps = node.recoveryProgress?.completedSteps?.length ?? 0;
  const hasRecovery = hasTraining && recoverySteps >= 5;

  const hasUnderstanding = !!node.analysis && (node.analysis.selectedSymptoms?.length ?? 0) > 0;

  return {
    awareness: !!node.analysis,
    understanding: hasUnderstanding,
    firstStep: hasFirstStep,
    situations: hasSituations,
    plan: hasPlan,
    training: hasTraining,
    recovery: hasRecovery
  };
}

function getCompletedCount(status: Record<string, boolean>): number {
  return MILESTONES.filter((m) => status[m.id]).length;
}

interface RecoveryProgressBarProps {
  node: MapNode;
}

export const RecoveryProgressBar: FC<RecoveryProgressBarProps> = ({ node }) => {
  const status = getMilestoneStatus(node);
  const completed = getCompletedCount(status);
  const total = MILESTONES.length;
  const progressPct = Math.round((completed / Math.max(total, 1)) * 100);
  const fromLabel = RING_LABELS[node.ring];
  const toLabel = GOAL_LABELS[node.ring];

  return (
    <div className="mb-4 rounded-xl bg-linear-to-br from-slate-50 to-teal-50/30 border border-slate-200/80 p-3 text-right">
      {/* من [الوضع الحالي] → إلى [الهدف] */}
      <p className="text-xs text-slate-600 mb-2 text-center" dir="rtl">
        من <span className="font-bold text-slate-800">{fromLabel}</span>
        <span className="mx-1 text-slate-400" aria-hidden>←</span>
        إلى <span className="font-bold text-teal-700">{toLabel}</span>
      </p>

      {/* شريط التقدم — يمتلئ حسب المراحل المكتملة */}
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-teal-500 to-teal-600"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* نقاط المراحل — كل نقطة تعكس حالة حقيقية؛ إكمال = نبضة لطيفة */}
      <div className="flex items-center justify-between gap-0.5">
        {MILESTONES.map((m) => {
          const done = status[m.id];
          return (
            <div
              key={m.id}
              className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
              title={`${m.label}: ${done ? "مكتمل" : "قادم"}`}
            >
              <motion.span
                key={`${m.id}-${done ? "done" : "pending"}`}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm transition-colors duration-300 ${
                  done ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-400"
                }`}
                initial={done ? { scale: 1.2 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {done ? "✓" : m.icon}
              </motion.span>
              <motion.span
                className={`text-[10px] font-medium truncate w-full text-center transition-colors duration-300 ${done ? "text-teal-700" : "text-slate-500"}`}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {m.label}
              </motion.span>
            </div>
          );
        })}
      </div>

      {/* نص تشجيعي بدل النسبة */}
      {completed > 0 && (
        <p className="text-[10px] text-slate-500 text-center mt-1">
          الخريطة بتترسم — {completed} من {total} محطات
        </p>
      )}
    </div>
  );
};
