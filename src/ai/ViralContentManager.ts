import { orchestrator } from "./orchestrator/Core";

export interface ViralPost {
    id: string;
    topic: string;
    content: string;
    targetSlot: string;
    rationale: string;
    scores: { safety: number; virality: number };
}

/**
 * ViralContentManager — محرك تحويل النبضات الإحصائية إلى محتوى إبداعي
 */
export class ViralContentManager {
    private static instance: ViralContentManager;

    private constructor() { }

    public static getInstance(): ViralContentManager {
        if (!ViralContentManager.instance) ViralContentManager.instance = new ViralContentManager();
        return ViralContentManager.instance;
    }

    /**
     * تحليل النبضات وإصدار محتوى متناغم مع الحالة الجماعية (3 خيارات)
     */
    public async produceViralInsights(): Promise<ViralPost[]> {
        const events = orchestrator.getPulseArchive();
        const trends = this.aggregateTrends(events);
        const topTrend = Object.entries(trends).sort(([, a], [, b]) => b - a)[0];

        if (!topTrend) return [];

        const protocolId = topTrend[0];

        // توليد 3 نبرات مختلفة (Simulating Multi-Variant Generation)
        return [
            this.generateMockPost(protocolId, "SAFE"),
            this.generateMockPost(protocolId, "DEEP"),
            this.generateMockPost(protocolId, "BOLD")
        ];
    }

    private aggregateTrends(events: any[]): Record<string, number> {
        const counts: Record<string, number> = {};
        events.forEach(e => {
            counts[e.protocol] = (counts[e.protocol] || 0) + 1;
        });
        return counts;
    }

    private generateMockPost(protocolId: string, style: "SAFE" | "DEEP" | "BOLD"): ViralPost {
        const baseVariations: Record<string, any> = {
            "crisis_intervention": {
                topic: "نوبات القلق المفاجئة",
                SAFE: "لو حاسس بضيق مفاجئ، افتكر إن ده مجرد رد فعل طبيعي من جسمك. جرب تتنفس ببطء وتعد لـ 4. إحنا معاك والرحلة لسه مستمرة.",
                DEEP: "القلق مش عدوك، القلق هو 'ديرة' حماية سيستم الطوارئ عندك قفلها زيادة شوية. لما تقدر ترصد النمط، هتقدر تكسر الدايرة.",
                BOLD: "جسمك بيكذب عليك دلوقتي. ضربات قلبك السريعة مش خطر حقيقي، دي مجرد 'كود برمجي' قديم شغال في الوقت الغلط. واجهه واقعد مكانه.",
                slot: "02:00 AM"
            },
            "evolution_challenge": {
                topic: "سباق الإنجاز",
                SAFE: "الإنجاز رحلة مش سباق. خد وقتك في النمو وماتقارنش بدايتك بنهاية غيرك. يومك الجيد هو اللي حاولت فيه وبس.",
                DEEP: "بنتورط في 'دواير' المثالية عشان نهرب من مواجهة نقصنا. الحقيقة إن النقص هو اللي بيدينا مساحة نكبر فيها فعلاً.",
                BOLD: "بطل هبل.. مفيش حد بينافسك غير النسخة اللي إنت مخبيها من نفسك. لو خايف تفشل، فإنت غالباً واقف في مكانك بقالك كتير.",
                slot: "09:00 PM"
            }
        };

        const data = baseVariations[protocolId] || baseVariations["crisis_intervention"];
        const content = data[style];

        // Scoring Logic (Simulated Weights)
        const safetyScore = style === "SAFE" ? 98 : style === "DEEP" ? 85 : 60;
        const viralityScore = style === "BOLD" ? 95 : style === "DEEP" ? 78 : 45;

        return {
            id: `viral_${style}_${Date.now()}`,
            topic: data.topic,
            content: content,
            targetSlot: data.slot,
            rationale: `Style: ${style} | Based on pulse density for ${protocolId}.`,
            scores: { safety: safetyScore, virality: viralityScore }
        } as any;
    }
}

export const viralArchitect = ViralContentManager.getInstance();
