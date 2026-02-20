import { describe, expect, it } from "vitest";
import { normalizeOwnerAction, normalizePreviewFeature } from "./actionRoutingMachine";

describe("actionRoutingMachine", () => {
  it("normalizes preview feature keys safely", () => {
    expect(normalizePreviewFeature("pulse_check")).toBe("pulse_check");
    expect(normalizePreviewFeature("  JOURNEY_TOOLS  ")).toBe("journey_tools");
    expect(normalizePreviewFeature("unknown_feature")).toBeNull();
  });

  it("normalizes owner action keys safely", () => {
    expect(normalizeOwnerAction("start_journey")).toBe("start_journey");
    expect(normalizeOwnerAction("  JOURNEY_TIMELINE ")).toBe("journey_timeline");
    expect(normalizeOwnerAction("bad_action")).toBeNull();
  });
});
