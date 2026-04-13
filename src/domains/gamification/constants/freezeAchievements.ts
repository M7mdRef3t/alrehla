/**
 * ❄️ Tajmeed — Freeze Achievements
 * إنجازات مرتبطة بميكانيكا التجميد
 *
 * كل إنجاز يُفتح عندما يتخذ المستخدم قرار واعي
 * بتجميد / إذابة / حماية حدوده العلائقية.
 */

export interface FreezeAchievement {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  hint: string;
  icon: string;
  frostPointsReward: number;
  condition: string; // internal key for checking
  threshold: number; // the number required to unlock
  order: number;
  hidden?: boolean;
}

export const FREEZE_ACHIEVEMENTS: FreezeAchievement[] = [
  // ─── تجميد أساسي ──────────────────────────────────
  {
    id: "first_frost",
    title: "أول صقيع",
    titleEn: "First Frost",
    description: "جمّدت أول علاقة مستنزفة على خريطتك",
    hint: "الخطوة الأولى نحو حماية طاقتك. فعل سيادي حقيقي.",
    icon: "❄️",
    frostPointsReward: 100,
    condition: "totalFreezes",
    threshold: 1,
    order: 1,
  },
  {
    id: "cold_snap",
    title: "موجة باردة",
    titleEn: "Cold Snap",
    description: "جمّدت 3 علاقات مستنزفة",
    hint: "أنت بتتعلم تحمي مساحتك بجدية.",
    icon: "🌨️",
    frostPointsReward: 200,
    condition: "totalFreezes",
    threshold: 3,
    order: 2,
  },
  {
    id: "absolute_zero",
    title: "الصفر المُطلق",
    titleEn: "Absolute Zero",
    description: "جمّدت 5 علاقات مستنزفة",
    hint: "لا شيء يخترق دفاعاتك. أنت سيد قراراتك.",
    icon: "🧊",
    frostPointsReward: 500,
    condition: "totalFreezes",
    threshold: 5,
    order: 3,
  },

  // ─── ذوبان واعي ──────────────────────────────────
  {
    id: "ice_breaker",
    title: "كاسر الجليد",
    titleEn: "Ice Breaker",
    description: "أذبت تجميد علاقة تحسنت",
    hint: "التسامح فن — والذوبان الواعي أصعب من التجميد.",
    icon: "🌊",
    frostPointsReward: 150,
    condition: "totalUnfreezes",
    threshold: 1,
    order: 4,
  },
  {
    id: "conscious_thaw",
    title: "الذوبان الواعي",
    titleEn: "Conscious Thaw",
    description: "أعدت 3 علاقات مجمدة للمدار النشط",
    hint: "تعرف متى تجمّد ومتى تذيب — ده الوعي الحقيقي.",
    icon: "☀️",
    frostPointsReward: 300,
    condition: "totalUnfreezes",
    threshold: 3,
    order: 5,
  },

  // ─── حدود سيادية ──────────────────────────────────
  {
    id: "boundary_sentinel",
    title: "حارس الحدود",
    titleEn: "Boundary Sentinel",
    description: "وضعت 10 حدود ناجحة مع أشخاص في مدارك",
    hint: "الحدود مش عداوة — الحدود حب للذات.",
    icon: "🛡️",
    frostPointsReward: 400,
    condition: "boundariesSet",
    threshold: 10,
    order: 6,
  },
  {
    id: "fortress_builder",
    title: "بنّاء القلعة",
    titleEn: "Fortress Builder",
    description: "وضعت 25 حد سيادي",
    hint: "قلعتك مبنية بأساسات صلبة.",
    icon: "🏰",
    frostPointsReward: 750,
    condition: "boundariesSet",
    threshold: 25,
    order: 7,
  },

  // ─── رصد الأنماط ──────────────────────────────────
  {
    id: "storm_eye",
    title: "عين العاصفة",
    titleEn: "Eye of the Storm",
    description: "رصد AI أنماطاً متكررة 3 مرات",
    hint: "ترى اللي ما يشوفه غيرك.",
    icon: "👁️",
    frostPointsReward: 250,
    condition: "patternsDetected",
    threshold: 3,
    order: 8,
  },
  {
    id: "pattern_oracle",
    title: "عرّاف الأنماط",
    titleEn: "Pattern Oracle",
    description: "10 أنماط مكتشفة من AI",
    hint: "أنت الآن تقرأ خريطة علاقاتك مثل الخبراء.",
    icon: "🔮",
    frostPointsReward: 500,
    condition: "patternsDetected",
    threshold: 10,
    order: 9,
    hidden: true,
  },

  // ─── كومبو الصقيع ──────────────────────────────────
  {
    id: "frost_combo",
    title: "كومبو الصقيع",
    titleEn: "Frost Combo",
    description: "جمّدت 3 علاقات في أسبوع واحد (×2 مكافأة)",
    hint: "السرعة في القرارات الصعبة دليل على النضج.",
    icon: "⚡❄️",
    frostPointsReward: 300,
    condition: "weeklyFreezes",
    threshold: 3,
    order: 10,
  },

  // ─── درع الطاقة (Streak + No Drain) ──────────────
  {
    id: "energy_shield",
    title: "درع الطاقة",
    titleEn: "Energy Shield",
    description: "حافظت على streak 14 يوم مع تجميدات فعالة",
    hint: "14 يوم من السيادة — درعك ما ينكسر.",
    icon: "💠",
    frostPointsReward: 1000,
    condition: "special_energy_shield",
    threshold: 14,
    order: 11,
    hidden: true,
  },
];

/**
 * فحص إنجازات التجميد مقابل الإحصائيات الحالية
 */
export function checkFreezeAchievements(
  stats: {
    totalFreezes: number;
    totalUnfreezes: number;
    boundariesSet: number;
    patternsDetected: number;
    weeklyFreezes: number;
  },
  unlockedIds: string[],
  streak?: number
): FreezeAchievement[] {
  const newlyUnlocked: FreezeAchievement[] = [];

  for (const achievement of FREEZE_ACHIEVEMENTS) {
    if (unlockedIds.includes(achievement.id)) continue;

    let value = 0;
    switch (achievement.condition) {
      case "totalFreezes":
        value = stats.totalFreezes;
        break;
      case "totalUnfreezes":
        value = stats.totalUnfreezes;
        break;
      case "boundariesSet":
        value = stats.boundariesSet;
        break;
      case "patternsDetected":
        value = stats.patternsDetected;
        break;
      case "weeklyFreezes":
        value = stats.weeklyFreezes;
        break;
      case "special_energy_shield":
        value = streak ?? 0;
        break;
      default:
        break;
    }

    if (value >= achievement.threshold) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}
