export const goalPickerCopy = {
  title: "نختار مع بعض نقط البداية 🎯",
  subtitle: "بناءً على قرايتك، دي المجالات اللي ممكن تبدأ فيها رحلتك",
  options: [
    { id: "family", label: "العيلة", subtitle: "تواصل أعمق، حب غير مشروط، ودعم." },
    { id: "friends", label: "الأصدقاء", subtitle: "صداقات حقيقية، دعم متبادل، ونمو." },
    { id: "work", label: "الشغل", subtitle: "نجاح مهني، نمو وتطور، وتحقيق الأهداف." },
    { id: "love", label: "الحب", subtitle: "علاقات صحية، نمو عاطفي، وشراكة حقيقية." },
    { id: "money", label: "المستقبل والأمان", subtitle: "استقرار مالي، تخطيط للمستقبل، وطمأنينة." },
    { id: "unknown", label: "مش عارف", subtitle: "اكتشاف الذات، clarity، وبداية جديدة." }
  ],
  buttons: {
    back: "رجوع",
    continue: "كمل"
  }
};

/** ما المفروض المستخدم يعمله (مختصرة)، مش تصنيف العلاقة */
export const goalActions: Record<string, string> = {
  work: "حدود في الشغل",
  family: "حدود صحية",
  friends: "حدود في الصداقات",
  love: "حدود عاطفية",
  money: "حدود مالية",
  unknown: "أولويات في العلاقات",
  general: "أولويات في العلاقات"
};

export function getGoalAction(goalId: string | undefined): string {
  if (!goalId) return "";
  return goalActions[goalId] ?? goalActions.unknown;
}

