import type { FeatureFlagKey } from "../config/features";

export type OwnerActionKey =
  | "admin_dashboard"
  | "consciousness_archive"
  | "journey_guide_chat"
  | "journey_tools"
  | "journey_timeline"
  | "open_dawayir"
  | "quick_experience"
  | "start_journey"
  | "guided_journey"
  | "baseline_check"
  | "notifications"
  | "tracking_dashboard"
  | "atlas_dashboard"
  | "data_tools"
  | "share_stats"
  | "library"
  | "symptoms"
  | "recovery_plan"
  | "theme_settings"
  | "achievements"
  | "advanced_tools"
  | "classic_recovery"
  | "manual_placement"
  | "feedback_modal"
  | "install_app"
  | "noise_silencing"
  | "breathing_session"
  | "ambient_reality"
  | "wisdom_vault"
  | "enterprise_dashboard";

const PREVIEW_FEATURE_KEYS = new Set<FeatureFlagKey>([
  "dawayir_map",
  "journey_tools",
  "basic_diagnosis",
  "mirror_tool",
  "family_tree",
  "internal_boundaries",
  "generative_ui_mode",
  "global_atlas",
  "ai_field",
  "pulse_check",
  "language_switcher",
  "armory_section"
]);

const OWNER_ACTION_KEYS = new Set<OwnerActionKey>([
  "admin_dashboard",
  "consciousness_archive",
  "journey_guide_chat",
  "journey_tools",
  "journey_timeline",
  "open_dawayir",
  "quick_experience",
  "start_journey",
  "guided_journey",
  "baseline_check",
  "notifications",
  "tracking_dashboard",
  "atlas_dashboard",
  "data_tools",
  "share_stats",
  "library",
  "symptoms",
  "recovery_plan",
  "theme_settings",
  "achievements",
  "advanced_tools",
  "classic_recovery",
  "manual_placement",
  "feedback_modal",
  "install_app",
  "noise_silencing",
  "breathing_session",
  "ambient_reality",
  "wisdom_vault",
  "enterprise_dashboard"
]);

export function normalizePreviewFeature(value: string | null): FeatureFlagKey | null {
  if (!value) return null;
  const key = value.trim().toLowerCase() as FeatureFlagKey;
  return PREVIEW_FEATURE_KEYS.has(key) ? key : null;
}

export function normalizeOwnerAction(value: string | null): OwnerActionKey | null {
  if (!value) return null;
  const key = value.trim().toLowerCase() as OwnerActionKey;
  return OWNER_ACTION_KEYS.has(key) ? key : null;
}
