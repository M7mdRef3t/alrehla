'use client';

/**
 * ConversionOfferCard — Layer 3: محرك التحويل
 * ══════════════════════════════════════════════════
 * يظهر بعد الـ Insight مباشرة ويقدم خيارين:
 * - Free CTA: ابدأ مجاناً بالأداة المقترحة
 * - Paid CTA: احجز جلسة مباشرة
 *
 * مش popup أو modal — هو جزء من الـ flow الطبيعي
 */

import { motion } from "framer-motion";
import { RECOMMENDED_PRODUCT_LABELS } from "../diagnosis/diagnosisEngine";
import type { RecommendedProduct, UserStateObject } from "../diagnosis/types";
import { analyticsService } from "@/domains/analytics";
import { useEffect } from "react";

// ════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════

interface ConversionOfferCardProps {
  userState: UserStateObject;
  onSelectFree: (product: RecommendedProduct) => void;
  onSelectSession: () => void;
  onDismiss?: () => void;
  // Tracking context
  source?: "diagnosis" | "map" | "tools" | "masarat" | "landing";
}

// ════════════════════════════════════════════════
// Free Tier Labels per Product
// ════════════════════════════════════════════════

const FREE_CTA_LABELS: Record<RecommendedProduct, string> = {
  dawayir: "ارسم خريطتك مجاناً",
  masarat: "ابدأ مسارك مجاناً",
  session: "خد جلسة استكشافية مجاناً",
  atmosfera: "جرّب أتموسفيرا مجاناً",
};

const URGENCY_LINES: Record<string, string> = {
  overwhelmed: "وانت تعبان — الوقت مش في صالحك.",
  stuck: "كل يوم بتقف فيه بيكلفك أكتر.",
  lost: "من غير خريطة — كل خطوة ممكن تبعّدك أكتر.",
  anxious: "القلق مش بيروح بالتجاهل.",
  ready: "الاستعداد بدون خطوة ينتهي في أسبوع.",
};

// ════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════

export function ConversionOfferCard({
  userState,
  onSelectFree,
  onSelectSession,
  onDismiss,
  source = "diagnosis",
}: ConversionOfferCardProps) {
  const product = RECOMMENDED_PRODUCT_LABELS[userState.recommendedProduct];
  const urgencyLine = URGENCY_LINES[userState.type] ?? "";

  // Track initial view of the offer
  useEffect(() => {
    analyticsService.track(analyticsService.Events.CONVERSION_OFFER_VIEW, {
      product: userState.recommendedProduct,
      source,
      user_state_type: userState.type,
      readiness: userState.readiness,
    });
  }, [userState.recommendedProduct, source, userState.type, userState.readiness]);

  const handleFree = () => {
    // Track conversion intent
    analyticsService.track(analyticsService.Events.CONVERSION_OFFER_CLICKED, {
      tier: "free",
      product: userState.recommendedProduct,
      source,
      user_state_type: userState.type,
      readiness: userState.readiness,
    });
    onSelectFree(userState.recommendedProduct);
  };

  const handleSession = () => {
    analyticsService.track(analyticsService.Events.CONVERSION_OFFER_CLICKED, {
      tier: "paid",
      product: "session",
      source,
      user_state_type: userState.type,
      readiness: userState.readiness,
    });
    onSelectSession();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(5,8,20,0.98), rgba(10,17,40,0.98))",
        border: `1px solid ${product.color}25`,
        boxShadow: `0 8px 40px ${product.color}15, 0 0 0 1px rgba(255,255,255,0.03)`,
      }}
      dir="rtl"
    >
      {/* Top Accent */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${product.color}, transparent)`,
        }}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: product.color }}
            >
              بناءً على حالتك
            </p>
            <h3 className="text-base font-extrabold text-white">
              {product.emoji} الخطوة الجاية → {product.name}
            </h3>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mt-1"
              aria-label="إغلاق"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Product Description */}
        <p className="text-[13px] text-slate-300 leading-relaxed">
          {product.desc}
        </p>

        {/* Urgency Line */}
        {urgencyLine && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}
          >
            <span className="text-rose-400 text-base">⚠️</span>
            <p className="text-[12px] text-rose-300 font-medium leading-snug">{urgencyLine}</p>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-2.5 pt-1">
          {/* Free CTA — Primary */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleFree}
            className="w-full py-3.5 rounded-2xl text-[14px] font-extrabold transition-all"
            style={{
              background: `linear-gradient(135deg, ${product.color}, ${product.color}bb)`,
              color: "#0f172a",
              boxShadow: `0 4px 20px ${product.color}35`,
            }}
          >
            {FREE_CTA_LABELS[userState.recommendedProduct]}
          </motion.button>

          {/* Session CTA — Secondary Paid */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSession}
            className="w-full py-3 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#f59e0b",
            }}
          >
            <span>🎙️</span>
            <span>احجز جلسة مباشرة</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
              style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}
            >
              PREMIUM
            </span>
          </motion.button>
        </div>

        {/* Trust Signal */}
        <p className="text-center text-[10px] text-slate-600">
          🔒 خاص تماماً — مش بيتشارك مع حد
        </p>
      </div>
    </motion.div>
  );
}
