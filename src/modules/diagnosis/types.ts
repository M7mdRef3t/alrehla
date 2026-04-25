/**
 * Diagnosis Engine — Core Types
 * ══════════════════════════════════════════════════
 * UserStateObject: نتيجة التشخيص الأولي
 * يُربط مباشرةً بـ JourneyPhaseV1 الموجودة في recommendation/types.ts
 */

import type { JourneyPhaseV1 } from "../recommendation/types";

// ── الحالة العاطفية للمستخدم ──
export type UserStateType =
  | "overwhelmed"  // مضغوط / غارق
  | "stuck"        // واقف مكانه
  | "lost"         // تايه / مش عارف من فين يبدأ
  | "anxious"      // قلقان / مشدود
  | "ready"        // مستعد للتغيير
  | "ununderstood"; // محدش فاهمني / الإحساس أعمق من الاختيارات

// ── مصدر الألم الأساسي ──
export type MainPain =
  | "relationship" // علاقات
  | "work"         // شغل / إنجاز
  | "self"         // الذات / نفسي
  | "family";      // عيلة

// ── مستوى الاستعداد للتغيير ──
export type ReadinessLevel = "low" | "medium" | "high";

// ── المنتج الموصّى به ──
export type RecommendedProduct = "dawayir" | "masarat" | "session" | "atmosfera";

// ── الـ UserStateObject الكامل ──
export interface UserStateObject {
  type: UserStateType;
  mainPain: MainPain;
  readiness: ReadinessLevel;
  journeyPhase: JourneyPhaseV1;         // تُمرَّر لـ decisionEngine/policyEngine
  recommendedProduct: RecommendedProduct;
  diagnosisScore: number;               // 0–100 — للعرض البصري
  completedAt: number;                  // timestamp
}

// ── إجابات الأسئلة الخمسة ──
export interface DiagnosisAnswers {
  q1_pain?: MainPain;                   // إيه اللي شايلك؟
  q2_feeling?: UserStateType;           // إيه الإحساس الأكتر؟
  q3_duration?: "just_now" | "weeks" | "months"; // من امتى؟
  q4_blocker?: "dont_know" | "afraid" | "not_ready" | "not_sure"; // إيه اللي بيوقفك؟
  q5_goal?: MainPain;                   // لو هتختار هدف واحد؟
}

// ── localStorage keys ──
export const DIAGNOSIS_STATE_KEY = "dawayir-diagnosis-state-v1";
export const DIAGNOSIS_DONE_KEY = "dawayir-diagnosis-done-v1";

// ── Helpers ──
export function hasDiagnosisCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DIAGNOSIS_DONE_KEY) === "true";
}

export function saveDiagnosisState(state: UserStateObject): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DIAGNOSIS_STATE_KEY, JSON.stringify(state));
  localStorage.setItem(DIAGNOSIS_DONE_KEY, "true");
}

export function loadDiagnosisState(): UserStateObject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DIAGNOSIS_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserStateObject;
  } catch {
    return null;
  }
}

export function resetDiagnosisState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DIAGNOSIS_STATE_KEY);
  localStorage.removeItem(DIAGNOSIS_DONE_KEY);
}
