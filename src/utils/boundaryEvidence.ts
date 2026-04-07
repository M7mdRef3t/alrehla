import type { MapNode, Ring } from "@/modules/map/mapTypes";

type EvidenceTone = "danger" | "caution";

export interface BoundaryEvidenceSnapshot {
  tone: EvidenceTone;
  title: string;
  summary: string;
  items: string[];
  copyText: string;
  confidenceScore: number;
  strongestSignal: string;
  actionWindow: string;
  patternLabel: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const ringRank: Record<Ring, number> = {
  green: 0,
  yellow: 1,
  red: 2
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRecentDrain(node: MapNode, now: number): number {
  const cutoff = now - SEVEN_DAYS_MS;
  return (node.energyBalance?.transactions ?? [])
    .filter((item) => item.amount < 0 && item.timestamp >= cutoff)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
}

function getOutwardDriftCount(node: MapNode): number {
  return (node.orbitHistory ?? []).filter(
    (entry) =>
      entry.type === "ring_changed" &&
      entry.fromRing != null &&
      ringRank[entry.ring] > ringRank[entry.fromRing]
  ).length;
}

function getPatternLabel(metrics: {
  netEnergy: number;
  recentDrain: number;
  outwardDriftCount: number;
  drainCount: number;
  ruminationCount: number;
  isEmergency: boolean;
  ring: Ring;
}): string {
  if (
    metrics.isEmergency ||
    (metrics.ring === "red" && (metrics.recentDrain >= 8 || metrics.netEnergy <= -8))
  ) {
    return "حاد";
  }

  if (
    metrics.outwardDriftCount >= 2 ||
    metrics.recentDrain >= 6 ||
    metrics.netEnergy <= -6
  ) {
    return "متصاعد";
  }

  if (metrics.drainCount >= 2 || metrics.ruminationCount >= 2) {
    return "متكرر";
  }

  return "تحت المراقبة";
}

function getStrongestSignal(
  displayName: string,
  node: MapNode,
  metrics: {
    netEnergy: number;
    recentDrain: number;
    drainCount: number;
    situationCount: number;
    ruminationCount: number;
    symptomCount: number;
    outwardDriftCount: number;
  }
): string {
  if (node.isEmergency) {
    return "تم تفعيل حالة الطوارئ لهذه العلاقة بالفعل.";
  }

  if (node.ring === "red" && (metrics.recentDrain >= 6 || metrics.netEnergy <= -5)) {
    return "المدار الأحمر حاضر ومعه نزيف طاقة واضح.";
  }

  if (metrics.recentDrain >= 6) {
    return `آخر 7 أيام وحدهم سحبوا منك ${metrics.recentDrain} نقاط طاقة مع ${displayName}.`;
  }

  if (metrics.netEnergy <= -5) {
    return `صافي الطاقة مع ${displayName} هبط إلى ${metrics.netEnergy}.`;
  }

  if (metrics.ruminationCount >= 3) {
    return `العلاقة ما زالت تشغل ذهنك ${metrics.ruminationCount} مرات أو أكثر.`;
  }

  if (metrics.outwardDriftCount >= 2) {
    return "الخريطة نفسها تسجل ابتعادًا متكررًا لحماية المسافة.";
  }

  if (metrics.drainCount >= 2) {
    return "مواقف الاستنزاف لم تعد حادثة واحدة معزولة.";
  }

  if (metrics.situationCount >= 2) {
    return "السجل المكتوب يؤكد أن النمط يتكرر أكثر من مرة.";
  }

  if (metrics.symptomCount >= 2) {
    return "جسمك أكد أكثر من عرض مرتبط بهذه العلاقة.";
  }

  return `فيه إشارات كفاية تقول إن ${displayName} يحتاج حدًا أوضح من الآن.`;
}

function getActionWindow(metrics: {
  isEmergency: boolean;
  ring: Ring;
  recentDrain: number;
  outwardDriftCount: number;
  ruminationCount: number;
  detachmentMode: boolean;
}): string {
  if (metrics.isEmergency) {
    return "جمّد الرد الآن وافتح الطوارئ قبل أي تواصل جديد.";
  }

  if (metrics.ring === "red" && metrics.recentDrain >= 6) {
    return "أوضح حدك قبل أقرب رسالة أو مكالمة.";
  }

  if (metrics.detachmentMode || metrics.outwardDriftCount >= 1) {
    return "لا ترجع تلقائيًا لنفس القرب قبل مراجعة هذا الملف.";
  }

  if (metrics.ruminationCount >= 2) {
    return "ارجع لهذا الملف كلما ظهر الذنب أو الحنين بدل الرجوع للشخص.";
  }

  return "راجع المسافة الآن قبل الجولة القادمة.";
}

function createCopyText(snapshot: BoundaryEvidenceSnapshot): string {
  return [
    snapshot.title,
    snapshot.summary,
    `ثقة الملف: ${snapshot.confidenceScore}%`,
    `أقوى إشارة: ${snapshot.strongestSignal}`,
    `نافذة القرار: ${snapshot.actionWindow}`,
    `النمط: ${snapshot.patternLabel}`,
    ...snapshot.items.map((item) => `- ${item}`)
  ].join("\n");
}

export function deriveBoundaryEvidence(
  node: MapNode,
  displayName: string,
  now = Date.now()
): BoundaryEvidenceSnapshot | null {
  const items: string[] = [];
  const netEnergy = node.energyBalance?.netEnergy ?? 0;
  const drainCount = (node.energyBalance?.transactions ?? []).filter((item) => item.amount < 0).length;
  const situationCount = node.recoveryProgress?.situationLogs?.length ?? 0;
  const ruminationCount = node.recoveryProgress?.ruminationLogCount ?? 0;
  const symptomCount = node.analysis?.selectedSymptoms?.length ?? 0;
  const detachmentReasons = node.recoveryProgress?.detachmentReasons ?? [];
  const recentDrain = getRecentDrain(node, now);
  const outwardDriftCount = getOutwardDriftCount(node);

  if (node.isEmergency) items.push("تم تسجيل هذه العلاقة كحالة طوارئ.");
  if (node.ring === "red") items.push("العلاقة في المدار الأحمر الآن.");
  if (node.detachmentMode) items.push("القرب الفعلي منخفض لكن الأثر ما زال شغالًا.");
  if (netEnergy < 0) items.push(`صافي الطاقة الحالي ${netEnergy}.`);
  if (recentDrain > 0) items.push(`آخر 7 أيام سجلت نزيف طاقة ${recentDrain}.`);
  if (drainCount > 0) items.push(`تم رصد ${drainCount} مواقف استنزاف مسجلة.`);
  if (outwardDriftCount > 0) {
    items.push(`الخريطة سجلت ${outwardDriftCount} حركة ابتعاد لحماية المسافة.`);
  }
  if (situationCount > 0) items.push(`فيه ${situationCount} مواقف مكتوبة تخص ${displayName}.`);
  if (ruminationCount > 0) items.push(`تم تسجيل ${ruminationCount} موجات اجترار مرتبطة به.`);
  if (symptomCount > 0) items.push(`تم تأكيد ${symptomCount} أعراض مرتبطة بهذه العلاقة.`);
  if (detachmentReasons.length > 0) items.push(...detachmentReasons.slice(0, 2));

  if (items.length === 0) return null;

  let confidenceScore = 0;
  if (node.isEmergency) confidenceScore += 30;
  if (node.ring === "red") confidenceScore += 22;
  else if (node.ring === "yellow") confidenceScore += 10;
  if (node.detachmentMode) confidenceScore += 8;
  if (netEnergy < 0) confidenceScore += Math.min(18, Math.abs(netEnergy) * 2);
  confidenceScore += Math.min(14, recentDrain * 2);
  confidenceScore += Math.min(10, drainCount * 3);
  confidenceScore += Math.min(8, situationCount * 2);
  confidenceScore += Math.min(8, ruminationCount * 2);
  confidenceScore += Math.min(6, symptomCount * 2);
  confidenceScore += Math.min(8, outwardDriftCount * 4);
  if (detachmentReasons.length > 0) confidenceScore += 4;
  confidenceScore = clamp(Math.round(confidenceScore), 18, 98);

  const tone: EvidenceTone =
    node.isEmergency || node.ring === "red" || netEnergy <= -5 ? "danger" : "caution";
  const strongestSignal = getStrongestSignal(displayName, node, {
    netEnergy,
    recentDrain,
    drainCount,
    situationCount,
    ruminationCount,
    symptomCount,
    outwardDriftCount
  });
  const actionWindow = getActionWindow({
    isEmergency: Boolean(node.isEmergency),
    ring: node.ring,
    recentDrain,
    outwardDriftCount,
    ruminationCount,
    detachmentMode: Boolean(node.detachmentMode)
  });
  const patternLabel = getPatternLabel({
    netEnergy,
    recentDrain,
    outwardDriftCount,
    drainCount,
    ruminationCount,
    isEmergency: Boolean(node.isEmergency),
    ring: node.ring
  });
  const title = tone === "danger" ? "ملف أدلة الحد" : "إشارات تستحق الانتباه";
  const summary =
    tone === "danger"
      ? `هذه ليست راحة عابرة. عندك ملف حي يقول إن ${displayName} يحتاج مسافة أوضح الآن.`
      : `فيه إشارات حقيقية تقول إن علاقتك مع ${displayName} تحتاج ضبطًا أدق قبل ما تزيد كلفتها عليك.`;

  const snapshot: BoundaryEvidenceSnapshot = {
    tone,
    title,
    summary,
    items,
    confidenceScore,
    strongestSignal,
    actionWindow,
    patternLabel,
    copyText: ""
  };

  snapshot.copyText = createCopyText(snapshot);
  return snapshot;
}
