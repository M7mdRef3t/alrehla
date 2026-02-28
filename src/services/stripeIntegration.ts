/**
 * STRIPE_INTEGRATION.ts — تكامل كامل مع Stripe للاشتراكات والدفع
 * =====================================================
 * نظام أتمتة الدفع والفواتير والاشتراكات
 */

import { PRICING_PLANS, type SubscriptionTier, type SubscriptionPlan } from "../ai/revenueAutomation";
import { decisionEngine } from "../ai/decision-framework";

// ═══════════════════════════════════════════════════════════════════════════
// 🔑 Stripe Configuration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ملاحظة: هذا الكود يفترض أن Stripe SDK مثبّت:
 * npm install stripe @stripe/stripe-js
 *
 * وأن Environment Variables موجودة:
 * VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
 * STRIPE_SECRET_KEY=sk_test_... (backend only)
 */

export const STRIPE_CONFIG = {
  publishableKey: readPublicEnv("VITE_STRIPE_PUBLISHABLE_KEY"),
  // Price IDs من Stripe Dashboard
  priceIds: {
    premium: readPublicEnv("VITE_STRIPE_PRICE_PREMIUM") || "price_xxx",
    coach: readPublicEnv("VITE_STRIPE_PRICE_COACH") || "price_yyy",
  },
};

function readPublicEnv(key: string): string {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    const value = metaEnv?.[key];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {
    // ignore import.meta access errors in non-Vite contexts
  }

  try {
    const nextPublic = process.env[key.replace("VITE_", "NEXT_PUBLIC_")];
    if (typeof nextPublic === "string" && nextPublic.length > 0) return nextPublic;
    const direct = process.env[key];
    if (typeof direct === "string" && direct.length > 0) return direct;
  } catch {
    // process may be unavailable in some browser contexts
  }

  return "";
}

// ═══════════════════════════════════════════════════════════════════════════
// 📦 Subscription Types
// ═══════════════════════════════════════════════════════════════════════════

export interface StripeSubscription {
  id: string;
  userId: string;
  tier: 'free' | 'premium' | 'coach';
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing";
  currentPeriodEnd: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ Stripe Service Class
// ═══════════════════════════════════════════════════════════════════════════

export class StripeService {
  /**
   * ─────────────────────────────────────────────────────────────────
   * إنشاء Checkout Session للاشتراك
   * ─────────────────────────────────────────────────────────────────
   */
  async createCheckoutSession(params: {
    userId: string;
    tier: 'premium' | 'coach';
  }): Promise<{ url: string } | null> {
    console.warn("💳 Creating Stripe checkout session...", params);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: params.userId,
          priceId: STRIPE_CONFIG.priceIds[params.tier],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { url: string };
      return data;
    } catch (error) {
      console.error("❌ Failed to create checkout session:", error);
      return null;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * إلغاء الاشتراك في نهاية الفترة
   * ─────────────────────────────────────────────────────────────────
   */
  async cancelSubscription(params: {
    userId: string;
    subscriptionId: string;
    immediately?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    console.warn("🛑 Canceling subscription...", params);

    try {
      const response = await fetch("/api/checkout/cancel", { // Update path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: params.subscriptionId,
          immediately: params.immediately || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { success: boolean; message: string };

      console.warn("✅ Subscription canceled:", data.message);

      // تسجيل القرار
      await decisionEngine.execute({
        type: "subscription_cancelled",
        reasoning: `User ${params.userId} cancelled subscription`,
        timestamp: Date.now(),
        payload: { userId: params.userId, subscriptionId: params.subscriptionId },
        outcome: "executed",
      });

      return data;
    } catch (error) {
      console.error("❌ Failed to cancel subscription:", error);
      return { success: false, message: String(error) };
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * استرجاع معلومات الاشتراك الحالي
   * ─────────────────────────────────────────────────────────────────
   */
  async getSubscription(userId: string): Promise<StripeSubscription | null> {
    console.warn("📋 Fetching subscription for user:", userId);

    try {
      const response = await fetch(`/api/user/subscription?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("ℹ️ No active subscription found");
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as StripeSubscription;

      console.warn("✅ Subscription fetched:", data);
      return data;
    } catch (error) {
      console.error("❌ Failed to fetch subscription:", error);
      return null;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * إنشاء Portal Session لإدارة الاشتراك
   * ─────────────────────────────────────────────────────────────────
   */
  async createPortalSession(params: {
    userId: string;
    returnUrl: string;
  }): Promise<{ url: string } | null> {
    console.warn("🔗 Creating customer portal session...");

    try {
      const response = await fetch("/api/checkout/portal", { // Update path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: params.userId,
          returnUrl: params.returnUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { url: string };

      console.warn("✅ Portal session created");
      return data;
    } catch (error) {
      console.error("❌ Failed to create portal session:", error);
      return null;
    }
  }
/**
   * ─────────────────────────────────────────────────────────────────
   * تحديث أسعار الاشتراكات
   * ─────────────────────────────────────────────────────────────────
   */
  async updatePricing(prices: { premium: number; coach: number }): Promise<{ success: boolean; message: string }> {
    console.warn("🔄 Updating Stripe prices...", prices);

    try {
      const response = await fetch("/api/stripe/update-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prices),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as { success: boolean; message: string };
      console.warn("✅ Stripe prices updated successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Failed to update Stripe prices:", error);
      return { success: false, message: String(error) };
    }
  }
}

// 🧪 Singleton Instance
export const stripeService = new StripeService();

// 🔄 Subscription Helpers

/**
 * التحقق من صلاحية الاشتراك
 */
export function isSubscriptionActive(subscription: StripeSubscription | null): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return false;
  }
  const expiryDate = new Date(subscription.currentPeriodEnd).getTime();
  if (expiryDate < Date.now()) return false;
  return true;
}

/**
 * الحصول على الـ Tier الحالي للمستخدم
 */
export function getCurrentTier(
  subscription: StripeSubscription | null
): SubscriptionTier {
  if (!subscription || !isSubscriptionActive(subscription)) {
    return "free";
  }
  return subscription.tier;
}

/**
 * التحقق من الصلاحيات بناءً على الـ Tier
 */
export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: keyof SubscriptionPlan['features']
): boolean {
  const plan = PRICING_PLANS[tier];
  const featureValue = plan.features[feature];

  if (typeof featureValue === "boolean") return featureValue;
  if (typeof featureValue === "number") return featureValue > 0;
  if (typeof featureValue === "string") return featureValue !== "never";

  return false;
}


/**
 * التحقق من الحد الأقصى للاستخدام
 */
export function checkUsageLimit(
  tier: SubscriptionTier,
  feature: keyof typeof PRICING_PLANS.free.features,
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
  const plan = PRICING_PLANS[tier];
  const limit = plan.features[feature] as number;

  if (typeof limit !== "number") {
    return { allowed: true, limit: Infinity, remaining: Infinity };
  }

  const remaining = Math.max(0, limit - currentUsage);
  const allowed = currentUsage < limit;

  return { allowed, limit, remaining };
}

