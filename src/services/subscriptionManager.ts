import { safeGetSession, supabase, isSupabaseAbortError } from "./supabaseClient";
import { hasRecordedOfferConversion, recordEmotionalPricingEvent } from "./emotionalPricingAnalytics";
import {
  type PricingTier,
  type TierLimits,
  TIER_LIMITS as UNIFIED_TIER_LIMITS,
  TIER_LABELS as UNIFIED_TIER_LABELS,
  TIER_PRICES_USD,
} from "../config/pricing";

/**
 * Subscription Manager — مدير الاشتراكات
 * =========================================
 * يدير مستويات الاشتراك وحدود الاستخدام.
 * الآن: تفعيل محلي/يدوي فقط. قابل للتوسع لاحقاً.
 */

const SUB_KEY = "dawayir-subscription";

export type SubscriptionTier = PricingTier;

export interface SubscriptionData {
    tier: SubscriptionTier;
    expiresAt?: number; // timestamp
    /** عدد رسائل جارفيس المستخدمة اليوم */
    dailyAIMessages: number;
    /** تاريخ آخر إعادة تعيين */
    lastResetDate: string; // YYYY-MM-DD
    /** عدد الأشخاص في الخريطة (للـ free limit) */
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

export type { TierLimits } from "../config/pricing";

export const TIER_LIMITS = UNIFIED_TIER_LIMITS;

export const TIER_LABELS = UNIFIED_TIER_LABELS;

export const TIER_PRICES: Record<SubscriptionTier, string> = {
    basic: TIER_PRICES_USD.basic.label,
    premium: TIER_PRICES_USD.premium.label,
    coach: TIER_PRICES_USD.coach.label,
};

function getTodayStr(): string {
    return new Date().toISOString().split("T")[0];
}

const DEFAULT_SUB: SubscriptionData = {
    tier: "basic",
    dailyAIMessages: 0,
    lastResetDate: getTodayStr(),
};

const EMOTIONAL_OFFER_KEY = "dawayir-emotional-offer";

/* ── Load / Save ── */
export function loadSubscription(): SubscriptionData {
    try {
        const raw = localStorage.getItem(SUB_KEY);
        if (!raw) return { ...DEFAULT_SUB };
        const data = JSON.parse(raw) as SubscriptionData;

        // Reset daily counter if new day
        if (data.lastResetDate !== getTodayStr()) {
            data.dailyAIMessages = 0;
            data.lastResetDate = getTodayStr();
            saveSubscription(data);
        }

        // Check expiry
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
    try {
        localStorage.setItem(SUB_KEY, JSON.stringify(data));
    } catch { /* noop */ }
}

/* ── Checks ── */
export function getCurrentTier(): SubscriptionTier {
    return loadSubscription().tier;
}

export function getTierLimits(): TierLimits {
    return TIER_LIMITS[getCurrentTier()];
}

export function canSendAIMessage(): boolean {
    const sub = loadSubscription();
    const limits = TIER_LIMITS[sub.tier];
    if (limits.dailyAIMessages === -1) return true;
    return sub.dailyAIMessages < limits.dailyAIMessages;
}

export function recordAIMessage(): void {
    const sub = loadSubscription();
    sub.dailyAIMessages += 1;
    saveSubscription(sub);
}

export function getRemainingAIMessages(): number {
    const sub = loadSubscription();
    const limits = TIER_LIMITS[sub.tier];
    if (limits.dailyAIMessages === -1) return Infinity;
    return Math.max(0, limits.dailyAIMessages - sub.dailyAIMessages);
}

export function canAddMapNode(currentCount: number): boolean {
    const limits = getTierLimits();
    if (limits.maxMapNodes === -1) return true;
    return currentCount < limits.maxMapNodes;
}

export function isPaidUser(): boolean {
    return getCurrentTier() !== "basic";
}

/** تفعيل اشتراك (للاختبار أو التفعيل اليدوي) */
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

export function saveEmotionalOffer(offer: EmotionalOffer): void {
    try {
        localStorage.setItem(EMOTIONAL_OFFER_KEY, JSON.stringify(offer));
    } catch {
        // noop
    }
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
        const raw = localStorage.getItem(EMOTIONAL_OFFER_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as EmotionalOffer;
        if (parsed.expiresAt < Date.now()) {
            clearEmotionalOffer();
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function consumeEmotionalOffer(): void {
    const offer = getEmotionalOffer();
    if (!offer) return;
    offer.consumed = true;
    saveEmotionalOffer(offer);
}

export function clearEmotionalOffer(): void {
    try {
        localStorage.removeItem(EMOTIONAL_OFFER_KEY);
    } catch {
        // noop
    }
}

/** 
 * مزامنة حالة الاشتراك مع السيرفر (Supabase)
 */
export async function syncSubscription(): Promise<void> {
    if (!supabase) return;

    try {
        const session = await safeGetSession();
        if (!session?.user) return;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, subscription_status, current_period_end')
            .eq('id', session.user.id)
            .single();

        if (error || !profile) return;

        const sub = loadSubscription();

        // Map backend role/status to frontend tier
        let newTier: SubscriptionTier = 'basic';
        if (profile.role === 'enterprise_admin') {
            newTier = 'coach'; // enterprise_admin maps to coach (full access)
        } else if (profile.subscription_status === 'active' || profile.subscription_status === 'trialing') {
            newTier = 'premium';
        }

        const previousTier = sub.tier;
        sub.tier = newTier;
        if (profile.current_period_end) {
            sub.expiresAt = new Date(profile.current_period_end).getTime();
        }

        saveSubscription(sub);
        if (previousTier !== "premium" && newTier === "premium") {
            const emotionalOffer = getEmotionalOffer();
            if (
                emotionalOffer?.type === "premium_discount" &&
                !hasRecordedOfferConversion(emotionalOffer.id)
            ) {
                recordEmotionalPricingEvent("offer_converted_to_premium", {
                    offerId: emotionalOffer.id
                });
            }
        }
        console.warn("🔄 Subscription synced with server:", newTier);
  } catch (err) {
    if (isSupabaseAbortError(err)) return;
    console.error("Failed to sync subscription:", err);
  }
}

