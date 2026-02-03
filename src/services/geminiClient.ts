import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type Content,
  type Part,
  type FunctionCall,
  type Tool
} from "@google/generative-ai";

/**
 * Gemini AI Client
 * Handles all interactions with Google's Gemini API
 */

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

class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // فترة تجريب: ضع VITE_GEMINI_AI_ENABLED=false في .env.local — مفيش طلبات للـ API (لا 429)، والتطبيق يولد النص محلياً في المتصفح
    if (import.meta.env.VITE_GEMINI_AI_ENABLED === "false") return;

    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) return;

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        }
      });
      // eslint-disable-next-line no-console
      console.log("✅ Gemini AI initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Gemini:", error);
      this.model = null;
    }
  }

  /**
   * Check if AI is available
   */
  isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Generate content using Gemini
   */
  async generate(prompt: string): Promise<string | null> {
    if (!this.model) return null;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        const msg = error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message) : "";
        if (msg.includes("429") || msg.includes("quota")) {
          console.warn("[Gemini] الحصة المجانية انتهت أو الطلبات كثيرة. جرّب بعد دقيقة أو راجع الحساب.");
        } else {
          console.error("Error generating content:", error);
        }
      }
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
    if (!this.model) {
      yield "AI غير متاح حالياً";
      return;
    }

    try {
      const result = await this.model.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error streaming content:", error);
      yield "حدث خطأ في الاتصال";
    }
  }

  /**
   * توليد مع أدوات (Function Calling): حلقة تنفيذ استدعاءات الدوال ثم رد نهائي.
   */
  async generateWithTools(
    request: GenerateWithToolsRequest,
    executeTool: ToolExecutor
  ): Promise<string | null> {
    if (!this.model) return null;

    const { contents, tools, systemInstruction } = request;
    const toolConfig = {
      functionCallingConfig: { mode: "AUTO" as const }
    };

    let currentContents: Content[] = [...contents];
    const maxToolRounds = 8;
    let rounds = 0;

    while (rounds < maxToolRounds) {
      rounds += 1;
      let res;
      try {
        res = await this.model.generateContent({
          contents: currentContents,
          tools,
          systemInstruction: systemInstruction ?? undefined,
          toolConfig
        });
      } catch (error: unknown) {
        if (import.meta.env.DEV) {
          const msg = error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message) : "";
          if (msg.includes("429") || msg.includes("quota")) {
            console.warn("[Gemini] الحصة المجانية انتهت أو الطلبات كثيرة.");
          } else {
            console.error("Error in generateWithTools:", error);
          }
        }
        return null;
      }

      const response = res.response;
      const functionCalls = response.functionCalls?.() ?? [];

      if (functionCalls.length === 0) {
        try {
          return response.text();
        } catch {
          return null;
        }
      }

      const modelContent: Content = response.candidates?.[0]?.content ?? {
        role: "model",
        parts: []
      };

      const responseParts: Part[] = [];
      for (const fc of functionCalls as FunctionCall[]) {
        const name = fc.name;
        const args = (fc.args ?? {}) as object;
        const out = await executeTool(name, args);
        responseParts.push({
          functionResponse: { name, response: out }
        });
      }

      const userContent: Content = {
        role: "user",
        parts: responseParts
      };

      currentContents = [...currentContents, modelContent, userContent];
    }

    return "تم تجاوز حد جولات الأدوات. جرّب صياغة أوضح.";
  }
}

// Singleton instance
export const geminiClient = new GeminiClient();
