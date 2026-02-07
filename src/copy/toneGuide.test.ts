import { describe, expect, it } from "vitest";
import { buildToneSystemBlock, resolveVoiceMode } from "./toneGuide";
import type { PulseEntry } from "../state/pulseState";

describe("tone guide", () => {
  it("resolves low energy as field medic", () => {
    expect(resolveVoiceMode(2)).toBe("field_medic");
  });

  it("resolves high energy as motivator", () => {
    expect(resolveVoiceMode(9)).toBe("general_motivator");
  });

  it("builds a tone block with tactical dictionary", () => {
    const pulse: PulseEntry = {
      energy: 5,
      mood: "calm",
      focus: "none",
      timestamp: Date.now()
    };
    const block = buildToneSystemBlock(pulse);
    expect(block).toContain("القاموس التكتيكي");
    expect(block).toContain("جبهة / ملف");
  });
});
