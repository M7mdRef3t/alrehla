import type { ResonanceInsight } from "./ProactiveResonanceFeed";
import type { OverviewStats } from "@/services/admin/adminTypes";

/**
 * resonanceEngine.ts
 * The reasoning core that transforms raw telemetry into sentient narrative insights.
 */

export function generateResonanceInsights(stats: OverviewStats | null): ResonanceInsight[] {
  if (!stats) return [];

  const insights: ResonanceInsight[] = [];
  const now = Date.now();

  // 1. Emotional Insight: Collective Harmony & Mood
  if (stats.avgMood !== null && stats.avgMood < 0.6) {
    insights.push({
      id: "harmony-alert",
      type: "emotional",
      title: "انخفاض في مستوى التناغم الجماعي",
      narrative: `نلاحظ انخفاضاً في متوسط الحالة الشعورية (${Math.round(stats.avgMood * 100)}%). المسافرون يمرون بلحظات من الثقل النفسي. قد يكون الوقت مناسباً لتفعيل "بروتوكول السلام" لتهدئة الأثير.`,
      timestamp: now - 1000 * 60 * 5,
      urgency: "medium"
    });
  } else if (stats.activeConsciousnessNow && stats.activeConsciousnessNow > 50) {
    insights.push({
      id: "high-vibration",
      type: "emotional",
      title: "اهتزاز عالي في الملاذ",
      narrative: `يوجد الآن ${stats.activeConsciousnessNow} مسافراً في حالة وعي نشطة. الطاقة الجماعية في ذروتها، مما قد يؤدي لبعض التداخل المعرفي.`,
      timestamp: now,
      urgency: "low"
    });
  }

  // 2. Analytical Insight: Flow & AI Routing
  const interventionRate = stats.routingTelemetry?.interventionHealth?.interventionRatePct ?? 0;
  if (interventionRate > 20) {
    insights.push({
      id: "friction-alert",
      type: "analytical",
      title: "مقاومة في تدفق الوعي",
      narrative: `خوارزمية التوجيه تضطر للتدخل بنسبة ${interventionRate}% لإنقاذ المسارات. يبدو أن هناك تعقيداً في واجهة 'النبض' يسبب تشتتاً للمسافرين الجدد.`,
      timestamp: now - 1000 * 60 * 12,
      urgency: "high"
    });
  }

  // 3. Actionable Insight: Awareness Gap
  const gap = stats.awarenessGap?.gapPercent ?? 0;
  if (gap > 15) {
    insights.push({
      id: "awareness-gap-action",
      type: "actionable",
      title: "فجوة وعي متسعة",
      narrative: `رصدنا فجوة بنسبة ${Math.round(gap)}% بين ما يحتاجه المسافرون وما يجدونه. نقترح تحديث "مرآة الوعي" لتعكس الاحتياجات الحالية المفقودة.`,
      timestamp: now - 1000 * 60 * 30,
      urgency: "medium"
    });
  }

  // 4. Default Insight if everything is too perfect (Oracle mode)
  if (insights.length === 0) {
    insights.push({
      id: "stable-orbit",
      type: "analytical",
      title: "استقرار في المدار السيادي",
      narrative: "كل المؤشرات تدل على انسجام تام بين المسافرين والنظام. الملاذ يتنفس بعمق، ولا توجد تدخلات حرجة مطلوبة حالياً.",
      timestamp: now,
      urgency: "low"
    });
  }

  return insights;
}

export function generateGrowthInsights(stats: OverviewStats | null, growth: any = null): ResonanceInsight[] {
  if (!stats) return [];
  const insights: ResonanceInsight[] = [];
  const now = Date.now();

  // 1. Magnetism: Conversion Health
  const funnel = stats.funnel?.steps ?? [];
  const landingCount = funnel.find(s => s.key === 'landing')?.count ?? 0;
  const entryCount = funnel.find(s => s.key === 'entry')?.count ?? 0;
  const conversionRate = landingCount > 0 ? (entryCount / landingCount) * 100 : 0;

  if (conversionRate < 10) {
    insights.push({
      id: "magnetism-low",
      type: "emotional",
      title: "ضعف في الجذب المغناطيسي",
      narrative: `معدل التحويل من الصفحة الرئيسية منخفض (${conversionRate.toFixed(1)}%). يبدو أن "النداء" الأول لا يلامس احتياجات المسافرين بشكل كافٍ.`,
      timestamp: now - 1000 * 60 * 20,
      urgency: "high"
    });
  }

  // 2. Viral Velocity: K-Factor
  const kFactor = growth?.kFactor ?? 0.4; // Fallback to 0.4 for mock simulation
  if (kFactor > 0.8) {
    insights.push({
      id: "viral-surge",
      type: "analytical",
      title: "انتشار فيروسي متسارع",
      narrative: `معامل الانتشار (K-Factor) وصل إلى ${kFactor}. الهمس بالرحلة ينتشر عضوياً بسرعة فائقة. الوقت مثالي لتعزيز "المغناطيسية" لاستيعاب هذا التدفق.`,
      timestamp: now,
      urgency: "low"
    });
  }

  // 3. Market Opportunity
  const totalTravelers = stats.totalTravelers ?? 0;
  if (totalTravelers > 1000 && (stats.activeConsciousnessNow ?? 0) < 5) {
    insights.push({
      id: "dormant-travelers",
      type: "actionable",
      title: "طاقة كامنة تنتظر التفعيل",
      narrative: `يوجد أكثر من 1000 مسافر مسجل ولكن النشاط اللحظي منخفض. نقترح إطلاق "نداء العودة" (Re-engagement Echo) لإعادة إحياء الرحلة في نفوسهم.`,
      timestamp: now - 1000 * 60 * 60,
      urgency: "medium"
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "growth-steady",
      type: "analytical",
      title: "نمو مستدام وهادئ",
      narrative: "معدلات النمو تتبع وتيرة صحية. الجذب المغناطيسي للمنصة مستقر والانتشار العضوي يسير وفق المخطط.",
      timestamp: now,
      urgency: "low"
    });
  }

  return insights;
}
