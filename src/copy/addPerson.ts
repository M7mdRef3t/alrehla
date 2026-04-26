import { STANDARD_OPTIONS } from "./standardOptions";

/** ⚔️ أسئلة كاشفة — تكشف حقيقة العلاقة من السلوك مش من المشاعر */
export const addPersonCopy = {
  quickQuestionsTitle: "كشف الحقيقة",
  question1: "امتى آخر مرة الشخص ده ساعدك فعلاً — من غير ما تطلب؟",
  question2: "لو مكلمتهوش أسبوع كامل — هو هيسأل عليك؟",
  /** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ */
  options1: [...STANDARD_OPTIONS],
  options2: [...STANDARD_OPTIONS],
  suggestionPrefix: "رأي الرحلة: المكان المقترح",
  suggestionReasons: {
    green: "لأن واضح إن العلاقة فيها بصيرة حقيقية ودعم فعلي.",
    yellow: "لأن فيه ضباب محتاج كشف — خد بالك من نفسك.",
    red: "لأن الحقيقة واضحة — العلاقة دي بتاخد أكتر ما بتعطي."
  },
  nextAfterQuestions: "اكشف الحقيقة"
};

