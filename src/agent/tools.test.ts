import { describe, it, expect, vi } from "vitest";
import { executeToolCall } from "./tools";
import type { AgentActions, AgentRoute } from "./types";
import type { Ring } from "../modules/map/mapTypes";

describe("executeToolCall", () => {
  const mockActions: AgentActions = {
    logSituation: vi.fn(),
    addOrUpdateSymptom: vi.fn(),
    updateRelationshipZone: vi.fn(),
    navigate: vi.fn(),
    showOverlay: vi.fn(),
  };

  it("should catch and return standard Error objects thrown by actions", async () => {
    // Arrange
    const errorMessage = "Simulated action error";
    mockActions.logSituation = vi.fn().mockRejectedValue(new Error(errorMessage));

    // Act
    const result = await executeToolCall(
      "logSituation",
      { personLabelOrId: "person1", text: "Some text" },
      mockActions
    );

    // Assert
    expect(result).toEqual({
      result: {},
      error: errorMessage,
    });
  });

  it("should catch and return non-Error strings thrown by actions", async () => {
    // Arrange
    const errorString = "String error thrown directly";
    mockActions.addOrUpdateSymptom = vi.fn().mockRejectedValue(errorString);

    // Act
    const result = await executeToolCall(
      "addOrUpdateSymptom",
      { personLabelOrId: "person1", symptomIdOrText: "symptom1" },
      mockActions
    );

    // Assert
    expect(result).toEqual({
      result: {},
      error: errorString,
    });
  });
});
