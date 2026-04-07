import type { FC } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Ring } from "../map/mapTypes";
import type { AdviceCategory } from "@/data/adviceScripts";
import {
  calculateSuggestedPlacement,
  getSuggestedRingLabel,
  getRingIcon
} from "@/utils/suggestedPlacement";

interface SuggestedPlacementProps {
  currentRing: Ring;
  personLabel: string;
  category: AdviceCategory;
  selectedSymptoms?: string[];
}

export const SuggestedPlacement: FC<SuggestedPlacementProps> = ({
  currentRing,
  personLabel,
  category,
  selectedSymptoms
}) => {
  const placement = calculateSuggestedPlacement(currentRing, category, selectedSymptoms);

  // لو العلاقة في مكانها الصحيح (خضراء صحية)
  if (placement.isHealthy && currentRing === "green") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-5 bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl"
      >
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-green-900 mb-1">
              ✅ المدار في مكانه الصح
            </h3>
            <p className="text-sm text-green-800 leading-relaxed">
              مدارك مع <span className="font-bold">{personLabel}</span> مستقر ومتوازن.
              كمّل بنفس الإيقاع.
            </p>
          </div>
        </div>

        {/* Maintenance Steps */}
        <div className="mt-4 pt-4 border-t border-green-200">
          <p className="text-xs font-semibold text-green-900 mb-2">
            💡 للحفاظ على استقرار المدار:
          </p>
          <ul className="space-y-2">
            {placement.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-green-800">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  }

  // لو الحماية القصوى (أحمر → المقترح أحمر = مكانك الصح)
  if (placement.isHealthy && currentRing === "red") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-5 bg-linear-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl"
      >
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-red-900 mb-1">
              🛡️ مساحتك محمية.. إنت في المكان الصح
            </h3>
            <p className="text-sm text-red-800 leading-relaxed">
              المدار مع <span className="font-bold">{personLabel}</span> بياخد من طاقتك.
              ثبّت الحدود الصارمة وكمل حماية طاقتك.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-red-200">
          <p className="text-xs font-semibold text-red-900 mb-2">
            💡 ثبّت القواعد دي:
          </p>
          <ul className="space-y-2">
            {placement.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-red-800">
                <span className="text-red-600 mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  }

  // لو العلاقة محتاجة تغيير
  const needsImprovement = placement.currentRing !== placement.suggestedRing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-5 bg-linear-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-bold text-purple-900 mb-1">
            🎯 التموضع الصحيح المقترح
          </h3>
          <p className="text-xs text-purple-800">
            بناءً على القراءة، ده أنسب تموضع للمدار عشان تحمي طاقتك وتقلل الضغط.
          </p>
        </div>
      </div>

      {/* Current vs Suggested */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {/* Shock Message if exists */}
        {placement.shockMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs font-bold text-red-900 text-center"
          >
            {placement.shockMessage}
          </motion.div>
        )}

        {/* Current Ring */}
        <div className="p-3 bg-white rounded-lg border-2 border-red-200">
          <p className="text-xs font-semibold text-slate-500 mb-1">
            التموضع اللي إنت فيه دلوقتي:
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getRingIcon(placement.currentRing)}</span>
            <span className="text-sm font-extrabold text-red-900 uppercase tracking-wide">
              {getSuggestedRingLabel(placement.currentRing)}
            </span>
          </div>
        </div>

        {/* Arrow */}
        {needsImprovement && (
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-purple-600" />
          </div>
        )}

        {/* Suggested Ring */}
        {needsImprovement && (
          <div className="p-3 bg-white rounded-lg border-2 border-green-200">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              التموضع المقترح:
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getRingIcon(placement.suggestedRing)}</span>
              <span className="text-sm font-bold text-green-900">
                {getSuggestedRingLabel(placement.suggestedRing)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="p-4 bg-linear-to-r from-purple-100 to-blue-100 rounded-lg mb-4">
        <p className="text-xs font-semibold text-purple-900 mb-2">
          💡 ليه التموضع ده؟
        </p>
        <p className="text-sm text-purple-900 leading-relaxed">
          {placement.reason}
        </p>
      </div>

      {/* Steps to Move */}
      <div className="p-4 bg-white rounded-lg border border-slate-200">
        <p className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span>🎯</span>
          <span>
            إزاي تنقل مدارك مع {personLabel} للتموضع الصح:
          </span>
        </p>
        <ul className="space-y-2.5">
          {placement.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-slate-800 leading-relaxed flex-1">
                {step}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Important Note */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-xs text-yellow-900 leading-relaxed">
          <span className="font-bold">⚠️ مهم:</span> النقل محتاج ثبات.
          أي تنازل بدري ممكن يرجّع المدار للمنطقة الحمراء.
        </p>
      </div>
    </motion.div>
  );
};
