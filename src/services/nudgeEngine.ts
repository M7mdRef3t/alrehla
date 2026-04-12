/**
 * Nudge Engine — محرك التنبيهات الذكية
 * ========================================
 * يرسل تنبيهات سلوكية مبنية على سلوك المستخدم الفعلي.
 * ليست عشوائية — مبنية على بيانات حقيقية.
 */

import { loadStreak, isStreakAtRisk, isStreakBroken } from "./streakSystem";
import { loadUserMemory } from "./userMemory";
import { getStoreRecommendations } from "./storeAdvisor";

export interface Nudge {
    id: string;
    type: "streak_risk" | "returning" | "milestone" | "boundary_reminder" | "quick_win" | "streak_broken" | "store_recommendation";
    title: string;
    message: string;
    cta?: string;
    /** إجراء الـ CTA — لا يُستخدم لـ navigation، فقط overlays آمنة */
    ctaAction?: "pulse_check" | "open_assistant" | "dismiss_only" | "share_stats" | "open_store";
    priority: 1 | 2 | 3; // 1=عالي, 3=منخفض
    icon: string;
}

const NUDGE_SHOWN_KEY = "dawayir-nudges-shown";

function getShownNudges(): Set<string> {
    try {
        const raw = localStorage.getItem(NUDGE_SHOWN_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

function markNudgeShown(id: string): void {
    const shown = getShownNudges();
    shown.add(id);
    // Keep only last 50
    const arr = Array.from(shown).slice(-50);
    try {
        localStorage.setItem(NUDGE_SHOWN_KEY, JSON.stringify(arr));
    } catch { /* noop */ }
}

/**
 * يُحدد التنبيه الأنسب للمستخدم الآن.
 * يُعيد null لو مفيش تنبيه مناسب.
 */
export function getNextNudge(): Nudge | null {
    const streak = loadStreak();
    const memory = loadUserMemory();
    const shown = getShownNudges();

    // Priority 1: Streak at risk (≥3 days, لم يُسجَّل اليوم)
    if (isStreakAtRisk() && streak.currentStreak >= 3) {
        const id = `streak-risk-${new Date().toISOString().split("T")[0]}`;
        if (!shown.has(id)) {
            return {
                id,
                type: "streak_risk",
                title: "عدّادك مستنيك ✨",
                message: `${streak.currentStreak} يوم متتالي — خطوة واحدة النهاردة تحافظ عليهم`,
                cta: "سجّل نبضتي",
                ctaAction: "pulse_check",
                priority: 1,
                icon: "✨",
            };
        }
    }

    // Priority 1: Milestone streak
    const milestones = [7, 14, 30, 60, 100];
    for (const m of milestones) {
        const id = `milestone-${m}`;
        if (streak.currentStreak === m && !shown.has(id)) {
            return {
                id,
                type: "milestone",
                title: `${m} يوم متتالي! 🏆`,
                message: `وصلت لـ ${m} يوم في الرحلة. ده إنجاز يستاهل يتشارك!`,
                cta: "شارك إنجازك",
                ctaAction: "share_stats",
                priority: 1,
                icon: "🏆",
            };
        }
    }


    // Priority 2: Returning user with recurring goal
    if (memory.totalSessions > 1 && memory.recurringGoals.length > 0) {
        const id = `goal-reminder-${new Date().toISOString().split("T")[0]}`;
        if (!shown.has(id)) {
            return {
                id,
                type: "returning",
                title: "حاجة شاغلاك 🎯",
                message: `كنت شاغل بالك بـ "${memory.recurringGoals[0]}" — إيه الجديد؟`,
                cta: "فتح المساعد",
                ctaAction: "open_assistant",
                priority: 2,
                icon: "🎯",
            };
        }
    }

    // Priority 3: Absence nudge (3+ days)
    const lastActive = streak.lastActiveDate;
    if (lastActive) {
        const diff = (new Date().getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
        if (diff >= 3) {
            const id = `absence-${new Date().toISOString().split("T")[0]}`;
            if (!shown.has(id)) {
                return {
                    id,
                    type: "returning",
                    title: "وحشتنا 🤗",
                    message: "التعافي مش سباق، هو رحلة. المهم إنك رجعت النهاردة.",
                    ctaAction: "dismiss_only",
                    priority: 3,
                    icon: "🤗",
                };
            }
        }
    }

    // Priority 3: Streak broken — كان عنده streak وانكسر (مستخدم قديم فقط)
    if (isStreakBroken() && streak.currentStreak === 0 && memory.totalSessions > 0) {
        const id = `streak-broken-${new Date().toISOString().split("T")[0]}`;
        if (!shown.has(id)) {
            return {
                id,
                type: "streak_broken",
                title: "الانقطاع جزء من الرحلة 🤍",
                message: "مش لازم تكون مثالياً. أهم حاجة إنك رجعت. هنبدأ من هنا.",
                ctaAction: "dismiss_only",
                priority: 3,
                icon: "🤍",
            };
        }
    }

    // Priority 3: Quick win — فقط للمستخدم اللي سبق استخدم التطبيق (مش للجديد)
    if (streak.currentStreak === 0 && memory.totalSessions > 0) {
        const id = `quick-win-${new Date().toISOString().split("T")[0]}`;
        if (!shown.has(id)) {
            return {
                id,
                type: "quick_win",
                title: "خطوة واحدة بس 🌱",
                message: "مش محتاج تعمل حاجة كبيرة. ارجع لرحلتك وخد نفس واحد.",
                cta: "تمام",
                ctaAction: "dismiss_only",
                priority: 3,
                icon: "🌱",
            };
        }
    }

    // 6. توصية ذكية من المتجر (AI Store Recommendation)
    // إذا كان هناك شيء ذو أولوية عالية جداً (مثلاً طاقة منخفضة جداً)
    const storeRecs = getStoreRecommendations([]);
    const highPriorityRec = storeRecs.find((r) => r.priority >= 4);

    if (highPriorityRec && !shown.has(`rec_${highPriorityRec.itemId}`)) {
        return {
            id: `rec_${highPriorityRec.itemId}`,
            type: "store_recommendation",
            title: "تطوير مرشح من جارفيس",
            message: highPriorityRec.reason,
            cta: "استكشاف التطوير",
            ctaAction: "open_store",
            priority: 1, // عالي
            icon: "Sparkles"
        };
    }

    return null;
}

export function dismissNudge(id: string): void {
    markNudgeShown(id);
}
