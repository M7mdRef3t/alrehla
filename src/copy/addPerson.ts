/** أسئلة سريعة لاقتراح الدائرة المناسبة عند إضافة شخص */
export const addPersonCopy = {
  quickQuestionsTitle: "سؤالين سريعين",
  question1: "هل العلاقة دي بتستنزفك أو بتسبب ألم؟",
  question2: "هل تحس بأمان وحدود واضحة مع الشخص؟",
  options1: [
    { value: "high", label: "نعم كثيراً" },
    { value: "medium", label: "أحياناً" },
    { value: "low", label: "نادراً" },
    { value: "no", label: "لأ" }
  ],
  options2: [
    { value: "yes", label: "أيوه" },
    { value: "sometimes", label: "مش دايماً" },
    { value: "no", label: "لأ" }
  ],
  suggestionPrefix: "اقتراحنا: ضعه في دائرة",
  suggestionReasons: {
    green: "لأن إجاباتك توحي بعلاقة صحية وحدود واضحة.",
    yellow: "لأن العلاقة محتاجة انتباه وحدود أوضح.",
    red: "لأن العلاقة بتستنزفك أو مش آمنة — المسافة هتحميك."
  },
  nextAfterQuestions: "التالي"
};
