import type { AdviceCategory } from "../data/adviceScripts";
import { adviceDatabase } from "../data/adviceScripts";
import type { AdviceZone } from "./scoreHelpers";

export interface Advice {
  title: string;
  message: string;
  actions?: string[];
}

/**
 * الحصول على النصيحة المناسبة حسب المنطقة والفئة
 */
export function getAdvice(
  zone: AdviceZone,
  category: AdviceCategory
): Advice {
  const adviceByZone = adviceDatabase[zone];
  const advice = adviceByZone[category] ?? adviceByZone.general ?? adviceDatabase.green.general;
  return advice;
}

/**
 * رسالة الفهم المخصصة حسب المنطقة واسم الشخص
 */
export function getUnderstandingMessage(zone: AdviceZone, personLabel: string): string {
  const messages: Record<AdviceZone, string> = {
    red: `علاقتك مع ${personLabel} فيها أنماط مؤذية وسلوكيات مستنزفة لطاقتك. دي علاقة محتاجة حدود واضحة أو مسافة.`,
    yellow: `في أنماط مش صحية في علاقتك مع ${personLabel}، لكن مش كل حاجة سيئة. العلاقة دي محتاجة شوية وعي وحدود.`,
    green: `علاقة صحية مع ${personLabel}. فيه احترام متبادل وراحة في التعامل.`
  };
  return messages[zone];
}

/**
 * العنوان المخصص للنصيحة
 */
export function getPersonalizedTitle(zone: AdviceZone, personLabel: string): string {
  const titles: Record<AdviceZone, string> = {
    red: `علاقتك مع ${personLabel} محتاجة مسافة`,
    yellow: `علاقتك مع ${personLabel} محتاجة انتباه`,
    green: `علاقتك مع ${personLabel} صحية`
  };
  return titles[zone];
}

/**
 * رسالة تشجيعية حسب المنطقة
 */
export function getEncouragingMessage(zone: AdviceZone): string {
  const messages: Record<AdviceZone, string> = {
    red: "أنت تستحق علاقات صحية. وضع حدود مش أنانية، ده حماية لنفسك.",
    yellow: "الوعي بالأنماط أول خطوة للتغيير. أنت في الطريق الصح.",
    green: "استمر في الحفاظ على هذه العلاقة الصحية. أنت تستحق ذلك."
  };
  return messages[zone];
}
