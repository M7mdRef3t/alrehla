/**
 * 🔬 Reality Feedback Engine — حلقة التحقق من الواقع
 * =====================================================
 * "مش إحنا هنقيّم — أنت هتقيّم، وإحنا هنقارن كلامك النهارده بكلامك إمبارح"
 *
 * ثلاث طبقات للقياس:
 * ─────────────────────
 * 1. Before/After Pulse: سؤال واحد قبل وبعد المهمة → مؤشر الأثر
 * 2. Reality Check-In: بعد 7 أيام من إكمال المهمة → تأكيد التغيير
 * 3. Orbit Drift Detection: مقارنة الدائرة قبل وبعد المهمة → رصد الجمود
 */

import type { Ring } from "@/modules/map/mapTypes";

// ─── Types ────────────────────────────────

export type RealityCheckAnswer = "yes_real_change" | "started_not_clear" | "no_change" | "got_worse";

export interface BeforeAfterPulse {
  /** ID الشخص المرتبط */
  nodeId: string;
  nodeLabel: string;
  /** مستوى الضغط قبل المهمة (1-10) */
  stressBefore: number;
  /** مستوى الضغط بعد المهمة (1-10) — يُملأ لاحقاً */
  stressAfter: number | null;
  /** الدائرة وقت بدء المهمة */
  ringBefore: Ring;
  /** الدائرة الحالية وقت التقييم — يُملأ لاحقاً */
  ringAfter: Ring | null;
  /** تاريخ تسجيل "القبل" */
  recordedAt: number;
  /** تاريخ تسجيل "البعد" — يُملأ لاحقاً */
  evaluatedAt: number | null;
  /** تاريخ تذكير التقييم */
  evaluateAt: number;
}

export interface RealityCheckIn {
  nodeId: string;
  nodeLabel: string;
  /** إجابة المستخدم */
  answer: RealityCheckAnswer;
  /** ملاحظة حرة */
  freeText: string;
  /** تاريخ التقييم */
  timestamp: number;
  /** الفرق بين القبل والبعد */
  impactDelta: number | null;
}

export interface RealityFeedbackRecord {
  id: string;
  nodeId: string;
  nodeLabel: string;
  pulse: BeforeAfterPulse;
  checkIn: RealityCheckIn | null;
  /** مؤشر الأثر النهائي — -10 إلى +10 */
  impactScore: number | null;
  /** هل تم رصد جمود مداري (الشخص لسه في نفس الدائرة) */
  orbitStagnation: boolean;
  /** حالة الـ record */
  status: "awaiting_after" | "awaiting_checkin" | "completed" | "expired";
}

export interface RealityFeedbackStats {
  totalRecords: number;
  completedRecords: number;
  /** متوسط مؤشر الأثر */
  avgImpactScore: number;
  /** نسبة المستخدمين اللي قالوا "لمست فرق حقيقي" */
  realChangeRate: number;
  /** نسبة المهام اللي فشلت (لا تغيير + جمود مداري) */
  stagnationRate: number;
  /** أفضل بصيرة */
  insight: string;
}

// ─── Storage ────────────────────────────────

const STORAGE_KEY = "dawayir-reality-feedback";
const DAY_MS = 24 * 60 * 60 * 1000;

function loadRecords(): RealityFeedbackRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: RealityFeedbackRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 200)));
  } catch { /* noop */ }
}

// ─── Public API ────────────────────────────────

/**
 * تسجيل "القبل" — يُستدعى عند بدء المهمة
 */
export function recordBeforePulse(params: {
  nodeId: string;
  nodeLabel: string;
  stressBefore: number;
  currentRing: Ring;
  evaluateAfterDays?: number;
}): RealityFeedbackRecord {
  const now = Date.now();
  const record: RealityFeedbackRecord = {
    id: `rfb-${now}-${Math.random().toString(36).slice(2, 8)}`,
    nodeId: params.nodeId,
    nodeLabel: params.nodeLabel,
    pulse: {
      nodeId: params.nodeId,
      nodeLabel: params.nodeLabel,
      stressBefore: params.stressBefore,
      stressAfter: null,
      ringBefore: params.currentRing,
      ringAfter: null,
      recordedAt: now,
      evaluatedAt: null,
      evaluateAt: now + (params.evaluateAfterDays ?? 7) * DAY_MS,
    },
    checkIn: null,
    impactScore: null,
    orbitStagnation: false,
    status: "awaiting_after",
  };

  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);

  return record;
}

/**
 * تسجيل "البعد" — يُستدعى بعد مرور الفترة المحددة
 */
export function recordAfterPulse(
  recordId: string,
  stressAfter: number,
  currentRing: Ring
): RealityFeedbackRecord | null {
  const records = loadRecords();
  const idx = records.findIndex((r) => r.id === recordId);
  if (idx === -1) return null;

  const record = records[idx];
  record.pulse.stressAfter = stressAfter;
  record.pulse.ringAfter = currentRing;
  record.pulse.evaluatedAt = Date.now();

  // حساب مؤشر الأثر: تحسن في الضغط = إيجابي
  const stressDelta = record.pulse.stressBefore - stressAfter; // إيجابي = تحسن
  record.impactScore = stressDelta;

  // رصد الجمود المداري
  record.orbitStagnation = record.pulse.ringBefore === currentRing;

  record.status = "awaiting_checkin";

  saveRecords(records);
  return record;
}

/**
 * تسجيل Reality Check-In — تأكيد التغيير الفعلي
 */
export function recordRealityCheckIn(
  recordId: string,
  answer: RealityCheckAnswer,
  freeText: string = ""
): RealityFeedbackRecord | null {
  const records = loadRecords();
  const idx = records.findIndex((r) => r.id === recordId);
  if (idx === -1) return null;

  const record = records[idx];
  record.checkIn = {
    nodeId: record.nodeId,
    nodeLabel: record.nodeLabel,
    answer,
    freeText,
    timestamp: Date.now(),
    impactDelta: record.impactScore,
  };

  record.status = "completed";

  // تعديل مؤشر الأثر بناءً على إجابة المستخدم
  if (record.impactScore !== null) {
    const answerWeight: Record<RealityCheckAnswer, number> = {
      yes_real_change: 1.5,
      started_not_clear: 1.0,
      no_change: 0.3,
      got_worse: -0.5,
    };
    record.impactScore = Math.round(record.impactScore * answerWeight[answer]);
  }

  saveRecords(records);
  return record;
}

/**
 * جلب السجلات المعلقة التي حان وقت تقييمها (After Pulse)
 */
export function getPendingAfterPulse(): RealityFeedbackRecord[] {
  const records = loadRecords();
  const now = Date.now();

  return records.filter(
    (r) => r.status === "awaiting_after" && now >= r.pulse.evaluateAt
  );
}

/**
 * جلب السجلات المعلقة التي تحتاج Reality Check-In
 */
export function getPendingCheckIns(): RealityFeedbackRecord[] {
  const records = loadRecords();
  return records.filter((r) => r.status === "awaiting_checkin");
}

/**
 * جلب كل السجلات
 */
export function getAllFeedbackRecords(): RealityFeedbackRecord[] {
  return loadRecords();
}

/**
 * جلب السجل المرتبط بشخص معين (أحدث واحد)
 */
export function getLatestFeedbackForNode(nodeId: string): RealityFeedbackRecord | null {
  const records = loadRecords();
  return records.find((r) => r.nodeId === nodeId) ?? null;
}

/**
 * حساب الإحصائيات الكلية
 */
export function getRealityFeedbackStats(): RealityFeedbackStats {
  const records = loadRecords();
  const completed = records.filter((r) => r.status === "completed");

  const totalRecords = records.length;
  const completedRecords = completed.length;

  // متوسط مؤشر الأثر
  const impactScores = completed
    .map((r) => r.impactScore)
    .filter((s): s is number => s !== null);
  const avgImpactScore =
    impactScores.length > 0
      ? Math.round(
          (impactScores.reduce((a, b) => a + b, 0) / impactScores.length) * 10
        ) / 10
      : 0;

  // نسبة التغيير الحقيقي
  const realChangeCount = completed.filter(
    (r) => r.checkIn?.answer === "yes_real_change"
  ).length;
  const realChangeRate =
    completedRecords > 0
      ? Math.round((realChangeCount / completedRecords) * 100)
      : 0;

  // نسبة الجمود المداري
  const stagnationCount = completed.filter((r) => r.orbitStagnation).length;
  const stagnationRate =
    completedRecords > 0
      ? Math.round((stagnationCount / completedRecords) * 100)
      : 0;

  // بصيرة
  let insight: string;
  if (completedRecords < 3) {
    insight =
      "محتاج ٣ مهام مكتملة على الأقل عشان نقدر نقيس الأثر الحقيقي على حياتك.";
  } else if (realChangeRate > 60 && avgImpactScore > 2) {
    insight =
      "المسارات بتحقق نتائج حقيقية — أنت بتتحرك فعلاً مش بس بتقرأ. كمّل.";
  } else if (realChangeRate > 30) {
    insight =
      "بعض المسارات بتشتغل وبعضها لأ. ركّز على اللي لمست فيه فرق وكرّر نمطه.";
  } else if (stagnationRate > 60) {
    insight =
      "فيه جمود: المهام بتخلص لكن العلاقات مش بتتحسن. محتاج نعيد التفكير في الأسلوب.";
  } else {
    insight =
      "النتائج لسه مش واضحة — جرّب تنفّذ الخطوات فعلاً مش بس تعلّمها ✓. التغيير بيحصل بره التطبيق.";
  }

  return {
    totalRecords,
    completedRecords,
    avgImpactScore,
    realChangeRate,
    stagnationRate,
    insight,
  };
}

/**
 * Mark expired records (> 30 days without evaluation)
 */
export function markExpiredFeedback(): number {
  const records = loadRecords();
  const now = Date.now();
  let expiredCount = 0;

  records.forEach((r) => {
    if (
      r.status !== "completed" &&
      r.status !== "expired" &&
      now - r.pulse.recordedAt > 30 * DAY_MS
    ) {
      r.status = "expired";
      expiredCount++;
    }
  });

  if (expiredCount > 0) saveRecords(records);
  return expiredCount;
}

/**
 * Detect orbit stagnation for a specific node
 * Call after a mission is marked complete
 */
export function detectOrbitStagnation(
  nodeId: string,
  currentRing: Ring
): { isStagnant: boolean; record: RealityFeedbackRecord | null } {
  const records = loadRecords();
  const record = records.find(
    (r) => r.nodeId === nodeId && r.status !== "expired"
  );

  if (!record) return { isStagnant: false, record: null };

  const isStagnant = record.pulse.ringBefore === currentRing;
  record.orbitStagnation = isStagnant;
  saveRecords(records);

  return { isStagnant, record };
}
