import { describe, expect, it } from "vitest";
import { sanitizeMapNodes } from "./mapNodeSchema";

describe("sanitizeMapNodes", () => {
  it("drops invalid treeRelation and keeps valid relation", () => {
    const nodes = sanitizeMapNodes([
      {
        id: "1",
        label: "A",
        ring: "red",
        x: 0,
        y: 0,
        treeRelation: { type: "invalid", parentId: "3", relationLabel: "x" }
      },
      {
        id: "2",
        label: "B",
        ring: "green",
        x: 0,
        y: 0,
        treeRelation: { type: "family", parentId: "1", relationLabel: "ابن" }
      }
    ]);

    expect(nodes[0].treeRelation).toBeUndefined();
    expect(nodes[1].treeRelation?.type).toBe("family");
    expect(nodes[1].treeRelation?.parentId).toBe("1");
  });
});
