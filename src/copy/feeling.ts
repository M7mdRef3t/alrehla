import { STANDARD_OPTIONS_MAP } from "./standardOptions";

export const feelingCopy = {
  title: "تأثير العلاقة عليك",
  body: "جاوب بصراحة عن تأثير الشخص ده عليك…",
  q1: "بعد ما تقابله.. بتحس إن طاقتك خلصت وجسمك مهدود؟",
  q2: "بياخد مساحة من تفكيرك غصب عنك طول اليوم؟",
  q3: "لو قلت له 'لأ' أو بعدت شوية.. بتحس بذنب أو خوف؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options: {
    often: STANDARD_OPTIONS_MAP.high,
    sometimes: STANDARD_OPTIONS_MAP.medium,
    rarely: STANDARD_OPTIONS_MAP.low,
    never: STANDARD_OPTIONS_MAP.zero
  } as const,
  cta: "التالي: فين الشخص في حياتك؟"
};

