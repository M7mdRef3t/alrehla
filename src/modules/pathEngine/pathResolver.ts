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
} from "@alrehla/masarat";

export type { ResolvePathInput } from "@alrehla/masarat";
