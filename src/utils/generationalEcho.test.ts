import { describe, expect, it } from "vitest";
import type { MapNode } from "../modules/map/mapTypes";
import { deriveGenerationalEcho } from "./generationalEcho";

function createNode(overrides: Partial<MapNode> = {}): MapNode {
  return {
    id: "node",
    label: "العقدة",
    ring: "yellow",
    x: 0,
    y: 0,
    analysis: {
      score: 4,
      answers: { q1: "sometimes", q2: "sometimes", q3: "rarely" },
      timestamp: Date.now(),
      recommendedRing: "yellow",
      insights: {
        underlyingPattern: "الخوف من الرفض عند الاقتراب"
      }
    },
    recoveryProgress: {
      completedSteps: [],
      situationLogs: []
    },
    missionProgress: {},
    ...overrides
  };
}

describe("deriveGenerationalEcho", () => {
  it("detects an inherited echo for a family branch with a matching ancestor pattern", () => {
    const root = createNode({
      id: "root",
      label: "الأم",
      ring: "red",
      goalId: "family",
      treeRelation: { type: "family", parentId: null, relationLabel: "أم" },
      analysis: {
        score: 7,
        answers: { q1: "often", q2: "often", q3: "sometimes" },
        timestamp: Date.now(),
        recommendedRing: "red",
        insights: {
          underlyingPattern: "الخوف من الرفض"
        }
      }
    });
    const child = createNode({
      id: "child",
      label: "الأخت",
      ring: "red",
      goalId: "family",
      treeRelation: { type: "family", parentId: "root", relationLabel: "أخت" }
    });

    const snapshot = deriveGenerationalEcho(child, [root, child]);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.title).toBe("صدى جيلي ظاهر");
    expect(snapshot?.branchLabel).toBe("فرع الأم");
    expect(snapshot?.reasons.some((reason) => reason.includes("الأم"))).toBe(true);
  });

  it("links a non-family relationship back to a matching family branch", () => {
    const familyNode = createNode({
      id: "family-root",
      label: "الأب",
      ring: "yellow",
      goalId: "family",
      treeRelation: { type: "family", parentId: null, relationLabel: "أب" },
      analysis: {
        score: 5,
        answers: { q1: "sometimes", q2: "sometimes", q3: "sometimes" },
        timestamp: Date.now(),
        recommendedRing: "yellow",
        insights: {
          underlyingPattern: "الخوف من الرفض"
        }
      }
    });
    const partner = createNode({
      id: "partner",
      label: "الشريك",
      goalId: "love",
      ring: "red"
    });

    const snapshot = deriveGenerationalEcho(partner, [familyNode, partner]);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.title).toBe("الخيط ليس جديدًا");
    expect(snapshot?.summary).toContain("الجذور العائلية");
    expect(snapshot?.reasons[0]).toContain("الأب");
  });

  it("returns null when there is no family pattern or branch pressure to support the link", () => {
    const familyNode = createNode({
      id: "family-root",
      label: "الأب",
      ring: "green",
      goalId: "family",
      treeRelation: { type: "family", parentId: null, relationLabel: "أب" },
      analysis: {
        score: 1,
        answers: { q1: "rarely", q2: "rarely", q3: "never" },
        timestamp: Date.now(),
        recommendedRing: "green",
        insights: {
          underlyingPattern: "حب الهدوء"
        }
      }
    });
    const partner = createNode({
      id: "partner",
      label: "الشريك",
      goalId: "love",
      ring: "green",
      analysis: {
        score: 1,
        answers: { q1: "rarely", q2: "rarely", q3: "never" },
        timestamp: Date.now(),
        recommendedRing: "green",
        insights: {
          underlyingPattern: "اتصال طبيعي"
        }
      },
      energyBalance: { totalCharge: 2, totalDrain: 0, netEnergy: 2, transactions: [] }
    });

    const snapshot = deriveGenerationalEcho(partner, [familyNode, partner]);

    expect(snapshot).toBeNull();
  });
});
