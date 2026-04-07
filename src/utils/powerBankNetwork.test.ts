import { describe, expect, it } from "vitest";
import type { MapNode } from "@/modules/map/mapTypes";
import { derivePowerBankNetwork } from "./powerBankNetwork";

function createNode(overrides: Partial<MapNode> = {}): MapNode {
  return {
    id: "node",
    label: "العقدة",
    ring: "green",
    x: 0,
    y: 0,
    goalId: "family",
    analysis: {
      score: 2,
      answers: { q1: "rarely", q2: "rarely", q3: "never" },
      timestamp: Date.now(),
      recommendedRing: "green"
    },
    recoveryProgress: {
      completedSteps: [],
      situationLogs: []
    },
    energyBalance: {
      totalCharge: 5,
      totalDrain: 0,
      netEnergy: 5,
      transactions: [{ id: "c1", amount: 3, timestamp: Date.now() }]
    },
    missionProgress: {},
    ...overrides
  };
}

describe("derivePowerBankNetwork", () => {
  it("prioritizes the safest green power bank and avoids the triggering person", () => {
    const trigger = createNode({
      id: "trigger",
      label: "الشخص الضاغط",
      ring: "red",
      isPowerBank: true,
      goalId: "family",
      energyBalance: {
        totalCharge: 0,
        totalDrain: 8,
        netEnergy: -8,
        transactions: [{ id: "d1", amount: -4, timestamp: Date.now() }]
      }
    });
    const best = createNode({
      id: "best",
      label: "أختي",
      isPowerBank: true,
      goalId: "family"
    });
    const backup = createNode({
      id: "backup",
      label: "صديقتي",
      goalId: "general",
      isPowerBank: true,
      energyBalance: {
        totalCharge: 2,
        totalDrain: 0,
        netEnergy: 2,
        transactions: [{ id: "c2", amount: 1, timestamp: Date.now() }]
      }
    });

    const snapshot = derivePowerBankNetwork(
      [trigger, best, backup],
      { personId: "trigger", personLabel: "الشخص الضاغط", goalId: "family", source: "person" },
      2
    );

    expect(snapshot).not.toBeNull();
    expect(snapshot?.bestMatch?.nodeId).toBe("best");
    expect(snapshot?.summary).toContain("أختي");
    expect(snapshot?.backupMatches[0]?.nodeId).toBe("backup");
  });

  it("returns null when no power banks are activated", () => {
    const snapshot = derivePowerBankNetwork([createNode({ isPowerBank: false })], null, null);

    expect(snapshot).toBeNull();
  });
});
