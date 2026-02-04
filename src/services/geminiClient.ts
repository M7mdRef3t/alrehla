import type { Content, FunctionCall, Part, Tool } from "@google/generative-ai";

/**
 * ترتيب الموديلات النصية — من الأفضل للاحتياط. مرجع كامل: docs/GEMINI_MODELS.md
 */
const TEXT_MODEL_FALLBACK_ORDER: string[] = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview"
];

const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

function isRateLimitError(error: unknown): boolean {
  const msg = error && typeof error === "object" && "message" in error
    ? String((error as { message?: string }).message)
    : "";
  return msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
}

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
}

class GeminiClient {
  private serverAvailable = true;

  private isEnabled(): boolean {
    return import.meta.env.VITE_GEMINI_AI_ENABLED !== "false";
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

  /**
   * Generate content — عبر Proxy
   */
  async generate(prompt: string): Promise<string | null> {
    if (!this.isEnabled()) return null;

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          generationConfig: GENERATION_CONFIG,
          modelOrder: TEXT_MODEL_FALLBACK_ORDER
        })
      });

      if (res.status === 503) {
        this.markServerUnavailable();
        return null;
      }
      if (!res.ok) return null;
      this.markServerAvailable();
      const data = (await res.json()) as { text?: string };
      return data.text ?? null;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error generating content:", error);
      return null;
    }
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
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error parsing JSON response:", error);
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

    try {
      const res = await fetch("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          generationConfig: GENERATION_CONFIG,
          modelOrder: TEXT_MODEL_FALLBACK_ORDER
        })
      });

      if (res.status === 503) {
        this.markServerUnavailable();
        yield "AI غير متاح حاليا";
        return;
      }
      if (!res.ok || !res.body) {
        yield "حدث خطأ في الاتصال";
        return;
      }

      this.markServerAvailable();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        if (text) yield text;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error streaming content:", error);
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

    const { contents, tools, systemInstruction } = request;
    const maxToolRounds = 8;
    let currentContents: Content[] = [...contents];
    let rounds = 0;

    while (rounds < maxToolRounds) {
      rounds += 1;
      let response: ToolResponse | null = null;

      try {
        const res = await fetch("/api/gemini/tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: currentContents,
            tools,
            systemInstruction,
            generationConfig: GENERATION_CONFIG,
            modelOrder: TEXT_MODEL_FALLBACK_ORDER
          })
        });

        if (res.status === 503) {
          this.markServerUnavailable();
          return null;
        }
        if (!res.ok) return null;
        this.markServerAvailable();
        response = (await res.json()) as ToolResponse;
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error in generateWithTools:", error);
        if (import.meta.env.DEV && isRateLimitError(error)) {
          // eslint-disable-next-line no-console
          console.warn("[Gemini] Rate limit in proxy.");
        }
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
}

// Singleton instance
export const geminiClient = new GeminiClient();
