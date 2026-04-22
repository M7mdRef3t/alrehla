import type { FC } from "react";
import { motion } from "framer-motion";
import { Crown, Zap, Lock, Check, ShieldAlert } from "lucide-react";
import {
  TIER_LABELS,
  TIER_PRICES,
  type SubscriptionTier,
} from "@/services/subscriptionManager";

import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { useEffect } from "react";
import * as analyticsService from "@/services/analytics";

interface PaywallGateProps {
  reason: "ai_limit" | "map_limit" | "pdf" | "training";
  onClose: () => void;
  onUpgrade?: (tier: SubscriptionTier) => void;
}

const REASON_COPY: Record<PaywallGateProps["reason"], { title: string; desc: string }> = {
  ai_limit: {
    title: "النزيف المعنوي مبيرحمش!",
    desc: "استنفدت التحليل المجاني! انضم للدفعة التأسيسية واكسر حدود المعالج الذكي عشان توقف استنزاف طاقتك فوراً.",
  },
  map_limit: {
    title: "دوائرك بتستنزفك؟",
    desc: "الخريطة المجانية آخرها 3 أشخاص. انضم للدفعة التأسيسية وافتح الخريطة كاملة عشان تنضف محيطك بلا قيود.",
  },
  pdf: {
    title: "التقرير الكامل — حصرية التأسيس",
    desc: "عشان تحتفظ بالخريطة كاملة وتشارك تقريرك PDF، لازم تكون من المنضمين للدفعة التأسيسية.",
  },
  training: {
    title: "درع الحدود — تدريب تكتيكي",
    desc: "تدريب عملي تتعلم إزاي تقول 'لأ' من غير ذنب. الميزة دي حصرية للمسار التأسيسي لحمايتك.",
  },
};

const PREMIUM_FEATURES = [
  "خريطة علاقات غير محدودة",
  "دخول لعقل الذكاء الاصطناعي",
  "تدريب تكتيكي لحماية طاقاتك",
  "تقارير PDF احترافية",
  "تأمين السعر التأسيسي للأبد",
];

export const PaywallGate: FC<PaywallGateProps> = ({ reason, onClose }) => {
  const copy = REASON_COPY[reason];
  const openOverlay = useAppOverlayState((s) => s.openOverlay);

  useEffect(() => {
    analyticsService.trackCheckoutViewed({ reason });
  }, [reason]);

  const handleUpgrade = () => {
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
        className="relative w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl shadow-amber-900/20"
        style={{
          background: "linear-gradient(160deg, #0f172a 0%, #1c1040 100%)",
          border: "1px solid rgba(217,119,6,0.5)",
          borderBottom: "none",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        dir="rtl"
      >
        <div className="p-5 pb-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="text-xl font-black text-white leading-tight mb-2">{copy.title}</h2>
          <p className="text-[13px] font-medium text-slate-300 mt-1 leading-relaxed px-4">{copy.desc}</p>
        </div>

        <div className="mx-5 mb-4">
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(180,83,9,0.08))",
              border: "1px solid rgba(217,119,6,0.35)",
            }}
          >
            <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-bl-lg">
              عرض الدفعة التأسيسية
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white tracking-wide">الدفعة التأسيسية</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-amber-400">{TIER_PRICES.premium}</p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-slate-200">{f}</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={handleUpgrade}
              className="w-full py-4 rounded-xl font-black text-black flex items-center justify-center gap-2 text-sm"
              style={{
                background: "linear-gradient(135deg, #f5a623, #d97706)",
                boxShadow: "0 4px 20px rgba(217,119,6,0.3)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="w-4 h-4" />
              انضم للدفعة التأسيسية الآن
            </motion.button>
          </div>
        </div>

        <div className="px-5 pb-6 text-center">
          <button
            onClick={onClose}
            className="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
          >
            تجاهل وتكملة بالألم الحالي (صلاحيات محدودة)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
