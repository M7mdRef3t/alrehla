/**
 * 🔬 Truth Test Engine — محرك اختبار المصداقية
 * ================================================
 * بروتوكول "الاختبار الأعمى" للاتصالات غير المادية.
 *
 * الآلية:
 * 1. المستخدم يسجّل التوقع **قبل** ما يتأكد
 * 2. المنصة تحفظ الطابع الزمني (مش ممكن يتعدّل)
 * 3. بعد المدة → نسأل: اتأكد ولا لأ؟
 * 4. نحسب: نسبة الإصابة vs الصدفة العشوائية
 *
 * الموقف المعرفي:
 * "مش بس نعترف بالتجربة — نختبرها.
 *  الأرقام بتتكلم. والصدق أهم من الراحة."
 *
 * ⚠️ ملف حصانة سيادية.
 */

import type { ConnectionPhenomenonType } from "@/data/connectionPhenomena";

// ═══════════════════════════════════════════════════════════════════════════
// 📊 أنواع الاختبار
// ═══════════════════════════════════════════════════════════════════════════

/** أنواع الاختبارات الثلاثة */
export type TruthTestType =
  | "connection_prediction"  // توقع اتصال: "حاسس إن حد هيتصل"
  | "pre_feeling"            // إحساس مسبق: "حاسس بقلق على حد"
  | "intent_reading";        // قراءة نية: "حسيت إن فلان بيكذب"

/** نتيجة الاختبار من المستخدم */
export type TestOutcome =
  | "confirmed"    // اتأكد
  | "denied"       // ما حصلش
  | "uncertain"    // مش متأكد
  | "pending";     // لسه ما حصلش — مستنيين

/** مستوى الدلالة الإحصائية */
export type SignificanceLevel =
  | "strong"       // أعلى بكتير من الصدفة — نمط قوي
  | "moderate"     // أحسن من الصدفة — نمط ناشئ
  | "weak"         // قريب من الصدفة — ضوضاء
  | "below_chance" // أقل من الصدفة — وهم مؤكد
  | "insufficient"; // بيانات غير كافية

// ═══════════════════════════════════════════════════════════════════════════
// 📝 نماذج البيانات
// ═══════════════════════════════════════════════════════════════════════════

/** فئات الإحساس المسبق */
export type PreFeelingCategory =
  | "worry_about_someone"    // قلق على حد
  | "unexplained_joy"        // فرحة غير مبررة
  | "danger_sense"           // إحساس بخطر
  | "intense_thinking"       // تفكير مكثف في شخص
  | "body_signal";           // إشارة جسدية (ضيق صدر / قبضة معدة)

/** فئات قراءة النية */
export type IntentReadingCategory =
  | "lying"                  // بيكذب
  | "hiding_pain"            // متضايق بس مش بيبيّن
  | "wants_to_say"           // عايز يقولي حاجة
  | "suppressed_anger"       // غضب مكبوت
  | "genuine_care";          // اهتمام حقيقي

/** اختبار واحد */
export interface TruthTest {
  /** معرف فريد */
  id: string;
  /** نوع الاختبار */
  type: TruthTestType;
  /** وقت تسجيل التوقع — لا يتغير أبداً */
  predictionTimestamp: number;
  /** المدة المتوقعة (بالمللي ثانية) */
  windowMs: number;
  /** وقت انتهاء نافذة الاختبار */
  expiresAt: number;
  /** الشخص المرتبط (من الخريطة) */
  personId?: string;
  personName?: string;
  /** تفاصيل التوقع حسب النوع */
  prediction: ConnectionPrediction | PreFeelingPrediction | IntentReadingPrediction;
  /** النتيجة */
  outcome: TestOutcome;
  /** وقت تسجيل النتيجة */
  outcomeTimestamp?: number;
  /** ملاحظة المستخدم بعد النتيجة */
  outcomeNote?: string;
  /** الظاهرة العلمية المصنفة */
  classifiedAs?: ConnectionPhenomenonType;
  /** مستوى الطاقة وقت التسجيل */
  energyAtPrediction?: number;
  /** المزاج وقت التسجيل */
  moodAtPrediction?: string;
}

/** تفاصيل توقع اتصال */
export interface ConnectionPrediction {
  type: "connection_prediction";
  /** نوع الاتصال المتوقع */
  contactMethod: "call" | "message" | "visit" | "any";
}

/** تفاصيل إحساس مسبق */
export interface PreFeelingPrediction {
  type: "pre_feeling";
  /** فئة الإحساس */
  category: PreFeelingCategory;
  /** وصف حر */
  description?: string;
}

/** تفاصيل قراءة نية */
export interface IntentReadingPrediction {
  type: "intent_reading";
  /** فئة القراءة */
  category: IntentReadingCategory;
  /** وصف حر */
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 📊 نتائج التحليل
// ═══════════════════════════════════════════════════════════════════════════

/** نتائج إحصائية لنوع اختبار واحد */
export interface TestTypeStats {
  type: TruthTestType;
  totalTests: number;
  confirmed: number;
  denied: number;
  uncertain: number;
  pending: number;
  /** نسبة الإصابة (من المحسومة فقط — بدون pending وuncertain) */
  hitRate: number;
  /** نسبة الصدفة المتوقعة */
  chanceRate: number;
  /** هل أحسن من الصدفة؟ */
  isAboveChance: boolean;
  /** مستوى الدلالة */
  significance: SignificanceLevel;
  /** الرسالة للمستخدم */
  userMessage: string;
}

/** نتائج شاملة */
export interface TruthTestDashboard {
  totalTests: number;
  completedTests: number;
  pendingTests: number;
  byType: TestTypeStats[];
  byPerson: PersonTestStats[];
  /** البصيرة الشاملة */
  overallInsight: string;
  /** الموقف المعرفي */
  epistemologicalNote: string;
}

/** إحصائيات شخص واحد */
export interface PersonTestStats {
  personId: string;
  personName: string;
  totalTests: number;
  confirmed: number;
  hitRate: number;
  chanceRate: number;
  significance: SignificanceLevel;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧮 حساب الصدفة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يحسب نسبة الصدفة المتوقعة لنوع اختبار معين.
 *
 * @param type - نوع الاختبار
 * @param totalPeopleOnMap - عدد الأشخاص على الخريطة (لتوقع الاتصال)
 */
export function calculateChanceRate(
  type: TruthTestType,
  totalPeopleOnMap: number = 10
): number {
  switch (type) {
    case "connection_prediction":
      // الصدفة = 1 / عدد الأشخاص × احتمال الاتصال اليومي
      // تقريباً: لو عندك 10 أشخاص واحتمال أي حد يتصل 30% يومياً
      // → الصدفة إن شخص معين يتصل = 30% / 10 = ~3%
      // نستخدم تقدير محافظ أعلى عشان نكون عادلين:
      return Math.min(100, Math.max(5, Math.round(100 / Math.max(totalPeopleOnMap, 2))));

    case "pre_feeling":
      // 4 فئات إحساس → الصدفة = 25%
      // لكن "قلق على حد + اتأكد" → أقل: ~15%
      return 20;

    case "intent_reading":
      // 5 فئات قراءة → الصدفة = 20%
      // لكن بعض القراءات سهلة (زي "متضايق") → نرفع لـ 30%
      return 30;

    default:
      return 25;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📈 تحليل النتائج
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يحسب مستوى الدلالة بناءً على نسبة الإصابة ونسبة الصدفة.
 */
export function calculateSignificance(
  hitRate: number,
  chanceRate: number,
  sampleSize: number
): SignificanceLevel {
  // أقل من 5 اختبارات محسومة = بيانات غير كافية
  if (sampleSize < 5) return "insufficient";

  const ratio = hitRate / Math.max(chanceRate, 1);

  if (ratio >= 2.0) return "strong";       // ضعف الصدفة أو أكتر
  if (ratio >= 1.5) return "moderate";     // 1.5× الصدفة
  if (ratio >= 0.8) return "weak";         // قريب من الصدفة
  return "below_chance";                    // أقل من الصدفة
}

/**
 * يبني رسالة للمستخدم بناءً على مستوى الدلالة.
 */
export function getSignificanceMessage(
  significance: SignificanceLevel,
  hitRate: number,
  chanceRate: number,
  sampleSize: number
): string {
  switch (significance) {
    case "strong":
      return `نسبة إصابتك ${hitRate}% — ده أعلى بكتير من الصدفة (${chanceRate}%). فيه نمط حقيقي يستاهل انتباهك. مش بنقول "تخاطر" — بنقول "فيه حاجة هنا".`;

    case "moderate":
      return `نسبة إصابتك ${hitRate}% مقابل ${chanceRate}% صدفة. أحسن من العشوائي — بس محتاج ${Math.max(10 - sampleSize, 3)} اختبار كمان عشان نتأكد.`;

    case "weak":
      return `نسبة إصابتك ${hitRate}% — قريبة من الصدفة (${chanceRate}%). ده غالباً وهم التكرار: عقلك بيتذكر المرات اللي صح وبينسى اللي غلط.`;

    case "below_chance":
      return `نسبة إصابتك ${hitRate}% — ده أقل من الصدفة (${chanceRate}%). عقلك بيقنعك بحاجة مش موجودة. الصدق أهم من الراحة.`;

    case "insufficient":
      return `لسه محتاج اختبارات أكتر. ${sampleSize} مش كفاية — كمّل لحد 10 على الأقل عشان النتائج تبقى ليها معنى.`;
  }
}

/**
 * يحلل مجموعة اختبارات ويطلع إحصائيات شاملة.
 */
export function analyzeTruthTests(
  tests: TruthTest[],
  totalPeopleOnMap: number = 10
): TruthTestDashboard {
  const completed = tests.filter((t) => t.outcome !== "pending");
  const pending = tests.filter((t) => t.outcome === "pending");

  // ── تحليل حسب النوع ──
  const types: TruthTestType[] = ["connection_prediction", "pre_feeling", "intent_reading"];
  const byType: TestTypeStats[] = types.map((type) => {
    const typeTests = tests.filter((t) => t.type === type);
    const typeCompleted = typeTests.filter((t) => t.outcome !== "pending");
    const confirmed = typeCompleted.filter((t) => t.outcome === "confirmed").length;
    const denied = typeCompleted.filter((t) => t.outcome === "denied").length;
    const uncertain = typeCompleted.filter((t) => t.outcome === "uncertain").length;
    const pendingCount = typeTests.filter((t) => t.outcome === "pending").length;

    const decidedCount = confirmed + denied; // بدون uncertain
    const hitRate = decidedCount > 0 ? Math.round((confirmed / decidedCount) * 100) : 0;
    const chanceRate = calculateChanceRate(type, totalPeopleOnMap);
    const significance = calculateSignificance(hitRate, chanceRate, decidedCount);

    return {
      type,
      totalTests: typeTests.length,
      confirmed,
      denied,
      uncertain,
      pending: pendingCount,
      hitRate,
      chanceRate,
      isAboveChance: hitRate > chanceRate,
      significance,
      userMessage: getSignificanceMessage(significance, hitRate, chanceRate, decidedCount),
    };
  });

  // ── تحليل حسب الشخص ──
  const personMap: Record<string, { name: string; tests: TruthTest[] }> = {};
  for (const test of tests) {
    if (!test.personId) continue;
    if (!personMap[test.personId]) {
      personMap[test.personId] = { name: test.personName || "غير معروف", tests: [] };
    }
    personMap[test.personId].tests.push(test);
  }

  const byPerson: PersonTestStats[] = Object.entries(personMap)
    .map(([personId, { name, tests: personTests }]) => {
      const decided = personTests.filter((t) => t.outcome === "confirmed" || t.outcome === "denied");
      const confirmed = decided.filter((t) => t.outcome === "confirmed").length;
      const hitRate = decided.length > 0 ? Math.round((confirmed / decided.length) * 100) : 0;
      const chanceRate = 25; // متوسط عام
      return {
        personId,
        personName: name,
        totalTests: personTests.length,
        confirmed,
        hitRate,
        chanceRate,
        significance: calculateSignificance(hitRate, chanceRate, decided.length),
      };
    })
    .filter((p) => p.totalTests >= 2)
    .sort((a, b) => b.hitRate - a.hitRate);

  // ── البصيرة الشاملة ──
  const totalDecided = completed.filter((t) => t.outcome !== "uncertain").length;
  const totalConfirmed = completed.filter((t) => t.outcome === "confirmed").length;
  const overallHitRate = totalDecided > 0 ? Math.round((totalConfirmed / totalDecided) * 100) : 0;

  let overallInsight: string;
  if (totalDecided < 5) {
    overallInsight = `${tests.length} اختبار — لسه في البداية. كمّل عشان الأرقام تبدأ تتكلم.`;
  } else {
    const strongTypes = byType.filter((t) => t.significance === "strong");
    const weakTypes = byType.filter((t) => t.significance === "weak" || t.significance === "below_chance");

    if (strongTypes.length > 0 && weakTypes.length > 0) {
      overallInsight = `نتائج مختلطة: ${strongTypes.map((t) => TYPE_LABELS[t.type]).join("، ")} أعلى من الصدفة — بس ${weakTypes.map((t) => TYPE_LABELS[t.type]).join("، ")} قريب من الصدفة. جسمك بيحس بحاجات — بس مش كل إحساس = اتصال.`;
    } else if (strongTypes.length > 0) {
      overallInsight = `${overallHitRate}% إصابة شاملة — فيه نمط حقيقي. مش بنقول تخاطر — بنقول بياناتك بتقول فيه حاجة أعلى من الصدفة.`;
    } else {
      overallInsight = `${overallHitRate}% إصابة — قريب من الصدفة. وهم التكرار هو التفسير الأقرب حالياً. بس كمّل — الأرقام ممكن تتغير.`;
    }
  }

  // البصيرة حسب الشخص
  const topPerson = byPerson.find((p) => p.significance === "strong");
  if (topPerson) {
    overallInsight += ` لافت: إحساسك بـ "${topPerson.personName}" أعلى بكتير من الصدفة (${topPerson.hitRate}%).`;
  }

  return {
    totalTests: tests.length,
    completedTests: completed.length,
    pendingTests: pending.length,
    byType,
    byPerson,
    overallInsight,
    epistemologicalNote: "الأرقام بتتكلم — لكن مش بتفسّر. نسبة عالية = 'فيه حاجة' — مش 'تخاطر مثبت'. نسبة منخفضة = 'غالباً وهم' — مش 'إحساسك كاذب'. الحقيقة أكبر من العلم والجهل معاً.",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🏷️ تسميات عربية
// ═══════════════════════════════════════════════════════════════════════════

export const TYPE_LABELS: Record<TruthTestType, string> = {
  connection_prediction: "توقع اتصال",
  pre_feeling: "إحساس مسبق",
  intent_reading: "قراءة نية",
};

export const TYPE_EMOJIS: Record<TruthTestType, string> = {
  connection_prediction: "📞",
  pre_feeling: "🌊",
  intent_reading: "👁️",
};

export const OUTCOME_LABELS: Record<TestOutcome, string> = {
  confirmed: "اتأكد ✅",
  denied: "ما حصلش ❌",
  uncertain: "مش متأكد 🤷",
  pending: "مستنيين ⏰",
};

export const PRE_FEELING_LABELS: Record<PreFeelingCategory, { label: string; emoji: string }> = {
  worry_about_someone: { label: "قلق على حد", emoji: "😰" },
  unexplained_joy: { label: "فرحة غير مبررة", emoji: "😊" },
  danger_sense: { label: "إحساس بخطر", emoji: "⚠️" },
  intense_thinking: { label: "تفكير مكثف في شخص", emoji: "🧠" },
  body_signal: { label: "إشارة جسدية", emoji: "💓" },
};

export const INTENT_READING_LABELS: Record<IntentReadingCategory, { label: string; emoji: string }> = {
  lying: { label: "بيكذب", emoji: "🎭" },
  hiding_pain: { label: "متضايق بس مش بيبيّن", emoji: "😶" },
  wants_to_say: { label: "عايز يقولي حاجة", emoji: "💬" },
  suppressed_anger: { label: "غضب مكبوت", emoji: "🌋" },
  genuine_care: { label: "اهتمام حقيقي", emoji: "💚" },
};

export const SIGNIFICANCE_META: Record<SignificanceLevel, { label: string; emoji: string; color: string }> = {
  strong: { label: "نمط قوي", emoji: "🟢", color: "#22c55e" },
  moderate: { label: "نمط ناشئ", emoji: "🟡", color: "#f59e0b" },
  weak: { label: "ضوضاء", emoji: "🟠", color: "#f97316" },
  below_chance: { label: "أقل من الصدفة", emoji: "🔴", color: "#ef4444" },
  insufficient: { label: "بيانات غير كافية", emoji: "⚪", color: "#64748b" },
};

// ═══════════════════════════════════════════════════════════════════════════
// ⏰ نوافذ الاختبار
// ═══════════════════════════════════════════════════════════════════════════

export const TEST_WINDOWS = {
  connection_prediction: {
    options: [
      { label: "ساعة", ms: 60 * 60 * 1000 },
      { label: "يوم", ms: 24 * 60 * 60 * 1000 },
      { label: "أسبوع", ms: 7 * 24 * 60 * 60 * 1000 },
    ],
    defaultIdx: 1,
  },
  pre_feeling: {
    options: [
      { label: "24 ساعة", ms: 24 * 60 * 60 * 1000 },
      { label: "3 أيام", ms: 3 * 24 * 60 * 60 * 1000 },
    ],
    defaultIdx: 0,
  },
  intent_reading: {
    options: [
      { label: "أسبوع", ms: 7 * 24 * 60 * 60 * 1000 },
      { label: "أسبوعين", ms: 14 * 24 * 60 * 60 * 1000 },
    ],
    defaultIdx: 0,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════

/** هل الاختبار انتهت مدته ومستنى نتيجة؟ */
export function isTestExpired(test: TruthTest): boolean {
  return test.outcome === "pending" && Date.now() >= test.expiresAt;
}

/** الاختبارات المنتهية اللي مستنية نتيجة */
export function getExpiredPendingTests(tests: TruthTest[]): TruthTest[] {
  return tests.filter(isTestExpired);
}

/** بناء بلوك AI لتحليل نتائج الاختبار */
export function buildTruthTestAIPrompt(dashboard: TruthTestDashboard): string {
  const lines: string[] = [
    "**سياق: نتائج مختبر المصداقية (اختبار أعمى للاتصالات غير المادية):**",
    "",
    `إجمالي الاختبارات: ${dashboard.totalTests} (${dashboard.completedTests} مكتمل / ${dashboard.pendingTests} مستنى)`,
    "",
  ];

  for (const stat of dashboard.byType) {
    if (stat.totalTests === 0) continue;
    lines.push(`- ${TYPE_LABELS[stat.type]}: ${stat.totalTests} اختبار`);
    lines.push(`  إصابة: ${stat.hitRate}% | صدفة: ${stat.chanceRate}% | الحكم: ${SIGNIFICANCE_META[stat.significance].label}`);
  }

  if (dashboard.byPerson.length > 0) {
    lines.push("");
    lines.push("أبرز الأشخاص:");
    for (const person of dashboard.byPerson.slice(0, 3)) {
      lines.push(`- "${person.personName}": ${person.hitRate}% إصابة من ${person.totalTests} اختبار — ${SIGNIFICANCE_META[person.significance].label}`);
    }
  }

  lines.push("");
  lines.push("**قواعد التحليل (إلزامية):**");
  lines.push("- لا تقول 'تخاطر مثبت' حتى لو النسبة عالية — قول 'نمط أعلى من الصدفة'");
  lines.push("- لا تنكر إحساس المستخدم حتى لو النسبة ضعيفة — قول 'الأرقام بتقول كذا — لكن البيانات لسه محدودة'");
  lines.push("- اربط بالعلم: وهم التكرار (Baader-Meinhof) لما النسبة ضعيفة / خلايا المرآة لما النسبة قوية");
  lines.push("- لغة عامية مصرية بسيطة");
  lines.push("- الموقف: 'الحقيقة أكبر من العلم والجهل معاً'");

  return lines.join("\n");
}
