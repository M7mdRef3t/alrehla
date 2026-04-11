/**
 * Domain: Sessions — Public API
 * 
 * هذا الملف هو النقطة الوحيدة التي تستورد منها الـ domains الأخرى.
 * أي شيء غير مُصدَّر هنا يعتبر internal implementation detail.
 */

// Types
export type {
  IntakeStep,
  IntakeFormData,
  SessionRequest,
  SessionRequestStatus,
  SessionBriefInput,
  AIExtractedBrief,
  SessionClient,
  TriageResult,
} from "./types";

// Constants
export {
  SESSION_GOAL_OPTIONS,
  AGE_RANGES,
  PREVIOUS_SESSION_OPTIONS,
  INTAKE_STEP_ORDER,
  INITIAL_INTAKE_FORM,
} from "./constants";

// Hooks (client-side)
export { useSessionIntake } from "./hooks/useSessionIntake";

// Services (server-side — re-exported for API routes)
export { extractAiSessionBrief } from "./services/brief.service";
export { processIntake } from "./services/intake.service";
export type { IntakeResult } from "./services/intake.service";
