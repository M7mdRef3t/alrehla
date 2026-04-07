import { CircuitBreaker } from "./circuitBreaker";

export interface ResilientHttpOptions {
  retries?: number;
  retryDelayMs?: number;
  breaker?: CircuitBreaker;
  timeoutMs?: number;
}

function shouldRetryStatus(status: number): boolean {
  // 429 (Too Many Requests) is handled by the caller (cooldown logic)
  // so we don't retry it here to avoid wasting quota or noise.
  return (
    status === 408 ||
    status === 425 ||
    (status >= 500 && status <= 504)
  );
}

/**
 * 401 and 403 are permanent auth failures — no point retrying.
 * Trip the circuit breaker immediately so polling loops stop quickly.
 */
function isPermanentAuthFailure(status: number): boolean {
  return status === 401 || status === 403;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJsonWithResilience<T>(
  url: string,
  init: RequestInit,
  options: ResilientHttpOptions = {}
): Promise<T | null> {
  const retries = Math.max(0, options.retries ?? 1);
  const retryDelayMs = Math.max(100, options.retryDelayMs ?? 350);
  const breaker = options.breaker;
  const timeoutMs = Math.max(500, options.timeoutMs ?? 4000);

  if (breaker && !breaker.canRequest()) return null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        if (breaker) breaker.markSuccess();
        return (await res.json()) as T;
      }
      // Auth failures are permanent — trip the breaker immediately and stop.
      if (isPermanentAuthFailure(res.status)) {
        if (breaker) {
          breaker.markFailure();
          breaker.markFailure(); // double-mark to exceed threshold and open circuit fast
        }
        return null;
      }
      if (attempt < retries && shouldRetryStatus(res.status)) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      if (breaker) breaker.markFailure();
      return null;
    } catch {
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      if (breaker) breaker.markFailure();
      return null;
    }
  }
  return null;
}

export async function sendJsonWithResilience(
  url: string,
  body: unknown,
  init: Omit<RequestInit, "body" | "method"> = {},
  options: ResilientHttpOptions = {}
): Promise<boolean> {
  const retries = Math.max(0, options.retries ?? 1);
  const retryDelayMs = Math.max(100, options.retryDelayMs ?? 350);
  const breaker = options.breaker;
  const timeoutMs = Math.max(500, options.timeoutMs ?? 4000);

  if (breaker && !breaker.canRequest()) return false;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: "POST",
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {})
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        if (breaker) breaker.markSuccess();
        return true;
      }
      // Auth failures are permanent — trip the breaker immediately and stop.
      if (isPermanentAuthFailure(res.status)) {
        if (breaker) {
          breaker.markFailure();
          breaker.markFailure();
        }
        return false;
      }
      if (attempt < retries && shouldRetryStatus(res.status)) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      if (breaker) breaker.markFailure();
      return false;
    } catch {
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      if (breaker) breaker.markFailure();
      return false;
    }
  }
  return false;
}
