import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { FEATURE_FLAGS, type FeatureFlagKey } from "@/config/features";
import { AlrehlaWordmark } from "./logo/AlrehlaWordmark";

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
  global_atlas: "الواجهة الكونية متوقفة حالياً من لوحة التحكم في الزمن.",
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
          className="w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 relative overflow-hidden glass-premium border border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <AlrehlaWordmark height={16} className="text-amber-500/40 mb-3" />
            <h2 className="text-2xl font-black text-white tracking-tight">{feature.label}</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{message}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 py-4 text-sm font-black hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
            >
              فهمت الرحلة
            </button>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              تحديث قادم من لوحة التحكم
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
