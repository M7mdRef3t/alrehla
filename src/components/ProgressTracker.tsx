import type { FC } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ProgressTrackerProps {
  completedSteps: number;
  totalSteps: number;
}

export const ProgressTracker: FC<ProgressTrackerProps> = ({
  completedSteps,
  totalSteps
}) => {
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  
  const milestones = [
    { label: "البداية", percent: 0 },
    { label: "الخطوات الأولى", percent: 20 },
    { label: "التحسن المحسوس", percent: 40 },
    { label: "علاقة أصح", percent: 70 },
    { label: "التوازن الصحي", percent: 100 }
  ];

  return (
    <div className="mt-6 p-5 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">
        📊 تقدمك في بروتوكول الدفاع
      </h3>

      {/* Progress Bar */}
      <div className="relative h-8 bg-white rounded-full overflow-hidden border-2 border-teal-300 mb-6">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-end pr-3"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {percentage > 15 && (
            <span className="text-white font-bold text-sm">
              {percentage}%
            </span>
          )}
        </motion.div>
        {percentage <= 15 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">
            {percentage}%
          </span>
        )}
      </div>

      {/* Steps Counter */}
      <div className="text-center mb-6">
        <p className="text-2xl font-bold text-teal-700">
          {completedSteps} <span className="text-slate-400">/</span> {totalSteps}
        </p>
        <p className="text-sm text-slate-600 mt-1">خطوة مكتملة</p>
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        {milestones.map((milestone, index) => {
          const isCompleted = percentage >= milestone.percent;
          const isCurrent = 
            percentage >= (milestones[index - 1]?.percent || 0) &&
            percentage < milestone.percent;

          return (
            <motion.div
              key={milestone.label}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isCompleted
                  ? "bg-teal-100 border-2 border-teal-400"
                  : isCurrent
                  ? "bg-amber-50 border-2 border-amber-300"
                  : "bg-white border border-gray-200"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? "bg-teal-500"
                    : isCurrent
                    ? "bg-amber-400"
                    : "bg-gray-200"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      isCurrent ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {milestone.percent}%
                  </span>
                )}
              </div>
              <span
                className={`text-sm font-semibold ${
                  isCompleted
                    ? "text-teal-900"
                    : isCurrent
                    ? "text-amber-900"
                    : "text-gray-600"
                }`}
              >
                {milestone.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Encouragement Message */}
      <div className="mt-6 p-4 bg-white rounded-lg border border-teal-200">
        <p className="text-sm text-center text-slate-700 leading-relaxed">
          {percentage === 0 && "🎯 ابدأ رحلتك نحو علاقة أصح!"}
          {percentage > 0 && percentage < 30 && "💪 بداية قوية! استمر"}
          {percentage >= 30 && percentage < 60 && "🌟 تقدم ممتاز! أنت على الطريق الصح"}
          {percentage >= 60 && percentage < 90 && "🔥 رائع! أوشكت على النهاية"}
          {percentage >= 90 && percentage < 100 && "🎊 تقريباً وصلت! خطوة أخيرة"}
          {percentage === 100 && "🎉 مبروك! أنت وصلت لتوازن صحي"}
        </p>
      </div>
    </div>
  );
};
