import { describe, expect, it } from "vitest";
import { getJourneyToolsView } from "./journeyTools";

describe("getJourneyToolsView", () => {
  it("locks features when feature flags disable them", () => {
    const view = getJourneyToolsView({
      nodesCount: 10,
      baselineCompletedAt: Date.now(),
      unlockedIds: ["first_step", "mission_complete"],
      hasMissionCompleted: true,
      availableFeatures: {
        mirror_tool: false,
        internal_boundaries: false
      }
    });

    const mirror = view.find((tool) => tool.id === "mirror");
    const journal = view.find((tool) => tool.id === "journal");
    expect(mirror?.locked).toBe(true);
    expect(journal?.locked).toBe(true);
    expect(mirror?.status).toBe("قيد التجهيز");
  });
});
