import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateQuickPath, getQuickPathHistory } from "./quickPath";
import { geminiClient } from "./geminiClient";

vi.mock("./geminiClient", () => ({
  geminiClient: {
    isAvailable: vi.fn(),
    generateJSON: vi.fn(),
  }
}));

describe("quickPath", () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    const getItemMock = vi.fn((key: string) => localStorageMock[key] || null);
    const setItemMock = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    vi.stubGlobal("localStorage", {
      getItem: getItemMock,
      setItem: setItemMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles getFromLocalStorage exception gracefully", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("Storage unavailable"); },
      setItem: vi.fn(),
    });

    const history = getQuickPathHistory();
    expect(history).toEqual([]);
  });

  it("handles setInLocalStorage exception gracefully", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => { throw new Error("Storage full"); },
    });

    // Mock gemini to return a fallback static phrase
    (geminiClient.isAvailable as any).mockReturnValue(false);

    const result = await generateQuickPath("pressure", "context");
    expect(result.exitPhrase).toBeDefined(); // Should not throw

    // verify it didn't crash
    const history = getQuickPathHistory();
    // since setItem threw, we don't expect history to be updated, but getting history should not throw
    expect(history).toEqual([]);
  });
});
