import { logger } from "@/services/logger";
/**
 * 🕸️ Graph Projection Engine — مُحرك إسقاط الوعي
 * ==========================================
 * يقوم بتمثيل حالة المستخدم النفسية وخريطته في هيكلية (Knowledge Graph).
 * يربط العقد بـ Vectors لتمكين البحث الدلالي مع البنية الشبكية.
 */

import { MapNode } from "@/modules/map/mapTypes";
import { consciousnessService } from "./consciousnessService";
import { supabase } from "./supabaseClient";
import { runtimeEnv } from "@/config/runtimeEnv";

export type RelationType = "ORBITS" | "EXHIBITS" | "TRIGGERS" | "REMEDIES" | "REINFORCES";

export class GraphProjectionEngine {
    /**
     * يحول Nodes الخريطة إلى عقد وروابط في الجراف.
     */
    static async projectMapToGraph(userId: string, nodes: MapNode[]): Promise<void> {
        if (!supabase) return;
        if (runtimeEnv.isDev) return;

        console.log(`🧠 [Graph Engine] Projecting map for user ${userId} to Consciousness Graph...`);

        try {
            // 1. ضمان وجود عقدة الـ Seeker (المستخدم نفسه)
            const seekerNode = await this.ensureVectorNode(
                userId,
                "seeker",
                `المستخدم (Seeker): هو نواة الوعي في هذه المنظومة. يحتاج للوضوح والتعافي.`,
                "seeker"
            );

            if (!seekerNode) return;

            // 2. معالجة كل عقدة في الخريطة
            for (const node of nodes) {
                const content = `الاسم: ${node.label} | الدائرة: ${node.ring} | الحالة: ${node.isDetached ? 'مبتعد' : 'متصل'}
                ${node.analysis?.insights?.diagnosisSummary || "لا يوجد تحليل كافي لهذه العقدة بعد."}`;

                // إسقاط عقدة الـ Daira
                const graphNode = await this.ensureVectorNode(
                    userId,
                    node.id,
                    content,
                    "node",
                    {
                        label: node.label,
                        ring: node.ring,
                        is_detached: node.isDetached
                    }
                );

                if (graphNode) {
                    // 3. إنشاء/تحديث الرابط: ORBITS (الدوران حول Seeker)
                    const drainWeight = node.ring === "red" ? 0.9 : node.ring === "yellow" ? 0.5 : 0.1;
                    await this.upsertEdge(
                        userId,
                        seekerNode.id,
                        graphNode.id,
                        "ORBITS",
                        drainWeight,
                        {
                            label: `يتمحور حوله بوزن استنزاف ${drainWeight}`,
                            ring: node.ring
                        }
                    );

                    // 4. إذا كان هناك أنماط مكتشفة، نربطها بـ EXHIBITS
                    if (node.analysis?.insights?.underlyingPattern) {
                        const patternContent = `النمط الإدراكي: ${node.analysis.insights.underlyingPattern}`;
                        const patternNode = await this.ensureVectorNode(
                            userId,
                            `pattern-${node.id}`,
                            patternContent,
                            "pattern"
                        );

                        if (patternNode) {
                            await this.upsertEdge(
                                userId,
                                graphNode.id,
                                patternNode.id,
                                "EXHIBITS",
                                1.0,
                                { pattern: node.analysis.insights.underlyingPattern }
                            );
                        }
                    }
                }
            }

            console.log(`✅ [Graph Engine] Projection complete for ${nodes.length} nodes.`);
        } catch (error) {
            logger.error("❌ [Graph Engine] Projection failed:", error);
        }
    }

    /**
     * يضمن وجود عقدة (Vector) في الجدول ويحدث محتواها لو تغير
     */
    private static async ensureVectorNode(
        userId: string,
        refId: string,
        content: string,
        refType: string,
        tags?: any
    ): Promise<{ id: string } | null> {
        // نتحقق من وجودها مسبقاً
        const { data: existing } = await supabase!
            .from("consciousness_vectors")
            .select("id, content")
            .eq("user_id", userId)
            .eq("ref_id", refId)
            .eq("ref_type", refType)
            .single();

        // لو موجودة بنفس المحتوى، نرجعها
        if (existing && existing.content === content) {
            return { id: existing.id };
        }

        // لو مش موجودة أو المحتوى اتغير، نولد Embedding جديد
        const embedding = await (consciousnessService as any).getEmbedding(content);
        if (!embedding) return existing ? { id: existing.id } : null;

        const { data: saved, error } = await supabase!
            .from("consciousness_vectors")
            .upsert({
                user_id: userId,
                ref_id: refId,
                ref_type: refType,
                content,
                embedding,
                source: "graph_engine",
                tags: tags ? [JSON.stringify(tags)] : []
            }, { onConflict: "user_id, ref_id, ref_type" })
            .select("id")
            .single();

        if (error) {
            logger.error("Error upserting vector node:", error);
            return null;
        }

        return saved;
    }

    /**
     * إنشاء أو تحديث رابط بين عقدتين
     */
    private static async upsertEdge(
        userId: string,
        sourceId: string,
        targetId: string,
        relationType: RelationType,
        weight: number,
        metadata?: any
    ): Promise<void> {
        const { error } = await supabase!
            .from("consciousness_edges")
            .upsert({
                user_id: userId,
                source_id: sourceId,
                target_id: targetId,
                relation_type: relationType,
                weight,
                metadata: metadata || {},
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id, source_id, target_id, relation_type" }); // سنحتاج لإضافة هذا القيد في الميجريشن

        if (error) {
            logger.error(`Error upserting edge ${relationType}:`, error);
        }
    }
}
