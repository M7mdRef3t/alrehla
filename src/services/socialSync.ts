/**
 * Dawayir Sync — تزامن الدوائر 📡
 * ==========================================
 * محرك تحليل التداخلات بين العُقد واكتشاف التوترات المعقدة.
 */

import { type MapNode, type Ring } from "@/modules/map/mapTypes";

export interface SyncInsight {
    id: string;
    type: "tension" | "harmony" | "interference";
    title: string;
    body: string;
    affectedNodes: string[]; // Node IDs
    severity: "low" | "medium" | "high";
}

/**
 * يحلل الخريطة بحثاً عن "التوترات الثلاثية" أو التداخلات.
 * مثال: إذا وجد شخصين في الدائرة الخضراء وكلاهما لديه تحليل طوارئ أو استنزاف عالٍ.
 */
export function analyzeMapInterference(nodes: MapNode[]): SyncInsight[] {
    const insights: SyncInsight[] = [];
    const activeNodes = nodes.filter(n => !n.isNodeArchived);

    // 1. اكتشاف "التوتر الثلاثي" (Triadic Tension)
    // إذا كان هناك شخصان في نفس الدائرة ولديهما درجة استنزاف عالية (Score < 5)
    const rings: Ring[] = ["green", "yellow", "red"];

    rings.forEach(ring => {
        const ringNodes = activeNodes.filter(n => n.ring === ring);
        const stressedInRing = ringNodes.filter(n => (n.analysis?.score ?? 10) < 5);

        if (stressedInRing.length >= 2) {
            insights.push({
                id: `tension-${ring}-${Date.now()}`,
                type: "tension",
                title: ring === "green" ? "اختراق في النواة!" : "تداخل كهرومغناطيسي",
                body: `يا سيادة القائد، استشعر توتراً مضاعفاً في الدائرة ${ring === "green" ? "الخضراء" : ring}. وجود ${stressedInRing.length} أشخاص مستنزِفين في نفس المدار يهدد استقرار المنظومة.`,
                affectedNodes: stressedInRing.map(n => n.id),
                severity: ring === "green" ? "high" : "medium"
            });
        }
    });

    // 2. اكتشاف "كتل الجاذبية" (Gravity Mass)
    // تجمع عدد كبير من الأشخاص في الدائرة الحمراء
    const redNodes = activeNodes.filter(n => n.ring === "red");
    if (redNodes.length > 5) {
        insights.push({
            id: `gravity-${Date.now()}`,
            type: "interference",
            title: "تجمع كتلة حرجة",
            body: "الدائرة الحمراء تجاوزت سعة الاستيعاب الآمنة. كثافة التهديدات في هذا المدار تمنعك من المناورة بفعالية.",
            affectedNodes: redNodes.map(n => n.id),
            severity: "high"
        });
    }

    return insights;
}

/**
 * يقدم نصيحة تكتيكية فورية بناءً على التداخل
 */
export function getTacticalSyncAdvice(insight: SyncInsight): string {
    switch (insight.type) {
        case "tension":
            return "توصية: فك الارتباط عن أحدهما مؤقتاً لتقليل الضغط على هذا المدار.";
        case "interference":
            return "توصية: ابدأ عملية 'تطهير' (Purge) للعقد الأقل تأثيراً لتقليل كتلة الجاذبية.";
        default:
            return "استمر في المراقبة.";
    }
}
