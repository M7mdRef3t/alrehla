import { useEffect, useRef, useState } from "react";
import type { FeatureFlagKey } from "@/config/features";
import { resolveNavigation, type AppScreen } from "@/navigation/navigationMachine";
import {
  getPathname,
  isAdminPath,
  isAnalyticsPath,
  pushUrl,
  replaceUrl,
  subscribePopstate
} from "@/services/navigation";

type AuthStatus = "loading" | "ready";

interface UseAppRouteSyncParams {
  screen: AppScreen;
  authStatus: AuthStatus;
  canUseMap: boolean;
  canUseJourneyTools: boolean;
  isLockedPhaseOne: boolean;
  hasOAuthCallbackParams: () => boolean;
  setScreen: (screen: AppScreen) => void;
  setLockedFeature: (feature: FeatureFlagKey | null) => void;
}

export function useAppRouteSync({
  screen,
  authStatus,
  canUseMap,
  canUseJourneyTools,
  isLockedPhaseOne,
  hasOAuthCallbackParams,
  setScreen,
  setLockedFeature
}: UseAppRouteSyncParams) {
  const [isAdminRoute, setIsAdminRoute] = useState(() => isAdminPath());
  const [isAnalyticsRoute, setIsAnalyticsRoute] = useState(() => isAnalyticsPath());
  const fromPopStateRef = useRef(false);
  const hasHistorySyncedRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      setIsAdminRoute(isAdminPath());
      setIsAnalyticsRoute(isAnalyticsPath());
    };
    handler();
    return subscribePopstate(handler);
  }, []);

  useEffect(() => {
    if (isAdminPath()) return;
    if (hasOAuthCallbackParams()) return;
    if (fromPopStateRef.current) {
      fromPopStateRef.current = false;
      return;
    }

    const state = { screen };
    const url = getPathname() || "/";
    if (!hasHistorySyncedRef.current) {
      hasHistorySyncedRef.current = true;
      replaceUrl(url, state);
      return;
    }
    pushUrl(url, state);
  }, [authStatus, hasOAuthCallbackParams, screen]);

  useEffect(() => {
    if (isAdminPath()) return;
    const handler = (event: PopStateEvent) => {
      const next = (event.state as { screen?: AppScreen } | null)?.screen ?? "landing";
      const result = resolveNavigation({
        target: next,
        canUseMap,
        canUseJourneyTools,
        isLockedPhaseOne
      });
      fromPopStateRef.current = true;
      if (result.kind === "blocked") {
        setLockedFeature(result.feature);
        setScreen("landing");
        return;
      }
      setScreen(result.screen);
    };
    return subscribePopstate(handler);
  }, [canUseJourneyTools, canUseMap, isLockedPhaseOne, setLockedFeature, setScreen]);

  return {
    isAdminRoute,
    isAnalyticsRoute,
    setIsAdminRoute
  };
}
