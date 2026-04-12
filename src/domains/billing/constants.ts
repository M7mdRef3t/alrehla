/**
 * Domain: Billing — Constants & Config
 * (Re-exports from @/config/pricing for domain isolation)
 */

import {
  TIER_LIMITS as PRICING_TIER_LIMITS,
  TIER_LABELS as PRICING_TIER_LABELS,
  TIER_PRICES_USD,
} from "@/config/pricing";
import type { SubscriptionTier } from "./types";

export { PRICING_TIER_LIMITS as TIER_LIMITS, PRICING_TIER_LABELS as TIER_LABELS };

export const TIER_PRICES: Record<SubscriptionTier, string> = {
  basic: TIER_PRICES_USD.basic.label,
  premium: TIER_PRICES_USD.premium.label,
  coach: TIER_PRICES_USD.coach.label,
};
