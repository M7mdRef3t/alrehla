import { describe, it, expect, vi } from "vitest";
import { executeToolCall } from "./tools";
import type { AgentActions } from "./types";

describe("executeToolCall", () => {
  it("catches and returns exceptions as error strings", async () => {
    const errorMsg = "Simulated unexpected failure";
    // Mock the actions object so that a tool throws an exception
    const mockActions: AgentActions = {
      logSituation: vi.fn().mockImplementation(() => {
        throw new Error(errorMsg);
      }),
      addOrUpdateSymptom: vi.fn(),
      updateRelationshipZone: vi.fn(),
      navigate: vi.fn(),
    };

    const args = { personLabelOrId: "person1", text: "Some situation" };

    const result = await executeToolCall("logSituation", args, mockActions);

    expect(result).toEqual({
      result: {},
      error: errorMsg,
    });
  });

  it("handles non-Error object throws gracefully", async () => {
    // Some libraries or code might throw strings directly
    const errorString = "String throw error";
    const mockActions: AgentActions = {
      logSituation: vi.fn().mockImplementation(() => {
        throw errorString;
      }),
      addOrUpdateSymptom: vi.fn(),
      updateRelationshipZone: vi.fn(),
      navigate: vi.fn(),
    };

    const args = { personLabelOrId: "person1", text: "Some situation" };

    const result = await executeToolCall("logSituation", args, mockActions);

    expect(result).toEqual({
      result: {},
      error: errorString,
    });
  });
});
