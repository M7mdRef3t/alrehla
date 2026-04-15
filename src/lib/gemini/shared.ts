import { GoogleGenerativeAI, type GenerativeModel, type GenerateContentResult } from "@google/generative-ai";

export const DEFAULT_MODEL_ORDER: string[] = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: string }).message);
  }
  return String(error || "unknown_error");
}

export function isRetryableModelError(error: unknown): boolean {
  const msg = extractErrorMessage(error).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("permission") ||
    msg.includes("denied") ||
    msg.includes("403") ||
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("model") ||
    msg.includes("unsupported")
  );
}

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_PRO_API_KEY;
  if (!apiKey) {
    console.error("[Gemini Shared] No API Key found in environment variables.");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel(
  client: GoogleGenerativeAI,
  modelName: string,
  generationConfig: Record<string, unknown>
): GenerativeModel {
  return client.getGenerativeModel({
    model: modelName,
    generationConfig
  });
}

const WINDOW_MS = 60_000;
const REQUESTS_PER_MINUTE = 80;
const MAX_IN_FLIGHT = 8;
const requestTimes: number[] = [];
let inFlight = 0;

function pruneRequestTimes(now = Date.now()): void {
  const min = now - WINDOW_MS;
  while (requestTimes.length > 0 && requestTimes[0] < min) requestTimes.shift();
}

export function canAcceptGeminiRequest(now = Date.now()): boolean {
  pruneRequestTimes(now);
  if (inFlight >= MAX_IN_FLIGHT) return false;
  if (requestTimes.length >= REQUESTS_PER_MINUTE) return false;
  return true;
}

export function markGeminiRequestStart(now = Date.now()): void {
  pruneRequestTimes(now);
  requestTimes.push(now);
  inFlight += 1;
}

export function markGeminiRequestEnd(): void {
  inFlight = Math.max(0, inFlight - 1);
}

export async function withTimeout<T>(task: Promise<T>, timeoutMs = 25_000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("gemini_timeout")), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Direct SDK call — for server-side use without going through the HTTP API route.
 * Avoids relative URL resolution failures in Next.js SSR/API contexts.
 */
export async function performInternalGeneration(
  prompt: string,
  config: Record<string, unknown> = DEFAULT_GENERATION_CONFIG,
  models: string[] = DEFAULT_MODEL_ORDER,
  feature: string = "dynamic_generation"
): Promise<{ text: string; usage: unknown } | { text: null; usage: null; fallback: true; reason: string; detail?: string }> {
  const client = getGeminiClient();
  if (!client) {
    return { text: null, usage: null, fallback: true, reason: "gemini_api_key_missing" };
  }
  if (!canAcceptGeminiRequest()) {
    return { text: null, usage: null, fallback: true, reason: "rate_limited" };
  }

  markGeminiRequestStart();
  let lastError: unknown = null;
  try {
    for (const modelName of models) {
      try {
        const model = getGeminiModel(client, modelName, config);
        const result: GenerateContentResult = await withTimeout(model.generateContent(prompt), 25_000);
        const response = result.response;
        const text = response.text();
        const usage = (response as { usageMetadata?: unknown }).usageMetadata ?? null;
        return { text, usage };
      } catch (err) {
        lastError = err;
        if (isRetryableModelError(err)) continue;
        break;
      }
    }
  } finally {
    markGeminiRequestEnd();
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError ?? "unknown");
  const reason = msg.includes("gemini_timeout") ? "generation_timeout" : "generation_failed";
  console.error(`[Gemini:performInternalGeneration] [${feature}] Failed:`, msg);
  return { text: null, usage: null, fallback: true, reason, detail: msg };
}

