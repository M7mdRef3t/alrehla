import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

/**
 * Gemini AI Client
 * Handles all interactions with Google's Gemini API
 */

class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Get API key from environment variable
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!this.apiKey) return;

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.7, // Balance between creativity and consistency
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        }
      });
      console.log('✅ Gemini AI initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
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
    if (!this.model) {
      yield 'AI غير متاح حالياً';
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
      yield 'حدث خطأ في الاتصال';
    }
  }
}

// Singleton instance
export const geminiClient = new GeminiClient();
