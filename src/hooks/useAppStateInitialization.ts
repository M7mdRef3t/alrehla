import { useMemo, useEffect } from "react";
import { useAdminState } from "../state/adminState";
import { useAuthState, getEffectiveRoleFromState } from "../state/authState";
import { getEffectiveFeatureAccess, isPrivilegedRole } from "../utils/featureFlags";
import { isUserMode } from "../config/appEnv";
import { runtimeEnv } from "../config/runtimeEnv";
import { fetchAdminConfig } from "../services/adminApi";

const hasSupabaseEnv = Boolean(runtimeEnv.supabaseUrl && runtimeEnv.supabaseAnonKey);

/**
 * Hook to manage app-level state initialization and feature access
 * Handles auth, role-based access, and feature flags
 */
export function useAppStateInitialization() {
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const setFeatureFlags = useAdminState((s) => s.setFeatureFlags);
  const setSystemPrompt = useAdminState((s) => s.setSystemPrompt);
  const setScoringWeights = useAdminState((s) => s.setScoringWeights);
  const setScoringThresholds = useAdminState((s) => s.setScoringThresholds);
  const setPulseCopyOverrides = useAdminState((s) => s.setPulseCopyOverrides);

  const authStatus = useAuthState((s) => s.status);
  const authUser = useAuthState((s) => s.user);
  const role = useAuthState(getEffectiveRoleFromState);

  const isPrivilegedUser = useMemo(() => isPrivilegedRole(role), [role]);
  const showTopToolsButton = isPrivilegedUser;

  const availableFeatures = useMemo(
    () =>
      getEffectiveFeatureAccess({
        featureFlags,
        betaAccess,
        role,
        adminAccess,
        isDev: !isUserMode && runtimeEnv.isDev
      }),
    [featureFlags, betaAccess, role, adminAccess]
  );

  const canUseMap = availableFeatures.dawayir_map;
  const canUseJourneyTools = availableFeatures.journey_tools;
  const canUseAIField = availableFeatures.ai_field;
  const canShowAIChatbot = canUseAIField && isPrivilegedUser;
  const canUsePulseCheck = availableFeatures.pulse_check;
  const shouldGateStartWithAuth = hasSupabaseEnv && !authUser && !isPrivilegedUser;

  // Load admin config on mount
  useEffect(() => {
    if (!hasSupabaseEnv) return;
    let cancelled = false;
    fetchAdminConfig()
      .then((config) => {
        if (!config || cancelled) return;
        if (config.featureFlags) setFeatureFlags(config.featureFlags);
        if (config.systemPrompt) setSystemPrompt(config.systemPrompt);
        if (config.scoringWeights) setScoringWeights(config.scoringWeights);
        if (config.scoringThresholds) setScoringThresholds(config.scoringThresholds);
        if (config.pulseCopyOverrides) {
          setPulseCopyOverrides({
            energy: config.pulseCopyOverrides.energy ?? "auto",
            mood: config.pulseCopyOverrides.mood ?? "auto",
            focus: config.pulseCopyOverrides.focus ?? "auto"
          });
        }
      })
      .catch(() => {
        // ignore remote errors, fallback to local
      });
    return () => {
      cancelled = true;
    };
  }, [setFeatureFlags, setSystemPrompt, setScoringWeights, setScoringThresholds, setPulseCopyOverrides]);

  return {
    authStatus,
    authUser,
    role,
    isPrivilegedUser,
    showTopToolsButton,
    availableFeatures,
    canUseMap,
    canUseJourneyTools,
    canUseAIField,
    canShowAIChatbot,
    canUsePulseCheck,
    shouldGateStartWithAuth
  };
}
