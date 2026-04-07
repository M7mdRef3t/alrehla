import { describe, it, expect, vi } from "vitest";
import { createAgentActions, type RunnerDeps } from "./runner";
import { useMapState } from "../state/mapState";

vi.mock("../state/mapState", () => ({
  useMapState: {
    getState: vi.fn(),
  },
}));

describe("Agent Runner", () => {
  describe("logSituation error paths", () => {
    const mockDeps = {
      resolvePerson: vi.fn().mockReturnValue("node123"),
      onNavigateBreathing: vi.fn(),
      onNavigateGym: vi.fn(),
      onNavigateMap: vi.fn(),
      onNavigateBaseline: vi.fn(),
      onNavigatePerson: vi.fn(),
      availableFeatures: new Proxy({}, {
        get: (target, prop) => {
          if (prop === "dawayir_map" || prop === "basic_diagnosis") return true;
          return false;
        }
      }) as RunnerDeps["availableFeatures"],
    } as unknown as RunnerDeps;

    it("should return error message when addSituationLog throws an Error object", async () => {
      vi.mocked(useMapState.getState).mockReturnValue({
        addSituationLog: () => {
          throw new Error("Failed to write to database");
        },
      } as any);

      const actions = createAgentActions(mockDeps);
      const result = await actions.logSituation("John", "Had an argument");

      expect(result).toEqual({
        ok: false,
        error: "Failed to write to database",
      });
    });

    it("should return stringified error when addSituationLog throws a non-Error", async () => {
      vi.mocked(useMapState.getState).mockReturnValue({
        addSituationLog: () => {
          throw "Database timeout";
        },
      } as any);

      const actions = createAgentActions(mockDeps);
      const result = await actions.logSituation("John", "Had an argument");

      expect(result).toEqual({
        ok: false,
        error: "Database timeout",
      });
    });
  });
});
