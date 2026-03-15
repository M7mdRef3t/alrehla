import type { MapNode } from "../modules/map/mapTypes";

type RelationshipWeatherTone = "storm" | "windy" | "clear";

export interface RelationshipWeatherItem {
  nodeId: string;
  label: string;
  tone: RelationshipWeatherTone;
  badge: string;
  headline: string;
  summary: string;
  score: number;
}

export interface RelationshipWeatherSnapshot {
  title: string;
  summary: string;
  highestRisk: RelationshipWeatherItem | null;
  safeAnchor: RelationshipWeatherItem | null;
  watchlist: RelationshipWeatherItem[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRecentDrain(node: MapNode, now: number): number {
  const cutoff = now - SEVEN_DAYS_MS;
  return (node.energyBalance?.transactions ?? [])
    .filter((item) => item.amount < 0 && item.timestamp >= cutoff)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
}

function buildItem(node: MapNode, pulseEnergy: number | null, now: number): RelationshipWeatherItem {
  const netEnergy = node.energyBalance?.netEnergy ?? 0;
  const recentDrain = getRecentDrain(node, now);
  const ruminationCount = node.recoveryProgress?.ruminationLogCount ?? 0;

  let score = 0;
  if (node.isEmergency) score += 50;
  if (node.ring === "red") score += 35;
  else if (node.ring === "yellow") score += 20;
  else score += 6;

  if (netEnergy < 0) score += Math.min(22, Math.abs(netEnergy) * 3);
  if (netEnergy > 0) score -= Math.min(14, netEnergy * 2);
  score += Math.min(22, recentDrain * 1.5);
  score += Math.min(12, ruminationCount * 3);
  if (node.detachmentMode) score += 10;
  if (node.isPowerBank) score -= 16;
  if (pulseEnergy != null && pulseEnergy <= 3) score += 8;

  const normalizedScore = clamp(Math.round(score), 0, 100);

  if (normalizedScore >= 60) {
    return {
      nodeId: node.id,
      label: node.label,
      tone: "storm",
      badge: "عاصفة",
      headline: `${node.label} هو أعلى ضغط اليوم`,
      summary: "احتمال الاختراق أو الاستنزاف مرتفع؛ الأفضل أن تكون المسافة قصيرة وواضحة.",
      score: normalizedScore
    };
  }

  if (normalizedScore >= 30) {
    return {
      nodeId: node.id,
      label: node.label,
      tone: "windy",
      badge: "رياح حذرة",
      headline: `${node.label} يحتاج ضبطًا خفيفًا`,
      summary: "الوضع ليس طارئًا، لكن أي قرب زائد اليوم قد يكلفك أكثر من المعتاد.",
      score: normalizedScore
    };
  }

  return {
    nodeId: node.id,
    label: node.label,
    tone: "clear",
    badge: "صحو",
    headline: `${node.label} آمن نسبيًا اليوم`,
    summary: "لا توجد إشارات ضغط قوية الآن، ويمكنك إبقاء العلاقة في نطاقها الطبيعي.",
    score: normalizedScore
  };
}

export function deriveRelationshipWeather(
  nodes: MapNode[],
  pulseEnergy: number | null,
  now = Date.now()
): RelationshipWeatherSnapshot | null {
  const activeNodes = nodes.filter((node) => !node.isNodeArchived);
  if (nodes.length === 0) return null;

  const items = activeNodes.map((node) => buildItem(node, pulseEnergy, now));
  const sortedByRisk = [...items].sort((a, b) => b.score - a.score);
  const highestRisk = sortedByRisk[0] ?? null;
  const watchlist = sortedByRisk.filter((item) => item.tone !== "clear").slice(0, 3);
  const safeAnchor =
    [...items]
      .filter((item) => item.tone === "clear")
      .sort((a, b) => a.score - b.score)[0] ?? null;

  const summary =
    activeNodes.length === 0
      ? "الخريطة هادئة اليوم لأن العلاقات الضاغطة مؤرشفة خارج المدار."
      : pulseEnergy != null && pulseEnergy <= 3
        ? "طاقتك منخفضة اليوم، لذلك أي علاقة متذبذبة ستبدو أثقل من المعتاد."
        : highestRisk?.tone === "storm"
          ? `أعلى ضغط متوقع اليوم يأتي من ${highestRisk.label}. ابدأ يومك بمسافة أوضح هناك.`
          : "الطقس العلاقي مستقر نسبيًا اليوم، مع حاجة لمراقبة العلاقات المتذبذبة فقط.";

  return {
    title: "طقس العلاقات اليوم",
    summary,
    highestRisk,
    safeAnchor,
    watchlist
  };
}
