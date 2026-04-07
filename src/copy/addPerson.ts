import { STANDARD_OPTIONS } from "./standardOptions";

/** أسئلة بسيطة عشان نعرف مكان الشخص ده فين في رحلتك */
export const addPersonCopy = {
  quickQuestionsTitle: "فهم مدى التعب",
  question1: "هل الشخص ده بياخد مساحة كبيرة من تفكيرك وطاقتك؟",
  question2: "هل بتحس براحة ووضوح وإنت بتتعامل معاه؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options1: [...STANDARD_OPTIONS],
  options2: [...STANDARD_OPTIONS],
  suggestionPrefix: "رأي الرحلة: المكان المقترح",
  suggestionReasons: {
    green: "لأن واضح إن العلاقة مريحة وفيها ثقة وأمان.",
    yellow: "لأن التعامل محتاج شوية حذر وتاخد بالك من نفسك.",
    red: "لأن الشخص ده بيسحب من طاقتك بزيادة — البعد عنه ضرورة لراحتك."
  },
  nextAfterQuestions: "تأكيد المكان"
};

