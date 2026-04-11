/**
 * @deprecated
 * Bridge file — يعيد التصدير من domain الجديد.
 * سيُزال هذا الملف بعد تحديث كل الـ imports.
 *
 * استخدم بدلاً منه:
 *   import { ... } from '@/domains/billing'
 */
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
  TIER_LIMITS,
  TIER_LABELS,
  TIER_PRICES,
} from "@/domains/billing";

export type {
  SubscriptionTier,
  SubscriptionData,
  EmotionalOffer,
  LegacyEmotionalOfferInput,
  TierLimits,
} from "@/domains/billing";
