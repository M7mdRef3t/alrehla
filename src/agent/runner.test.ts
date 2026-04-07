import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAgentActions, RunnerDeps } from "./runner";
import { useMapState } from "../state/mapState";

// Mock the zustand store
vi.mock("../state/mapState", () => ({
  useMapState: {
    getState: vi.fn(),
  },
}));

describe("runner", () => {
  describe("createAgentActions", () => {
    let mockDeps: RunnerDeps;

    beforeEach(() => {
      vi.clearAllMocks();

      mockDeps = {
        resolvePerson: vi.fn().mockReturnValue("mock-node-id"),
        onNavigateBreathing: vi.fn(),
        onNavigateGym: vi.fn(),
        onNavigateMap: vi.fn(),
        onNavigateBaseline: vi.fn(),
        onNavigateEmergency: vi.fn(),
        availableFeatures: {
          dawayir_map: true,
          basic_diagnosis: true,
          social_circles: true,
          ai_chatbot: true,
          advanced_analytics: true,
        },
        onNavigatePerson: vi.fn(),
      };
    });

    it("should create agent actions successfully", () => {
      const actions = createAgentActions(mockDeps);
      expect(actions).toBeDefined();
      expect(typeof actions.logSituation).toBe("function");
      expect(typeof actions.addOrUpdateSymptom).toBe("function");
      expect(typeof actions.updateRelationshipZone).toBe("function");
      expect(typeof actions.navigate).toBe("function");
      expect(typeof actions.showOverlay).toBe("function");
    });

    describe("logSituation", () => {
      it("should handle error path when addSituationLog throws", async () => {
        // Setup mock for getState
        const mockAddSituationLog = vi.fn().mockImplementation(() => {
          throw new Error("Mocked database error");
        });

        // Ensure vi.mocked works properly with the destructured import
        (vi.mocked(useMapState.getState) as any).mockReturnValue({
          addSituationLog: mockAddSituationLog
        });

        const actions = createAgentActions(mockDeps);
        const result = await actions.logSituation("John", "Had an argument", "غاضب");

        expect(mockAddSituationLog).toHaveBeenCalledWith("mock-node-id", {
          situation: "Had an argument",
          feeling: "غاضب",
          response: "-",
          outcome: "-",
          lesson: "-"
        });
        expect(result).toEqual({ ok: false, error: "Mocked database error" });
      });

      it("should handle error path when addSituationLog throws a non-Error object", async () => {
        // Setup mock for getState
        const mockAddSituationLog = vi.fn().mockImplementation(() => {
          throw "String error";
        });

        (vi.mocked(useMapState.getState) as any).mockReturnValue({
          addSituationLog: mockAddSituationLog
        });

        const actions = createAgentActions(mockDeps);
        const result = await actions.logSituation("John", "Had an argument", "غاضب");

        expect(mockAddSituationLog).toHaveBeenCalled();
        expect(result).toEqual({ ok: false, error: "String error" });
      });
    });
  });
});
