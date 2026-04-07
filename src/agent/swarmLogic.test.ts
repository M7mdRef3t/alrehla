import { describe, it, expect } from "vitest";
import { determineAutoPersona } from "./swarmLogic";
import { AgentContext } from "./types";
import { AppScreen } from "../navigation/navigationMachine";

describe("determineAutoPersona", () => {
  // Helper to create a base context for tests
  const createBaseContext = (overrides: Partial<AgentContext> = {}): AgentContext => ({
    activePersona: "STOIC",
    nodesSummary: [],
    screen: "home" as AppScreen,
    selectedNodeId: null,
    goalId: "default",
    category: "general",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availableFeatures: { featureX: true } as any,
    ...overrides,
  });

  it("should return COMFORTER when mood is angry", () => {
    const context = createBaseContext({ pulse: { mood: "angry", energy: 5, focus: "event", timestamp: Date.now() } });
    expect(determineAutoPersona(context)).toBe("COMFORTER");
  });

  it("should return COMFORTER when mood is overwhelmed", () => {
    const context = createBaseContext({ pulse: { mood: "overwhelmed", energy: 5, focus: "event", timestamp: Date.now() } });
    expect(determineAutoPersona(context)).toBe("COMFORTER");
  });

  it("should return COMFORTER when energy is 3 or less", () => {
    const context1 = createBaseContext({ pulse: { mood: "calm", energy: 3, focus: "thought", timestamp: Date.now() } });
    expect(determineAutoPersona(context1)).toBe("COMFORTER");

    const context2 = createBaseContext({ pulse: { mood: "bright", energy: 1, focus: "event", timestamp: Date.now() } });
    expect(determineAutoPersona(context2)).toBe("COMFORTER");
  });

  it("should return TACTICIAN when screen is guilt-court", () => {
    // High energy / calm mood would normally be STOIC, but screen rule should take precedence over default
    // Note: Due to function structure, mood/energy COMFORTER rules run *before* screen rules.
    const context = createBaseContext({ screen: "guilt-court", pulse: { mood: "calm", energy: 5, focus: "event", timestamp: Date.now() } });
    expect(determineAutoPersona(context)).toBe("TACTICIAN");
  });

  it("should return TACTICIAN when screen is diplomacy", () => {
    const context = createBaseContext({ screen: "diplomacy", pulse: null });
    expect(determineAutoPersona(context)).toBe("TACTICIAN");
  });

  // Note: Based on the current logic order, COMFORTER overrides TACTICIAN
  it("COMFORTER rules take precedence over TACTICIAN screen rules", () => {
    const context = createBaseContext({ screen: "diplomacy", pulse: { mood: "angry", energy: 5, focus: "event", timestamp: Date.now() } });
    expect(determineAutoPersona(context)).toBe("COMFORTER");
  });

  it("should return STOIC when mood is bright", () => {
    const context = createBaseContext({ pulse: { mood: "bright", energy: 5, focus: "event", timestamp: Date.now() } });
    expect(determineAutoPersona(context)).toBe("STOIC");
  });

  it("should return STOIC when mood is calm", () => {
    const context = createBaseContext({ pulse: { mood: "calm", energy: 5, focus: "event", timestamp: Date.now() } });
    expect(determineAutoPersona(context)).toBe("STOIC");
  });

  it("should return STOIC when energy is 6 or more", () => {
    // Normal mood, high energy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = createBaseContext({ pulse: { mood: "neutral", energy: 8, focus: "event", timestamp: Date.now() } as any });
    expect(determineAutoPersona(context)).toBe("STOIC");
  });

  it("should return STOIC as default when no conditions are met", () => {
    // No pulse
    const context1 = createBaseContext({ pulse: null });
    expect(determineAutoPersona(context1)).toBe("STOIC");

    // Pulse exists but doesn't trigger other conditions (energy 4-5, mood not angry/overwhelmed/bright/calm)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context2 = createBaseContext({ pulse: { mood: "neutral", energy: 4, focus: "event", timestamp: Date.now() } as any });
    expect(determineAutoPersona(context2)).toBe("STOIC");
  });
});
