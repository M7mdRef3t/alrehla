import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

export const DEFAULT_MODEL_ORDER: string[] = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview"
];

export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

export function isRateLimitError(error: unknown): boolean {
  const msg = error && typeof error === "object" && "message" in error
    ? String((error as { message?: string }).message)
    : "";
  return msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
}

export function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export function getModel(
  client: GoogleGenerativeAI,
  modelName: string,
  generationConfig: Record<string, unknown>
): GenerativeModel {
  return client.getGenerativeModel({
    model: modelName,
    generationConfig
  });
}

