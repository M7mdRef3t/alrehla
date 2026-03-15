import type { MapNode } from "../modules/map/mapTypes";
import type { EmergencyContext } from "./emergencyContext";

export interface PowerBankRecommendation {
  nodeId: string;
  label: string;
  score: number;
  headline: string;
  summary: string;
  reasons: string[];
}

export interface PowerBankNetworkSnapshot {
  title: string;
  summary: string;
  bestMatch: PowerBankRecommendation | null;
  backupMatches: PowerBankRecommendation[];
  totalAnchors: number;
  triggerLabel?: string;
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRecentCharge(node: MapNode, now: number): number {
  const cutoff = now - FOURTEEN_DAYS_MS;
  return (node.energyBalance?.transactions ?? [])
    .filter((item) => item.amount > 0 && item.timestamp >= cutoff)
    .reduce((sum, item) => sum + item.amount, 0);
}

function buildRecommendation(
  node: MapNode,
  context: EmergencyContext | null,
  pulseEnergy: number | null,
  now: number
): PowerBankRecommendation {
  const netEnergy = node.energyBalance?.netEnergy ?? 0;
  const recentCharge = getRecentCharge(node, now);
  const sameContext = Boolean(
    context?.goalId && (node.goalId ?? "general") === (context.goalId ?? "general")
  );

  let score = 20;
  if (node.ring === "green") score += 26;
  else if (node.ring === "yellow") score += 10;
  else score -= 18;

  if (node.isPowerBank) score += 8;
  if (node.detachmentMode) score -= 10;
  if (netEnergy > 0) score += Math.min(18, netEnergy * 2);
  if (netEnergy < 0) score -= Math.min(20, Math.abs(netEnergy) * 3);
  score += Math.min(14, recentCharge * 2);
  if (sameContext) score += 8;
  if (pulseEnergy != null && pulseEnergy <= 3 && node.ring === "green") score += 6;

  const reasons: string[] = [];
  if (node.ring === "green") reasons.push("في المدار الأخضر.");
  if (node.isPowerBank) reasons.push("مفعل كبطارية طوارئ بشرية.");
  if (netEnergy > 0) reasons.push(`صافي الطاقة معه ${netEnergy > 0 ? `+${netEnergy}` : netEnergy}.`);
  if (recentCharge > 0) reasons.push(`شحنك مؤخرًا ${recentCharge} نقاط طاقة.`);
  if (sameContext) reasons.push("يعرف نفس القطاع الذي يضغطك الآن.");
  if (reasons.length === 0) {
    reasons.push("حضوره أكثر أمانًا من الفراغ أو العودة لنفس الحلقة.");
  }

  const summary =
    sameContext && node.ring === "green"
      ? "مرسى آمن من داخل نفس القطاع، بدون أن يعيدك لنفس النزيف."
      : node.ring === "green"
        ? "يسحبك إلى مساحة أهدأ ويقطع الرجوع التلقائي للحلقة الضاغطة."
        : "ليس المرساة الأقوى، لكنه يظل أأمن من الرجوع للعلاقة الضاغطة الآن.";

  return {
    nodeId: node.id,
    label: node.label,
    score: clamp(Math.round(score), 0, 100),
    headline: `ابدأ ب${node.label}`,
    summary,
    reasons: reasons.slice(0, 3)
  };
}

export function derivePowerBankNetwork(
  nodes: MapNode[],
  context: EmergencyContext | null,
  pulseEnergy: number | null,
  now = Date.now()
): PowerBankNetworkSnapshot | null {
  const candidates = nodes.filter(
    (node) =>
      node.isPowerBank &&
      !node.isNodeArchived &&
      node.id !== context?.personId
  );

  if (candidates.length === 0) return null;

  const ranked = candidates
    .map((node) => buildRecommendation(node, context, pulseEnergy, now))
    .sort((left, right) => right.score - left.score);

  const bestMatch = ranked[0] ?? null;
  const backupMatches = ranked.slice(1, 3);
  const triggerLabel = context?.personLabel;
  const summary = bestMatch
    ? triggerLabel
      ? `بدل الرجوع إلى ${triggerLabel}، وجّه خطوتك التالية مباشرة نحو ${bestMatch.label}.`
      : `أقرب مرساة آمنة الآن هي ${bestMatch.label}. افتحها قبل أي رد أو رجوع.`
    : "شبكة الأمان البشرية جاهزة، لكن لم نستطع ترشيح مرساة أولى الآن.";

  return {
    title: "شبكة الشحن البشري",
    summary,
    bestMatch,
    backupMatches,
    totalAnchors: ranked.length,
    triggerLabel
  };
}
