export const goalPickerCopy = {
  title: "إيه أكتر حاجة شاغلتك دلوقتي؟",
  subtitle: "اختار اللي تحس إنه يثقل عليك الأكتر",
  options: [
    { id: "family", label: "العيلة", subtitle: "واجبات، لوم من الآخرين، ومسافات." },
    { id: "friends", label: "الأصدقاء", subtitle: "صداقات، حدود غير واضحة، أو مسافات." },
    { id: "work", label: "الشغل", subtitle: "ضغط، توتر، وتوقعات عالية." },
    { id: "love", label: "الحب", subtitle: "حيرة عاطفية، تعلق، أو وجع قلب." },
    { id: "money", label: "المستقبل والأمان", subtitle: "قلق من بكرة، وخوف من المجهول." },
    { id: "unknown", label: "مش عارف", subtitle: "حاسس بضغط بس مش عارف الاتجاه." }
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

