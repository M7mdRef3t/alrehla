import { useCallback, useEffect, useRef } from "react";
import { type AdviceCategory } from "@/data/adviceScripts";
import { recordFlowEvent } from "@/services/journeyTracking";
import { useMapState } from "@/state/mapState";
import type { FeatureFlagKey } from "@/config/features";
import { isPhaseOneUserFlow, isUserMode } from "@/config/appEnv";
import { getLastGoalMeta } from "@/utils/goalLabel";
import { ensureValidJourneyState } from "@/utils/journeyState";
import { requestIdleCallback, cancelIdleCallback } from "@/utils/performanceOptimizations";
import type { AppShellScreen } from "@/state/appShellNavigationState";

const preloadCoreMap = () => import('@/modules/exploration/CoreMapScreen');
const preloadGym = () => import('@/modules/exploration/RelationshipGym');

interface UseAppJourneyEntryActionsParams {
  screen: AppShellScreen;
  goalId: string;
  storedGoalId: string | null | undefined;
  storedCategory: string | null | undefined;
  lastGoalById: Record<string, { category: string; updatedAt: number }> | undefined;
  authStatus: "loading" | "ready";
  canUseMap: boolean;
  canUseJourneyTools: boolean;
  isLockedPhaseOne: boolean;
  navigateToScreen: (target: AppShellScreen) => boolean;
  setScreen: (screen: AppShellScreen) => void;
  setGoalId: (goalId: string) => void;
  setCategory: (category: AdviceCategory) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setMissionNodeId: (nodeId: string | null) => void;
  setToolsBackScreen: (screen: AppShellScreen) => void;
  setLockedFeature: (feature: FeatureFlagKey | null) => void;
  skipNextPulseCheck: () => void;
}

export function useAppJourneyEntryActions({
  screen,
  goalId,
  storedGoalId,
  storedCategory,
  lastGoalById,
  authStatus,
  canUseMap,
  canUseJourneyTools,
  isLockedPhaseOne,
  navigateToScreen,
  setScreen,
  setGoalId,
  setCategory,
  setSelectedNodeId,
  setMissionNodeId,
  setToolsBackScreen,
  setLockedFeature,
  skipNextPulseCheck
}: UseAppJourneyEntryActionsParams) {
  const phaseOneMissionBypassRef = useRef(false);

  useEffect(() => {
    if (screen !== "goal") return;

    const idleHandle = requestIdleCallback(() => {
      void preloadCoreMap();
      void preloadGym();
    }, { timeout: 1200 });

    return () => {
      cancelIdleCallback(idleHandle);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "map") {
      setSelectedNodeId(null);
    }
  }, [screen, setSelectedNodeId]);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (canUseMap || isUserMode) return;
    if (screen === "goal" || screen === "map" || screen === "mission" || screen === "guided") {
      void navigateToScreen("landing");
    }
  }, [authStatus, canUseMap, navigateToScreen, screen]);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (canUseJourneyTools) return;
    if (screen === "tools") {
      void navigateToScreen("landing");
    }
  }, [authStatus, canUseJourneyTools, navigateToScreen, screen]);

  useEffect(() => {
    if (!isLockedPhaseOne) return;

    if (screen === "mission" && phaseOneMissionBypassRef.current) {
      phaseOneMissionBypassRef.current = false;
      return;
    }

    if (screen === "guided" || screen === "mission") {
      void navigateToScreen("map");
    }
  }, [isLockedPhaseOne, navigateToScreen, screen]);

  useEffect(() => {
    if (!isLockedPhaseOne) return;
    if (goalId !== "family") {
      setGoalId("family");
    }
  }, [goalId, isLockedPhaseOne, setGoalId]);

  const openDefaultGoalMap = useCallback(() => {
    const validJourney = ensureValidJourneyState();
    setGoalId(validJourney.goalId);
    setCategory(validJourney.category);
    setSelectedNodeId(null);
    void navigateToScreen("map");
  }, [navigateToScreen, setCategory, setGoalId, setSelectedNodeId]);

  const goToGoals = useCallback(() => {
    if (!canUseMap) {
      if (isUserMode) {
        skipNextPulseCheck();
        openDefaultGoalMap();
        return;
      }
      setLockedFeature("dawayir_map");
      return;
    }

    skipNextPulseCheck();
    if (isPhaseOneUserFlow) {
      navigateToScreen("guided");
      return;
    }

    navigateToScreen("goal");
  }, [canUseMap, navigateToScreen, openDefaultGoalMap, setLockedFeature, skipNextPulseCheck]);

  const openMissionScreen = useCallback((nodeId: string) => {
    if (isLockedPhaseOne) return;
    setMissionNodeId(nodeId);
    void navigateToScreen("mission");
  }, [isLockedPhaseOne, navigateToScreen, setMissionNodeId]);

  const openMissionFromAddPerson = useCallback((nodeId: string) => {
    const safeId = String(nodeId ?? "").trim();
    if (!safeId) {
      recordFlowEvent("add_person_start_path_blocked_missing_node", {
        meta: { reason: "empty_node_id" }
      });
      return;
    }

    const nodeExists = useMapState.getState().nodes.some((node) => node.id === safeId);
    if (!nodeExists) {
      recordFlowEvent("add_person_start_path_blocked_missing_node", {
        meta: { reason: "node_not_found", nodeId: safeId }
      });
      return;
    }

    setMissionNodeId(safeId);
    setSelectedNodeId(safeId);
    phaseOneMissionBypassRef.current = true;
    setScreen("mission");
  }, [setMissionNodeId, setScreen, setSelectedNodeId]);

  const openJourneyTools = useCallback(() => {
    if (isLockedPhaseOne || !canUseJourneyTools) {
      setLockedFeature("journey_tools");
      return;
    }

    recordFlowEvent("tools_opened");
    setToolsBackScreen(screen === "tools" ? "landing" : screen);
    void navigateToScreen("tools");
  }, [
    canUseJourneyTools,
    isLockedPhaseOne,
    navigateToScreen,
    screen,
    setLockedFeature,
    setToolsBackScreen
  ]);

  const openDawayirTool = useCallback(() => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }

    const lastGoalMeta = getLastGoalMeta(lastGoalById, storedGoalId, storedCategory);
    if (lastGoalMeta) {
      setGoalId(lastGoalMeta.goalId);
      setCategory(lastGoalMeta.category as AdviceCategory);
      void navigateToScreen("map");
      setSelectedNodeId(null);
      return;
    }

    if (isPhaseOneUserFlow) {
      openDefaultGoalMap();
      return;
    }

    void navigateToScreen("goal");
  }, [
    canUseMap,
    lastGoalById,
    navigateToScreen,
    openDefaultGoalMap,
    setCategory,
    setGoalId,
    setLockedFeature,
    setSelectedNodeId,
    storedCategory,
    storedGoalId
  ]);

  const openDawayirSetup = useCallback(() => {
    if (!canUseMap) {
      setLockedFeature("dawayir_map");
      return;
    }

    skipNextPulseCheck();
    if (isPhaseOneUserFlow) {
      navigateToScreen("guided");
      return;
    }

    void navigateToScreen("goal");
  }, [canUseMap, navigateToScreen, setLockedFeature, skipNextPulseCheck]);

  return {
    openDefaultGoalMap,
    goToGoals,
    openMissionScreen,
    openMissionFromAddPerson,
    openJourneyTools,
    openDawayirTool,
    openDawayirSetup
  };
}
