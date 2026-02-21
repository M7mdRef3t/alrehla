import { supabase } from "./supabaseClient";
import { hasRecordedOfferConversion, recordEmotionalPricingEvent } from "./emotionalPricingAnalytics";

/**
 * Subscription Manager — مدير الاشتراكات
 * =========================================
 * يدير مستويات الاشتراك وحدود الاستخدام.
 * الآن: Local-only (بدون Stripe). قابل للتوسع لاحقاً.
 */

const SUB_KEY = "dawayir-subscription";

export type SubscriptionTier = "free" | "premium" | "coach";

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

export interface TierLimits {
    maxMapNodes: number;         // -1 = لا حد
    dailyAIMessages: number;     // -1 = لا حد
    canExportPDF: boolean;
    canAccessTraining: boolean;
    canShareMap: boolean;
    canAccessB2B: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
    free: {
        maxMapNodes: 3,
        dailyAIMessages: 5,
        canExportPDF: false,
        canAccessTraining: false,
        canShareMap: true,
        canAccessB2B: false,
    },
    premium: {
        maxMapNodes: -1,
        dailyAIMessages: -1,
        canExportPDF: true,
        canAccessTraining: true,
        canShareMap: true,
        canAccessB2B: false,
    },
    coach: {
        maxMapNodes: -1,
        dailyAIMessages: -1,
        canExportPDF: true,
        canAccessTraining: true,
        canShareMap: true,
        canAccessB2B: true,
    },
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
    free: "مجاني",
    premium: "بريميوم 🎖️",
    coach: "كوتش (PRO) 👑",
};

export const TIER_PRICES: Record<SubscriptionTier, string> = {
    free: "$0",
    premium: "$9/شهر",
    coach: "$49/شهر",
};

function getTodayStr(): string {
    return new Date().toISOString().split("T")[0];
}

const DEFAULT_SUB: SubscriptionData = {
    tier: "free",
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
            data.tier = "free";
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
    return getCurrentTier() !== "free";
}

/** تفعيل اشتراك (للاختبار — سيُستبدل بـ Stripe webhook) */
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, subscription_status, current_period_end')
            .eq('id', session.user.id)
            .single();

        if (error || !profile) return;

        const sub = loadSubscription();

        // Map backend role/status to frontend tier
        let newTier: SubscriptionTier = 'free';
        if (profile.role === 'coach') {
            newTier = 'coach';
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
        console.log("🔄 Subscription synced with server:", newTier);
    } catch (err) {
        console.error("Failed to sync subscription:", err);
    }
}
