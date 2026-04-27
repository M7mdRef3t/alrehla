import type { Content, FunctionCall, Part, Tool } from "@google/generative-ai";
import { runtimeEnv } from "@/config/runtimeEnv";
import { useToastState } from '@/modules/map/dawayirIndex';
import { CircuitBreaker } from "../architecture/circuitBreaker";
import { fetchJsonWithResilience } from "../architecture/resilientHttp";
import { performInternalGeneration } from "../lib/gemini/shared";
import {
  hydrateAIGuardrailSnapshot,
  recordAICostFromUsage,
  recordAIFallback,
  runWithAIGuardrails
} from "./aiGuardrails";
import { safeGetSession } from "./supabaseClient";

/**
 * ترتيب الموديلات النصية — من الأفضل للاحتياط. مرجع كامل: docs/GEMINI_MODELS.md
 */
const TEXT_MODEL_FALLBACK_ORDER: string[] = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash",
  "gemini-flash-latest"
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
  private unavailableUntil = 0;
  private lastUnavailableToastAt = 0;
  private readonly generateBreaker = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 20_000 });
  private readonly toolBreaker = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 20_000 });
  private readonly embedBreaker = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 20_000 });
  private readonly streamBreaker = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 20_000 });
  private guardHydrated = false;

  private ensureGuardHydrated(): void {
    if (this.guardHydrated) return;
    this.guardHydrated = true;
    void hydrateAIGuardrailSnapshot();
  }

  private isEnabled(): boolean {
    return runtimeEnv.geminiEnabled !== "false";
  }

  private canAttemptServerRequest(bypassCooldown = false): boolean {
    if (bypassCooldown) return true;
    return Date.now() >= this.unavailableUntil;
  }

  /** Features that must never be blocked by the server-unavailable cooldown */
  private readonly HIGH_PRIORITY_FEATURES = new Set([
    "illusion_dismantling",
    "script_generation",
  ]);

  private notifyTemporarilyUnavailable(): void {
    const now = Date.now();
    if (now - this.lastUnavailableToastAt < 30_000) return;
    this.lastUnavailableToastAt = now;
    useToastState.getState().showToast("الذكاء الاصطناعي غير متاح مؤقتًا. بنحاول نرجّعه تلقائيًا خلال ثواني.", "warning");
  }

  isAvailable(): boolean {
    return this.isEnabled() && this.serverAvailable && this.canAttemptServerRequest();
  }

  private markServerUnavailable() {
    this.serverAvailable = false;
    this.unavailableUntil = Date.now() + 30_000;
    this.notifyTemporarilyUnavailable();
  }

  private markServerAvailable() {
    this.serverAvailable = true;
    this.unavailableUntil = 0;
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
  async generate(prompt: string, feature: string = "dynamic_generation"): Promise<string | null> {
    if (!this.isEnabled()) {
      console.warn(`[GeminiClient] Disabled via runtimeEnv.geminiEnabled. Feature: ${feature}`);
      return null;
    }
    const isHighPriority = this.HIGH_PRIORITY_FEATURES.has(feature);
    if (!this.canAttemptServerRequest(isHighPriority)) {
      const remainingMs = Math.max(0, this.unavailableUntil - Date.now());
      console.warn(`[GeminiClient] Server unavailable — cooldown ${Math.ceil(remainingMs / 1000)}s remaining. Feature: ${feature}`);
      this.notifyTemporarilyUnavailable();
      return null;
    }
    const breakerState = this.generateBreaker.getState();
    if (breakerState === 'open') {
      console.warn(`[GeminiClient] Circuit breaker open — waiting for cooldown. Feature: ${feature}`);
      return null;
    }
    this.ensureGuardHydrated();

    // Server-side: call the Gemini SDK directly to avoid relative URL failures.
    // Browser-side: go through the /api/gemini/generate proxy as usual.
    const isServer = typeof window === "undefined";

    if (isServer) {
      try {
        const result = await performInternalGeneration(
          prompt,
          GENERATION_CONFIG as Record<string, unknown>,
          TEXT_MODEL_FALLBACK_ORDER,
          feature
        );
        if (!result.text) {
          const reason = (result as { reason?: string }).reason ?? "unknown";
          const detail = (result as { detail?: string }).detail ?? "no_detail";
          console.error(`[GeminiClient:server] Generation failed. Reason: ${reason}. Detail: ${detail}`);
          this.markServerUnavailable();
          recordAIFallback();
          return null;
        }
        this.markServerAvailable();
        this.applyUsageCost(result.usage as GenerateResponse["usage"]);
        return result.text;
      } catch (err) {
        console.error("[GeminiClient:server] Unexpected error:", err);
        recordAIFallback();
        return null;
      }
    }

    // Browser path — fetch through the API route proxy
    let data: GenerateResponse | null = null;
    try {
      data = await runWithAIGuardrails(
        "generate",
        async (signal) => {
          const session = await safeGetSession();
          const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (session?.access_token) {
            authHeaders["Authorization"] = `Bearer ${session.access_token}`;
          }
          
          return fetchJsonWithResilience<GenerateResponse>(
            "/api/gemini/generate",
            {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                prompt,
                generationConfig: GENERATION_CONFIG,
                modelOrder: TEXT_MODEL_FALLBACK_ORDER,
                feature
              }),
              signal
            },
            { retries: 1, breaker: this.generateBreaker, timeoutMs: 25_000 }
          );
        },
        {
          timeoutMs: 30_000,
          inputChars: 0,
          outputCharsEstimate: 0
        }
      );
    } catch (error) {
      console.error("[GeminiClient] Browser fetch proxy failed for generate:", error);
      recordAIFallback();
      return null;
    }
    if (!data) {
      // No response at all = network/server error or Circuit Breaker Open
      const isBreakerOpen = this.generateBreaker && !this.generateBreaker.canRequest();
      console.warn(`[GeminiClient] Browser fetch returned null (network/server error or Circuit Open). Feature: ${feature}. BreakerOpen: ${isBreakerOpen}`);
      this.markServerUnavailable();
      recordAIFallback();
      return null;
    }
    this.markServerAvailable();
    this.applyUsageCost(data.usage);
    if (!data.text) {
      // Server responded but model returned no text — NOT a server error, don't lock out
      const reason = (data as { reason?: string }).reason ?? "unknown";
      const detail = (data as { detail?: string }).detail ?? "no_detail";
      const fallback = (data as { fallback?: boolean }).fallback;
      if (fallback) {
        console.warn(`[GeminiClient] Model fallback. Feature: ${feature}. Reason: ${reason}. Detail: ${detail}`);
      } else {
        console.warn(`[GeminiClient] Empty text (non-fallback). Feature: ${feature}. Reason: ${reason}`);
      }
      recordAIFallback();
    }
    return data.text ?? null;
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T>(prompt: string, feature: string = "dynamic_generation"): Promise<T | null> {
    const result = await this.generate(prompt, feature);
    if (!result) {
      console.warn(`[GeminiClient] No response generated for prompt feature: ${feature}`);
      return null;
    }

    try {
      // Extract JSON from various delimiters: [BEGIN JSON], markdown code blocks, or raw text
      const customMatch = result.match(/\[BEGIN JSON\]\n?([\s\S]*?)\n?\[END JSON\]/i);
      const markdownMatch = result.match(/```json\n([\s\S]*?)\n```/i) || result.match(/```\n([\s\S]*?)\n```/i);
      
      const rawJson = customMatch ? customMatch[1] : (markdownMatch ? markdownMatch[1] : result);

      // Sanitize Unicode smart/curly quotes that models sometimes place INSIDE JSON strings.
      // These look like " " (U+201C / U+201D) and break JSON.parse when inside a quoted value.
      const jsonText = rawJson
        .replace(/\u201c/g, '\\"')  // LEFT DOUBLE QUOTATION MARK → escaped quote
        .replace(/\u201d/g, '\\"')  // RIGHT DOUBLE QUOTATION MARK → escaped quote
        .replace(/\u2018/g, "'")    // LEFT SINGLE QUOTATION MARK → plain apostrophe
        .replace(/\u2019/g, "'");   // RIGHT SINGLE QUOTATION MARK → plain apostrophe
      
      try {
        return JSON.parse(jsonText.trim());
      } catch (parseError) {
        // Second attempt: strip any remaining unescaped control characters
        try {
          const sanitized = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").trim();
          return JSON.parse(sanitized);
        } catch {
          console.warn("[GeminiClient] JSON Parse Error. Raw Text:", rawJson);
          console.warn("[GeminiClient] Full Model Output:", result);
          return null;
        }
      }
    } catch (err) {
      console.warn("[GeminiClient] Extraction Error:", err);
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
    if (!this.canAttemptServerRequest()) {
      this.notifyTemporarilyUnavailable();
      yield "AI غير متاح حاليا";
      return;
    }
    this.ensureGuardHydrated();

    try {
      if (!this.streamBreaker.canRequest()) {
        this.notifyTemporarilyUnavailable();
        recordAIFallback();
        yield "AI غير متاح حاليا";
        return;
      }
      const res = await runWithAIGuardrails(
        "stream",
        async (signal) => {
          const session = await safeGetSession();
          const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (session?.access_token) {
            authHeaders["Authorization"] = `Bearer ${session.access_token}`;
          }

          return fetch("/api/gemini/stream", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              prompt,
              generationConfig: GENERATION_CONFIG,
              modelOrder: TEXT_MODEL_FALLBACK_ORDER
            }),
            signal
          });
        },
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
    if (!this.canAttemptServerRequest()) {
      this.notifyTemporarilyUnavailable();
      return null;
    }
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
          async (signal) => {
            const session = await safeGetSession();
            const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
            if (session?.access_token) {
              authHeaders["Authorization"] = `Bearer ${session.access_token}`;
            }

            return fetchJsonWithResilience<ToolResponse>(
              "/api/gemini/tool",
              {
                method: "POST",
                headers: authHeaders,
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
            );
          },
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
    if (!this.canAttemptServerRequest()) {
      this.notifyTemporarilyUnavailable();
      return null;
    }
    this.ensureGuardHydrated();

    let data: { embedding: number[] } | null = null;
    try {
      data = await runWithAIGuardrails(
        "embed",
        async (signal) => {
          const session = await safeGetSession();
          const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (session?.access_token) {
            authHeaders["Authorization"] = `Bearer ${session.access_token}`;
          }

          return fetchJsonWithResilience<{ embedding: number[] }>(
            "/api/gemini/embed",
            {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                text,
                model: "text-embedding-004"
              }),
              signal
            },
            { retries: 1, breaker: this.embedBreaker }
          );
        },
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
