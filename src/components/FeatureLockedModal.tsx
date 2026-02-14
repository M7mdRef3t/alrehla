import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { FEATURE_FLAGS, type FeatureFlagKey } from "../config/features";

interface FeatureLockedModalProps {
  isOpen: boolean;
  featureKey: FeatureFlagKey | null;
  onClose: () => void;
}

const LOCK_MESSAGES: Partial<Record<FeatureFlagKey, string>> = {
  basic_diagnosis: "عرض التفاصيل متوقف حالياً من لوحة التحكم في الزمن.",
  mirror_tool: "بطاقة (أنا) متوقفة حالياً من لوحة التحكم في الزمن.",
  family_tree: "شجرة العيلة متوقفة حالياً من لوحة التحكم في الزمن.",
  dawayir_map: "الخريطة متوقفة حالياً من لوحة التحكم في الزمن.",
  journey_tools: "أدوات الرحلة متوقفة حالياً من لوحة التحكم في الزمن.",
  internal_boundaries: "أدوات الحدود الداخلية متوقفة حالياً من لوحة التحكم في الزمن.",
  global_atlas: "لوحة الأطلس متوقفة حالياً من لوحة التحكم في الزمن.",
  ai_field: "مرشد الرحلة متوقف حالياً من لوحة التحكم في الزمن.",
  pulse_check: "ضبط البوصلة متوقف حالياً من لوحة التحكم في الزمن.",
  generative_ui_mode: "وضع الواجهة الذكي متوقف حالياً من لوحة التحكم في الزمن."
};

export const FeatureLockedModal: FC<FeatureLockedModalProps> = ({
  isOpen,
  featureKey,
  onClose
}) => {
  const feature = FEATURE_FLAGS.find((f) => f.key === featureKey);
  if (!isOpen || !feature) return null;

  const message =
    LOCK_MESSAGES[feature.key] ?? "هذه الميزة متوقفة حالياً من لوحة التحكم في الزمن.";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl bg-white p-6 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{feature.label}</h2>
          <p className="text-sm text-slate-600">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-slate-900 text-white py-3 text-sm font-semibold hover:bg-slate-800"
          >
            تمام
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
