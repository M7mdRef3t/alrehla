/**
 * ⚔️ Reciprocity Engine — محرك ميزان الحقيقة
 * ============================================
 * يقيس التوازن الحقيقي في العلاقات:
 * كم أعطيت vs كم أخذت — بالأفعال مش بالمشاعر.
 */

import type { MapNode } from "@/modules/map/mapTypes";

export interface ReciprocityData {
    givenCount: number;      // عدد مرات العطاء
    receivedCount: number;   // عدد مرات الأخذ
    lastGivenAt?: number;    // تاريخ آخر عطاء
    lastReceivedAt?: number; // تاريخ آخر أخذ
    brokenPromises: number;  // وعود مكسورة
    cancelledMeets: number;  // لقاءات ملغية
}

export interface ReciprocityScore {
    /** 0-100 — 50 = متوازن، <30 = أنت تعطي بزيادة، >70 = أنت تاخد بزيادة */
    index: number;
    /** تصنيف نصي */
    label: "balanced" | "over_giving" | "over_taking" | "one_sided" | "unknown";
    /** رسالة للمستخدم */
    message: string;
    /** هل هناك خلل واضح */
    hasImbalance: boolean;
}

/**
 * حساب مؤشر المقابل لشخص معين
 */
export function calculateReciprocityIndex(node: MapNode): ReciprocityScore {
    const reciprocity = node.reciprocity;

    if (!reciprocity || (reciprocity.givenCount === 0 && reciprocity.receivedCount === 0)) {
        return {
            index: 50,
            label: "unknown",
            message: "لسه ما سجلتش بيانات كافية. سجل تفاعلاتك عشان نقدر نكشف لك الحقيقة.",
            hasImbalance: false
        };
    }

    const total = reciprocity.givenCount + reciprocity.receivedCount;
    const receivedRatio = reciprocity.receivedCount / total;
    const index = Math.round(receivedRatio * 100);

    // Apply broken promises penalty
    const promisePenalty = Math.min(reciprocity.brokenPromises * 5, 20);
    const cancelPenalty = Math.min(reciprocity.cancelledMeets * 3, 15);
    const adjustedIndex = Math.max(0, Math.min(100, index - promisePenalty - cancelPenalty));

    if (adjustedIndex >= 40 && adjustedIndex <= 60) {
        return {
            index: adjustedIndex,
            label: "balanced",
            message: "العلاقة متوازنة — الأخذ والعطاء في حالة صحية.",
            hasImbalance: false
        };
    }

    if (adjustedIndex < 20) {
        return {
            index: adjustedIndex,
            label: "one_sided",
            message: `إنت بتعطي ${reciprocity.givenCount} مرة وبتاخد ${reciprocity.receivedCount} بس. ده مش كرم — ده استنزاف.`,
            hasImbalance: true
        };
    }

    if (adjustedIndex < 40) {
        return {
            index: adjustedIndex,
            label: "over_giving",
            message: `بتعطي أكتر مما بتاخد. ${reciprocity.givenCount} عطاء مقابل ${reciprocity.receivedCount} أخذ.`,
            hasImbalance: true
        };
    }

    if (adjustedIndex > 60) {
        return {
            index: adjustedIndex,
            label: "over_taking",
            message: `بتاخد أكتر مما بتعطي. فكر — ده شيء مستدام؟`,
            hasImbalance: false // Not alarming, just awareness
        };
    }

    return {
        index: adjustedIndex,
        label: "balanced",
        message: "العلاقة في توازن معقول.",
        hasImbalance: false
    };
}

/**
 * توليد بصيرة ذكية بناءً على بيانات المقابل
 */
export function generateReciprocityInsight(node: MapNode): string | null {
    const reciprocity = node.reciprocity;
    if (!reciprocity) return null;

    const { givenCount, receivedCount, brokenPromises, cancelledMeets } = reciprocity;
    const total = givenCount + receivedCount;
    if (total < 3) return null;

    const insights: string[] = [];

    // Broken promises pattern
    if (brokenPromises >= 3) {
        insights.push(`${brokenPromises} وعود مكسورة — الكلام رخيص، الأفعال هي الحقيقة.`);
    }

    // Cancelled meets pattern
    if (cancelledMeets >= 3) {
        insights.push(`${cancelledMeets} لقاءات ملغية — مين اللي فعلاً بيبذل مجهود هنا؟`);
    }

    // Extreme imbalance
    if (givenCount > 0 && receivedCount === 0) {
        insights.push(`عطاء من غير مقابل — ده حب ولا عادة؟`);
    }

    // Long time since received
    if (reciprocity.lastReceivedAt && reciprocity.lastGivenAt) {
        const daysSinceReceived = (Date.now() - reciprocity.lastReceivedAt) / (24 * 60 * 60 * 1000);
        const daysSinceGiven = (Date.now() - reciprocity.lastGivenAt) / (24 * 60 * 60 * 1000);
        if (daysSinceReceived > 30 && daysSinceGiven < 7) {
            insights.push(`آخر مرة أخذت منه من ${Math.floor(daysSinceReceived)} يوم، لكنك أعطيت من ${Math.floor(daysSinceGiven)} يوم بس.`);
        }
    }

    return insights.length > 0 ? insights[0] : null;
}

/**
 * Default reciprocity data for new nodes
 */
export function createDefaultReciprocity(): ReciprocityData {
    return {
        givenCount: 0,
        receivedCount: 0,
        brokenPromises: 0,
        cancelledMeets: 0
    };
}
