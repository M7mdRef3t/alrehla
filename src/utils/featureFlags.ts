import type { FeatureFlagMode } from "../config/features";

export function isFeatureEnabled(mode: FeatureFlagMode | undefined, isBetaUser: boolean): boolean {
  if (mode === "on") return true;
  if (mode === "beta") return isBetaUser;
  return false;
}

export function normalizeFeatureMode(mode: FeatureFlagMode | undefined): FeatureFlagMode {
  if (mode === "on" || mode === "off" || mode === "beta") return mode;
  return "off";
}
