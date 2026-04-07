import { describe, it, expect, vi } from "vitest";
import { executeToolCall } from "./tools";
import type { AgentActions } from "./types";

describe("executeToolCall", () => {
  it("should handle thrown Error instances and return the error message", async () => {
    // Create a mock actions object where logSituation throws an Error
    const mockActions = {
      logSituation: vi.fn().mockRejectedValue(new Error("Database connection failed")),
      addOrUpdateSymptom: vi.fn(),
      updateRelationshipZone: vi.fn(),
      navigate: vi.fn(),
      showOverlay: vi.fn(),
    } as unknown as AgentActions;

    const result = await executeToolCall("logSituation", { personLabelOrId: "Ali", text: "He was angry" }, mockActions);

    expect(result).toEqual({
      result: {},
      error: "Database connection failed",
    });
  });

  it("should handle thrown non-Error primitives and return them as string", async () => {
    // Create a mock actions object where logSituation throws a string
    const mockActions = {
      logSituation: vi.fn().mockRejectedValue("Primitive string error"),
      addOrUpdateSymptom: vi.fn(),
      updateRelationshipZone: vi.fn(),
      navigate: vi.fn(),
      showOverlay: vi.fn(),
    } as unknown as AgentActions;

    const result = await executeToolCall("logSituation", { personLabelOrId: "Ahmed", text: "We talked" }, mockActions);

    expect(result).toEqual({
      result: {},
      error: "Primitive string error",
    });
  });
});
