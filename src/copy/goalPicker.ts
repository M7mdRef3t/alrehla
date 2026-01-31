export const goalPickerCopy = {
  title: "إيه أكتر حاجة شغالك دلوقتي؟",
  subtitle: "مفيش اختيار غلط… اختار اللي حاسس إنه تقيل عليك دلوقتي",
  options: [
    { 
      id: "work", 
      label: "الشغل", 
      subtitle: "ضغط، توتر، وتوقعات." 
    },
    { 
      id: "family", 
      label: "العيلة", 
      subtitle: "واجبات، لوم، ومسافات." 
    },
    { 
      id: "love", 
      label: "الحب", 
      subtitle: "حيرة، تعلق، أو وجع." 
    },
    { 
      id: "money", 
      label: "الفلوس والحياة", 
      subtitle: "قلق من المستقبل." 
    },
    { 
      id: "unknown", 
      label: "مش عارف", 
      subtitle: "حاسس بدوشة بس." 
    }
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
  love: "حدود عاطفية",
  money: "حدود مالية",
  unknown: "أولويات في العلاقات",
  general: "أولويات في العلاقات"
};

export function getGoalAction(goalId: string | undefined): string {
  if (!goalId) return "";
  return goalActions[goalId] ?? goalActions.unknown;
}

