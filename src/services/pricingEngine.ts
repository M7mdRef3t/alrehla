/**
 * Pricing Engine — محرك التسعير العالمي (PPP Logic) 🌍
 * =====================================================
 * يقرأ من ملف التسعير الموحد `config/pricing.ts`.
 * يدعم PPP (Purchasing Power Parity) للأسواق المختلفة.
 */

export type { PricingTier, LocalizedPrice, TierLimits } from "../config/pricing";

export {
  getLocalizedPricing as getAdjustedPricing,
  TIER_PERMISSIONS,
  hasPermission,
  TIER_PRICES_USD,
  TIER_LABELS,
  TIER_LIMITS,
  REGIONAL_PRICING,
} from "../config/pricing";
