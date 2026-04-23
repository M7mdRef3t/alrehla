import { logger } from "@/services/logger";
/**
 * 🛰️ Graph Recommendation Engine — محرك التوصيات الشبكي
 * ===================================================
 * يستخدم الـ Knowledge Graph والبحث الدلالي (Vector Search) لترشيح
 * المحتوى التعليمي والخطوات العملية الأكثر صلة بحالة المستخدم.
 */

import { supabase } from "./supabaseClient";
import { consciousnessService } from "./consciousnessService";
import { videos, successStories, faqs } from "@/data/educationalContent";

export interface RecommendationResult {
    type: "video" | "story" | "faq" | "nudge";
    id: string;
    title: string;
    description: string;
    relevance: number; // 0-1
    context?: string; // سبب التوصية (مثلاً: "لأنك تعاني من استنزاف في الدائرة الحمراء")
}

export class GraphRecommendationEngine {
    /**
     * يحصل على توصيات ذكية لعقدة معينة في الخريطة بناءً على علاقاتها في الجراف.
     */
    static async getRecommendationsForNode(userId: string, nodeId: string): Promise<RecommendationResult[]> {
        if (!supabase) return [];

        try {
            // 1. استرجاع العقدة والروابط المرتبطة بها في الجراف
            const { data: nodeVector } = await supabase
                .from("consciousness_vectors")
                .select("id, content")
                .eq("user_id", userId)
                .eq("ref_id", nodeId)
                .single();

            if (!nodeVector) return [];

            // 2. البحث عن الأنماط المرتبطة بها عبر الروابط (EXHIBITS)
            const { data: edges } = await supabase
                .from("consciousness_edges")
                .select("target_id, relation_type, weight")
                .eq("source_id", nodeVector.id)
                .eq("relation_type", "EXHIBITS");

            const patternIds = edges?.map(e => e.target_id) || [];

            // 3. البحث الدلالي (Vector Search) عن أصول تعليمية مشابهة لمحتوى العقدة أو الأنماط
            const queryText = nodeVector.content;
            const matches = await consciousnessService.recallSimilarMoments(queryText, {
                limit: 5,
                sources: [("educational_asset" as any)] // البحث المباشر في الأصول التعليمية المدمجة
            });

            // 4. دمج النتائج وترتيبها
            const recommendations: RecommendationResult[] = [];

            // تحويل الـ matches إلى توصيات مباشرة بالاعتماد على الميتاداتا
            for (const match of matches) {
                let meta: any = {};
                try {
                    meta = typeof (match as any).metadata === 'string' ? JSON.parse((match as any).metadata) : (match as any).metadata || {};
                } catch(e) { logger.warn("[Recommendation] metadata parse error:", e); }

                recommendations.push({
                    id: match.id,
                    type: meta.type || "story", // "video" | "story" | "faq"
                    title: meta.title || "رؤية مقترحة",
                    description: match.content,
                    relevance: match.similarity,
                    context: "بناءً على التوافق الدلالي مع حالتك"
                });
            }

            // إضافة توصية "Nudge" بناءً على الروابط
            if (edges && edges.length > 0) {
                recommendations.push({
                    id: "graph-nudge-1",
                    type: "nudge",
                    title: "نمط متكرر 🧠",
                    description: "الجراف اكتشف إن العقدة دي مرتبطة بنمط استنزاف شفناه قبل كده. راجع 'دروس الحدود'.",
                    relevance: 0.9,
                    context: "رابط شبكي مكتشف"
                });
            }

            return recommendations.sort((a, b) => b.relevance - a.relevance);

        } catch (error) {
            logger.error("❌ [Recommendation Engine] Failed to get recommendations:", error);
            return [];
        }
    }
}
