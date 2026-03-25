export const goalPickerCopy = {
  title: "ما الذي يستنزف طاقتك في هذه اللحظة؟",
  subtitle: "لا توجد خيارات خاطئة. اختر المساحة التي تشغل الحيز الأكبر من وعيك الآن.",
  options: [
    { id: "family", label: "مساحة الجذور", subtitle: "علاقات العائلة.. حدودك، أدوارك، والولاءات الخفية." },
    { id: "friends", label: "دايرة الأثر", subtitle: "الأصدقاء والمحيط.. من يمنحك الطاقة ومن يمتصها بهدوء." },
    { id: "work", label: "بيئة الإنجاز", subtitle: "التزامات المهنة.. متى يتحول العمل من شغف إلى استنزاف؟" },
    { id: "love", label: "روابط التعلق", subtitle: "علاقات القرب.. هل هو حب يبني أم تعلق يبعثر الهوية؟" },
    { id: "money", label: "ميزان الموارد", subtitle: "الفلوس والذنب.. أين تذهب مواردك النفسية والمادية؟" },
    { id: "unknown", label: "المنطقة الرمادية", subtitle: "ثقل غير مفسر.. ابدأ هنا لنفكك شيفرة هذا الشعور معاً." }
  ],
  buttons: {
    back: "العودة",
    continue: "بدء الرحلة الآن"
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
