/**
 * PRICING.ts — مصدر الحقيقة الوحيد للتسعير
 * =============================================
 * كل ملف في المشروع يقرأ الأسعار والحدود من هنا.
 *
 * الباقات:
 *   - basic    (المستكشف) — مجاناً
 *   - premium  (القائد)   — $14.99/شهر (200 ج.م مصر)
 *   - coach    (الكوتش)   — $99/شهر (1,500 ج.م مصر) — B2B/معالجين
 *
 * تعديل السعر يتم هنا فقط وينعكس تلقائياً في كل الواجهات.
 */

// ═══════════════════════════════════════════════════════════════════
// 📦 Tiers
// ═══════════════════════════════════════════════════════════════════

export type PricingTier = "basic" | "premium" | "coach";

// ═══════════════════════════════════════════════════════════════════
// 💰 Prices (Base in USD — PPP adjustments below)
// ═══════════════════════════════════════════════════════════════════

export interface TierPrice {
  monthly: number; // USD
  label: string;   // human-readable
}

export const TIER_PRICES_USD: Record<PricingTier, TierPrice> = {
  basic: {
    monthly: 0,
    label: "مجاناً",
  },
  premium: {
    monthly: 14.99,
    label: "$14.99 / شهر",
  },
  coach: {
    monthly: 99,
    label: "$99 / شهر",
  },
};

// ═══════════════════════════════════════════════════════════════════
// 🏷️ Labels
// ═══════════════════════════════════════════════════════════════════

export const TIER_LABELS: Record<PricingTier, string> = {
  basic: "المستكشف",
  premium: "القائد 🎖️",
  coach: "الكوتش 👑",
};

export const TIER_DESCRIPTIONS: Record<PricingTier, string> = {
  basic: "ابدأ رحلتك — اكتشف خريطتك",
  premium: "سعة أعلى وأدوات تعافي متقدمة",
  coach: "أدوات احترافية للمعالجين والكوتشز",
};

// ═══════════════════════════════════════════════════════════════════
// 🔒 Feature Limits
// ═══════════════════════════════════════════════════════════════════

export interface TierLimits {
  /** الحد الأقصى لعدد الأشخاص في الخريطة (-1 = لا محدود) */
  maxMapNodes: number;
  /** عدد رسائل AI المسموحة يومياً (-1 = لا محدود) */
  dailyAIMessages: number;
  /** تصدير PDF */
  canExportPDF: boolean;
  /** تدريب تكتيكي / محاكاة حدود */
  canAccessTraining: boolean;
  /** مشاركة الخريطة */
  canShareMap: boolean;
  /** لوحة B2B / إدارة عملاء */
  canAccessB2B: boolean;
  /** Predictive Engine */
  hasPredictiveEngine: boolean;
  /** AI Oracle مع سياق عميق */
  hasAiOracle: boolean;
  /** Shadow Memory */
  hasShadowMemory: boolean;
  /** مساعدة المُيسّر */
  hasFacilitatorAssistance: boolean;
  /** أسئلة AI شهرياً (-1 = لا محدود) */
  aiQuestionsPerMonth: number;
  /** تردد فحص الصحة */
  healthCheckFrequency: "never" | "daily" | "hourly";
}

export const TIER_LIMITS: Record<PricingTier, TierLimits> = {
  basic: {
    maxMapNodes: 5,
    dailyAIMessages: 5,
    canExportPDF: false,
    canAccessTraining: false,
    canShareMap: true,
    canAccessB2B: false,
    hasPredictiveEngine: false,
    hasAiOracle: false,
    hasShadowMemory: false,
    hasFacilitatorAssistance: false,
    aiQuestionsPerMonth: 5,
    healthCheckFrequency: "never",
  },
  premium: {
    maxMapNodes: -1,
    dailyAIMessages: -1,
    canExportPDF: true,
    canAccessTraining: true,
    canShareMap: true,
    canAccessB2B: false,
    hasPredictiveEngine: true,
    hasAiOracle: true,
    hasShadowMemory: true,
    hasFacilitatorAssistance: true,
    aiQuestionsPerMonth: -1,
    healthCheckFrequency: "daily",
  },
  coach: {
    maxMapNodes: -1,
    dailyAIMessages: -1,
    canExportPDF: true,
    canAccessTraining: true,
    canShareMap: true,
    canAccessB2B: true,
    hasPredictiveEngine: true,
    hasAiOracle: true,
    hasShadowMemory: true,
    hasFacilitatorAssistance: true,
    aiQuestionsPerMonth: -1,
    healthCheckFrequency: "hourly",
  },
};

// ═══════════════════════════════════════════════════════════════════
// 🌍 PPP (Purchasing Power Parity) — Regional Pricing
// ═══════════════════════════════════════════════════════════════════

export interface RegionalConfig {
  multiplier: number;
  currency: string;
  symbol: string;
}

export const REGIONAL_PRICING: Record<string, RegionalConfig> = {
  EG: { multiplier: 1, currency: "EGP", symbol: "ج.م" },       // Base
  SA: { multiplier: 2.3, currency: "SAR", symbol: "ر.س" },
  AE: { multiplier: 2.3, currency: "AED", symbol: "د.إ" },
  US: { multiplier: 1, currency: "USD", symbol: "$" },          // Base reference
  GB: { multiplier: 0.85, currency: "GBP", symbol: "£" },
  DEFAULT: { multiplier: 1, currency: "USD", symbol: "$" },
};

/**
 * السعر الأساسي بالجنيه المصري لباقة القائد
 * $14.99 × ~13.3 (سعر صرف تقريبي) ≈ 200 ج.م
 */
const BASE_PRICE_EGP = 200;

export interface LocalizedPrice {
  id: PricingTier;
  name: string;
  price: number;
  currency: string;
  displayPrice: string;
}

/**
 * احصل على الأسعار المحلية بناءً على كود البلد
 */
export function getLocalizedPricing(countryCode: string | null): LocalizedPrice[] {
  const region = REGIONAL_PRICING[countryCode || "DEFAULT"] || REGIONAL_PRICING["DEFAULT"];

  if (countryCode === "EG") {
    // مصر: السعر بالجنيه المصري
    return [
      {
        id: "basic",
        name: TIER_LABELS.basic,
        price: 0,
        currency: "EGP",
        displayPrice: "مجاناً",
      },
      {
        id: "premium",
        name: TIER_LABELS.premium,
        price: BASE_PRICE_EGP,
        currency: "EGP",
        displayPrice: `${BASE_PRICE_EGP} ج.م / شهر`,
      },
      {
        id: "coach",
        name: TIER_LABELS.coach,
        price: 1500,
        currency: "EGP",
        displayPrice: "1,500 ج.م / شهر",
      },
    ];
  }

  // باقي العالم: بالعملة المحلية أو USD
  return [
    {
      id: "basic",
      name: TIER_LABELS.basic,
      price: 0,
      currency: region.currency,
      displayPrice: "مجاناً",
    },
    {
      id: "premium",
      name: TIER_LABELS.premium,
      price: Math.round(TIER_PRICES_USD.premium.monthly * region.multiplier * 100) / 100,
      currency: region.currency,
      displayPrice: `${Math.round(TIER_PRICES_USD.premium.monthly * region.multiplier)} ${region.symbol} / شهر`,
    },
    {
      id: "coach",
      name: TIER_LABELS.coach,
      price: Math.round(TIER_PRICES_USD.coach.monthly * region.multiplier * 100) / 100,
      currency: region.currency,
      displayPrice: `${Math.round(TIER_PRICES_USD.coach.monthly * region.multiplier)} ${region.symbol} / شهر`,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Feature lists (for UI display)
// ═══════════════════════════════════════════════════════════════════

export const PREMIUM_FEATURES_LIST = [
  "خريطة علاقات لا محدودة",
  "خطة تعافي يومية مخصصة بالذكاء الاصطناعي",
  "تحليل الأنماط المتكررة في علاقاتك",
  "مساعد ذكي (نَواة) بلا حدود",
  "تقارير PDF شاملة",
  "تدريب تكتيكي + محاكاة حدود",
  "أولوية في الدعم والمتابعة",
];

export const COACH_FEATURES_LIST = [
  ...PREMIUM_FEATURES_LIST,
  "لوحة تحكم للعملاء (B2B)",
  "إدارة متعددة الحسابات",
  "API وتكامل خارجي",
  "برندينج مخصص",
  "دعم أولوية فائقة",
];

// ═══════════════════════════════════════════════════════════════════
// 🔐 Permission check
// ═══════════════════════════════════════════════════════════════════

export const TIER_PERMISSIONS: Record<PricingTier, string[]> = {
  basic: ["compass", "breathing", "basic_insights"],
  premium: [
    "compass", "breathing", "basic_insights",
    "drag_drop_map", "detachment_protocols",
    "sos_button", "victory_reports",
  ],
  coach: ["*"], // everything
};

export function hasPermission(tier: PricingTier, permission: string): boolean {
  if (tier === "coach") return true;
  return TIER_PERMISSIONS[tier].includes(permission);
}
