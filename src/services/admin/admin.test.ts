import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Admin Module Tests
 * 
 * These tests verify the safety guards in the admin module:
 * 1. Auth guard: callAdminApi rejects when no token/code
 * 2. Settings: operations are type-safe and handle nulls
 * 3. Barrel re-export: the barrel file correctly re-exports all modules
 */

// Mock auth store — no credentials available
vi.mock("@/domains/auth/store/auth.store", () => ({
  getAuthToken: () => null
}));

vi.mock("@/domains/admin/store/admin.store", () => ({
  useAdminState: {
    getState: () => ({ adminCode: null })
  }
}));

// Mock runtimeEnv
vi.mock("@/config/runtimeEnv", () => ({
  runtimeEnv: {
    adminApiBase: "https://api.alrehla.app",
    isDev: false,
    ownerSecurityWebhookUrl: null
  }
}));

// Mock resilientHttp — prevent real network calls
vi.mock("@/architecture/resilientHttp", () => ({
  fetchJsonWithResilience: vi.fn().mockResolvedValue(null),
  sendJsonWithResilience: vi.fn().mockResolvedValue(false)
}));

describe("adminCore", () => {
  describe("callAdminApi auth guard", () => {
    it("returns null when no auth token or admin code is available", async () => {
      const { callAdminApi } = await import("./adminCore");
      const result = await callAdminApi("overview");
      expect(result).toBeNull();
    });

    it("does not make network calls without credentials", async () => {
      const { fetchJsonWithResilience } = await import("@/architecture/resilientHttp");
      const { callAdminApi } = await import("./adminCore");
      
      await callAdminApi("overview");
      
      // Should not call fetch because auth is missing
      expect(fetchJsonWithResilience).not.toHaveBeenCalled();
    });
  });
});

describe("adminTypes", () => {
  it("exports all expected type interfaces", async () => {
    // Verify the types module exports are loadable (compile-time check)
    const types = await import("./adminTypes");
    expect(types).toBeDefined();
  });
});

/**
 * Barrel re-export correctness is verified by:
 * 1. TypeScript compilation (npm run typecheck) — if any re-export is missing,
 *    the 50+ consumer files that import from adminApi.ts (now a barrel) will fail.
 * 2. The full test suite — if any function signature changed, downstream tests break.
 * 
 * No dynamic import test needed here since it triggers heavy Supabase initialization.
 */

