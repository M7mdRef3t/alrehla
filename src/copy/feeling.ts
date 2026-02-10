import { STANDARD_OPTIONS_MAP } from "./standardOptions";

export const feelingCopy = {
  title: "إحساسك مع الشخص ده",
  body: "جاوب من إحساسك الحقيقي:",
  q1: "بعد ما تقابله — بتحس إن طاقتك اتسحبت؟",
  q2: "بتلاقي نفسك بتفكر فيه من غير ما تختار؟",
  q3: "لو حطيت مسافة أو قلت لأ — بتحس بذنب أو خوف؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options: {
    often: STANDARD_OPTIONS_MAP.high,
    sometimes: STANDARD_OPTIONS_MAP.medium,
    rarely: STANDARD_OPTIONS_MAP.low,
    never: STANDARD_OPTIONS_MAP.zero
  } as const,
  cta: "يلا نكمل: فين الشخص في مدارك؟"
};
