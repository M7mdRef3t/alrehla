import {
  DEFAULT_FEATURE_FLAGS,
  REVENUE_FIRST_FEATURES,
  type FeatureFlagKey,
  type FeatureFlagMode
} from "../config/features";
import { isRevenueMode } from "../config/appEnv";

const PRIVILEGED_ROLES = new Set(["admin", "owner", "superadmin", "developer"]);

export interface FeatureAccessContext {
  featureFlags: Record<FeatureFlagKey, FeatureFlagMode>;
  betaAccess: boolean;
  role?: string | null;
  adminAccess?: boolean;
  isDev?: boolean;
}

export function isFeatureEnabled(mode: FeatureFlagMode | undefined, isBetaUser: boolean): boolean {
  if (mode === "on") return true;
  if (mode === "beta") return isBetaUser;
  return false;
}

export function isPrivilegedRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return PRIVILEGED_ROLES.has(role.trim().toLowerCase());
}

export function isGodModeEnabled(context: FeatureAccessContext): boolean {
  if (isPrivilegedRole(context.role)) return true;
  return Boolean(context.isDev && context.adminAccess);
}

export function getEffectiveFeatureAccess(
  context: FeatureAccessContext
): Record<FeatureFlagKey, boolean> {
  const godMode = isGodModeEnabled(context);
  const keys = Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlagKey[];
  const result = {} as Record<FeatureFlagKey, boolean>;

  for (const key of keys) {
    // لو إحنا في Revenue Mode والـ Feature مش من القائمة الأساسية، اقفلها للمستخدمين العاديين
    const isRestrictedByRevenueMode =
      isRevenueMode && !godMode && !REVENUE_FIRST_FEATURES.includes(key);

    if (isRestrictedByRevenueMode) {
      result[key] = false;
      continue;
    }

    const mode = context.featureFlags[key] ?? DEFAULT_FEATURE_FLAGS[key];
    result[key] = godMode
      ? true
      : isFeatureEnabled(mode, context.betaAccess);
  }
  return result;
}

export function normalizeFeatureMode(mode: FeatureFlagMode | undefined): FeatureFlagMode {
  if (mode === "on" || mode === "off" || mode === "beta") return mode;
  return "off";
}
