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
  }
};
