import { describe, expect, it } from "vitest";
import { deriveRelationshipWeather } from "./relationshipWeather";

describe("deriveRelationshipWeather", () => {
  it("identifies the highest-risk relationship and safe anchor", () => {
    const now = Date.now();
    const snapshot = deriveRelationshipWeather(
      [
        {
          id: "1",
          label: "منى",
          ring: "red",
          x: 0,
          y: 0,
          isEmergency: true,
          energyBalance: {
            totalCharge: 0,
            totalDrain: 10,
            netEnergy: -6,
            transactions: [{ id: "a", amount: -6, timestamp: now - 1000 }]
          },
          recoveryProgress: { completedSteps: [], situationLogs: [], ruminationLogCount: 2 }
        },
        {
          id: "2",
          label: "أختي",
          ring: "green",
          x: 0,
          y: 0,
          isPowerBank: true,
          energyBalance: {
            totalCharge: 5,
            totalDrain: 0,
            netEnergy: 5,
            transactions: [{ id: "b", amount: 5, timestamp: now - 1000 }]
          },
          recoveryProgress: { completedSteps: [], situationLogs: [] }
        }
      ],
      2,
      now
    );

    expect(snapshot?.highestRisk?.label).toBe("منى");
    expect(snapshot?.highestRisk?.tone).toBe("storm");
    expect(snapshot?.safeAnchor?.label).toBe("أختي");
  });

  it("returns a calm snapshot when all risky relationships are archived", () => {
    const snapshot = deriveRelationshipWeather(
      [
        {
          id: "1",
          label: "خالد",
          ring: "red",
          x: 0,
          y: 0,
          isNodeArchived: true
        }
      ],
      6
    );

    expect(snapshot?.highestRisk).toBeNull();
    expect(snapshot?.summary).toContain("الخريطة هادئة");
  });
});
