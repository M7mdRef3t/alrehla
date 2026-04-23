import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock supabase — always "unavailable" for unit tests
vi.mock("./supabaseClient", () => ({
  supabase: null,
  isSupabaseReady: false,
  safeGetSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null }))
}));

vi.mock("./clientRuntime", () => ({
  getWindowOrNull: () => null
}));

vi.mock("../config/runtimeEnv", () => ({
  runtimeEnv: {
    authRedirectUrl: "https://alrehla.app",
    publicAppUrl: "https://alrehla.app",
    isDev: false
  }
}));

describe("authService", () => {
  describe("normalizePhoneNumber", () => {
    let normalizePhoneNumber: typeof import("./authService").normalizePhoneNumber;

    beforeEach(async () => {
      const mod = await import("./authService");
      normalizePhoneNumber = mod.normalizePhoneNumber;
    });

    it("adds Egypt country code (+20) when missing", () => {
      expect(normalizePhoneNumber("01012345678")).toBe("+201012345678");
    });

    it("handles number without leading zero", () => {
      expect(normalizePhoneNumber("1012345678")).toBe("+201012345678");
    });

    it("converts 00 prefix to + prefix", () => {
      expect(normalizePhoneNumber("002012345678")).toBe("+2012345678");
    });

    it("preserves existing + prefix", () => {
      expect(normalizePhoneNumber("+201012345678")).toBe("+201012345678");
    });

    it("strips whitespace and non-digit characters", () => {
      expect(normalizePhoneNumber("+20 101 234 5678")).toBe("+201012345678");
      expect(normalizePhoneNumber("010-1234-5678")).toBe("+201012345678");
    });

    it("handles international numbers with + prefix", () => {
      expect(normalizePhoneNumber("+447911123456")).toBe("+447911123456");
    });
  });

  describe("signInWithEmail guard", () => {
    it("returns error when supabase is unavailable", async () => {
      const { signInWithEmail } = await import("./authService");
      const result = await signInWithEmail("test@test.com", "password");
      expect(result.data.user).toBeNull();
      expect(result.data.session).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("غير متاح");
    });
  });

  describe("signUpWithEmail guard", () => {
    it("returns error when supabase is unavailable", async () => {
      const { signUpWithEmail } = await import("./authService");
      const result = await signUpWithEmail("test@test.com", "password");
      expect(result.data.user).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe("signOut guard", () => {
    it("does not throw when supabase is unavailable", async () => {
      const { signOut } = await import("./authService");
      await expect(signOut()).resolves.toBeUndefined();
    });
  });
});
