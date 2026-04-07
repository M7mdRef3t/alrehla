import { describe, it, expect, vi, beforeEach } from "vitest";
import { geminiClient } from "@/services/geminiClient";

describe("geminiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("generates text via proxy", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: "hello" })
    });

    const out = await geminiClient.generate("hi");
    expect(out).toBe("hello");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("handles function calling loop once", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          functionCalls: [{ name: "showCard", args: { cardId: "breathing" } }],
          modelContent: { role: "model", parts: [{ text: "call tool" }] }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ text: "done" })
      });

    const toolSpy = vi.fn(async () => ({ result: { ok: true } }));
    const result = await geminiClient.generateWithTools(
      {
        contents: [],
        tools: []
      },
      toolSpy
    );

    expect(result).toBe("done");
    expect(toolSpy).toHaveBeenCalled();
  });
});
