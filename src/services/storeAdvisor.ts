import { buildLifeContext, LifeContext } from "./lifeAdvisor";
import { STORE_ITEMS, StoreItem } from "@/data/storeItems";

export interface StoreRecommendation {
    itemId: string;
    reason: string;
    priority: number; // 1-5
    discountPercent?: number;
}

/**
 * Analyze life context to recommend products from the store
 */
export function getStoreRecommendations(purchasedItemIds: string[]): StoreRecommendation[] {
    const ctx = buildLifeContext();
    const recommendations: StoreRecommendation[] = [];

    const isOwned = (id: string) => purchasedItemIds.includes(id);

    // ─── 1. Logic for AI Personas (Evolutions) ──────────────────────
    
    // If Work domain is weak or active problems are high -> Commander
    if (!isOwned("ai_commander") && ((ctx.lifeScore?.domains.work || 100) < 50 || ctx.activeProblems.length > 3)) {
        recommendations.push({
            itemId: "ai_commander",
            reason: "شايف إن الدنيا زحمة والتركيز قل شوية، 'القائد' هيديك الحسم اللي محتاجه عشان تخلص المشاكل المفتوحة دي.",
            priority: 5
        });
    }

    // If Spirit/Self is weak or energy is consistently chaotic -> Sage
    if (!isOwned("ai_sage") && ((ctx.lifeScore?.domains.spirit || 100) < 50 || (ctx.lifeScore?.domains.self || 100) < 50)) {
        recommendations.push({
            itemId: "ai_sage",
            reason: "أنت محتاج لحظة هدوء وتأمل أعمق. 'الحكيم' هيساعدك تشوف الصورة الكبيرة بهدوء وسكينة.",
            priority: 4
        });
    }

    // ─── 2. Logic for Themes (Sanctuaries) ─────────────────────────

    // If Energy is low -> Emerald (Calming)
    if (!isOwned("theme_emerald") && (ctx.currentEnergy || 10) < 4) {
        recommendations.push({
            itemId: "theme_emerald",
            reason: "طاقتك منخفضة بقالها فترة، واحة الزمرد هتاخد عينك لمكان أهدى وتساعدك تفصل عن دوشة اليوم.",
            priority: 4,
            discountPercent: 15 // Smart discount for urgent mental rest
        });
    }

    // If High Discipline (Streak > 7) -> Gold (Trophy Theme)
    if (!isOwned("theme_gold") && ctx.streakDays >= 7) {
        recommendations.push({
            itemId: "theme_gold",
            reason: "أنت بقالك أسبوع بطل! مفيش أحسن من الثيم الذهبي عشان يعبر عن حالة الازدهار اللي بتعيشها دلوقتي.",
            priority: 3
        });
    }

    // If High Work Activity but low tech feel -> Cyber
    if (!isOwned("theme_cyber") && (ctx.lifeScore?.domains.work || 0) > 70) {
        recommendations.push({
            itemId: "theme_cyber",
            reason: "انت شغال بدقة الترسانة الرقمية، الثيم ده هيليق جداً مع سرعة إنجازك وقوة تركيزك.",
            priority: 2
        });
    }

    // ─── 3. Logic for Identity ─────────────────────────────────────
    
    // If Relationships are red/low -> Royal Ring (Focus on presence)
    if (!isOwned("ring_royal") && ctx.relationshipHealth.red > 0) {
        recommendations.push({
            itemId: "ring_royal",
            reason: "في حلقات محتاجة اهتمام على الخريطة. 'المدار الملكي' هيخلي حضورك أوضح ويجذب انتباهك للدواير المهمة.",
            priority: 3
        });
    }

    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
}
