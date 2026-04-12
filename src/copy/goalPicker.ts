export const goalPickerCopy = {
  title: "إنت جاي عشان إيه دلوقتي؟",
  subtitle: "اختار الوجع اللي شاغل حيز تفكيرك دلوقتي، ومن هنا هنبدأ نفكك اللخبطة.",
  options: [
    { id: "overloaded", label: "مخنوق ومش فاهم مالي", subtitle: "ضغط عالي، تشوش، وحاسس إنك شايل الدنيا فوق كتافك." },
    { id: "relationship_drain", label: "علاقة مستنزفاني", subtitle: "استنزاف طاقة، خناق ملوش آخر، أو حدود مش واضحة مع حد قريب." },
    { id: "stuck", label: "عالق ومش عارف أتحرك", subtitle: "عارف المفروض تعمل إيه بس مش قادر تاخد خطوة.. تجميد كامل." },
    { id: "self_discovery", label: "عايز أفهم نفسي", subtitle: "رغبة في الترتيب، فهم الأنماط، وبناء نظام حياة متزن." }
  ],
  buttons: {
    back: "رجوع",
    continue: "بدء المسار"
  }
};

/** وصف المسار اللي المستخدم اختاره */
export const goalActions: Record<string, string> = {
  overloaded: "تفريغ الضغط والتشوش",
  relationship_drain: "ترميم الحدود والعلاقات",
  stuck: "كسر التجميد والتحرك",
  self_discovery: "ترتيب النفس والوضوح",
  general: "البحث عن مسار"
};

export function getGoalAction(goalId: string | undefined): string {
  if (!goalId) return "";
  return goalActions[goalId] ?? goalActions.unknown;
}
