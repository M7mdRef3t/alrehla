import { STANDARD_OPTIONS_MAP } from "./standardOptions";

export const realityCopy = {
  title: "الواقع الفعلي للعلاقة",
  bodyPrefix: "جاوب عن الحقيقة مع ",
  q1: "بتكلمه/تشوفه كل يوم تقريباً؟",
  q2: "بتشاركه قراراتك المهمة؟",
  q3: "لو احتجت حاجة ضرورية، هتكلمه فوراً؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options: {
    often: STANDARD_OPTIONS_MAP.high,
    sometimes: STANDARD_OPTIONS_MAP.medium,
    rarely: STANDARD_OPTIONS_MAP.low,
    never: STANDARD_OPTIONS_MAP.zero
  } as const,
  cta: "يلا نكمل"
};
