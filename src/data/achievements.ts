/**
 * تعريفات الإنجازات — نصوص دافئة ومحفزة لاستكمال الرحلة
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** رسالة قصيرة عند الفتح — تشجيع */
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
    hint: "بداية حلوة! كل رحلة بتبدأ بخطوة.",
    icon: "🌱",
    order: 1
  },
  {
    id: "writer",
    title: "كاتب",
    description: "سجّلت أول موقف",
    hint: "الكتابة بتوضّح الصورة. كمّل.",
    icon: "✍️",
    order: 2
  },
  {
    id: "plan_seeker",
    title: "صاحب مسار",
    description: "سجّلت موقفين وفتحت مسار الحماية",
    hint: "مسارك المخصص جاهز. خطوة جميلة!",
    icon: "📋",
    order: 3
  },
  {
    id: "trained",
    title: "متمرّس",
    description: "خلّصت تمرين مع شخص",
    hint: "التمرّن على المسافات بيقوّيك. فخورين بيك.",
    icon: "🎯",
    order: 4
  },
  {
    id: "growing_map",
    title: "خريطتك بتكبر",
    description: "عندك ٣ أشخاص على الخريطة",
    hint: "واضح إنك جاد في فهم مداراتك. كمّل.",
    icon: "🗺️",
    order: 5
  },
  {
    id: "boundary_keeper",
    title: "صاحب مساحة",
    description: "عندك ٥ أشخاص على الخريطة",
    hint: "إنجاز كبير! أنت بتبني مساحتك بوضوح.",
    icon: "🛡️",
    order: 6
  },
  {
    id: "measured",
    title: "واعي",
    description: "خلّصت الاستكشاف الأولي",
    hint: "معرفة نقطة البداية أول خطوة للوضوح.",
    icon: "📊",
    order: 7
  },
  {
    id: "reader",
    title: "قارئ",
    description: "فتحت المكتبة التعليمية",
    hint: "المعرفة بتنوّر الطريق. كمّل اقرأ.",
    icon: "📚",
    order: 8
  },
  {
    id: "breather",
    title: "هادي",
    description: "استخدمت تمرين التنفس",
    hint: "إنك تهتم بنفسك ده إنجاز بحد ذاته.",
    icon: "🌬️",
    order: 9
  },
  {
    id: "mission_complete",
    title: "رحّال",
    description: "خلّصت خطوة كاملة في الرحلة",
    hint: "أول خطوة مكتملة… دلوقتي أنت ماشي بجد.",
    icon: "🏁",
    order: 10
  }
].sort((a, b) => a.order - b.order);

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
