import { describe, expect, it } from "vitest";
import type { MapNode } from "@/modules/map/mapTypes";
import { deriveContextAtlas } from "./contextAtlas";

function createNode(overrides: Partial<MapNode> = {}): MapNode {
  return {
    id: "node",
    label: "العقدة",
    ring: "yellow",
    x: 0,
    y: 0,
    goalId: "general",
    analysis: {
      score: 4,
      answers: { q1: "sometimes", q2: "sometimes", q3: "rarely" },
      timestamp: Date.now(),
      recommendedRing: "yellow"
    },
    recoveryProgress: {
      completedSteps: [],
      situationLogs: []
    },
    energyBalance: {
      totalCharge: 0,
      totalDrain: 3,
      netEnergy: -3,
      transactions: [{ id: "t1", amount: -3, timestamp: Date.now() }]
    },
    missionProgress: {},
    ...overrides
  };
}

describe("deriveContextAtlas", () => {
  it("summarizes multiple contexts around the same center", () => {
    const snapshot = deriveContextAtlas([
      createNode({ id: "family-1", label: "الأم", goalId: "family", ring: "red" }),
      createNode({
        id: "work-1",
        label: "المدير",
        goalId: "work",
        ring: "yellow"
      }),
      createNode({
        id: "love-1",
        label: "الشريك",
        goalId: "love",
        ring: "green",
        isPowerBank: true,
        energyBalance: {
          totalCharge: 5,
          totalDrain: 0,
          netEnergy: 5,
          transactions: [{ id: "c1", amount: 5, timestamp: Date.now() }]
        }
      })
    ]);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.contexts).toHaveLength(3);
    expect(snapshot?.dominantKey).toBe("family");
    expect(snapshot?.stableKey).toBe("love");
    expect(snapshot?.summary).toContain("أثقل ضغط");
  });

  it("maps unknown contexts into the general sector", () => {
    const snapshot = deriveContextAtlas([
      createNode({ id: "general-1", label: "صديق", goalId: "friends", ring: "green" })
    ]);

    expect(snapshot?.contexts[0]?.key).toBe("general");
  });

  it("returns null when there are no active nodes", () => {
    const snapshot = deriveContextAtlas([]);

    expect(snapshot).toBeNull();
  });
});
