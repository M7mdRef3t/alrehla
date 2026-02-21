import { STANDARD_OPTIONS } from "./standardOptions";

/** أسئلة سريعة لاقتراح المدار المناسب عند إضافة شخص */
export const addPersonCopy = {
  quickQuestionsTitle: "تحليل مستوى الاستنزاف",
  question1: "هل هذا الهدف يستهلك مساحة كبيرة من طاقتك باستمرار؟",
  question2: "هل تشعر بالأمان ووضوح الحدود التكتيكية مع هذا الهدف؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options1: [...STANDARD_OPTIONS],
  options2: [...STANDARD_OPTIONS],
  suggestionPrefix: "توجيه النظام: التصنيف المقترح",
  suggestionReasons: {
    green: "لأن إجاباتك توحي بتحالف موثوق وحدود آمنة.",
    yellow: "لأن التفاعل يتطلب يقظة ومراجعة للحدود.",
    red: "لأن هذا الهدف مصنف كتهديد استنزافي — توسيع المسافة ضرورة تكتيكية."
  },
  nextAfterQuestions: "تأكيد الإحداثيات"
};
