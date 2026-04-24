import { supabase } from "./supabaseClient";
import { logger } from "./logger";
import { PredictiveInsight } from "./predictiveEngine";

/**
 * ShadowService — خدمة ذاكرة الظل 🌑
 * =================================
 * مسؤولة عن حفظ واسترجاع "لقطات" الحالة النفسية والذهنية للمستخدم (Entropy Snapshots).
 * تساعد في تحليل المسار الزمني وتحذير الكوتشز عند دخول المستخدم في منطقة الخطر.
 */
export const ShadowService = {
  /**
   * يحفظ لقطة جديدة في جدول shadow_snapshots.
   */
  async saveSnapshot(userId: string, insight: PredictiveInsight) {
    if (!supabase) return { error: new Error("Supabase not initialized") };

    try {
      const { error } = await supabase
        .from("shadow_snapshots")
        .insert({
          user_id: userId,
          entropy_score: insight.entropyScore,
          state: insight.state,
          primary_factor: insight.primaryFactor,
          metadata: {
            unstableNodes: insight.unstableNodes,
            pulseVolatility: insight.pulseVolatility,
            lowEnergyRatio: insight.lowEnergyRatio,
            unstableNodesData: insight.unstableNodesData,
          },
        });

      if (error) {
        logger.error("❌ [ShadowService] Failed to save snapshot", error);
      }
      return { error };
    } catch (err) {
      logger.error("❌ [ShadowService] Unexpected error saving snapshot", err);
      return { error: err };
    }
  },

  /**
   * يسترجع سجل اللقطات لمستخدم معين.
   */
  async getSnapshotHistory(userId: string, limit = 50) {
    if (!supabase) return { data: [], error: new Error("Supabase not initialized") };

    try {
      const { data, error } = await supabase
        .from("shadow_snapshots")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("❌ [ShadowService] Failed to fetch snapshots", error);
      }
      return { data: data || [], error };
    } catch (err) {
      logger.error("❌ [ShadowService] Unexpected error fetching snapshots", err);
      return { data: [], error: err };
    }
  },
};
