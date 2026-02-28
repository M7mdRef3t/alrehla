import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry, withTimeout, getErrorMessage, AICache } from "./geminiEnhancements";

describe("geminiEnhancements", () => {
  describe("withRetry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("should succeed immediately without retries", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const onRetry = vi.fn();

      const result = await withRetry(fn, onRetry);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
    });

    it("should retry on failure and eventually succeed", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("failure 1"))
        .mockRejectedValueOnce(new Error("failure 2"))
        .mockResolvedValueOnce("success");
      const onRetry = vi.fn();

      const promise = withRetry(fn, onRetry);

      // Fast-forward timers to advance past the `setTimeout` delays in `withRetry`
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, new Error("failure 1"));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, new Error("failure 2"));
    });

    it("should throw the last error after exhausting max retries", async () => {
      // Need to handle the promise rejection immediately to avoid UnhandledPromiseRejectionWarning
      let tryCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        tryCount++;
        return Promise.reject(new Error(`persistent failure ${tryCount}`));
      });
      const onRetry = vi.fn();

      const promise = withRetry(fn, onRetry);

      // We must catch it, otherwise it becomes unhandled while we're fast-forwarding timers.
      let caughtError: Error | undefined;
      promise.catch(e => { caughtError = e; });

      await vi.runAllTimersAsync();

      // Wait for the promise to fully reject so we can assert on it.
      await expect(promise).rejects.toThrow("persistent failure 4");

      // initial attempt (0) + 3 retries (1, 2, 3) = 4 attempts total
      expect(fn).toHaveBeenCalledTimes(4);
      expect(onRetry).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, new Error("persistent failure 1"));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, new Error("persistent failure 2"));
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, new Error("persistent failure 3"));
    });
  });
});
