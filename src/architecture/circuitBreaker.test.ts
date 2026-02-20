import { describe, expect, it } from "vitest";
import { CircuitBreaker } from "./circuitBreaker";

describe("CircuitBreaker", () => {
  it("opens after threshold failures and recovers after cooldown", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 });

    expect(breaker.canRequest(0)).toBe(true);
    breaker.markFailure(10);
    expect(breaker.getState()).toBe("closed");

    breaker.markFailure(20);
    expect(breaker.getState()).toBe("open");
    expect(breaker.canRequest(100)).toBe(false);
    expect(breaker.canRequest(1300)).toBe(true);
    expect(breaker.getState()).toBe("half-open");

    breaker.markSuccess();
    expect(breaker.getState()).toBe("closed");
    expect(breaker.canRequest(1400)).toBe(true);
  });
});

