/**
 * Diagnosis Engine — محرك التشخيص
 * ══════════════════════════════════════════════════
 * يحوّل إجابات الـ 5 أسئلة → UserStateObject كامل
 * ويربط النتيجة مباشرة بـ JourneyPhaseV1 للـ decisionEngine
 */

import type {
  DiagnosisAnswers,
  UserStateObject,
  UserStateType,
  MainPain,
  ReadinessLevel,
  RecommendedProduct,
} from "./types";
import type { JourneyPhaseV1 } from "../recommendation/types";

// ════════════════════════════════════════════════
// Phase Mapping
// ════════════════════════════════════════════════

function deriveJourneyPhase(
  answers: DiagnosisAnswers
): JourneyPhaseV1 {
  const { q2_feeling, q3_duration, q4_blocker } = answers;

  // تايه تماماً → lost
  if (q2_feeling === "lost") return "lost";

  // مضغوط + مش عارف يبدأ → resistance
  if (q2_feeling === "overwhelmed" && q4_blocker === "dont_know") return "resistance";

  // قلقان + خايف → resistance
  if (q2_feeling === "anxious" && q4_blocker === "afraid") return "resistance";

  // واقف مكانه + بيفكر من فترة → awareness
  if (q2_feeling === "stuck" && q3_duration === "months") return "awareness";

  // مستعد + بيفكر يبدأ → acceptance
  if (q2_feeling === "ready") return "acceptance";

  // مضغوط + من فترة قصيرة → mapping
  if (q2_feeling === "overwhelmed" && q3_duration === "just_now") return "mapping";

  // default → mapping
  return "mapping";
}

// ════════════════════════════════════════════════
// State Type Derivation
// ════════════════════════════════════════════════

function deriveStateType(answers: DiagnosisAnswers): UserStateType {
  return answers.q2_feeling ?? "stuck";
}

// ════════════════════════════════════════════════
// Main Pain Derivation
// ════════════════════════════════════════════════

function deriveMainPain(answers: DiagnosisAnswers): MainPain {
  // q5 (long-term goal) has priority over q1 (immediate pain)
  return answers.q5_goal ?? answers.q1_pain ?? "self";
}

// ════════════════════════════════════════════════
// Readiness Level
// ════════════════════════════════════════════════

function deriveReadiness(answers: DiagnosisAnswers): ReadinessLevel {
  const { q3_duration, q4_blocker, q2_feeling } = answers;

  if (q2_feeling === "ready" && q4_blocker === "not_sure") return "medium";
  if (q2_feeling === "ready") return "high";
  if (q3_duration === "just_now" || q4_blocker === "dont_know") return "low";
  if (q3_duration === "months" && q4_blocker !== "afraid") return "high";
  return "medium";
}

// ════════════════════════════════════════════════
// Product Recommendation Routing Table
// ════════════════════════════════════════════════
// الجدول ده هو قلب الـ Layer 2 (Routing System)
//
// | الحالة                  | يروح فين     |
// |------------------------|-------------|
// | تايه / مش فاهم          | dawayir      |
// | فاهم بس مش بيتحرك       | masarat      |
// | محتاج تدخل قوي / جاهز  | session      |
// | مضغوط / مشدود           | atmosfera    |

function deriveRecommendedProduct(
  phase: JourneyPhaseV1,
  type: UserStateType,
  pain: MainPain,
  readiness: ReadinessLevel
): RecommendedProduct {
  // مضغوط جداً → هدّيه أول (أتموسفيرا)
  if (type === "overwhelmed" && readiness === "low") return "atmosfera";

  // تايه → يشوف الخريطة أول (دواير)
  if (type === "lost" || phase === "lost" || phase === "mapping") return "dawayir";

  // awareness phase + علاقات → دواير
  if (phase === "awareness" && pain === "relationship") return "dawayir";
  if (phase === "awareness" && pain === "family") return "dawayir";

  // جاهز عالي + شغل/ذات → مسارات
  if (readiness === "high" && (pain === "work" || pain === "self")) return "masarat";

  // resistance + جاهز متوسط → مسارات
  if (phase === "resistance" && readiness === "medium") return "masarat";

  // acceptance/integration → يوصلوا لجلسة
  if (phase === "acceptance" || phase === "integration") return "session";

  // مضغوط عالي → مسارات (لأنه عنده طاقة يتحرك)
  if (type === "overwhelmed" && readiness === "high") return "masarat";

  // fallback → دواير (Entry point آمن دايماً)
  return "dawayir";
}

// ════════════════════════════════════════════════
// Diagnosis Score (0–100 للعرض البصري)
// ════════════════════════════════════════════════

function calculateDiagnosisScore(
  type: UserStateType,
  readiness: ReadinessLevel,
  pain: MainPain
): number {
  let score = 50;

  // حالة المستخدم
  const typeScores: Record<UserStateType, number> = {
    overwhelmed: -20,
    anxious: -15,
    lost: -10,
    stuck: -5,
    ready: +20,
  };
  score += typeScores[type] ?? 0;

  // مستوى الاستعداد
  const readinessScores: Record<ReadinessLevel, number> = {
    low: -15,
    medium: 0,
    high: +20,
  };
  score += readinessScores[readiness] ?? 0;

  // مصدر الألم (بعض المصادر أصعب)
  if (pain === "family") score -= 5;
  if (pain === "relationship") score -= 5;

  return Math.max(10, Math.min(90, Math.round(score)));
}

// ════════════════════════════════════════════════
// Main Compute Function
// ════════════════════════════════════════════════

export function computeDiagnosis(answers: DiagnosisAnswers): UserStateObject {
  const type: UserStateType = deriveStateType(answers);
  const mainPain: MainPain = deriveMainPain(answers);
  const readiness: ReadinessLevel = deriveReadiness(answers);
  const journeyPhase: JourneyPhaseV1 = deriveJourneyPhase(answers);
  const recommendedProduct: RecommendedProduct = deriveRecommendedProduct(
    journeyPhase,
    type,
    mainPain,
    readiness
  );
  const diagnosisScore = calculateDiagnosisScore(type, readiness, mainPain);

  return {
    type,
    mainPain,
    readiness,
    journeyPhase,
    recommendedProduct,
    diagnosisScore,
    completedAt: Date.now(),
  };
}

// ════════════════════════════════════════════════
// Human-readable Labels (عربي)
// ════════════════════════════════════════════════

export const USER_STATE_LABELS: Record<string, string> = {
  overwhelmed: "مضغوط ومشغول الدنيا",
  stuck: "واقف بس مش مطلّع",
  lost: "تايه ومش عارف من فين تبدأ",
  anxious: "قلقان ومشدود",
  ready: "جاهز وعايز تتحرك",
};

export const MAIN_PAIN_LABELS: Record<string, string> = {
  relationship: "علاقاتي مع الناس",
  work: "الشغل والإنجاز",
  self: "علاقتي بنفسي",
  family: "عيلتي",
};

export const RECOMMENDED_PRODUCT_LABELS: Record<string, { name: string; desc: string; emoji: string; color: string }> = {
  dawayir: {
    name: "دواير",
    desc: "ارسم خريطة علاقاتك واشوف مين بيديك ومين بياخد منك",
    emoji: "⭕",
    color: "#2dd4bf",
  },
  masarat: {
    name: "مسارات",
    desc: "خطة واضحة تاخدك من مكانك ده للي عايز توصله",
    emoji: "🗺️",
    color: "#8b5cf6",
  },
  session: {
    name: "جلسة",
    desc: "تدخل مباشر معاك — أعمق من أي أداة",
    emoji: "🎙️",
    color: "#f59e0b",
  },
  atmosfera: {
    name: "أتموسفيرا",
    desc: "اوعاك تتخد قرار وانت متعب — هدّي الدنيا الأول",
    emoji: "🌊",
    color: "#06b6d4",
  },
};
