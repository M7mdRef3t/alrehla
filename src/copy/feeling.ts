import { STANDARD_OPTIONS_MAP } from "./standardOptions";

export const feelingCopy = {
  title: "إحساسك مع الشخص ده",
  body: "جاوب عن مشاعرك الحقيقية:",
  q1: "بعد ما تقابله — طاقتك تنخفض وجسمك يتعب؟",
  q2: "بتفكر فيه طول الوقت بدون اختيار؟",
  q3: "لو بعدت عنه أو قلت لا — بتحس بذنب أو خوف؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options: {
    often: STANDARD_OPTIONS_MAP.high,
    sometimes: STANDARD_OPTIONS_MAP.medium,
    rarely: STANDARD_OPTIONS_MAP.low,
    never: STANDARD_OPTIONS_MAP.zero
  } as const,
  cta: "التالي: فين الشخص في حياتك؟"
};

