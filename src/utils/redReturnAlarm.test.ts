import { describe, expect, it } from "vitest";
import { deriveRedReturnAlarm } from "./redReturnAlarm";

describe("deriveRedReturnAlarm", () => {
  it("returns a danger alarm for archived draining red relationships", () => {
    const alarm = deriveRedReturnAlarm(
      {
        id: "1",
        label: "ندى",
        ring: "red",
        x: 0,
        y: 0,
        isNodeArchived: true,
        isEmergency: true,
        detachmentMode: false,
        archivedAt: Date.now(),
        energyBalance: {
          totalCharge: 0,
          totalDrain: 10,
          netEnergy: -10,
          transactions: [
            { id: "a", amount: -5, timestamp: Date.now() },
            { id: "b", amount: -5, timestamp: Date.now() }
          ]
        },
        recoveryProgress: {
          completedSteps: [],
          situationLogs: [],
          ruminationLogCount: 2
        }
      },
      "ندى"
    );

    expect(alarm?.tone).toBe("danger");
    expect(alarm?.title).toBe("إنذار الرجوع الأحمر");
    expect(alarm?.reasons).toContain("العلاقة كانت مؤرشفة أصلًا لحماية مساحتك");
  });

  it("returns null when the archived relationship has no clear return risk", () => {
    const alarm = deriveRedReturnAlarm(
      {
        id: "2",
        label: "خالد",
        ring: "green",
        x: 0,
        y: 0,
        isNodeArchived: true,
        isEmergency: false,
        detachmentMode: false,
        archivedAt: Date.now(),
        energyBalance: {
          totalCharge: 4,
          totalDrain: 0,
          netEnergy: 4,
          transactions: [{ id: "a", amount: 4, timestamp: Date.now() }]
        },
        recoveryProgress: {
          completedSteps: [],
          situationLogs: []
        }
      },
      "خالد"
    );

    expect(alarm).toBeNull();
  });
});
