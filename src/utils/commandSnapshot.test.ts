import { describe, expect, it } from "vitest";
import { deriveCommandSnapshot } from "./commandSnapshot";

describe("deriveCommandSnapshot", () => {
  it("prefers archive guidance when the relationship is archived", () => {
    const snapshot = deriveCommandSnapshot({
      displayName: "أحمد",
      ring: "red",
      node: {
        ring: "red",
        isNodeArchived: true,
        isPowerBank: false,
        detachmentMode: false,
        energyBalance: { totalCharge: 0, totalDrain: 10, netEnergy: -10, transactions: [] },
        missionProgress: {}
      }
    });

    expect(snapshot.tone).toBe("steady");
    expect(snapshot.ctaLabel).toBe("أبقها في الأرشيف");
  });

  it("returns a protection decision for red draining relationships", () => {
    const snapshot = deriveCommandSnapshot({
      displayName: "منى",
      ring: "red",
      node: {
        ring: "red",
        isNodeArchived: false,
        isPowerBank: false,
        detachmentMode: false,
        energyBalance: { totalCharge: 0, totalDrain: 7, netEnergy: -7, transactions: [] },
        missionProgress: {}
      },
      completedSteps: 0,
      totalSteps: 3
    });

    expect(snapshot.tone).toBe("danger");
    expect(snapshot.ctaLabel).toBe("ابدأ خطوة الحماية");
    expect(snapshot.reasons).toContain("المدار أحمر");
  });

  it("returns a soft-boundary decision for yellow relationships with an active mission", () => {
    const snapshot = deriveCommandSnapshot({
      displayName: "سارة",
      ring: "yellow",
      node: {
        ring: "yellow",
        isNodeArchived: false,
        isPowerBank: false,
        detachmentMode: false,
        energyBalance: { totalCharge: 2, totalDrain: 3, netEnergy: -1, transactions: [] },
        missionProgress: { startedAt: Date.now() }
      },
      completedSteps: 1,
      totalSteps: 3
    });

    expect(snapshot.tone).toBe("caution");
    expect(snapshot.ctaLabel).toBe("كمّل الحد الناعم");
    expect(snapshot.reasons).toContain("المدار أصفر");
  });

  it("returns a safe anchoring decision for power-bank relationships", () => {
    const snapshot = deriveCommandSnapshot({
      displayName: "أختي",
      ring: "green",
      node: {
        ring: "green",
        isNodeArchived: false,
        isPowerBank: true,
        detachmentMode: false,
        energyBalance: { totalCharge: 5, totalDrain: 0, netEnergy: 5, transactions: [] },
        missionProgress: {}
      }
    });

    expect(snapshot.tone).toBe("safe");
    expect(snapshot.reasons).toContain("بطارية طوارئ بشرية");
  });
});
