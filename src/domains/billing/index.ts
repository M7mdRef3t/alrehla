/**
 * Domain: Billing — Public API
 */

// Types
export type {
  SubscriptionTier,
  TierLimits,
  PaymentGateway,
  PaymentStatus,
  SubscriptionData,
  EmotionalOffer,
  LegacyEmotionalOfferInput,
  TransactionSummary,
  RevenueMetricSnapshot,
} from "./types";

// Constants
export { TIER_LIMITS, TIER_LABELS, TIER_PRICES } from "./constants";

// Subscription service
export {
  loadSubscription,
  saveSubscription,
  getCurrentTier,
  isPaidUser,
  canSendAIMessage,
  getRemainingAIMessages,
  canAddMapNode,
  getTierLimits,
  recordAIMessage,
  activateSubscription,
  grantEmotionalFreeMonth,
  saveEmotionalOffer,
  setEmotionalOffer,
  getEmotionalOffer,
  consumeEmotionalOffer,
  clearEmotionalOffer,
  syncSubscription,
} from "./services/subscription.service";

// Revenue service
export { revenueService } from "./services/revenue.service";
