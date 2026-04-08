import { logger } from "@/services/logger";
import { geminiClient } from "./geminiClient";
import { AICache } from "./geminiEnhancements";
import { useConsciousnessHistory } from "@/state/consciousnessHistoryState";
import { supabase } from "./supabaseClient";

export interface ConsciousnessInsight {
  emotionalState: string;
  underlyingPattern: string;
  suggestedAction: string;
  intensity: number; // 1-10
}

export interface MemoryMatch {
  id: string;
  user_id?: string;
  content: string;
  similarity: number;
  created_at?: string;
  source?: string;
   tags?: string[] | null;
   manual_notes?: string | null;
   hidden?: boolean;
}

type MemorySource = "pulse" | "chat" | "note";

class ConsciousnessService {
  private cache = new AICache();
  private memory: string[] = [];

  /**
   * استدعاء Edge Function في Supabase للحصول على الـ Embedding (vector 768)
   */
  private async getEmbedding(text: string): Promise<number[] | null> {
    if (!supabase) {
      console.warn("Supabase client غير مهيأ، لن يتم استدعاء gemini_embeddings.");
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("gemini_embeddings", {
        body: { text }
      });

      if (error) {
        logger.error("Embedding Error:", error);
        return null;
      }

      const embedding = (data as { embedding?: number[] } | null)?.embedding;
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        logger.error("Embedding response فارغ أو غير صالح.");
        return null;
      }

      return embedding;
    } catch (err) {
      logger.error("Failed to invoke gemini_embeddings function:", err);
      return null;
    }
  }

  /**
   * إضافة حدث أو شعور لذاكرة الوعي (محاكاة لذاكرة الـ Vector)
   */
  addToMemory(event: string) {
    this.memory.push(`${new Date().toISOString()}: ${event}`);
    if (this.memory.length > 50) this.memory.shift(); // الحفاظ على آخر 50 ذكرى
  }

  /**
   * تخزين لحظة وعي في جدول consciousness_vectors (لو Supabase جاهز)
   */
  async saveMoment(
    userId: string | null | undefined,
    content: string,
    source: "pulse" | "chat" | "note" = "pulse"
  ): Promise<boolean> {
    const embedding = await this.getEmbedding(content);
    if (!embedding || !supabase) return false;

    const payload: Record<string, unknown> = {
      content,
      embedding,
      source
    };
    if (userId) payload.user_id = userId;

    const { error } = await supabase.from("consciousness_vectors").insert(payload);

    if (error) {
      logger.error("Save consciousness moment error:", error);
      return false;
    }

    return true;
  }

  /**
   * استرجاع ذكريات مشابهة (مرآة الوعي) باستخدام match_consciousness_vectors
   */
  async recallSimilarMoments(
    queryText: string,
    options?: { threshold?: number; limit?: number; sources?: Array<"pulse" | "chat" | "note"> }
  ): Promise<MemoryMatch[]> {
    const threshold = options?.threshold ?? 0.7;
    const limit = options?.limit ?? 3;
    const allowedSources = options?.sources;

    const queryEmbedding = await this.getEmbedding(queryText);
    if (!queryEmbedding || !supabase) return [];

    try {
      const { data, error } = await supabase.rpc("match_consciousness_vectors", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_limit: limit
      });

      if (error) {
        logger.error("Recall similar moments error:", error);
        return [];
      }

      let matches = (data as MemoryMatch[]) ?? [];
      if (allowedSources && allowedSources.length > 0) {
        matches = matches.filter((m) => !m.source || allowedSources.includes(m.source as MemorySource));
      }

      return matches;
    } catch (err) {
      logger.error("Recall similar moments unexpected error:", err);
      return [];
    }
  }

  /**
   * أرشيف الوعي الكامل من Supabase (بدون تصفية تشابه)
   */
  async fetchArchive(options?: { limit?: number; sources?: Array<"pulse" | "chat" | "note"> }): Promise<MemoryMatch[]> {
    if (!supabase) return [];
    const limit = options?.limit ?? 200;
    const allowedSources = options?.sources;

    try {
      const { data, error } = await supabase.rpc("get_consciousness_archive", {
        limit_count: limit
      });
      if (error) {
        logger.error("Fetch consciousness archive error:", error);
        return [];
      }
      let matches = (data as MemoryMatch[]) ?? [];
      // استبعاد العناصر المخفية من الواجهات الافتراضية
      matches = matches.filter((m) => !m.hidden);
      if (allowedSources && allowedSources.length > 0) {
        matches = matches.filter((m) => !m.source || allowedSources.includes(m.source as MemorySource));
      }
      return matches;
    } catch (err) {
      logger.error("Fetch consciousness archive unexpected error:", err);
      return [];
    }
  }

  /**
   * تحليل الحالة الشعورية والوعي بناءً على المدخلات والذاكرة
   */
  async analyzeConsciousness(input: string): Promise<ConsciousnessInsight | null> {
    const memoryContext = this.memory.join('\n');
    const prompt = `
      بصفتك خبير في الوعي والذكاء الاصطناعي لمرافق "الرحلة".
      حلل النص التالي مع مراعاة سياق الذاكرة الأخير للمستخدم.
      
      سياق الذاكرة:
      ${memoryContext}
      
      المدخل الحالي:
      "${input}"
      
      المطلوب: تحليل دقيق للحالة الشعورية، النمط المتكرر، واقتراح عملي للتعامل مع هذا الشعور (توظيفه وليس إصلاحه).
      رد بتنسيق JSON فقط:
      {
        "emotionalState": "الحالة الشعورية المكتشفة",
        "underlyingPattern": "النمط اللاشعوري الذي يفسر هذا الشعور",
        "suggestedAction": "اقتراح لتوظيف هذا الشعور في النمو الشخصي",
        "intensity": 7
      }
    `;

    try {
      const response = await geminiClient.generateJSON<ConsciousnessInsight>(prompt);
      if (response) {
        this.addToMemory(`تحليل: ${response.emotionalState} - ${response.underlyingPattern}`);
        
        // تسجيل النقطة في تاريخ الوعي
        useConsciousnessHistory.getState().addPoint({
          timestamp: Date.now(),
          emotionalState: response.emotionalState,
          intensity: response.intensity,
          pattern: response.underlyingPattern
        });
      }
      return response;
    } catch (error) {
      logger.error("Consciousness Analysis Error:", error);
      return null;
    }
  }

  getMemory() {
    return [...this.memory];
  }
}

export const consciousnessService = new ConsciousnessService();
