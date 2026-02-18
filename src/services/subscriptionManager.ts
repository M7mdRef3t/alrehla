/**
 * Subscription Manager — مدير الاشتراكات
 * =========================================
 * يدير مستويات الاشتراك وحدود الاستخدام.
 * الآن: Local-only (بدون Stripe). قابل للتوسع لاحقاً.
 */

const SUB_KEY = "dawayir-subscription";

export type SubscriptionTier = "free" | "commander" | "general";

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
    commander: {
        maxMapNodes: -1,
        dailyAIMessages: -1,
        canExportPDF: true,
        canAccessTraining: true,
        canShareMap: true,
        canAccessB2B: false,
    },
    general: {
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
    commander: "قائد 🎖️",
    general: "جنرال 👑",
};

export const TIER_PRICES: Record<SubscriptionTier, string> = {
    free: "$0",
    commander: "$7/شهر",
    general: "$25/شهر",
};

function getTodayStr(): string {
    return new Date().toISOString().split("T")[0];
}

const DEFAULT_SUB: SubscriptionData = {
    tier: "free",
    dailyAIMessages: 0,
    lastResetDate: getTodayStr(),
};

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
