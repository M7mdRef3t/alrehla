/**
 * Predictive Engine — المحرك التنبؤي 🔮
 * ==========================================
 * يحلل أنماط سلوك المستخدم لتحديد حالته النفسية (الفوضى vs النظام).
 * يهدف لتكييف الواجهة (Adaptation) بدلاً من مجرد عرض البيانات.
 */

import { useMapState } from "../state/mapState";
import { usePulseState } from "../state/pulseState";

export type UserState = "CHAOS" | "ORDER" | "FLOW";

export interface PredictiveInsight {
    entropyScore: number; // 0 (Order) -> 100 (Chaos)
    state: UserState;
    primaryFactor: "pulse_instability" | "map_clutter" | "engagement_gap" | "none";
}

/**
 * حساب "الإنتروبيا النفسية" (Psychological Entropy)
 * مقياس لمعدل العشوائية وعدم الاستقرار في تجربة المستخدم.
 */
export function calculateEntropy(): PredictiveInsight {
    const { nodes } = useMapState.getState();
    const { logs: pulseLogs } = usePulseState.getState(); // Last 90 logs

    let entropy = 0;
    let primaryFactor: PredictiveInsight["primaryFactor"] = "none";

    // 1. Pulse Instability (عدم استقرار النبض)
    // نأخذ آخر 7 قراءات
    const recentPulse = pulseLogs.slice(0, 7);
    if (recentPulse.length > 0) {
        const negativeMoods = recentPulse.filter(p =>
            ["anxious", "overwhelmed", "angry", "sad", "tense"].includes(p.mood)
        ).length;

        // Low energy frequency
        const lowEnergy = recentPulse.filter(p => p.energy <= 4).length;

        // كل مزاج سلبي يضيف 10 نقاط
        entropy += (negativeMoods * 10);
        // كل طاقة منخفضة تضيف 5 نقاط
        entropy += (lowEnergy * 5);

        if (negativeMoods >= 4) primaryFactor = "pulse_instability";
    }

    // 2. Map Clutter (فوضى الخريطة)
    // كثرة العقد في المدار الأحمر (خطر) أو الرمادي (انفصال)
    const redNodes = nodes.filter(n => n.ring === "red" && !n.isNodeArchived).length;
    const detachedNodes = nodes.filter(n => n.detachmentMode && !n.isNodeArchived).length;
    const totalNodes = nodes.filter(n => !n.isNodeArchived).length;

    entropy += (redNodes * 8);
    entropy += (detachedNodes * 5);

    // لو أكثر من 50% من العلاقات "صعبة"، ده مؤشر فوضى
    if (totalNodes > 0 && (redNodes + detachedNodes) / totalNodes > 0.5) {
        entropy += 20;
        if (primaryFactor === "none") primaryFactor = "map_clutter";
    }

    // 3. Engagement Gap (فجوة التفاعل) - Future implementation
    // يمكن قياسها بآخر دخول، لكن الـ Streak بيغطيها.

    // Normalization (0-100)
    entropy = Math.min(100, Math.max(0, entropy));

    // Determine State
    let state: UserState = "ORDER";
    if (entropy >= 60) {
        state = "CHAOS";
    } else if (entropy < 20 && totalNodes > 3) {
        // استقرار عالي مع وجود علاقات نشطة = Flow
        state = "FLOW";
    }

    return {
        entropyScore: entropy,
        state,
        primaryFactor
    };
}

/**
 * هل يجب تفعيل "نمط الاحتواء"؟ (للتهدئة)
 */
export function shouldActivateContainmentMode(): boolean {
    const insight = calculateEntropy();
    return insight.state === "CHAOS";
}

/**
 * هل يجب تفعيل "نمط النمو"؟ (للتحدي)
 */
export function shouldActivateGrowthMode(): boolean {
    const insight = calculateEntropy();
    return insight.state === "ORDER" || insight.state === "FLOW";
}
