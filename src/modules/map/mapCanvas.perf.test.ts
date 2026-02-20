import { describe, expect, it } from "vitest";
import { analyzeMapInterference } from "../../services/socialSync";
import type { MapNode, Ring } from "./mapTypes";

const MAX_NODES_FOR_FULL_CONNECTIONS = 140;
const MAX_NODES_FOR_INTERFERENCE_SCAN = 220;

function getRingPosition(ring: Ring, nodeIndex: number, totalInRing: number): { x: number; y: number } {
  const angleStep = (2 * Math.PI) / Math.max(totalInRing, 1);
  const angle = nodeIndex * angleStep - Math.PI / 2;
  const radius = ring === "green" ? 15 : ring === "yellow" ? 27 : 38;
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
}

function filterNodesByContext(nodes: MapNode[], goalIdFilter?: string): MapNode[] {
  if (!goalIdFilter) return nodes.filter((n) => !n.isNodeArchived);
  return nodes.filter((n) => !n.isNodeArchived && (n.goalId ?? "general") === goalIdFilter);
}

function makeNodes(size: number): MapNode[] {
  const rings: Ring[] = ["green", "yellow", "red"];
  const goals = ["family", "work", "love", "general"] as const;
  const out: MapNode[] = [];
  for (let i = 0; i < size; i += 1) {
    const ring = rings[i % rings.length];
    out.push({
      id: `n-${i}`,
      label: `N${i}`,
      ring,
      x: 0,
      y: 0,
      goalId: goals[i % goals.length],
      isNodeArchived: false,
      analysis: { score: (i % 10) + 1, timestamp: Date.now(), answers: { q1: "sometimes", q2: "sometimes", q3: "sometimes" }, recommendedRing: ring }
    });
  }
  return out;
}

function computeNodePositions(nodes: MapNode[]): Record<string, { x: number; y: number }> {
  const byRing: Record<Ring, MapNode[]> = { green: [], yellow: [], red: [] };
  nodes.forEach((n) => { byRing[n.ring].push(n); });
  const pos: Record<string, { x: number; y: number }> = {};
  (Object.keys(byRing) as Ring[]).forEach((ring) => {
    byRing[ring].forEach((n, i) => {
      pos[n.id] = getRingPosition(ring, i, byRing[ring].length);
    });
  });
  return pos;
}

function computeConnectionThreads(nodes: MapNode[], nodePositions: Record<string, { x: number; y: number }>): number {
  const groups: Record<string, MapNode[]> = {};
  nodes.forEach((node) => {
    const gid = node.goalId;
    if (!gid || gid === "general") return;
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(node);
  });

  let count = 0;
  Object.values(groups).forEach((group) => {
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        const p1 = nodePositions[group[i].id];
        const p2 = nodePositions[group[j].id];
        if (p1 && p2) count += 1;
      }
    }
  });
  return count;
}

function profileRun(size: number) {
  const nodes = filterNodesByContext(makeNodes(size));
  const t0 = performance.now();
  const positions = computeNodePositions(nodes);
  const t1 = performance.now();

  let connections = 0;
  if (nodes.length <= MAX_NODES_FOR_FULL_CONNECTIONS) {
    connections = computeConnectionThreads(nodes, positions);
  }
  const t2 = performance.now();

  let interferenceCount = 0;
  if (nodes.length <= MAX_NODES_FOR_INTERFERENCE_SCAN) {
    interferenceCount = analyzeMapInterference(nodes).length;
  }
  const t3 = performance.now();

  return {
    size,
    positionsMs: Number((t1 - t0).toFixed(2)),
    connectionsMs: Number((t2 - t1).toFixed(2)),
    interferenceMs: Number((t3 - t2).toFixed(2)),
    totalMs: Number((t3 - t0).toFixed(2)),
    connections,
    interferenceCount
  };
}

describe("MapCanvas performance baseline", () => {
  it("profiles hot-path computations for 200/500/1000 nodes", () => {
    const sizes = [200, 500, 1000];
    const runs = sizes.map((s) => {
      const samples = Array.from({ length: 6 }, () => profileRun(s)).slice(1); // drop warm-up
      const avg = (key: keyof (typeof samples)[number]) =>
        Number((samples.reduce((sum, x) => sum + (x[key] as number), 0) / samples.length).toFixed(2));

      return {
        size: s,
        positionsMs: avg("positionsMs"),
        connectionsMs: avg("connectionsMs"),
        interferenceMs: avg("interferenceMs"),
        totalMs: avg("totalMs"),
        connections: samples[samples.length - 1].connections,
        interferenceCount: samples[samples.length - 1].interferenceCount
      };
    });

    console.table(runs);

    // Guardrail sanity checks: main hot path should stay reasonably quick on dev machines.
    expect(runs[0].totalMs).toBeLessThan(25);
    expect(runs[1].totalMs).toBeLessThan(35);
    expect(runs[2].totalMs).toBeLessThan(45);
  });
});

