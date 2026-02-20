export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
}

export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private state: CircuitState = "closed";
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = Math.max(1, options.failureThreshold ?? 3);
    this.cooldownMs = Math.max(500, options.cooldownMs ?? 15_000);
  }

  canRequest(now = Date.now()): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open" && now - this.openedAt >= this.cooldownMs) {
      this.state = "half-open";
      return true;
    }
    return this.state === "half-open";
  }

  markSuccess(): void {
    this.failures = 0;
    this.state = "closed";
    this.openedAt = 0;
  }

  markFailure(now = Date.now()): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = "open";
      this.openedAt = now;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

