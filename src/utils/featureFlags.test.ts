import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURE_FLAGS } from "../config/features";
import { getEffectiveFeatureAccess } from "./featureFlags";

describe("getEffectiveFeatureAccess", () => {
  it("disables off features for normal user", () => {
    const access = getEffectiveFeatureAccess({
      featureFlags: { ...DEFAULT_FEATURE_FLAGS, mirror_tool: "off" },
      betaAccess: false,
      role: "user",
      adminAccess: false,
      isDev: false
    });
    expect(access.mirror_tool).toBe(false);
  });

  it("keeps beta feature disabled for non-beta users", () => {
    const access = getEffectiveFeatureAccess({
      featureFlags: { ...DEFAULT_FEATURE_FLAGS, generative_ui_mode: "beta" },
      betaAccess: false,
      role: "user",
      adminAccess: false,
      isDev: false
    });
    expect(access.generative_ui_mode).toBe(false);
  });

  it("enables all features for privileged roles", () => {
    const access = getEffectiveFeatureAccess({
      featureFlags: { ...DEFAULT_FEATURE_FLAGS, mirror_tool: "off", family_tree: "off" },
      betaAccess: false,
      role: "admin",
      adminAccess: false,
      isDev: false
    });
    expect(access.mirror_tool).toBe(true);
    expect(access.family_tree).toBe(true);
  });
});
