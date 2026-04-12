import { afterEach, describe, expect, it } from "vitest";
import { useMapState } from "@/domains/dawayir/store/map.store";
import type { MapNode } from "../map/mapTypes";
import { deriveJourneyPhaseV1 } from "./featureBuilder";
import type { FeatureVectorV1 } from "./types";

const neutralFeatures: FeatureVectorV1 = {
  entropyScore: 20,
  riskRatio: 0.1,
  ringVolatility7d: 0,
  pulseInstability7d: 0.1,
  ruminationVelocity7d: 0,
  taskCompletion7d: 0.5,
  sessionHesitation: 0.1,
  dominantRing: "green"
};

function setNodes(nodes: MapNode[]) {
  useMapState.setState({ nodes });
}

afterEach(() => {
  setNodes([]);
});

describe("deriveJourneyPhaseV1", () => {
  it("returns lost when there is no goal and no nodes", () => {
    const phase = deriveJourneyPhaseV1({
      goalId: "unknown",
      features: neutralFeatures
    });
    expect(phase).toBe("lost");
  });

  it("returns mapping when nodes exist but no completed steps", () => {
    setNodes([
      {
        id: "1",
        label: "A",
        ring: "yellow",
        x: 0,
        y: 0,
        recoveryProgress: { completedSteps: [], situationLogs: [], pathStage: "awareness" }
      }
    ]);

    const phase = deriveJourneyPhaseV1({
      goalId: "family",
      features: neutralFeatures
    });
    expect(phase).toBe("mapping");
  });

  it("returns acceptance when dominant stage is acceptance", () => {
    setNodes([
      {
        id: "1",
        label: "A",
        ring: "yellow",
        x: 0,
        y: 0,
        recoveryProgress: {
          completedSteps: ["a", "b", "c", "d"],
          situationLogs: [],
          pathStage: "acceptance"
        }
      }
    ]);
    const phase = deriveJourneyPhaseV1({
      goalId: "family",
      features: neutralFeatures
    });
    expect(phase).toBe("acceptance");
  });

  it("returns resistance when hesitation is high even with progress", () => {
    setNodes([
      {
        id: "1",
        label: "A",
        ring: "yellow",
        x: 0,
        y: 0,
        recoveryProgress: {
          completedSteps: ["a", "b", "c"],
          situationLogs: [],
          pathStage: "acceptance"
        }
      }
    ]);

    const phase = deriveJourneyPhaseV1({
      goalId: "family",
      features: { ...neutralFeatures, sessionHesitation: 0.8 }
    });
    expect(phase).toBe("resistance");
  });
});
