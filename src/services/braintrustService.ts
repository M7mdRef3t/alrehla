/**
 * Braintrust Service — Lightweight stub.
 * Logs LLM calls when the braintrust SDK is available; silently no-ops otherwise.
 */

class BraintrustService {
  logCall(_name: string, _input: unknown, _output: unknown, _metadata: unknown = {}) {
    // No-op: braintrust integration disabled until SDK is installed
  }

  startSpan(_name: string, _input: unknown): null {
    return null;
  }
}

export const braintrustService = new BraintrustService();
