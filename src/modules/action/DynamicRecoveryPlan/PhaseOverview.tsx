import React, { type FC } from "react";
import { motion } from "framer-motion";
import { Zap as Sparkles, CheckCircle2 } from "lucide-react";
import type { DynamicRecoveryPlan as Plan } from "@/utils/dynamicPlanGenerator";

interface PhaseOverviewProps {
  plan: Plan | null;
  completedWeeks: number;
  isComplete: boolean;
  nextPhase?: { title: string; description: string } | null;
}

export const PhaseOverview: FC<PhaseOverviewProps> = ({
  plan,
  completedWeeks,
  isComplete,
  nextPhase
}) => {
  if (!plan) return null;

  const totalWeeks = plan.steps.length;
  const progressPct = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
  const planTitle = plan.steps[0]?.title ? `خطة ${plan.steps[0].title}` : "خطة التعافي";
  const planDescription = plan.insights?.[0] ?? "";

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{planTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{planDescription}</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="p-4 bg-purple-50 dark:bg-slate-800/50 rounded-2xl border border-purple-200 dark:border-purple-900/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">التقدم العام</span>
          <span className="text-lg font-bold text-purple-600">{progressPct}%</span>
        </div>

        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>{completedWeeks} من {totalWeeks} أسابيع</span>
          {isComplete && <span className="font-bold text-green-600">✓ مكتمل!</span>}
        </div>
      </div>

      {/* Next Phase Preview */}
      {nextPhase && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg dark:from-slate-800/30 dark:to-slate-800/20 dark:border-purple-700/40"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">المحطة الجاية: {nextPhase.title}</h4>
          </div>
          <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">{nextPhase.description}</p>
        </motion.div>
      )}

      {/* Journey Complete */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700/40 text-center"
        >
          <p className="text-sm font-bold text-green-700 dark:text-green-400">🎉 الرحلة مكتملة!</p>
          <p className="text-xs text-green-600 dark:text-green-300 mt-1">مبروك على الشروع الشجاع. الحقي في الخطوة الجاية.</p>
        </motion.div>
      )}
    </motion.div>
  );
};
