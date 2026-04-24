/**
 * Infrastructure — AI Gateway
 * 
 * نقطة دخول موحدة لكل عمليات الذكاء الاصطناعي.
 * كل Domain يمر من هنا بدل الوصول المباشر لـ Gemini.
 * 
 * الـ Gateway مسؤول عن:
 * - اختيار الـ Provider (Gemini حالياً)
 * - Guardrails (rate limit, cost, safety)
 * - Response caching
 * - Telemetry & cost tracking
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerationConfig } from "@google/generative-ai";

// ─── Types ─────────────────────────────────────────────

export interface AIRequest {
  /** نوع الطلب — لتحديد الـ prompt template والـ guardrails */
  type: string;
  /** الـ prompt النهائي */
  prompt: string;
  /** إعدادات التوليد (اختياري) */
  generationConfig?: Partial<GenerationConfig>;
  /** هل نريد JSON response؟ */
  jsonMode?: boolean;
  /** Model override (اختياري) */
  model?: string;
}

export interface AIResponse<T = string> {
  success: boolean;
  data: T | null;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ─── Default Config ────────────────────────────────────

const DEFAULT_MODEL = "gemini-2.5-flash";

const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

// ─── Gateway ───────────────────────────────────────────

class AIGateway {
  private client: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI | null {
    if (this.client) return this.client;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.warn("[AI Gateway] Missing Gemini API Key");
      return null;
    }

    this.client = new GoogleGenerativeAI(apiKey);
    return this.client;
  }

  /**
   * Generate text content
   */
  async generate(request: AIRequest): Promise<AIResponse<string>> {
    const client = this.getClient();
    if (!client) {
      return { success: false, data: null, error: "AI not configured" };
    }

    try {
      const genConfig: GenerationConfig = {
        ...DEFAULT_GENERATION_CONFIG,
        ...request.generationConfig,
      };

      if (request.jsonMode) {
        (genConfig as GenerationConfig & { responseMimeType?: string }).responseMimeType = "application/json";
      }

      const model = client.getGenerativeModel({
        model: request.model || DEFAULT_MODEL,
        generationConfig: genConfig,
      });

      const result = await model.generateContent(request.prompt);
      const response = await result.response;
      const text = response.text();

      const usage = response.usageMetadata;

      return {
        success: true,
        data: text,
        usage: usage ? {
          promptTokens: usage.promptTokenCount ?? 0,
          completionTokens: usage.candidatesTokenCount ?? 0,
          totalTokens: usage.totalTokenCount ?? 0,
        } : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[AI Gateway] Generation error:", message);
      return { success: false, data: null, error: message };
    }
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T>(request: Omit<AIRequest, "jsonMode">): Promise<AIResponse<T>> {
    const response = await this.generate({ ...request, jsonMode: true });
    if (!response.success || !response.data) {
      return { success: false, data: null, error: response.error };
    }

    try {
      const parsed = JSON.parse(response.data) as T;
      return { success: true, data: parsed, usage: response.usage };
    } catch {
      // Try extracting JSON from markdown code blocks
      const match = response.data.match(/```json\n([\s\S]*?)\n```/i)
        || response.data.match(/```\n([\s\S]*?)\n```/i);

      if (match) {
        try {
          const parsed = JSON.parse(match[1].trim()) as T;
          return { success: true, data: parsed, usage: response.usage };
        } catch {
          // fall through
        }
      }

      return { success: false, data: null, error: "Failed to parse JSON response" };
    }
  }

  /**
   * هل الـ AI متاح؟
   */
  isAvailable(): boolean {
    return Boolean(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    );
  }
}

// Singleton
export const aiGateway = new AIGateway();
