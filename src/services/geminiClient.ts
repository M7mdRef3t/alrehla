import type { Content, FunctionCall, Part, Tool } from "@google/generative-ai";
import { runtimeEnv } from "../config/runtimeEnv";
import { CircuitBreaker } from "../architecture/circuitBreaker";
import { fetchJsonWithResilience } from "../architecture/resilientHttp";
import {
  hydrateAIGuardrailSnapshot,
  recordAICostFromUsage,
  recordAIFallback,
  runWithAIGuardrails
} from "./aiGuardrails";

/**
 * ترتيب الموديلات النصية — من الأفضل للاحتياط. مرجع كامل: docs/GEMINI_MODELS.md
 */
const TEXT_MODEL_FALLBACK_ORDER: string[] = [
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

export interface GenerateWithToolsRequest {
  /** محادثة: مصفوفة محتوى (دور + أجزاء) */
  contents: Content[];
  /** أدوات (تعريف دوال) */
  tools: Tool[];
  /** تعليمات النظام (اختياري) */
  systemInstruction?: string;
}

/** تنفيذ استدعاء دالة من الموديل — يُرجع كائن النتيجة للموديل */
export type ToolExecutor = (name: string, args: object) => Promise<object>;

interface ToolResponse {
  text?: string;
  functionCalls?: FunctionCall[];
  modelContent?: Content;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null;
}

interface GenerateResponse {
  text?: string;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null;
}

class GeminiClient {
  private serverAvailable = true;
  private readonly generateBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });
  private readonly toolBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });
  private readonly embedBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });
  private readonly streamBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });
  private guardHydrated = false;

  private ensureGuardHydrated(): void {
    if (this.guardHydrated) return;
    this.guardHydrated = true;
    void hydrateAIGuardrailSnapshot();
  }

  private isEnabled(): boolean {
    return runtimeEnv.geminiEnabled !== "false";
  }

  isAvailable(): boolean {
    return this.isEnabled() && this.serverAvailable;
  }

  private markServerUnavailable() {
    this.serverAvailable = false;
  }

  private markServerAvailable() {
    this.serverAvailable = true;
  }

  private applyUsageCost(usage: GenerateResponse["usage"]): void {
    if (!usage) return;
    const inputTokens = Number(usage.promptTokenCount ?? 0);
    const outputTokens = Number(usage.candidatesTokenCount ?? 0);
    if (inputTokens <= 0 && outputTokens <= 0) return;
    recordAICostFromUsage(inputTokens, outputTokens);
  }

  /**
   * Generate content — عبر Proxy
   */
  async generate(prompt: string): Promise<string | null> {
    if (!this.isEnabled()) return null;
    this.ensureGuardHydrated();

    let data: GenerateResponse | null = null;
    try {
      data = await runWithAIGuardrails(
        "generate",
        async (signal) => fetchJsonWithResilience<GenerateResponse>(
          "/api/gemini/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              generationConfig: GENERATION_CONFIG,
              modelOrder: TEXT_MODEL_FALLBACK_ORDER
            }),
            signal
          },
          { retries: 1, breaker: this.generateBreaker }
        ),
        {
          timeoutMs: 10_000,
          inputChars: 0,
          outputCharsEstimate: 0
        }
      );
    } catch {
      recordAIFallback();
      return null;
    }
    if (!data) {
      this.markServerUnavailable();
      recordAIFallback();
      return null;
    }
    this.markServerAvailable();
    this.applyUsageCost(data.usage);
    return data.text ?? null;
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T>(prompt: string): Promise<T | null> {
    const result = await this.generate(prompt);
    if (!result) return null;

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : result;
      return JSON.parse(jsonText.trim());
    } catch {
      return null;
    }
  }

  /**
   * Stream content generation (for chatbot)
   */
  async *generateStream(prompt: string): AsyncGenerator<string> {
    if (!this.isEnabled()) {
      yield "AI غير متاح حاليا";
      return;
    }
    this.ensureGuardHydrated();

    try {
      if (!this.streamBreaker.canRequest()) {
        recordAIFallback();
        yield "AI غير متاح حاليا";
        return;
      }
      const res = await runWithAIGuardrails(
        "stream",
        async (signal) => fetch("/api/gemini/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            generationConfig: GENERATION_CONFIG,
            modelOrder: TEXT_MODEL_FALLBACK_ORDER
          }),
          signal
        }),
        {
          timeoutMs: 20_000,
          inputChars: prompt.length,
          outputCharsEstimate: 800
        }
      );

      if (res.status === 503) {
        this.streamBreaker.markFailure();
        this.markServerUnavailable();
        recordAIFallback();
        yield "AI غير متاح حاليا";
        return;
      }
      if (!res.ok || !res.body) {
        this.streamBreaker.markFailure();
        recordAIFallback();
        yield "حدث خطأ في الاتصال";
        return;
      }

      this.streamBreaker.markSuccess();
      this.markServerAvailable();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        if (text) yield text;
      }
    } catch {
      this.streamBreaker.markFailure();
      recordAIFallback();
      yield "حدث خطأ في الاتصال";
    }
  }

  /**
   * توليد مع أدوات (Function Calling) — عبر Proxy
   */
  async generateWithTools(
    request: GenerateWithToolsRequest,
    executeTool: ToolExecutor
  ): Promise<string | null> {
    if (!this.isEnabled()) return null;
    this.ensureGuardHydrated();

    const { contents, tools, systemInstruction } = request;
    const maxToolRounds = 8;
    let currentContents: Content[] = [...contents];
    let rounds = 0;

    while (rounds < maxToolRounds) {
      rounds += 1;
      let response: ToolResponse | null = null;

      try {
        const responsePayload = await runWithAIGuardrails(
          "tool",
          async (signal) => fetchJsonWithResilience<ToolResponse>(
            "/api/gemini/tool",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: currentContents,
                tools,
                systemInstruction,
                generationConfig: GENERATION_CONFIG,
                modelOrder: TEXT_MODEL_FALLBACK_ORDER
              }),
              signal
            },
            { retries: 1, breaker: this.toolBreaker }
          ),
          {
            timeoutMs: 12_000,
            inputChars: 0,
            outputCharsEstimate: 0
          }
        );
        if (!responsePayload) {
          this.markServerUnavailable();
          recordAIFallback();
          return null;
        }
        this.markServerAvailable();
        response = responsePayload;
        this.applyUsageCost(responsePayload.usage);
      } catch {
        recordAIFallback();
        return null;
      }

      if (!response) return null;

      if (!response.functionCalls || response.functionCalls.length === 0) {
        return response.text ?? null;
      }

      const modelContent: Content = response.modelContent ?? {
        role: "model",
        parts: []
      };
      const responseParts: Part[] = [];
      for (const fc of response.functionCalls as FunctionCall[]) {
        const name = fc.name;
        const args = (fc.args ?? {}) as object;
        const out = await executeTool(name, args);
        responseParts.push({ functionResponse: { name, response: out } });
      }
      currentContents = [...currentContents, modelContent, { role: "user", parts: responseParts }];
    }

    return "تم تجاوز حد جولات الأدوات. جرّب صياغة أوضح.";
  }

  /**
   * Generate text embedding
   */
  async embedText(text: string): Promise<number[] | null> {
    if (!this.isEnabled()) return null;
    this.ensureGuardHydrated();

    let data: { embedding: number[] } | null = null;
    try {
      data = await runWithAIGuardrails(
        "embed",
        async (signal) => fetchJsonWithResilience<{ embedding: number[] }>(
          "/api/gemini/embed",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              model: "text-embedding-004"
            }),
            signal
          },
          { retries: 1, breaker: this.embedBreaker }
        ),
        {
          timeoutMs: 8_000,
          inputChars: text.length,
          outputCharsEstimate: 256
        }
      );
    } catch {
      recordAIFallback();
      return null;
    }
    if (!data) {
      recordAIFallback();
      return null;
    }
    return data.embedding;
  }
}

// Singleton instance
export const geminiClient = new GeminiClient();
