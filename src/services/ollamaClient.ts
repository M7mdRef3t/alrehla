import { runtimeEnv } from "@/config/runtimeEnv";

export interface OllamaOptions {
  model?: string;
  system?: string;
  template?: string;
  format?: "json";
  options?: Record<string, unknown>;
  stream?: boolean;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = runtimeEnv.ollamaBaseUrl;
    this.defaultModel = runtimeEnv.localAiModel;
  }

  /** Checks if the local Ollama server is reachable */
  async isAvailable(): Promise<boolean> {
    if (!runtimeEnv.localAiEnabled) return false;
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(2000), // Quick check
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generates a completion from the local model.
   * Uses the /api/generate endpoint.
   */
  async generate(prompt: string, options: OllamaOptions = {}): Promise<string> {
    const payload = {
      model: options.model || this.defaultModel,
      prompt,
      system: options.system,
      template: options.template,
      format: options.format,
      stream: false, // Default to non-streaming for easier integration
      options: {
        temperature: 0.7,
        num_predict: 2048,
        ...options.options,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama Error: ${response.status} - ${errText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error("[OllamaClient] Generation failed:", error);
      throw error;
    }
  }

  /**
   * Generates a structured JSON completion.
   */
  async generateStructured<T>(prompt: string, systemPrompt: string): Promise<T> {
    const responseText = await this.generate(prompt, {
      system: systemPrompt,
      format: "json",
    });

    try {
      return JSON.parse(responseText) as T;
    } catch (error) {
      console.error("[OllamaClient] Failed to parse structured response:", responseText);
      throw new Error("Invalid structured response from Local AI");
    }
  }
}

export const ollamaClient = new OllamaClient();
