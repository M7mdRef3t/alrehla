import { STANDARD_OPTIONS } from "./standardOptions";

/** أسئلة سريعة لاقتراح الدائرة المناسبة عند إضافة شخص — نفس الصيغة القياسية لكل التطبيق */
export const addPersonCopy = {
  quickQuestionsTitle: "سؤالين سريعين",
  question1: "هل العلاقة دي بتستنزفك أو بتسبب ألم؟",
  question2: "هل تحس بأمان وحدود واضحة مع الشخص؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options1: [...STANDARD_OPTIONS],
  options2: [...STANDARD_OPTIONS],
  suggestionPrefix: "اقتراحنا: ضعه في دائرة",
  suggestionReasons: {
    green: "لأن إجاباتك توحي بعلاقة صحية وحدود واضحة.",
    yellow: "لأن العلاقة محتاجة انتباه وحدود أوضح.",
    red: "لأن العلاقة بتستنزفك أو مش آمنة — المسافة هتحميك."
  },
  nextAfterQuestions: "التالي"
};
