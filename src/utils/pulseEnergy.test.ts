import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getEnergySuggestion,
  getEnergySupportLineByVariant,
  getWeeklyEnergyRecommendation,
  getWeeklyEnergyTrend
} from "./pulseEnergy";

describe("pulseEnergy helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns suggestion bands by energy level", () => {
    expect(getEnergySuggestion(2)?.focus).toBe("body");
    expect(getEnergySuggestion(6)?.focus).toBe("thought");
    expect(getEnergySuggestion(9)?.focus).toBe("event");
    expect(getEnergySuggestion(null)).toBeNull();
  });

  it("returns copy variant text based on selected variant", () => {
    const aText = getEnergySupportLineByVariant(6, "a");
    const bText = getEnergySupportLineByVariant(6, "b");
    expect(aText).not.toBe(bText);
    expect(aText.length).toBeGreaterThan(0);
    expect(bText.length).toBeGreaterThan(0);
  });

  it("computes weekly trend direction from recent logs", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T10:00:00.000Z"));
    const base = Date.now();
    const makeTs = (daysAgo: number) => base - daysAgo * 24 * 60 * 60 * 1000;

    const up = getWeeklyEnergyTrend([
      { energy: 2, timestamp: makeTs(6) },
      { energy: 3, timestamp: makeTs(5) },
      { energy: 7, timestamp: makeTs(2) },
      { energy: 8, timestamp: makeTs(1) }
    ]);
    expect(up?.direction).toBe("up");

    const down = getWeeklyEnergyTrend([
      { energy: 8, timestamp: makeTs(6) },
      { energy: 7, timestamp: makeTs(5) },
      { energy: 3, timestamp: makeTs(2) },
      { energy: 2, timestamp: makeTs(1) }
    ]);
    expect(down?.direction).toBe("down");
  });

  it("returns rounded weekly recommendation when enough samples exist", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T10:00:00.000Z"));
    const base = Date.now();
    const makeTs = (daysAgo: number) => base - daysAgo * 24 * 60 * 60 * 1000;
    const recommendation = getWeeklyEnergyRecommendation([
      { energy: 5, timestamp: makeTs(6) },
      { energy: 6, timestamp: makeTs(5) },
      { energy: 7, timestamp: makeTs(2) },
      { energy: 6, timestamp: makeTs(1) }
    ]);
    expect(recommendation?.value).toBe(6);
    expect(recommendation?.samples).toBe(4);
  });
});
