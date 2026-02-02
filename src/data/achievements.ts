/**
 * تعريفات الإنجازات — نصوص داعمة ومحفزة لاستكمال الرحلة
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** رسالة قصيرة عند الفتح — تحفيز */
  hint: string;
  icon: string;
  /** ترتيب العرض */
  order: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_step",
    title: "أول خطوة",
    description: "أضفت أول شخص على الخريطة",
    hint: "بداية جميلة! كل رحلة تبدأ بخطوة.",
    icon: "🌱",
    order: 1
  },
  {
    id: "writer",
    title: "كاتب",
    description: "كتبت أول موقف",
    hint: "الكتابة بتخلّي الصورة أوضح. استمر.",
    icon: "✍️",
    order: 2
  },
  {
    id: "plan_seeker",
    title: "مخلص",
    description: "كتبت موقفين وفتحت الخطة",
    hint: "خطتك المخصصة جاهزة. خطوة قوية!",
    icon: "📋",
    order: 3
  },
  {
    id: "trained",
    title: "متدرب",
    description: "خلصت تدريب مع شخص",
    hint: "التدرب على الحدود بيقوّيك. فخورين بيك.",
    icon: "🎯",
    order: 4
  },
  {
    id: "growing_map",
    title: "خريطتك تنمو",
    description: "عندك 3 أشخاص على الخريطة",
    hint: "واضح إنك جاد في فهم علاقاتك. كمل.",
    icon: "🗺️",
    order: 5
  },
  {
    id: "boundary_keeper",
    title: "صاحب حدود",
    description: "عندك 5 أشخاص على الخريطة",
    hint: "إنجاز كبير! أنت تبني مساحتك بوضوح.",
    icon: "🛡️",
    order: 6
  },
  {
    id: "measured",
    title: "مقيس",
    description: "خلصت القياس الأولي",
    hint: "معرفة نقطة البداية أول خطوة للتقدّم.",
    icon: "📊",
    order: 7
  },
  {
    id: "reader",
    title: "قارئ",
    description: "فتحت المكتبة التعليمية",
    hint: "المعرفة سلاحك. استمر تتعلم.",
    icon: "📚",
    order: 8
  },
  {
    id: "breather",
    title: "هادئ",
    description: "استخدمت تمرين التنفس",
    hint: "إنك تهتم بنفسك ده إنجاز بحد ذاته.",
    icon: "🌬️",
    order: 9
  }
].sort((a, b) => a.order - b.order);

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
