/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Domain: Billing — Subscription Service
 *
 * ينقل منطق subscriptionManager.ts للـ domain
 * مع re-exports للتوافق مع الكود القديم.
 */

import type { SubscriptionTier, SubscriptionData, EmotionalOffer, LegacyEmotionalOfferInput } from "../types";
import type { PricingTier } from "@/config/pricing";
import {
  TIER_LIMITS,
  TIER_LABELS,
  TIER_PRICES,
} from "../constants";

// ─── Storage Keys ───────────────────────────────────────

const SUB_KEY = "dawayir-subscription";
const OFFER_KEY = "dawayir-emotional-offer";

// ─── Helpers ────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

const DEFAULT_SUB: SubscriptionData = {
  tier: "basic",
  dailyAIMessages: 0,
  lastResetDate: todayStr(),
};

// ─── Load / Save ────────────────────────────────────────

export function loadSubscription(): SubscriptionData {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return { ...DEFAULT_SUB };
    const data = JSON.parse(raw) as SubscriptionData;

    if (data.lastResetDate !== todayStr()) {
      data.dailyAIMessages = 0;
      data.lastResetDate = todayStr();
      saveSubscription(data);
    }

    if (data.expiresAt && Date.now() > data.expiresAt) {
      data.tier = "basic";
      delete data.expiresAt;
      saveSubscription(data);
    }

    return data;
  } catch {
    return { ...DEFAULT_SUB };
  }
}

export function saveSubscription(data: SubscriptionData): void {
  try { localStorage.setItem(SUB_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

// ─── Queries ────────────────────────────────────────────

export function getCurrentTier(): SubscriptionTier {
  return loadSubscription().tier;
}

export function isPaidUser(): boolean {
  return getCurrentTier() !== "basic";
}

export function canSendAIMessage(): boolean {
  const sub = loadSubscription();
  const limits = TIER_LIMITS[sub.tier as PricingTier];
  if (limits.dailyAIMessages === -1) return true;
  return sub.dailyAIMessages < limits.dailyAIMessages;
}

export function getRemainingAIMessages(): number {
  const sub = loadSubscription();
  const limits = TIER_LIMITS[sub.tier];
  if (limits.dailyAIMessages === -1) return Infinity;
  return Math.max(0, limits.dailyAIMessages - sub.dailyAIMessages);
}

export function canAddMapNode(currentCount: number): boolean {
  const limits = TIER_LIMITS[getCurrentTier() as PricingTier];
  if (limits.maxMapNodes === -1) return true;
  return currentCount < limits.maxMapNodes;
}

export function getTierLimits() {
  return TIER_LIMITS[getCurrentTier() as PricingTier];
}

// ─── Actions ────────────────────────────────────────────

export function recordAIMessage(): void {
  const sub = loadSubscription();
  sub.dailyAIMessages += 1;
  saveSubscription(sub);
}

export function activateSubscription(tier: SubscriptionTier, durationDays: number): void {
  const sub = loadSubscription();
  sub.tier = tier;
  sub.expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  saveSubscription(sub);
}

export function grantEmotionalFreeMonth(): void {
  const sub = loadSubscription();
  sub.tier = "premium";
  const base = sub.expiresAt && sub.expiresAt > Date.now() ? sub.expiresAt : Date.now();
  sub.expiresAt = base + 30 * 24 * 60 * 60 * 1000;
  saveSubscription(sub);
  saveEmotionalOffer({
    id: `offer-${Date.now()}`,
    createdAt: Date.now(),
    type: "free_month",
    title: "هدية من الرحلة",
    message: "إحنا شايفين مجهودك. اتفعل لك شهر بريميوم مجاني دعمًا ليك.",
    expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    consumed: false,
  });
}

// ─── Emotional Offers ────────────────────────────────────

export function saveEmotionalOffer(offer: EmotionalOffer): void {
  try { localStorage.setItem(OFFER_KEY, JSON.stringify(offer)); } catch { /* noop */ }
}

export function setEmotionalOffer(input: LegacyEmotionalOfferInput): void {
  const durationDays = input.urgencyLevel === "high" ? 3 : input.urgencyLevel === "medium" ? 7 : 14;
  saveEmotionalOffer({
    id: `offer-${Date.now()}`,
    createdAt: Date.now(),
    type: input.discountPercentage && input.discountPercentage > 0 ? "premium_discount" : "free_month",
    title: input.title,
    message: input.message,
    discountPercent: input.discountPercentage,
    expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
    consumed: false,
  });
}

export function getEmotionalOffer(): EmotionalOffer | null {
  try {
    const raw = localStorage.getItem(OFFER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EmotionalOffer;
    if (parsed.expiresAt < Date.now()) { clearEmotionalOffer(); return null; }
    return parsed;
  } catch { return null; }
}

export function consumeEmotionalOffer(): void {
  const offer = getEmotionalOffer();
  if (!offer) return;
  offer.consumed = true;
  saveEmotionalOffer(offer);
}

export function clearEmotionalOffer(): void {
  try { localStorage.removeItem(OFFER_KEY); } catch { /* noop */ }
}

// ─── Server Sync ─────────────────────────────────────────

export async function syncSubscription(): Promise<void> {
  try {
    const { supabase } = await import("@/infrastructure/database");
    if (!supabase) return;

    const { safeGetSession, isSupabaseAbortError } = await import("@/services/supabaseClient");
    const session = await safeGetSession();
    if (!session?.user) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, subscription_status, current_period_end")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) return;

    const sub = loadSubscription();
    let newTier: SubscriptionTier = "basic";
    if (profile.role === "enterprise_admin") { newTier = "coach"; }
    else if (["active", "trialing"].includes(profile.subscription_status)) { newTier = "premium"; }

    const previousTier = sub.tier;
    sub.tier = newTier;
    if (profile.current_period_end) {
      sub.expiresAt = new Date(profile.current_period_end).getTime();
    }
    saveSubscription(sub);

    if (previousTier !== "premium" && newTier === "premium") {
      const offer = getEmotionalOffer();
      if (offer?.type === "premium_discount" && !offer.consumed) {
        consumeEmotionalOffer();
      }
    }
  } catch (err) {
    const { isSupabaseAbortError } = await import("@/services/supabaseClient");
    if (isSupabaseAbortError(err)) return;
    console.error("[Billing] Failed to sync subscription:", err);
  }
}

// Re-exports for backwards compat
export { TIER_LIMITS, TIER_LABELS, TIER_PRICES };
