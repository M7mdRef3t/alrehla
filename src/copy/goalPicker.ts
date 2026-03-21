export const goalPickerCopy = {
  title: "إيه أكتر حاجة مرهقاك دلوقتي؟",
  subtitle: "مفيش اختيار غلط. اختار المساحة اللي حاسس إنها واخدة طاقتك.",
  options: [
    { id: "family", label: "العيلة", subtitle: "علاقات قريبة محتاجة حدود... ذنب، أدوار، توقعات." },
    { id: "friends", label: "علاقات قريبة", subtitle: "صحاب، جيران... مين بيشحنك ومين بيسحب طاقتك." },
    { id: "work", label: "الشغل", subtitle: "مدير، زميل، عميل... مين واخد من وقتك أكتر ما يستاهل." },
    { id: "love", label: "الحب", subtitle: "قرب صحي ولّا تعلق مؤلم؟ شوف العلاقة من بعيد." },
    { id: "money", label: "الفلوس والذنب", subtitle: "مين بياخد من مواردك؟ صرف بقاء ولّا صرف ذنب." },
    { id: "unknown", label: "مش عارف", subtitle: "حاسس بحاجة بس مش قادر تسميها. ابدأ وهنفهم مع بعض." }
  ],
  buttons: {
    back: "رجوع",
    continue: "يلا نبدأ"
  }
};

/** وصف المساحة اللي المستخدم اختارها */
export const goalActions: Record<string, string> = {
  work: "علاقات الشغل والطاقة",
  family: "علاقات العيلة والحدود",
  friends: "الأصدقاء والدايرة القريبة",
  love: "علاقات الحب والقرب",
  money: "الفلوس والذنب المالي",
  self: "علاقتك مع نفسك",
  unknown: "مساحة مش واضحة بعد",
  general: "أولويات في العلاقات"
};

export function getGoalAction(goalId: string | undefined): string {
  if (!goalId) return "";
  return goalActions[goalId] ?? goalActions.unknown;
}
