/**
 * مُحلّل المسار — Bridge to @alrehla/masarat SDK
 * ═══════════════════════════════════════════════
 * Re-exports path resolution logic from the SDK.
 * Platform consumers continue to import from this path.
 */

export {
  resolvePathId,
  symptomIdsToSymptomType,
  PATH_NAMES,
  PATH_DESCRIPTIONS,
  SYMPTOM_TYPE_LABELS,
  ROLE_LABELS,
  generateDynamicPlan,
  generateBasicPlan,
} from "@alrehla/masarat";

export type { ResolvePathInput } from "@alrehla/masarat";

// PATTERN_TYPE_LABELS is not exported by the SDK yet — local fallback
export const PATTERN_TYPE_LABELS: Record<string, string> = {
  drain: "استنزاف",
  guilt: "ذنب وتبرير",
  fear: "قلق وتجنب",
  anger: "غضب مكبوت",
  enmeshment: "تشابك حدود",
  default: "نمط سلوكي",
};
