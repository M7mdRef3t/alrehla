/**
 * تذكيرات مخصصة حسب تقدم المستخدم — تقرأ من الخريطة والرحلة وتعيد عنوان ونص مناسب
 */
import type { MapNode } from "../modules/map/mapTypes";
import { loadStoredState } from "./localStore";

export interface ProgressSnapshot {
  nodesCount: number;
  situationsCount: number;
  hasViewedPlan: boolean;
  hasCompletedTraining: boolean;
}

function countSituations(nodes: MapNode[]): number {
  let total = 0;
  for (const node of nodes) {
    const inputs = node.firstStepProgress?.stepInputs;
    if (!inputs) continue;
    for (const arr of Object.values(inputs)) {
      total += (arr || []).filter((s) => s?.trim()).length;
    }
  }
  return total;
}

export async function getProgressSnapshot(): Promise<ProgressSnapshot> {
  const stored = await loadStoredState();
  const nodes = stored?.nodes ?? [];
  const situationsCount = countSituations(nodes);
  const hasViewedPlan = nodes.some((n) => n.lastViewedStep === "recoveryPlan");
  const hasCompletedTraining = nodes.some((n) => n.hasCompletedTraining === true);
  return {
    nodesCount: nodes.length,
    situationsCount,
    hasViewedPlan,
    hasCompletedTraining
  };
}

export interface SmartReminderContent {
  title: string;
  body: string;
}

/**
 * يختار تذكيرًا يوميًا مخصصًا حسب التقدم
 */
export async function getSmartDailyReminder(): Promise<SmartReminderContent> {
  const p = await getProgressSnapshot();

  if (p.nodesCount === 0) {
    return {
      title: "وقت تبدأ خريطتك 💚",
      body: "ضيف أول شخص وابدأ ترسم حدودك. إزاي حاسس النهاردة؟"
    };
  }

  if (p.situationsCount === 1) {
    return {
      title: "موقف واحد وخلاص! ✍️",
      body: "موقف تاني وتفتح الخطة المخصصة. خُد دقيقة وكمل."
    };
  }

  if (p.situationsCount >= 2 && !p.hasViewedPlan) {
    return {
      title: "خطتك جاهزة 📋",
      body: "كتبت المواقف — دلوقتي افتح تبويب الخطة وشوف خطتك الأسبوعية."
    };
  }

  if (p.nodesCount >= 3 && !p.hasViewedPlan) {
    return {
      title: "راجع خريطتك 🗺️",
      body: "عندك أكتر من علاقة على الخريطة. اختار حد وراجع حالك معاه أو كمل خطته."
    };
  }

  if (p.nodesCount >= 1 && !p.hasCompletedTraining) {
    return {
      title: "تدرب على الحدود 🎯",
      body: "جرب تدريب مع شخص من علاقاتك — هيخليك واثق أكتر في وضع الحدود."
    };
  }

  return {
    title: "وقت فحص مشاعرك 💚",
    body: "خُد دقيقة وشوف خريطتك. إزاي حاسس النهاردة؟"
  };
}

/**
 * يختار تذكير عودة (بعد غياب) مخصصًا حسب التقدم
 */
export async function getSmartInactiveReminder(): Promise<SmartReminderContent> {
  const p = await getProgressSnapshot();

  if (p.nodesCount === 0) {
    return {
      title: "وحشتنا! 👋",
      body: "تعالى نبدأ — ضيف أول شخص على الخريطة وابدأ رحلة الحدود."
    };
  }

  if (p.situationsCount === 1) {
    return {
      title: "كمل من حيث وقفت 👋",
      body: "كان عندك موقف واحد مكتوب. موقف تاني وتفتح الخطة المخصصة — تعالى نكمّل."
    };
  }

  if (p.situationsCount >= 2 && !p.hasViewedPlan) {
    return {
      title: "خطتك مستنياك 📋",
      body: "كتبت المواقف من زمان. افتح التطبيق وشوف خطتك الأسبوعية من تبويب الخطة."
    };
  }

  if (p.nodesCount >= 3) {
    return {
      title: "وحشتنا! 👋",
      body: "خريطتك فيها علاقات كتير. تعالى راجع حد منهم أو كمل خطته."
    };
  }

  return {
    title: "وحشتنا! 👋",
    body: "محتاجين نشوف خريطتك. تعالى نكمّل رحلتك."
  };
}

