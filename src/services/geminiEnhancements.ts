/**
 * Enhanced Gemini Client with improvements:
 * - Retry logic with exponential backoff
 * - Request timeout handling
 * - Response caching
 * - Better error messages
 */

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
};

const GENERATION_TIMEOUT = 30000; // 30 seconds

interface CacheEntry {
  text: string;
  timestamp: number;
}

/**
 * Retry helper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < RETRY_CONFIG.maxRetries) {
        const delayMs = Math.min(
          RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelayMs
        );

        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

/**
 * Timeout wrapper for promises
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    )
  ]);
}

/**
 * Get appropriate error message based on error type
 */
function getErrorMessage(error: unknown): string {
  const msg = error && typeof error === "object" && "message" in error
    ? String((error as { message?: string }).message)
    : String(error);

  if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "الخدمة مشغولة جداً الآن. حاول مرة أخرى بعد قليل.";
  }
  if (msg.includes("timeout")) {
    return "الاتصال بطيء جداً. تأكد من الشبكة وحاول مرة أخرى.";
  }
  if (msg.includes("401") || msg.includes("403")) {
    return "مشكلة في المصادقة. تواصل مع الدعم.";
  }
  if (msg.includes("5") || msg.includes("503")) {
    return "خدمة الذكاء الاصطناعي غير متاحة حالياً.";
  }
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}

/**
 * Cache manager for AI responses
 */
class AICache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 3600000; // 1 hour

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.text;
  }

  set(key: string, value: string): void {
    this.cache.set(key, {
      text: value,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key from prompt (first 100 chars)
  static generateKey(prompt: string): string {
    return `ai_cache_${prompt.substring(0, 100).replace(/\s+/g, "_")}`;
  }
}

export { withRetry, withTimeout, getErrorMessage, AICache, GENERATION_TIMEOUT };

/**
 * Usage Example:
 * 
 * const result = await withRetry(
 *   () => fetch(url).then(r => r.json()),
 *   (attempt, error) => {
 *     console.log(`Retry attempt ${attempt}, error: ${error.message}`);
 *   }
 * );
 * 
 * const response = await withTimeout(
 *   fetch(url),
 *   30000 // 30 seconds
 * );
 */
