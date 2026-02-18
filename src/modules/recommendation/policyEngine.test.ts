import { describe, expect, it } from "vitest";
import { calculateRiskScore, generateCandidatesByPolicy, resolveRiskBand } from "./policyEngine";
import type { FeatureVectorV1 } from "./types";

const baseFeatures: FeatureVectorV1 = {
  entropyScore: 30,
  riskRatio: 0.1,
  ringVolatility7d: 1,
  pulseInstability7d: 0.2,
  ruminationVelocity7d: 1,
  taskCompletion7d: 0.7,
  sessionHesitation: 0.2,
  dominantRing: "green"
};

describe("recommendation policy engine", () => {
  it("resolves high risk band for elevated risk inputs", () => {
    const features: FeatureVectorV1 = {
      ...baseFeatures,
      entropyScore: 82,
      riskRatio: 0.72,
      pulseInstability7d: 0.81,
      sessionHesitation: 0.64
    };
    const riskScore = calculateRiskScore(features);
    expect(resolveRiskBand(riskScore)).toBe("high");
  });

  it("keeps medium risk between thresholds", () => {
    const features: FeatureVectorV1 = {
      ...baseFeatures,
      entropyScore: 58,
      riskRatio: 0.35,
      pulseInstability7d: 0.44,
      sessionHesitation: 0.35
    };
    const riskScore = calculateRiskScore(features);
    expect(resolveRiskBand(riskScore)).toBe("medium");
  });

  it("only returns containment-oriented candidates on high risk", () => {
    const features: FeatureVectorV1 = {
      ...baseFeatures,
      entropyScore: 78,
      riskRatio: 0.8,
      pulseInstability7d: 0.8
    };
    const { riskBand, candidates } = generateCandidatesByPolicy("resistance", features);
    expect(riskBand).toBe("high");
    const allowed = new Set(["open_breathing", "review_red_node", "log_situation"]);
    for (const candidate of candidates) {
      expect(allowed.has(candidate.actionType)).toBe(true);
    }
  });
});
