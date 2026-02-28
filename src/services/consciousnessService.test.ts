import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { consciousnessService } from "./consciousnessService";
import { geminiClient } from "./geminiClient";

vi.mock("./geminiClient", () => ({
  geminiClient: {
    generateJSON: vi.fn(),
  },
}));

vi.mock("../state/consciousnessHistoryState", () => ({
  useConsciousnessHistory: {
    getState: vi.fn(() => ({
      addPoint: vi.fn(),
    })),
  },
}));

describe("consciousnessService", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("handles errors gracefully and returns null when generateJSON fails", async () => {
    // Arrange
    const mockError = new Error("Mocked API Error");
    vi.mocked(geminiClient.generateJSON).mockRejectedValueOnce(mockError);

    // Act
    const result = await consciousnessService.analyzeConsciousness("I feel confused");

    // Assert
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Consciousness Analysis Error:", mockError);
  });

  it("returns insights successfully when generateJSON succeeds", async () => {
    // Arrange
    const mockResponse = {
      emotionalState: "Happy",
      underlyingPattern: "Joy",
      suggestedAction: "Smile",
      intensity: 8,
    };
    vi.mocked(geminiClient.generateJSON).mockResolvedValueOnce(mockResponse);

    // Act
    const result = await consciousnessService.analyzeConsciousness("I feel great!");

    // Assert
    expect(result).toEqual(mockResponse);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    // Verify memory was updated - getMemory returns array of ISOString: event
    const memory = consciousnessService.getMemory();
    expect(memory.some(item => item.includes(`تحليل: Happy - Joy`))).toBe(true);
  });
});
