/**
 * Victory Engine — محرك الانتصار 🏆
 * ==========================================
 * يحلل سجل الأحداث لاستخراج مؤشرات النمو والسيطرة.
 */

import { useEventHistoryStore } from "@/domains/analytics/store/eventHistory.store";

export interface VictoryMetrics {
    growthVelocity: number;      // Higher means more positive shifts (inward/reconciliation)
    detachmentStrength: number;  // Measured by MAJOR_DETACHMENT frequency
    keystoneImpact: number;      // Count of KEYSTONE_RESOLVED
    harmonyScore: number;        // Overall balance (0-100)
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    date: number;
}

/**
 * Calculates current tactical metrics based on recent history.
 */
export const calculateVictoryMetrics = (): VictoryMetrics => {
    const events = useEventHistoryStore.getState().events;

    if (events.length === 0) {
        return { growthVelocity: 0, detachmentStrength: 0, keystoneImpact: 0, harmonyScore: 50 };
    }

    const inwardCount = events.filter(e => e.type === "ORBIT_SHIFT_INWARD" || e.type === "RECONCILIATION").length;
    const outwardCount = events.filter(e => e.type === "ORBIT_SHIFT_OUTWARD" || e.type === "MAJOR_DETACHMENT").length;
    const keystoneCount = events.filter(e => e.type === "KEYSTONE_RESOLVED").length;
    const detachmentCount = events.filter(e => e.type === "MAJOR_DETACHMENT").length;

    // growthVelocity: favors inward movement (trust building)
    const growthVelocity = Math.min(100, (inwardCount / events.length) * 100);

    // detachmentStrength: favors the courage to move people out
    const detachmentStrength = Math.min(100, (detachmentCount * 25));

    // harmonyScore: A composite of action vs chaos
    const harmonyScore = Math.min(100, 50 + (inwardCount * 5) - (outwardCount * 2) + (keystoneCount * 10));

    return {
        growthVelocity,
        detachmentStrength,
        keystoneImpact: keystoneCount,
        harmonyScore
    };
};

/**
 * Scans for "Medals of Honor" (Special Achievements).
 */
export const scanForAchievements = (): Achievement[] => {
    const events = useEventHistoryStore.getState().events;
    const achievements: Achievement[] = [];

    if (events.filter(e => e.type === "MAJOR_DETACHMENT").length >= 2) {
        achievements.push({
            id: "shield_of_truth",
            title: "درع الوضوح",
            description: "لقد أبعدت أكثر من ثقب أسود في وقت قصير. شجاعة استثنائية.",
            icon: "🛡️",
            date: Date.now()
        });
    }

    if (events.filter(e => e.type === "KEYSTONE_RESOLVED").length >= 1) {
        achievements.push({
            id: "strategic_master",
            title: "المخطط الاستراتيجي",
            description: "حل عقدة 'الحجر الأساسي' التي كانت تعيق نموك.",
            icon: "🔑",
            date: Date.now()
        });
    }

    return achievements;
};
