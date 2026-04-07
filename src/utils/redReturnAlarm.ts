import type { MapNode } from "@/modules/map/mapTypes";
import { deriveBoundaryEvidence } from "./boundaryEvidence";

type RedReturnAlarmTone = "danger" | "caution";

export interface RedReturnAlarmSnapshot {
  tone: RedReturnAlarmTone;
  title: string;
  summary: string;
  reasons: string[];
  confirmLabel: string;
  keepArchivedLabel: string;
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function deriveRedReturnAlarm(
  node: MapNode,
  displayName: string
): RedReturnAlarmSnapshot | null {
  if (!node.isNodeArchived) return null;

  const netEnergy = node.energyBalance?.netEnergy ?? 0;
  const drainCount = (node.energyBalance?.transactions ?? []).filter((item) => item.amount < 0).length;
  const ruminationCount = node.recoveryProgress?.ruminationLogCount ?? 0;
  const evidence = deriveBoundaryEvidence(node, displayName);

  const dangerScore = [
    node.isEmergency,
    node.ring === "red",
    netEnergy <= -5,
    drainCount >= 2,
    ruminationCount >= 2,
    Boolean(node.detachmentMode),
    Boolean(node.recoveryProgress?.detachmentReasons?.length)
  ].filter(Boolean).length;

  if (dangerScore === 0 && evidence?.tone !== "danger") return null;

  const tone: RedReturnAlarmTone =
    node.isEmergency || node.ring === "red" || netEnergy <= -5 || dangerScore >= 3
      ? "danger"
      : "caution";

  const reasons = dedupe([
    "العلاقة كانت مؤرشفة أصلًا لحماية مساحتك",
    ...(evidence?.items ?? []),
    drainCount >= 2 ? `تم تسجيل ${drainCount} مواقف استنزاف قبل الأرشفة` : "",
    ruminationCount >= 2 ? `الرجوع قد يعيد ${ruminationCount} موجات اجترار مسجلة` : ""
  ]).slice(0, 4);

  return {
    tone,
    title: tone === "danger" ? "إنذار الرجوع الأحمر" : "تحذير قبل فك الأرشفة",
    summary:
      tone === "danger"
        ? `الرجوع إلى ${displayName} الآن قد يعيد نفس الحلقة بسرعة. لو لا يوجد سبب جديد وواضح، إبقاء المسافة هو القرار الأكثر أمانًا.`
        : `فك أرشفة ${displayName} يحتاج سببًا واضحًا حتى لا يعود الضغط القديم بصورة أهدأ فقط.`,
    reasons,
    confirmLabel: "نعم، أعدها للخريطة",
    keepArchivedLabel: "اتركها مؤرشفة"
  };
}
