import type { MapNode } from "@/modules/map/mapTypes";

export type ContextAtlasKey = "family" | "work" | "love" | "general";

export interface ContextAtlasItem {
  key: ContextAtlasKey;
  count: number;
  pressureCount: number;
  safeCount: number;
  leadNodeId: string | null;
  leadLabel: string | null;
  supportNodeId: string | null;
  supportLabel: string | null;
  score: number;
}

export interface ContextAtlasSnapshot {
  title: string;
  summary: string;
  contexts: ContextAtlasItem[];
  dominantKey: ContextAtlasKey | null;
  stableKey: ContextAtlasKey | null;
}

const CONTEXT_KEYS: ContextAtlasKey[] = ["family", "work", "love", "general"];

function getContextKey(node: MapNode): ContextAtlasKey {
  if (node.goalId === "family" || node.treeRelation?.type === "family") return "family";
  if (node.goalId === "work") return "work";
  if (node.goalId === "love") return "love";
  return "general";
}

function getRiskScore(node: MapNode): number {
  const netEnergy = node.energyBalance?.netEnergy ?? 0;
  let score = 0;

  if (node.isEmergency) score += 50;
  if (node.ring === "red") score += 30;
  else if (node.ring === "yellow") score += 14;
  else score += 4;

  if (netEnergy < 0) score += Math.min(24, Math.abs(netEnergy) * 3);
  if (netEnergy > 0) score -= Math.min(14, netEnergy * 2);
  if (node.detachmentMode) score += 12;
  if (node.isPowerBank) score -= 16;

  return score;
}

function getSupportScore(node: MapNode): number {
  const netEnergy = node.energyBalance?.netEnergy ?? 0;
  let score = 0;

  if (node.ring === "green") score += 22;
  if (node.isPowerBank) score += 18;
  if (netEnergy > 0) score += Math.min(18, netEnergy * 2);
  if (netEnergy < 0) score -= Math.min(16, Math.abs(netEnergy) * 2);

  return score;
}

function buildItem(key: ContextAtlasKey, nodes: MapNode[]): ContextAtlasItem {
  const pressureNodes = nodes
    .filter((node) => getRiskScore(node) >= 30)
    .sort((left, right) => getRiskScore(right) - getRiskScore(left));
  const safeNodes = nodes
    .filter((node) => getSupportScore(node) > 0)
    .sort((left, right) => getSupportScore(right) - getSupportScore(left));

  return {
    key,
    count: nodes.length,
    pressureCount: pressureNodes.length,
    safeCount: safeNodes.length,
    leadNodeId: pressureNodes[0]?.id ?? null,
    leadLabel: pressureNodes[0]?.label ?? null,
    supportNodeId: safeNodes[0]?.id ?? null,
    supportLabel: safeNodes[0]?.label ?? null,
    score: nodes.reduce((sum, node) => sum + getRiskScore(node), 0)
  };
}

function contextLabel(key: ContextAtlasKey): string {
  if (key === "family") return "العائلة";
  if (key === "work") return "العمل";
  if (key === "love") return "العاطفة";
  return "السياقات الأخرى";
}

export function deriveContextAtlas(nodes: MapNode[]): ContextAtlasSnapshot | null {
  const activeNodes = nodes.filter((node) => !node.isNodeArchived);
  if (activeNodes.length === 0) return null;

  const grouped = new Map<ContextAtlasKey, MapNode[]>();
  for (const key of CONTEXT_KEYS) grouped.set(key, []);

  for (const node of activeNodes) {
    const key = getContextKey(node);
    grouped.get(key)?.push(node);
  }

  const contexts = CONTEXT_KEYS
    .map((key) => buildItem(key, grouped.get(key) ?? []))
    .filter((item) => item.count > 0);

  if (contexts.length === 0) return null;

  const dominant = [...contexts].sort((left, right) => right.score - left.score)[0] ?? null;
  const stable =
    [...contexts]
      .sort((left, right) => right.safeCount - left.safeCount || left.pressureCount - right.pressureCount)[0] ??
    null;

  const summary =
    contexts.length === 1
      ? `مركزك الآن يعمل أساسًا داخل ${contextLabel(contexts[0]!.key)}.`
      : dominant && stable
        ? `أثقل ضغط الآن يأتي من ${contextLabel(dominant.key)}، بينما أقوى ارتكاز عندك يظهر في ${contextLabel(stable.key)}.`
        : "أنت في المركز، والقطاعات المختلفة تتحرك حولك بدرجات ضغط ودعم مختلفة.";

  return {
    title: "أنا في المركز، والسياقات حولي",
    summary,
    contexts,
    dominantKey: dominant?.key ?? null,
    stableKey: stable?.key ?? null
  };
}
