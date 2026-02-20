import { CircuitBreaker } from "./circuitBreaker";

export interface ResilientHttpOptions {
  retries?: number;
  retryDelayMs?: number;
  breaker?: CircuitBreaker;
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 504);
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

  if (breaker && !breaker.canRequest()) return null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, init);
      if (res.ok) {
        if (breaker) breaker.markSuccess();
        return (await res.json()) as T;
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

  if (breaker && !breaker.canRequest()) return false;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: "POST",
        ...init,
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

