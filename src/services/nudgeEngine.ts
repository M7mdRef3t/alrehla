/**
 * Nudge Engine — محرك التنبيهات الذكية
 * ========================================
 * يرسل تنبيهات سلوكية مبنية على سلوك المستخدم الفعلي.
 * ليست عشوائية — مبنية على بيانات حقيقية.
 */

import { loadStreak, isStreakAtRisk } from "./streakSystem";
import { loadUserMemory } from "./userMemory";

export interface Nudge {
    id: string;
    type: "streak_risk" | "returning" | "milestone" | "boundary_reminder" | "quick_win";
    title: string;
    message: string;
    cta?: string;
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

    // Priority 1: Streak at risk
    if (isStreakAtRisk() && streak.currentStreak >= 3) {
        const id = `streak-risk-${new Date().toISOString().split("T")[0]}`;
        if (!shown.has(id)) {
            return {
                id,
                type: "streak_risk",
                title: "عدّادك مستنيك ✨",
                message: `${streak.currentStreak} يوم متتالي — خطوة واحدة النهاردة تحافظ عليهم`,
                cta: "سجّل دخولي",
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
                message: `وصلت لـ ${m} يوم في الرحلة. ده إنجاز حقيقي يا بطل.`,
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
                    priority: 3,
                    icon: "🤗",
                };
            }
        }
    }

    // Priority 3: Quick win suggestion
    if (streak.currentStreak === 0) {
        const id = `quick-win-${new Date().toISOString().split("T")[0]}`;
        if (!shown.has(id)) {
            return {
                id,
                type: "quick_win",
                title: "خطوة واحدة بس 🌱",
                message: "مش محتاج تعمل حاجة كبيرة. افتح التطبيق وخد نفس واحد.",
                cta: "يلّا نبدأ",
                priority: 3,
                icon: "🌱",
            };
        }
    }

    return null;
}

export function dismissNudge(id: string): void {
    markNudgeShown(id);
}
