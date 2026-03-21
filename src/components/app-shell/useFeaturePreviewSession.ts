import { useCallback, useEffect, useState } from "react";
import type { FeatureFlagKey } from "../../config/features";
import type { AppScreen } from "../../navigation/navigationMachine";
import { normalizePreviewFeature } from "../../navigation/actionRoutingMachine";
import { createCurrentUrl, pushUrl, replaceUrl } from "../../services/navigation";
import { getWindowOrNull } from "../../services/clientRuntime";

type PulseCheckContext = "regular" | "start_recovery";

interface UseFeaturePreviewSessionParams {
  isAdminRoute: boolean;
  isOwnerWatcher: boolean;
  navigateToScreen: (screen: AppScreen) => boolean;
  openJourneyTools: () => void;
  skipNextPulseCheck: () => void;
  setPulseCheckContext: (context: PulseCheckContext) => void;
  setShowPulseCheck: (show: boolean) => void;
}

export function useFeaturePreviewSession({
  isAdminRoute,
  isOwnerWatcher,
  navigateToScreen,
  openJourneyTools,
  skipNextPulseCheck,
  setPulseCheckContext,
  setShowPulseCheck
}: UseFeaturePreviewSessionParams) {
  const [isFeaturePreviewSession, setIsFeaturePreviewSession] = useState(false);
  const [previewedFeature, setPreviewedFeature] = useState<FeatureFlagKey | null>(null);
  const [forcePulsePreviewOpen, setForcePulsePreviewOpen] = useState(() => {
    const currentUrl = createCurrentUrl();
    return normalizePreviewFeature(currentUrl?.searchParams.get("previewFeature") ?? null) === "pulse_check";
  });

  const goBackToFeatureFlags = useCallback(() => {
    const next = createCurrentUrl();
    if (!next) return;
    next.pathname = "/admin";
    next.search = "";
    next.searchParams.set("tab", "feature-flags");
    pushUrl(next);
    setIsFeaturePreviewSession(false);
    setPreviewedFeature(null);
    setForcePulsePreviewOpen(false);
  }, []);

  const clearPulseCheckPreview = useCallback(() => {
    setPreviewedFeature((prev) => (prev === "pulse_check" ? null : prev));
    setForcePulsePreviewOpen(false);
  }, []);

  useEffect(() => {
    if (isAdminRoute) return;
    const currentUrl = createCurrentUrl();
    if (!currentUrl) return;
    const previewFeature = normalizePreviewFeature(currentUrl.searchParams.get("previewFeature"));
    if (!previewFeature) return;

    setIsFeaturePreviewSession(true);
    setPreviewedFeature(previewFeature);

    const clearPreviewParam = () => {
      const next = createCurrentUrl();
      if (!next) return;
      next.searchParams.delete("previewFeature");
      replaceUrl(next);
    };

    if (previewFeature === "journey_tools") {
      skipNextPulseCheck();
      openJourneyTools();
      clearPreviewParam();
      return;
    }

    if (previewFeature === "pulse_check") {
      skipNextPulseCheck();
      setForcePulsePreviewOpen(true);
      void navigateToScreen("landing");
      clearPreviewParam();
      const windowRef = getWindowOrNull();
      if (!windowRef) return;
      windowRef.setTimeout(() => {
        setPulseCheckContext("regular");
        setShowPulseCheck(true);
      }, 0);
      return;
    }

    if (previewFeature === "language_switcher" || previewFeature === "armory_section") {
      void navigateToScreen("landing");
      clearPreviewParam();
      return;
    }

    if (previewFeature === "ai_field") {
      skipNextPulseCheck();
      void navigateToScreen("landing");
      clearPreviewParam();
      return;
    }

    if (previewFeature === "global_atlas") {
      if (isOwnerWatcher) {
        const next = createCurrentUrl();
        if (!next) return;
        next.pathname = "/analytics";
        next.search = "";
        pushUrl(next);
      }
      clearPreviewParam();
      return;
    }

    skipNextPulseCheck();
    void navigateToScreen("map");
    clearPreviewParam();
  }, [
    isAdminRoute,
    isOwnerWatcher,
    navigateToScreen,
    openJourneyTools,
    setPulseCheckContext,
    setShowPulseCheck,
    skipNextPulseCheck
  ]);

  return {
    isFeaturePreviewSession,
    previewedFeature,
    forcePulsePreviewOpen,
    goBackToFeatureFlags,
    clearPulseCheckPreview
  };
}
