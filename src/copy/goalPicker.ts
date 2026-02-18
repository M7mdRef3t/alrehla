export const goalPickerCopy = {
  title: "حدد الجبهة التي تحتاج تأمين اليوم",
  subtitle: "بناءً على تقرير الاستطلاع، دي الجبهات النشطة اللي محتاج تركز عليها",
  options: [
    { id: "family", label: "العيلة", subtitle: "تأمين الحدود، تقليل الخسائر، وحماية السلام الداخلي." },
    { id: "friends", label: "الأصدقاء", subtitle: "فلترة الدايرة، تعزيز التحالفات الحقيقية." },
    { id: "work", label: "الشغل", subtitle: "إدارة الطاقة، فصل الملفات، ومنع الاستنزاف." },
    { id: "love", label: "الحب", subtitle: "تقييم العائد العاطفي، حماية القلب، وشراكة متوازنة." },
    { id: "money", label: "المستقبل والأمان", subtitle: "تأمين الموارد، خطط بديلة، واستقرار." },
    { id: "self", label: "الجبهة الداخلية", subtitle: "إعادة بناء الدفاعات النفسية وتطهير الأفكار." },
    { id: "unknown", label: "استطلاع عام", subtitle: "مسح شامل للخريطة لتحديد مصادر الخطر." }
  ],
  buttons: {
    back: "العودة للقاعدة",
    continue: "تأكيد الهدف"
  }
};

/** وصف المساحة اللي المستخدم اختارها */
export const goalActions: Record<string, string> = {
  work: "مسافات صحية في الشغل",
  family: "مسافات صحية في العيلة",
  friends: "مسافات صحية في الصداقات",
  love: "مسافات صحية في الحب",
  money: "مسافات مالية واضحة",
  self: "علاقتك مع نفسك",
  unknown: "أولويات في العلاقات",
  general: "أولويات في العلاقات"
};

export function getGoalAction(goalId: string | undefined): string {
  if (!goalId) return "";
  return goalActions[goalId] ?? goalActions.unknown;
}
