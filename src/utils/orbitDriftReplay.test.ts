import { describe, expect, it } from "vitest";
import { deriveOrbitDriftReplay } from "./orbitDriftReplay";

describe("deriveOrbitDriftReplay", () => {
  it("summarizes outward drift and archiving history", () => {
    const snapshot = deriveOrbitDriftReplay(
      {
        ring: "red",
        isNodeArchived: true,
        orbitHistory: [
          { id: "1", type: "created", timestamp: 1, ring: "yellow" },
          { id: "2", type: "ring_changed", timestamp: 2, ring: "red", fromRing: "yellow" },
          { id: "3", type: "archived", timestamp: 3, ring: "red", fromRing: "red" }
        ]
      },
      "سارة"
    );

    expect(snapshot?.title).toBe("إعادة تشغيل انجراف المدار");
    expect(snapshot?.summary).toContain("خرجت من الخريطة");
    expect(snapshot?.steps).toHaveLength(3);
  });

  it("returns null when there is no meaningful replay yet", () => {
    const snapshot = deriveOrbitDriftReplay(
      {
        ring: "green",
        isNodeArchived: false,
        orbitHistory: [{ id: "1", type: "created", timestamp: 1, ring: "green" }]
      },
      "خالد"
    );

    expect(snapshot).toBeNull();
  });
});
