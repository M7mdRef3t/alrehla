/**
 * Domain: Dawayir — Cloud Map Service
 *
 * يدير الـ AI analysis + cloud save للخريطة
 * مهاجر من useDawayirEngine.ts
 */

import { aiGateway } from "@/infrastructure/ai";
import type { DawayirMapState } from "../types";

const CLOUD_SAVE_TABLE = "dawayir_maps";

export const cloudMapService = {
  /**
   * تحليل إجابات المستخدم وتوليد هيكل الخريطة بالـ AI
   */
  async analyzeAnswers(
    answers: string[],
    maxNodes = 50
  ): Promise<DawayirMapState> {
    const prompt = `
أنت محرك تحليل العلاقات. المستخدم يصف علاقاته وقضاياه الحياتية.
المدخلات: ${answers.join("\n")}

أعد JSON بهذا الشكل بالضبط:
{
  "nodes": [{ "id": "1", "label": "...", "size": "medium", "color": "neutral", "mass": 1 }],
  "edges": [{ "source": "1", "target": "2", "type": "stable", "animated": false }],
  "insight_message": "ملخص قصير بالعربية",
  "detected_symptoms": ["..."]
}

الألوان المتاحة: core, danger, ignored, neutral
الأحجام: small, medium, large
أنواع الروابط: draining, stable, ignored, conflict
حد الـ nodes: ${maxNodes}
    `.trim();

    const response = await aiGateway.generateJSON<DawayirMapState>({
      type: "dawayir:analyze",
      prompt,
      generationConfig: { temperature: 0.4 },
    });

    if (!response.success || !response.data) {
      throw new Error(response.error ?? "فشل الاتصال بمحرك الوعي.");
    }

    const result = response.data; // Apply node limit
    if (result.nodes.length > maxNodes) {
      result.nodes = result.nodes.slice(0, maxNodes);
      result.insight_message += " (وصلت للحد الأقصى المسموح به في خطتك)";
    }

    return result;
  },

  /**
   * حفظ الخريطة في Supabase
   */
  async saveMap(
    mapData: DawayirMapState,
    userId: string,
    title = "خريطتي"
  ): Promise<DawayirMapState> {
    const { supabase } = await import("@/infrastructure/database");
    if (!supabase) throw new Error("Supabase not available");

    const { data: savedMap, error } = await supabase
      .from(CLOUD_SAVE_TABLE)
      .upsert({
        user_id: userId,
        title,
        nodes: mapData.nodes,
        edges: mapData.edges,
        insight_message: mapData.insight_message,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { ...mapData, id: savedMap.id };
  },

  /**
   * تحميل آخر خريطة محفوظة للمستخدم
   */
  async loadLatestMap(userId: string): Promise<DawayirMapState | null> {
    const { supabase } = await import("@/infrastructure/database");
    if (!supabase) return null;

    const { data, error } = await supabase
      .from(CLOUD_SAVE_TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
      insight_message: data.insight_message ?? "",
      detected_symptoms: data.detected_symptoms ?? [],
    };
  },
};
