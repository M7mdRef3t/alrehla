import { describe, expect, it } from "vitest";
import { buildToneSystemBlock, resolveVoiceMode } from "./toneGuide";
import type { PulseEntry } from "../state/pulseState";

describe("tone guide", () => {
  it("resolves low energy as warm healer", () => {
    expect(resolveVoiceMode(2)).toBe("warm_healer");
  });

  it("resolves high energy as gentle companion", () => {
    expect(resolveVoiceMode(9)).toBe("gentle_companion");
  });

  it("builds a tone block with orbital dictionary", () => {
    const pulse: PulseEntry = {
      energy: 5,
      mood: "calm",
      focus: "none",
      timestamp: Date.now()
    };
    const block = buildToneSystemBlock(pulse);
    expect(block).toContain("مفردات المدار");
    expect(block).toContain("مدار / شخص");
  });
});
