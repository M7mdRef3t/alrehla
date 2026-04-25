import { useAuthState, getEffectiveRoleFromState } from "@/domains/auth/store/auth.store";
import { isPrivilegedRole } from "@/utils/featureFlags";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { trackingService } from "@/domains/journey";
import { useCallback } from "react";

export function useAccessState() {
  const authStatus = useAuthState((s) => s.status);
  const authUser = useAuthState((s) => s.user);
  const tier = useAuthState((s) => s.tier);
  const rawRole = useAuthState((s) => s.role);
  const role = useAuthState(getEffectiveRoleFromState);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const setAppOverlay = useAppOverlayState((s) => s.setOverlay);

  const isPrivilegedUser = isPrivilegedRole(rawRole) || isPrivilegedRole(role) || adminAccess;

  const canSaveMap = Boolean(authUser);
  const canUseGuided = isPrivilegedUser || tier !== "free";
  const canUseAdvancedAnalysis = isPrivilegedUser || tier !== "free";
  const canExportReport = isPrivilegedUser || tier !== "free";

  const triggerPaywall = useCallback((featureName: string) => {
    trackingService.recordFlow("paid_feature_clicked", { meta: { feature: featureName } });
    setAppOverlay("premiumBridge", true);
    trackingService.recordFlow("premium_bridge_viewed", { meta: { source: featureName } });
  }, [setAppOverlay]);

  return {
    authStatus,
    authUser,
    tier,
    isPrivilegedUser,
    canSaveMap,
    canUseGuided,
    canUseAdvancedAnalysis,
    canExportReport,
    triggerPaywall
  };
}
