import { useEffect, useRef, useState, startTransition } from "react";
import type { FeatureFlagKey } from "@/config/features";
import { resolveNavigation, type AppScreen } from "@/navigation/navigationMachine";
import {
  getPathname,
  getHash,
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

function resolveScreenFromHash(): AppScreen | null {
  const rawHash = getHash();
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;

  const validHashScreens: string[] = [
    "landing", "goal", "map", "guided", "mission", "tools", "settings",
    "enterprise", "guilt-court", "diplomacy", "oracle-dashboard", "armory",
    "survey", "exit-scripts", "grounding", "stories", "about", "insights",
    "quizzes", "behavioral-analysis", "resources", "profile", "sanctuary",
    "life-os", "dawayir", "maraya", "session-intake", "session-console",
    "atmosfera", "masarat", "baseera", "watheeqa", "mizan", "rifaq",
    "murshid", "taqrir", "bawsala", "riwaya", "nadhir", "wird", "markaz",
    "sada", "hafiz", "mirah", "sijil", "naba", "mithaq", "sullam", "bathra",
    "observatory", "wasiyya", "khalwa", "ecosystem-hub", "tazkiya", "jisr",
    "risala", "shahada", "warsha", "kanz", "qalb", "athar", "rafiq", "ruya",
    "niyya", "protocol", "diagnosis"
  ];

  if (validHashScreens.includes(hash)) {
    return hash as AppScreen;
  }

  return null;
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
    const pathname = getPathname() || "/";
    const url = screen === "sanctuary" ? `${pathname}#sanctuary` : pathname;
    if (!hasHistorySyncedRef.current) {
      hasHistorySyncedRef.current = true;
      replaceUrl(url, state);
      return;
    }
    pushUrl(url, state);
  }, [authStatus, hasOAuthCallbackParams, screen]);

  useEffect(() => {
    // We subscribe to popstate even on admin paths so we can detect 
    // when a user clicks a tool (hash change) that leads away from or overlays the admin.
    const handler = (event: PopStateEvent) => {
      const next =
        (event.state as { screen?: AppScreen } | null)?.screen ??
        resolveScreenFromHash() ??
        "landing";
      const result = resolveNavigation({
        target: next,
        canUseMap,
        canUseJourneyTools,
        isLockedPhaseOne
      });
      fromPopStateRef.current = true;
      startTransition(() => {
        if (result.kind === "blocked") {
          setLockedFeature(result.feature);
          setScreen("landing");
          return;
        }
        setScreen(result.screen);
      });
    };
    return subscribePopstate(handler);
  }, [canUseJourneyTools, canUseMap, isLockedPhaseOne, setLockedFeature, setScreen]);

  return {
    isAdminRoute,
    isAnalyticsRoute,
    setIsAdminRoute
  };
}
