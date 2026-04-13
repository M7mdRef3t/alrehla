/**
 * Dynamic Plan Generator — Bridge to @alrehla/masarat SDK
 * ═══════════════════════════════════════════════
 * Re-exports pure plan generation from SDK.
 * Platform consumers continue to import from this path.
 *
 * NOTE: DetectedPattern/PatternType also exist in ./patternAnalyzer.
 * The SDK types are duck-compatible. This file re-exports from SDK
 * for new consumers, while patternAnalyzer remains for backward compat.
 */

// Re-export types from SDK
export type {
  DynamicAction,
  DynamicStep,
  DynamicRecoveryPlan,
  PatternType,
  DetectedPattern,
  SymptomExercise,
} from "@alrehla/masarat";

// Re-export plan generators from SDK
export {
  generateDynamicPlan,
  generateBasicPlan,
} from "@alrehla/masarat";
