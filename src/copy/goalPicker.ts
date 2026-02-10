export const goalPickerCopy = {
  title: "من فين تحب نبدأ الرحلة؟",
  subtitle: "بناءً على إحساسك، دي المساحات اللي ممكن نبدأ منها",
  options: [
    { id: "family", label: "العيلة", subtitle: "تواصل أعمق، حب حقيقي، ومساحة آمنة." },
    { id: "friends", label: "الأصدقاء", subtitle: "صداقات حقيقية، دعم متبادل، ونمو." },
    { id: "work", label: "الشغل", subtitle: "نجاح مهني، نمو وتطور، وتوازن." },
    { id: "love", label: "الحب", subtitle: "علاقة صحية، نمو عاطفي، وشراكة حقيقية." },
    { id: "money", label: "المستقبل والأمان", subtitle: "استقرار، تخطيط للمستقبل، وطمأنينة." },
    { id: "unknown", label: "مش عارف لسه", subtitle: "اكتشاف الذات، وضوح، وبداية جديدة." }
  ],
  buttons: {
    back: "ارجع خطوة",
    continue: "يلا نكمل"
  }
};

/** وصف المساحة اللي المستخدم اختارها */
export const goalActions: Record<string, string> = {
  work: "مسافات صحية في الشغل",
  family: "مسافات صحية في العيلة",
  friends: "مسافات صحية في الصداقات",
  love: "مسافات صحية في الحب",
  money: "مسافات مالية واضحة",
  unknown: "أولويات في العلاقات",
  general: "أولويات في العلاقات"
};

export function getGoalAction(goalId: string | undefined): string {
  if (!goalId) return "";
  return goalActions[goalId] ?? goalActions.unknown;
}
