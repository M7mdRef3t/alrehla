import { initLogger, type Span, type Logger } from "braintrust";
import { runtimeEnv } from "@/config/runtimeEnv";

class BraintrustService {
  private logger: Logger | null = null;
  private isInitialized = false;

  private init() {
    if (this.isInitialized) return;
    const apiKey = runtimeEnv.braintrustApiKey;

    if (apiKey) {
      try {
        this.logger = initLogger({
          projectName: "alrehla-core",
          apiKey,
        });
        this.isInitialized = true;
        console.log("[Braintrust] Logger initialized successfully.");
      } catch (error) {
        console.error("[Braintrust] Initialization failed:", error);
      }
    }
  }

  /**
   * Starts a new trace span for an LLM operation.
   * ONLY use this in server-side contexts to protect the API key.
   */
  startSpan(name: string, input: any): Span | null {
    if (typeof window !== "undefined") return null; // Safety guard
    this.init();
    if (!this.logger) return null;

    return this.logger.traced(name, {
      input,
    });
  }

  /**
   * Logs an LLM call directly.
   */
  logCall(name: string, input: any, output: any, metadata: any = {}) {
    if (typeof window !== "undefined") return;
    this.init();
    if (!this.logger) return;

    this.logger.log({
      name,
      input,
      output,
      metadata: {
        ...metadata,
        system: "alrehla-intelligence",
      },
    });
  }
}

export const braintrustService = new BraintrustService();
