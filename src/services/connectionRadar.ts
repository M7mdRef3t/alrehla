/**
 * 🔮 Connection Radar — رادار الاتصالات غير المادية
 * ====================================================
 * محرك رصد تلقائي يحلل بيانات النبض + الخريطة + السجلات
 * ويكتشف أنماط اتصال محتملة مع أشخاص معينين.
 *
 * الآلية:
 * 1. يقرأ سجلات النبض (مزاج + طاقة + وقت)
 * 2. يقرأ تفاعلات الخريطة (من فتح ملف الشخص؟ متى؟)
 * 3. يقرأ سجلات صِلة (من تواصل معاه؟)
 * 4. يربط الأنماط: "لما طاقتك بتنخفض — بتفتح ملف X"
 * 5. يصنّف الظاهرة حسب connectionPhenomena.ts
 *
 * الموقف المعرفي:
 * "اعتراف بالتجربة — تحفظ على التفسير"
 *
 * ⚠️ ملف حصانة سيادية.
 */

import type { ConnectionPhenomenonType } from "@/data/connectionPhenomena";

// ═══════════════════════════════════════════════════════════════════════════
// 📊 أنواع البيانات
// ═══════════════════════════════════════════════════════════════════════════

/** حدث اتصال مرصود */
export interface ConnectionEvent {
  id: string;
  /** وقت الحدث */
  timestamp: number;
  /** الشخص المرتبط (من الخريطة) — لو معروف */
  personId?: string;
  /** اسم الشخص */
  personName?: string;
  /** نوع الظاهرة المصنفة */
  phenomenonType: ConnectionPhenomenonType;
  /** وصف الحدث */
  description: string;
  /** هل تأكد الحدث بعدها؟ (مثلاً: حسيت بيه — وفعلاً اتصل) */
  confirmed?: boolean;
  /** ملاحظات المستخدم */
  userNote?: string;
  /** سياق الرصد — إزاي اتكشف */
  detectionContext: DetectionContext;
  /** مستوى الطاقة وقت الحدث */
  energyAtEvent?: number;
  /** المزاج وقت الحدث */
  moodAtEvent?: string;
}

/** سياق الرصد — من أين جاء الإشارة */
export interface DetectionContext {
  /** المصدر */
  source: "pulse_pattern" | "map_interaction" | "sila_log" | "manual" | "ai_analysis";
  /** تفاصيل */
  detail: string;
}

/** نمط اتصال مع شخص معين */
export interface ConnectionPattern {
  /** الشخص */
  personId: string;
  personName: string;
  /** عدد الأحداث */
  eventCount: number;
  /** عدد الأحداث المؤكدة */
  confirmedCount: number;
  /** نسبة التأكيد */
  confirmationRate: number;
  /** أكثر ظاهرة متكررة */
  dominantPhenomenon: ConnectionPhenomenonType;
  /** أوقات الذروة (ساعات اليوم اللي بتحصل فيها أكتر) */
  peakHours: number[];
  /** متوسط الطاقة وقت الأحداث */
  avgEnergyDuringEvents: number;
  /** البصيرة — رسالة للمستخدم */
  insight: string;
}

/** بصيرة AI عن الأنماط */
export interface ConnectionInsight {
  id: string;
  timestamp: number;
  /** البصيرة الرئيسية */
  title: string;
  /** الشرح */
  body: string;
  /** الشخص المرتبط */
  personId?: string;
  personName?: string;
  /** الظاهرة */
  phenomenonType: ConnectionPhenomenonType;
  /** الموقف المعرفي — تعليق صريح */
  epistemologicalNote: string;
  /** مستوى الثقة */
  confidence: "low" | "medium" | "high";
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 محرك الرصد التلقائي
// ═══════════════════════════════════════════════════════════════════════════

interface PulseLog {
  timestamp: number;
  energy: number;
  mood: string;
}

interface MapInteraction {
  nodeId: string;
  nodeName: string;
  timestamp: number;
  action: "viewed" | "analyzed" | "noted";
}

/**
 * يكتشف أنماط "التفكير في شخص" من تفاعلات الخريطة + النبض.
 * 
 * المنطق:
 * - لو المستخدم فتح ملف شخص في وقت طاقته منخفضة + بدون سبب واضح
 *   → ده ممكن يكون "حدس جسدي" أو "وهم تكرار"
 * - لو المستخدم فتح ملف نفس الشخص أكتر من 3 مرات في يوم
 *   → ده نمط ملفت — المنصة بتنبّه
 */
export function detectPulseMapCorrelation(
  pulseLogs: PulseLog[],
  mapInteractions: MapInteraction[],
  windowHours: number = 2
): ConnectionEvent[] {
  const events: ConnectionEvent[] = [];
  const windowMs = windowHours * 60 * 60 * 1000;

  // لكل تفاعل مع الخريطة — شوف النبض اللي قبله
  for (const interaction of mapInteractions) {
    const nearbyPulses = pulseLogs.filter(
      (p) => Math.abs(p.timestamp - interaction.timestamp) < windowMs
    );

    if (nearbyPulses.length === 0) continue;

    const avgEnergy = nearbyPulses.reduce((s, p) => s + p.energy, 0) / nearbyPulses.length;
    const moods = nearbyPulses.map((p) => p.mood);
    const hasAnxiety = moods.some((m) => ["anxious", "tense", "overwhelmed"].includes(m));

    // نمط: طاقة منخفضة + قلق + فتح ملف شخص → حدس جسدي محتمل
    if (avgEnergy <= 4 && hasAnxiety) {
      events.push({
        id: `ce_${interaction.timestamp}_${interaction.nodeId}`,
        timestamp: interaction.timestamp,
        personId: interaction.nodeId,
        personName: interaction.nodeName,
        phenomenonType: "somatic_intuition",
        description: `فتحت ملف "${interaction.nodeName}" وطاقتك كانت ${avgEnergy.toFixed(1)} مع شعور بالقلق`,
        detectionContext: {
          source: "pulse_pattern",
          detail: `طاقة ${avgEnergy.toFixed(1)}/10 + مزاج قلق + تفاعل مع الخريطة`,
        },
        energyAtEvent: avgEnergy,
        moodAtEvent: moods[0],
      });
    }
  }

  return events;
}

/**
 * يكتشف "التكرار المشبوه" — لما المستخدم يفتح ملف نفس الشخص كتير.
 * ده ممكن يكون:
 * - وهم تكرار (عقلك بيلاحظ اللي يثبت اللي هو عايز يصدقه)
 * - أو اتصال حقيقي (حدس ثابت)
 * 
 * المنصة بترصد بس — التفسير على المستخدم.
 */
export function detectRepetitiveThinking(
  mapInteractions: MapInteraction[],
  thresholdPerDay: number = 3
): ConnectionEvent[] {
  const events: ConnectionEvent[] = [];

  // تجميع التفاعلات حسب الشخص + اليوم
  const byPersonDay: Record<string, MapInteraction[]> = {};
  for (const interaction of mapInteractions) {
    const dayKey = new Date(interaction.timestamp).toISOString().slice(0, 10);
    const key = `${interaction.nodeId}_${dayKey}`;
    if (!byPersonDay[key]) byPersonDay[key] = [];
    byPersonDay[key].push(interaction);
  }

  for (const [key, interactions] of Object.entries(byPersonDay)) {
    if (interactions.length >= thresholdPerDay) {
      const first = interactions[0];
      events.push({
        id: `ce_repeat_${key}`,
        timestamp: first.timestamp,
        personId: first.nodeId,
        personName: first.nodeName,
        phenomenonType: "frequency_illusion",
        description: `فتحت ملف "${first.nodeName}" ${interactions.length} مرات في يوم واحد`,
        detectionContext: {
          source: "map_interaction",
          detail: `${interactions.length} تفاعل مع نفس الشخص في يوم — نمط تكرار ملفت`,
        },
      });
    }
  }

  return events;
}

// ═══════════════════════════════════════════════════════════════════════════
// 📊 محلل الأنماط
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يحلل مجموعة أحداث ويستخرج أنماط لكل شخص.
 */
export function analyzeConnectionPatterns(events: ConnectionEvent[]): ConnectionPattern[] {
  // تجميع حسب الشخص
  const byPerson: Record<string, ConnectionEvent[]> = {};
  for (const event of events) {
    if (!event.personId) continue;
    if (!byPerson[event.personId]) byPerson[event.personId] = [];
    byPerson[event.personId].push(event);
  }

  const patterns: ConnectionPattern[] = [];
  for (const [personId, personEvents] of Object.entries(byPerson)) {
    if (personEvents.length < 2) continue;

    const confirmed = personEvents.filter((e) => e.confirmed);
    const confirmationRate = personEvents.length > 0
      ? (confirmed.length / personEvents.length) * 100
      : 0;

    // أكثر ظاهرة متكررة
    const typeCounts: Record<string, number> = {};
    for (const e of personEvents) {
      typeCounts[e.phenomenonType] = (typeCounts[e.phenomenonType] || 0) + 1;
    }
    const dominantPhenomenon = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as ConnectionPhenomenonType;

    // أوقات الذروة
    const hourCounts: Record<number, number> = {};
    for (const e of personEvents) {
      const hour = new Date(e.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([h]) => parseInt(h));

    // متوسط الطاقة
    const energyEvents = personEvents.filter((e) => e.energyAtEvent != null);
    const avgEnergy = energyEvents.length > 0
      ? energyEvents.reduce((s, e) => s + (e.energyAtEvent || 0), 0) / energyEvents.length
      : -1;

    // بناء البصيرة
    let insight: string;
    if (confirmationRate >= 60) {
      insight = `فيه نمط ملفت مع "${personEvents[0].personName}" — ${confirmed.length} من ${personEvents.length} مرة اتأكدت. ده يستاهل انتباه.`;
    } else if (dominantPhenomenon === "frequency_illusion") {
      insight = `بتفكر في "${personEvents[0].personName}" كتير — بس أغلب المرات ما اتأكدتش. ده ممكن يكون وهم التكرار.`;
    } else {
      insight = `${personEvents.length} حدث اتصال مع "${personEvents[0].personName}" — ${confirmed.length} منهم اتأكد. تابع وسجّل.`;
    }

    patterns.push({
      personId,
      personName: personEvents[0].personName || "غير معروف",
      eventCount: personEvents.length,
      confirmedCount: confirmed.length,
      confirmationRate: Math.round(confirmationRate),
      dominantPhenomenon,
      peakHours,
      avgEnergyDuringEvents: avgEnergy >= 0 ? Math.round(avgEnergy * 10) / 10 : -1,
      insight,
    });
  }

  return patterns.sort((a, b) => b.eventCount - a.eventCount);
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 بناء بلوك التحليل للـ AI
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يبني prompt context للـ AI عشان يحلل أنماط الاتصال.
 */
export function buildConnectionAnalysisPrompt(
  patterns: ConnectionPattern[],
  events: ConnectionEvent[]
): string {
  if (patterns.length === 0) return "";

  const lines: string[] = [
    "**سياق: أنماط الاتصال غير المادي المرصودة:**",
    "",
  ];

  for (const pattern of patterns) {
    lines.push(`- "${pattern.personName}": ${pattern.eventCount} حدث`);
    lines.push(`  الظاهرة الغالبة: ${pattern.dominantPhenomenon}`);
    lines.push(`  نسبة التأكيد: ${pattern.confirmationRate}%`);
    if (pattern.avgEnergyDuringEvents >= 0) {
      lines.push(`  متوسط الطاقة وقت الأحداث: ${pattern.avgEnergyDuringEvents}/10`);
    }
    lines.push(`  أوقات الذروة: ${pattern.peakHours.map(h => `${h}:00`).join("، ")}`);
    lines.push("");
  }

  lines.push("**قواعد التحليل (إلزامية):**");
  lines.push("- لا تُثبت 'التخاطر' كحقيقة — قول 'نمط ملفت'");
  lines.push("- لا تُنكر تجربة المستخدم — قول 'إحساسك حقيقي'");
  lines.push("- فرّق بين: وهم التكرار (عقلك بيلاحظ التطابقات) و حدس حقيقي (جسمك بيقرأ إشارات)");
  lines.push("- استخدم لغة عامية مصرية بسيطة");
  lines.push("- اربط بالعلم + النص القرآني لو مناسب");
  lines.push("- الموقف: 'الحقيقة أكبر من العلم والجهل معاً'");

  return lines.join("\n");
}
