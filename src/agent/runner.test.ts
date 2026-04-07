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
          journey_tools: true,
          basic_diagnosis: true,
          mirror_tool: true,
          family_tree: true,
          internal_boundaries: true,
          generative_ui_mode: true,
          global_atlas: true,
          ai_field: true,
          pulse_check: true,
          pulse_weekly_recommendation: true,
          pulse_immediate_action: true,
          dynamic_routing_v2: true,
          dynamic_routing_owner_observability: true,
          golden_needle_enabled: true,
          language_switcher: true,
          armory_section: true,
          landing_live_metrics: true,
          landing_live_testimonials: true,
          dawayir_live: true,
          dawayir_live_couple: true,
          dawayir_live_coach: true,
          dawayir_live_camera: true
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
        (vi.mocked(useMapState.getState) as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
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

        (vi.mocked(useMapState.getState) as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
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
