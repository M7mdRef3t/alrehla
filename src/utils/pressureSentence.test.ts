import { describe, expect, it } from "vitest";
import { derivePressureSentence } from "./pressureSentence";

describe("derivePressureSentence", () => {
  it("returns a keep-distance sentence for archived relationships", () => {
    const snapshot = derivePressureSentence({
      displayName: "سارة",
      ring: "red",
      node: {
        ring: "red",
        isNodeArchived: true,
        detachmentMode: false,
        isEmergency: false,
        energyBalance: { totalCharge: 0, totalDrain: 6, netEnergy: -6, transactions: [] }
      }
    });

    expect(snapshot?.tone).toBe("steady");
    expect(snapshot?.sentence).toContain("أحافظ على المسافة");
  });

  it("returns a protective sentence for high-pressure relationships", () => {
    const snapshot = derivePressureSentence({
      displayName: "مها",
      ring: "red",
      node: {
        ring: "red",
        isNodeArchived: false,
        detachmentMode: false,
        isEmergency: true,
        energyBalance: { totalCharge: 0, totalDrain: 8, netEnergy: -8, transactions: [] }
      }
    });

    expect(snapshot?.tone).toBe("danger");
    expect(snapshot?.copyText).toContain("فاتح مساحة لنفسي");
  });

  it("returns null for stable green relationships", () => {
    const snapshot = derivePressureSentence({
      displayName: "أختي",
      ring: "green",
      node: {
        ring: "green",
        isNodeArchived: false,
        detachmentMode: false,
        isEmergency: false,
        energyBalance: { totalCharge: 5, totalDrain: 0, netEnergy: 5, transactions: [] }
      }
    });

    expect(snapshot).toBeNull();
  });
});
