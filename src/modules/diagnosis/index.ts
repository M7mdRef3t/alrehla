/**
 * Diagnosis Module — Public API
 */

export { DiagnosisScreen } from "./DiagnosisScreen";
export { computeDiagnosis, USER_STATE_LABELS, MAIN_PAIN_LABELS, RECOMMENDED_PRODUCT_LABELS } from "./diagnosisEngine";
export {
  hasDiagnosisCompleted,
  saveDiagnosisState,
  loadDiagnosisState,
  resetDiagnosisState,
  DIAGNOSIS_STATE_KEY,
  DIAGNOSIS_DONE_KEY,
} from "./types";
export type { UserStateObject, DiagnosisAnswers, RecommendedProduct, UserStateType, MainPain, ReadinessLevel } from "./types";
