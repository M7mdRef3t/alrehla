import { describe, it, expect } from "vitest";
import { scoreToRing, scoreToZone, getRingLabel, analyzeScore } from "../utils/scoreHelpers";

describe("scoreHelpers", () => {
  describe("scoreToRing", () => {
    it("returns green for score <= 0", () => {
      expect(scoreToRing(0)).toBe("green");
      expect(scoreToRing(-1)).toBe("green");
    });

    it("returns yellow for score 1-2", () => {
      expect(scoreToRing(1)).toBe("yellow");
      expect(scoreToRing(2)).toBe("yellow");
    });

    it("returns red for score > 2", () => {
      expect(scoreToRing(3)).toBe("red");
      expect(scoreToRing(5)).toBe("red");
    });
  });

  describe("scoreToZone", () => {
    it("returns green zone for score <= 0", () => {
      expect(scoreToZone(0)).toBe("green");
    });

    it("returns yellow zone for score 1-2", () => {
      expect(scoreToZone(1)).toBe("yellow");
      expect(scoreToZone(2)).toBe("yellow");
    });

    it("returns red zone for score > 2", () => {
      expect(scoreToZone(3)).toBe("red");
    });
  });

  describe("getRingLabel", () => {
    it("returns correct Arabic label for each ring", () => {
      expect(getRingLabel("green")).toBe("صحية");
      expect(getRingLabel("yellow")).toBe("محتاجة انتباه");
      expect(getRingLabel("red")).toBe("استنزاف");
    });
  });

  describe("analyzeScore", () => {
    it("returns complete analysis object", () => {
      const result = analyzeScore(1);
      
      expect(result).toHaveProperty("ring");
      expect(result).toHaveProperty("zone");
      expect(result).toHaveProperty("label");
      expect(result.ring).toBe("yellow");
      expect(result.zone).toBe("yellow");
      expect(result.label).toBe("محتاجة انتباه");
    });
  });
});
