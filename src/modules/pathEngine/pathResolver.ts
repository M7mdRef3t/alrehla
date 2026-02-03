/**
 * مُحلّل المسار — يحدد مسار التعافي من منطقة المستخدم + الاحتكاك + نوع الألم.
 */

import type { Ring } from "../map/mapTypes";
import type { PathId, ContactLevel, SymptomType } from "./pathTypes";

/** تحويل قائمة أعراض (IDs) إلى نوع ألم سائد — للـ AI والـ resolver */
export function symptomIdsToSymptomType(symptomIds: string[]): SymptomType {
  if (symptomIds.length === 0) return "mixed";
  const guilt = ["guilt", "shame", "over_explaining", "people_pleasing"].some((id) => symptomIds.includes(id));
  const fear = ["anxiety_before_contact", "anxiety_low_mood", "walking_eggshells", "avoidance", "checking_phone"].some((id) => symptomIds.includes(id));
  const drain = ["exhausted", "chronic_fatigue", "time_drained", "relief_on_cancel", "brain_fog", "inner_emptiness"].some((id) => symptomIds.includes(id));
  const anger = ["suppressed_anger", "physical_tension", "chest_tightness", "stomach_knot"].some((id) => symptomIds.includes(id));
  if (guilt && !fear && !drain && !anger) return "guilt";
  if (fear && !guilt && !drain && !anger) return "fear";
  if (drain && !guilt && !fear && !anger) return "drain";
  if (anger && !guilt && !fear && !drain) return "anger";
  return "mixed";
}

export interface ResolvePathInput {
  /** المنطقة: أحمر / أصفر / أخضر */
  zone: Ring;
  /** هل المستخدم في «المنطقة الرمادية» (فك ارتباط / استنزاف عن بُعد) */
  isGreyPath?: boolean;
  /** معدل الاحتكاك: من إجابات الواقع */
  contact: ContactLevel;
  /** نوع الألم السائد (اختياري) */
  symptomType?: SymptomType;
  /** طوارئ: إيذاء بدني / ابتزاز خطير */
  isSOS?: boolean;
}

/**
 * يحدد المسار المناسب من مصفوفة التشخيص.
 * الفلسفة: «كل التعافي حدود» — مسرحان: حدود خارجية (مع الشخص) | حدود داخلية (مع النفس).
 * النتيجة: path_protection | path_detox | path_negotiation | path_deepening | path_sos.
 */
export function resolvePathId(input: ResolvePathInput): PathId {
  const { zone, isGreyPath, contact, isSOS } = input;

  if (isSOS) return "path_sos";

  // رمادي أو (أحمر + احتكاك منخفض) → حدود داخلية (العدو جوا الدماغ؛ قول «لأ» لأفكارك)
  if (isGreyPath || (zone === "red" && (contact === "low" || contact === "none"))) {
    return "path_detox";
  }

  // أحمر + احتكاك عالي → حدود خارجية (العدو الشخص؛ قول «لأ» للشخص)
  if (zone === "red" && (contact === "high" || contact === "medium")) {
    return "path_protection";
  }

  // أصفر → فن المسافة
  if (zone === "yellow") return "path_negotiation";

  // أخضر → الجذور العميقة
  if (zone === "green") return "path_deepening";

  return "path_negotiation";
}

/** أسماء المسارات بالعربي — للعرض (درع الحماية = حدود خارجية، الصيام الشعوري = حدود داخلية) */
export const PATH_NAMES: Record<PathId, string> = {
  path_protection: "درع الحماية",
  path_detox: "الصيام الشعوري",
  path_negotiation: "فن المسافة",
  path_deepening: "الجذور العميقة",
  path_sos: "الطوارئ القصوى"
};
