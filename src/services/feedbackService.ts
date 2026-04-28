import { supabase } from "./supabaseClient";

/**
 * خدمة التقييم (Feedback)
 * تستخدم لحفظ آراء المستخدمين في مخرجات النظام (مثل سكريبتات الذكاء الاصطناعي)
 */

export interface FeedbackData {
  content: string;
  rating: 'up' | 'down' | null;
  source: string;
  metadata?: any;
}

export const feedbackService = {
  /**
   * إرسال تقييم جديد
   */
  async submit(data: FeedbackData) {
    if (!supabase) return { success: false, error: "Supabase not ready" };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      const { error } = await supabase
        .from('feedback')
        .insert({
          content: data.content,
          rating: data.rating,
          source: data.source,
          metadata: data.metadata || {},
          user_id: userId
        });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("[FeedbackService] Submit failed:", err);
      return { success: false, error: err };
    }
  },

  /**
   * تسجيل عمليات الذكاء الاصطناعي (Telemetry)
   */
  async logAiGeneration(data: {
    prompt: string;
    response: string;
    tokens?: number;
    source: string;
    metadata?: any;
  }) {
    if (!supabase) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      // We use 'admin_ai_logs' for deep tracking if available, 
      // or we can fall back to a generic 'events' table
      const { error } = await supabase
        .from('admin_ai_logs')
        .insert({
          user_id: userId,
          prompt: data.prompt,
          response: data.response,
          tokens: data.tokens || 0,
          source: data.source,
          metadata: data.metadata || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        // Fallback to console if table doesn't exist or no perms
        console.warn("[FeedbackService] logAiGeneration failed (check permissions):", error);
      }
    } catch (err) {
      console.error("[FeedbackService] logAiGeneration error:", err);
    }
  }
};
