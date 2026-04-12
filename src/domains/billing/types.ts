/**
 * Domain: Billing — Full Types
 */

import type { PricingTier, TierLimits as PricingTierLimits } from "@/config/pricing";

// Alias PricingTier → SubscriptionTier for domain naming clarity
export type SubscriptionTier = PricingTier;
export type { PricingTierLimits as TierLimits };


export type PaymentGateway = "stripe" | "gumroad" | "direct" | "manual";
export type PaymentStatus = "confirmed" | "pending" | "failed";

export interface SubscriptionData {
  tier: SubscriptionTier;
  expiresAt?: number;
  dailyAIMessages: number;
  lastResetDate: string;
  mapNodeCount?: number;
}

export interface EmotionalOffer {
  id: string;
  createdAt: number;
  type: "free_month" | "premium_discount";
  title: string;
  message: string;
  discountPercent?: number;
  expiresAt: number;
  consumed: boolean;
}

export interface LegacyEmotionalOfferInput {
  title: string;
  message: string;
  discountPercentage?: number;
  urgencyLevel?: "low" | "medium" | "high";
}

export interface TransactionSummary {
  id: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  usdEquivalent: number;
  status: PaymentStatus;
  timestamp: string;
  market: string;
}

export interface RevenueMetricSnapshot {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  arpu: number;
  regionalResonance: Record<string, number>;
}
