export const goalPickerCopy = {
  title: "إيه المشهد اللي محتاج فيه وضوح كامل عشان تقدر تاخد قرارك؟",
  subtitle: "حدد المساحة اللي محتاج تسترجع سيطرتك عليها دلوقتي، ومن هنا هنرسم خريطة التحرك.",
  options: [
    { id: "overloaded", label: "ضبابية ومشهد مشوش", subtitle: "ضغط عالي بيأثر على قراراتك، ومحتاج تفصل مشاعرك عن الواقع." },
    { id: "relationship_drain", label: "علاقة محتاجة حدود", subtitle: "علاقة بتسحب طاقتك ومحتاج تاخد فيها موقف حاسم أو ترسم حدود واضحة." },
    { id: "stuck", label: "قرار معلق أو تجميد", subtitle: "عارف المفروض تعمل إيه بس محتاج زقة أو وضوح عشان تاخد الخطوة." },
    { id: "self_discovery", label: "قراءة شاملة للمشهد", subtitle: "محتاج تقرأ أنماطك، تفهم نقط ضعفك، وتبني سيستم أقوى لنفسك." }
  ],
  buttons: {
    back: "رجوع",
    continue: "بدء المسار"
  }
};

/** وصف المسار اللي المستخدم اختاره */
export const goalActions: Record<string, string> = {
  overloaded: "تفكيك الضبابية وقراءة الواقع",
  relationship_drain: "رسم الحدود واستعادة النفوذ",
  stuck: "حسم القرار المؤجل",
  self_discovery: "تأسيس غرفة القيادة",
  general: "البحث عن مسار"
};

export function getGoalAction(goalId: string | undefined): string {
  if (!goalId) return "";
  return goalActions[goalId] ?? goalActions.unknown;
}
