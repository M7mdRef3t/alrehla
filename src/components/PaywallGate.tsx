import type { FC } from "react";
import { motion } from "framer-motion";
import { Crown, Zap, Lock, Check } from "lucide-react";
import {
  TIER_LABELS,
  TIER_PRICES,
  type SubscriptionTier,
} from "../services/subscriptionManager";

import { isPublicPaymentsEnabled } from "../config/payments";
import { useAppOverlayState } from "../state/appOverlayState";

interface PaywallGateProps {
  reason: "ai_limit" | "map_limit" | "pdf" | "training";
  onClose: () => void;
  onUpgrade?: (tier: SubscriptionTier) => void;
}

const REASON_COPY: Record<PaywallGateProps["reason"], { title: string; desc: string }> = {
  ai_limit: {
    title: "وصلت لحد رسائل اليوم",
    desc: "الخطة المجانية تمنحك 5 رسائل يوميًا مع نَواة. لو عايز سعة أعلى، افتح المسار المتقدم من جوه المنصة.",
  },
  map_limit: {
    title: "الخريطة وصلت للحد المجاني",
    desc: "تقدر تضيف 3 أشخاص في الخريطة المجانية. لو محتاج سعة أكبر، افتح المسار المتقدم من جوه المنصة.",
  },
  pdf: {
    title: "تصدير PDF — مسار متقدم",
    desc: "احفظ تقريرك الكامل كـ PDF. الميزة دي متاحة في المسار المتقدم.",
  },
  training: {
    title: "التدريب التكتيكي — مسار متقدم",
    desc: "محاكاة تفاعلية لتدريب مهارات الحدود. الميزة دي متاحة في المسار المتقدم.",
  },
};

const PREMIUM_FEATURES = [
  "خريطة لا محدودة",
  "نواة (AI) بلا حدود",
  "تدريب تكتيكي مخصص",
  "تقارير PDF",
  "أولوية الدعم",
];

export const PaywallGate: FC<PaywallGateProps> = ({ reason, onClose }) => {
  const copy = REASON_COPY[reason];
  const openOverlay = useAppOverlayState((s) => s.openOverlay);

  const handleUpgrade = () => {
    if (!isPublicPaymentsEnabled) return;
    onClose();
    openOverlay("premiumBridge");
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0f172a 0%, #1c1040 100%)",
          border: "1px solid rgba(217,119,6,0.3)",
          borderBottom: "none",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        dir="rtl"
      >
        <div className="p-5 pb-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white leading-tight">{copy.title}</h2>
          <p className="text-sm text-slate-400 mt-1 leading-[1.8]">{copy.desc}</p>
        </div>

        <div className="mx-5 mb-4">
          <div
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(180,83,9,0.08))",
              border: "1px solid rgba(217,119,6,0.35)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white">{TIER_LABELS.premium}</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-amber-400">{TIER_PRICES.premium}</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-sm text-slate-300">{f}</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={handleUpgrade}
              disabled={!isPublicPaymentsEnabled}
              className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #d97706, #b45309)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="w-4 h-4" />
              {isPublicPaymentsEnabled ? "افتح المسار المتقدم" : "المسار المتقدم قريبًا"}
            </motion.button>
          </div>
        </div>

        <div className="px-5 pb-6 text-center">
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            استمر مجانًا مع الحدود الحالية
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
