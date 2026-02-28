import { describe, expect, it } from "vitest";
import { calculateGravityMass } from "./physicsEngine";
import type { MapNode } from "../modules/map/mapTypes";

function createNode(
  id: string,
  ring: MapNode["ring"],
  partial?: Partial<MapNode>
): MapNode {
  return {
    id,
    label: `Node ${id}`,
    ring,
    x: 0,
    y: 0,
    ...partial
  };
}

describe("calculateGravityMass", () => {
  it("calculates default mass correctly (neutral intensity, far orbit, no occupancy)", () => {
    // Expected: Intensity (1+1)^1.5 * Occupancy (1) * Distance (1 for red)
    // = 2^1.5 * 1 * 1 = 2.8284...
    const node = createNode("1", "red");
    const result = calculateGravityMass(node);

    expect(result.nodeId).toBe("1");
    expect(result.mass).toBeCloseTo(2.8284, 4);
    expect(result.classification).toBe("Nebula"); // mass < 5
  });

  it("calculates mass for high intensity and close orbit", () => {
    // Expected: Intensity (6+1)^1.5 * Occupancy (1) * Distance (3 for green)
    // = 7^1.5 * 1 * 3 = 18.520259... * 3 = 55.560777...
    const node = createNode("2", "green", {
      analysis: {
        score: 6,
        answers: { q1: "often", q2: "often", q3: "often" },
        timestamp: 12345,
        recommendedRing: "green"
      }
    });
    const result = calculateGravityMass(node);

    expect(result.nodeId).toBe("2");
    expect(result.mass).toBeCloseTo(55.56, 1);
    expect(result.classification).toBe("Black Hole"); // mass > 50
  });

  it("calculates mass with occupancy factors (notes and logs)", () => {
    // Expected: Intensity (3+1)^1.5 * Occupancy (1 + 2*0.5 + 1*1) * Distance (2 for yellow)
    // = 4^1.5 * (1 + 1 + 1) * 2
    // = 8 * 3 * 2 = 48
    const node = createNode("3", "yellow", {
      analysis: {
        score: 3,
        answers: { q1: "often", q2: "often", q3: "often" },
        timestamp: 12345,
        recommendedRing: "yellow"
      },
      notes: [
        { id: "n1", text: "note1", timestamp: 1 },
        { id: "n2", text: "note2", timestamp: 2 }
      ],
      recoveryProgress: {
        completedSteps: [],
        situationLogs: [
          { id: "l1", date: 1, situation: "s", feeling: "f", response: "r", outcome: "o", lesson: "l" }
        ]
      }
    });
    const result = calculateGravityMass(node);

    expect(result.mass).toBeCloseTo(48, 4);
    expect(result.classification).toBe("Star"); // mass > 20 and <= 50
  });

  it("calculates mass correctly for a 'Planet' classification", () => {
    // Expected: Intensity (2+1)^1.5 * Occupancy (1) * Distance (2 for yellow)
    // = 3^1.5 * 1 * 2 = 5.196 * 2 = 10.392
    const node = createNode("4", "yellow", {
      analysis: {
        score: 2,
        answers: { q1: "often", q2: "often", q3: "often" },
        timestamp: 12345,
        recommendedRing: "yellow"
      }
    });
    const result = calculateGravityMass(node);

    expect(result.mass).toBeCloseTo(10.392, 2);
    expect(result.classification).toBe("Planet"); // mass >= 5 and <= 20
  });

  it("handles missing occupancy properties without errors", () => {
    // Expected: Default occupancy should handle undefined arrays gracefully
    const node = createNode("5", "green", {
      notes: undefined,
      recoveryProgress: {
        completedSteps: [],
        situationLogs: [] // Fixed typing error
      }
    });
    const result = calculateGravityMass(node);

    // Intensity (1+1)^1.5 = 2^1.5 = 2.8284
    // Occupancy (1 + 0 + 0) = 1
    // Distance (3)
    // 2.8284 * 3 = 8.485
    expect(result.mass).toBeCloseTo(8.485, 2);
    expect(result.classification).toBe("Planet");
  });
});
