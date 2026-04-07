import { describe, expect, it } from "vitest";
import type { MapNode } from "@/modules/map/mapTypes";
import { deriveBoundaryEvidence } from "./boundaryEvidence";
import { buildEmergencyContextFromNode } from "./emergencyContext";

function createNode(overrides: Partial<MapNode> = {}): MapNode {
  const now = Date.now();

  return {
    id: "1",
    label: "أحمد",
    ring: "red",
    x: 0,
    y: 0,
    analysis: {
      score: 6,
      answers: { q1: "often", q2: "often", q3: "sometimes" },
      timestamp: now,
      recommendedRing: "red",
      selectedSymptoms: ["fatigue", "guilt"]
    },
    recoveryProgress: {
      completedSteps: [],
      situationLogs: [
        {
          id: "log-1",
          date: now,
          situation: "اتصال متأخر",
          feeling: "ضغط",
          response: "رديت",
          outcome: "تعب",
          lesson: "أحتاج حد"
        }
      ],
      ruminationLogCount: 2,
      detachmentReasons: ["كل مرة بعد الكلام بحس باستنزاف واضح"]
    },
    energyBalance: {
      totalCharge: 0,
      totalDrain: 8,
      netEnergy: -8,
      transactions: [{ id: "t1", amount: -4, timestamp: now }]
    },
    missionProgress: {},
    ...overrides
  };
}

describe("deriveBoundaryEvidence", () => {
  it("builds a danger evidence file for a draining red relationship", () => {
    const evidence = deriveBoundaryEvidence(createNode(), "أحمد");

    expect(evidence).not.toBeNull();
    expect(evidence?.tone).toBe("danger");
    expect(evidence?.items).toContain("العلاقة في المدار الأحمر الآن.");
    expect(evidence?.confidenceScore).toBeGreaterThan(60);
    expect(evidence?.strongestSignal).toContain("المدار الأحمر");
    expect(evidence?.actionWindow).toContain("الملف");
    expect(evidence?.patternLabel).toBe("حاد");
    expect(evidence?.copyText).toContain("ملف أدلة الحد");
    expect(evidence?.copyText).toContain("ثقة الملف");
  });

  it("returns null when there are no real warning signals", () => {
    const evidence = deriveBoundaryEvidence(
      createNode({
        ring: "green",
        isEmergency: false,
        analysis: {
          score: 0,
          answers: { q1: "rarely", q2: "never", q3: "never" },
          timestamp: Date.now(),
          recommendedRing: "green",
          selectedSymptoms: []
        },
        recoveryProgress: { completedSteps: [], situationLogs: [] },
        energyBalance: { totalCharge: 2, totalDrain: 0, netEnergy: 2, transactions: [] }
      }),
      "أحمد"
    );

    expect(evidence).toBeNull();
  });
});

describe("buildEmergencyContextFromNode", () => {
  it("creates a person-scoped emergency context", () => {
    const context = buildEmergencyContextFromNode(createNode());

    expect(context.source).toBe("person");
    expect(context.personLabel).toBe("أحمد");
    expect(context.title).toContain("أحمد");
    expect((context.reasons ?? []).length).toBeGreaterThan(0);
  });
});
