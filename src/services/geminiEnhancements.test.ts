import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry, withTimeout, getErrorMessage, AICache } from "./geminiEnhancements";

describe("geminiEnhancements", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("withRetry", () => {
    it("should resolve immediately if the function succeeds", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await withRetry(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry and resolve if the function fails initially but succeeds later", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValueOnce("success");
      const onRetry = vi.fn();

      const promise = withRetry(fn, onRetry);

      // Fast forward past the first delay (1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      // Fast forward past the second delay (2000ms)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, new Error("fail 1"));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, new Error("fail 2"));
    });

    it("should throw the last error if max retries are exceeded", async () => {
      const expectedError = new Error("persistent failure");
      const fn = vi.fn().mockRejectedValue(expectedError);
      const onRetry = vi.fn();

      const promise = withRetry(fn, onRetry);

      // We need to catch the rejection to avoid UnhandledPromiseRejectionWarning
      let caughtError: Error | null = null;
      promise.catch(err => { caughtError = err; });

      // RETRY_CONFIG.maxRetries is 3
      // Delays: 1000ms, 2000ms, 4000ms
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await expect(promise).rejects.toThrow("persistent failure");

      // Initial call + 3 retries = 4 calls total
      expect(fn).toHaveBeenCalledTimes(4);
      expect(onRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe("withTimeout", () => {
    it("should resolve if the promise resolves before timeout", async () => {
      const promise = Promise.resolve("success");
      const result = await withTimeout(promise, 1000);
      expect(result).toBe("success");
    });

    it("should reject if the promise takes longer than timeout", async () => {
      const slowPromise = new Promise(resolve => setTimeout(() => resolve("success"), 2000));

      const timeoutPromise = withTimeout(slowPromise, 1000);

      // Catch rejection to avoid UnhandledPromiseRejectionWarning
      let caughtError: Error | null = null;
      timeoutPromise.catch(err => { caughtError = err; });

      await vi.advanceTimersByTimeAsync(1000);

      await expect(timeoutPromise).rejects.toThrow("Request timeout");
    });
  });

  describe("getErrorMessage", () => {
    it("should return correct message for 429/quota errors", () => {
      expect(getErrorMessage(new Error("API returned 429"))).toContain("مشغولة");
      expect(getErrorMessage({ message: "quota exceeded" })).toContain("مشغولة");
      expect(getErrorMessage("RESOURCE_EXHAUSTED error")).toContain("مشغولة");
    });

    it("should return correct message for timeout errors", () => {
      expect(getErrorMessage(new Error("Request timeout"))).toContain("بطيء");
    });

    it("should return correct message for 401/403 errors", () => {
      expect(getErrorMessage(new Error("Status 401 Unauthorized"))).toContain("المصادقة");
      expect(getErrorMessage({ message: "403 Forbidden" })).toContain("المصادقة");
    });

    it("should return correct message for 5xx errors", () => {
      expect(getErrorMessage(new Error("503 Service Unavailable"))).toContain("غير متاحة");
      expect(getErrorMessage({ message: "500 Internal Server Error" })).toContain("غير متاحة");
    });

    it("should return default message for unknown errors", () => {
      expect(getErrorMessage(new Error("Something strange happened"))).toContain("غير متوقع");
    });
  });

  describe("AICache", () => {
    it("should store and retrieve values", () => {
      const cache = new AICache();
      const key = AICache.generateKey("test prompt");

      cache.set(key, "cached response");
      expect(cache.get(key)).toBe("cached response");
    });

    it("should return null for expired entries", async () => {
      const cache = new AICache();
      const key = AICache.generateKey("test prompt");

      cache.set(key, "cached response");

      // Advance time by more than TTL (3600000ms = 1 hour)
      await vi.advanceTimersByTimeAsync(3600001);

      expect(cache.get(key)).toBeNull();
    });

    it("should clear the cache", () => {
      const cache = new AICache();
      const key = AICache.generateKey("test prompt");

      cache.set(key, "cached response");
      cache.clear();

      expect(cache.get(key)).toBeNull();
    });
  });
});
