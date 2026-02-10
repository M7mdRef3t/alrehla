import { STANDARD_OPTIONS } from "./standardOptions";

/** أسئلة سريعة لاقتراح المدار المناسب عند إضافة شخص */
export const addPersonCopy = {
  quickQuestionsTitle: "استكشاف سريع",
  question1: "العلاقة دي واخدة مساحة كبيرة من طاقتك؟",
  question2: "أنت حاسس بأمان وعندك مسافات واضحة مع الشخص ده؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options1: [...STANDARD_OPTIONS],
  options2: [...STANDARD_OPTIONS],
  suggestionPrefix: "اقتراحنا: حطه في مدار",
  suggestionReasons: {
    green: "لأن إجاباتك بتوحي بعلاقة قريبة ومسافات واضحة.",
    yellow: "لأن العلاقة محتاجة انتباه ومسافات أوضح.",
    red: "لأن العلاقة واخدة مساحة كبيرة من طاقتك — المسافة هتريّحك."
  },
  nextAfterQuestions: "يلا نكمل"
};
