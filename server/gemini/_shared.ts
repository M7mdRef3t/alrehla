import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { getSupabaseAdminClient } from "../../app/api/_lib/supabaseAdmin";

export const DEFAULT_MODEL_ORDER: string[] = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite-preview",
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
  const msg = error && typeof error === "object" && "message" in error
    ? String((error as { message?: string }).message)
    : "";
  return msg;
}

export function isRateLimitError(error: unknown): boolean {
  const msg = extractErrorMessage(error);
  return msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
}

// أخطاء شائعة عند عدم توفر موديل معين أو صلاحياته
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

export function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_PRO_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log("[Gemini API] API Key found (censored):", apiKey ? apiKey.slice(0, 5) + "..." : "NONE");
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

export async function withTimeout<T>(task: Promise<T>, timeoutMs = 18_000): Promise<T> {
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

export async function logAiTelemetry(data: {
  feature: string;
  model: string;
  latency_ms: number;
  tokens: { prompt: number; completion: number; total: number };
  success: boolean;
  failure_reason?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, any>;
}) {
  try {
    const admin = getSupabaseAdminClient();
    if (!admin) {
      console.warn("[Gemini Telemetry] Supabase Admin client not available.");
      return;
    }

    const requestId = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

    // Mapping failure reasons to allowed enum values in ai_telemetry table
    let mappedReason = data.failure_reason;
    if (!data.success && !mappedReason) {
      mappedReason = "unknown";
    }
    
    // Ensure reason is one of the allowed types or null if success
    const allowedReasons = ['hallucination', 'format_mismatch', 'token_limit_exceeded', 'rate_limited', 'timeout', 'provider_error', 'network_error', 'unknown'];
    if (data.success) {
      mappedReason = undefined; 
    } else if (mappedReason && !allowedReasons.includes(mappedReason)) {
      mappedReason = "provider_error"; // Default for unmapped errors
    }

    const { error } = await admin.from("ai_telemetry").insert({
      request_id: requestId,
      feature: data.feature || "unknown",
      model: data.model || "unknown",
      llm_latency_ms: Math.max(0, Math.floor(data.latency_ms)),
      prompt_tokens: data.tokens.prompt || 0,
      completion_tokens: data.tokens.completion || 0,
      total_tokens: data.tokens.total || 0,
      json_success: data.success,
      failure_reason: mappedReason,
      error_message: data.errorMessage || null,
      metadata: {
        ...(data.metadata || {}),
        timestamp: new Date().toISOString()
      }
    });

    if (error) console.error("[Gemini Telemetry] Insert failed:", error);
  } catch (err) {
    console.error("[Gemini Telemetry] Critical error logging AI data:", err);
  }
}

