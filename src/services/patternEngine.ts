import { supabase } from "./supabaseClient";
import { logger } from "./logger";
import type { BehavioralPattern, PatternSentiment } from "./behavioralService";

export const PatternEngine = {
  /**
   * Analyzes the user's bio and extracts heuristic patterns.
   * In a full implementation, this would call an LLM (e.g. Gemini).
   * Here we use a keyword heuristic approach to simulate AI extraction.
   */
  async extractFromBio(bio: string, userId: string) {
    if (!bio || bio.trim() === "") return;

    logger.info("🧠 [PatternEngine] Analyzing bio for behavioral patterns...");

    const text = bio.toLowerCase();
    let detectedPattern: Partial<BehavioralPattern> | null = null;
    let alertMessage = "";

    // Heuristics Engine
    if (text.includes("هرب") || text.includes("انسحاب") || text.includes("صمت") || text.includes("وحد")) {
      detectedPattern = {
        title: "الانسحاب وقت المواجهة",
        description: "ميل للابتعاد أو الصمت عند الشعور بضغط عاطفي مفاجئ في العلاقات.",
        sentiment: "negative",
        icon: "🛡️",
        frequency: 1,
        resourceTab: "exit-scripts",
      };
      alertMessage = "استشعرنا ميلاً للانسحاب من كلماتك. هناك نصوص آمنة للانسحاب المؤقت يمكنك تجربتها.";
    } else if (text.includes("ضغط") || text.includes("مشغول") || text.includes("ارهاق") || text.includes("تعب")) {
      detectedPattern = {
        title: "تراكم الإجهاد الخفي",
        description: "الشعور المستمر بالضغط الذي قد ينعكس سلباً على سعة الاستيعاب العاطفي.",
        sentiment: "recurring",
        icon: "⚠️",
        frequency: 1,
        resourceTab: "exercises",
      };
      alertMessage = "كلماتك توحي بضغط متراكم. جرب تمارين التفريغ السريع قبل التفاعل مع من تحب.";
    } else if (text.includes("أمان") || text.includes("هدوء") || text.includes("استقرار") || text.includes("سلام")) {
      detectedPattern = {
        title: "السعي نحو الأمان",
        description: "تفضيل واضح للبيئات المستقرة وتجنب الصراعات العنيفة.",
        sentiment: "positive",
        icon: "✨",
        frequency: 1,
        resourceTab: "articles",
      };
      alertMessage = "رغبتك في السلام الداخلي واضحة؛ حافظ على حدودك لضمان هذا الأمان.";
    }

    if (!detectedPattern) {
      logger.info("🧠 [PatternEngine] No distinct patterns found in the new bio.");
      return;
    }

    if (!supabase) {
      logger.warn("[PatternEngine] Supabase is unavailable; skipping extracted pattern persistence.");
      return;
    }

    // Save Pattern and Alert to Supabase
    try {
      // 1. Insert Pattern
      const { data: patternData, error: patternError } = await supabase
        .from("behavioral_patterns")
        .insert({
          user_id: userId,
          title: detectedPattern.title,
          description: detectedPattern.description,
          sentiment: detectedPattern.sentiment,
          icon: detectedPattern.icon,
          frequency: detectedPattern.frequency,
          resource_tab: detectedPattern.resourceTab,
        })
        .select("id")
        .single();

      if (patternError) {
        logger.error("❌ [PatternEngine] Failed to insert pattern", patternError);
        return;
      }

      // 2. Insert Proactive Alert
      const { error: alertError } = await supabase
        .from("behavioral_alerts")
        .insert({
          user_id: userId,
          message: alertMessage,
          pattern_id: patternData.id,
          resource_tab: detectedPattern.resourceTab,
          resource_key: "extracted-from-bio",
          is_read: false,
        });

      if (alertError) {
        logger.error("❌ [PatternEngine] Failed to insert proactive alert", alertError);
      } else {
        logger.info("✅ [PatternEngine] Successfully extracted pattern and generated proactive alert!");
      }
    } catch (err) {
      logger.error("❌ [PatternEngine] Unexpected error during extraction", err);
    }
  },
};
