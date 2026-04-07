import { useState, useCallback } from "react";
import type { AdviceCategory } from "@/data/adviceScripts";
import type { FeatureFlagKey } from "@/config/features";

export type Screen = "landing" | "goal" | "map" | "guided" | "mission" | "tools";
export type PulseCheckContext = "regular" | "start_recovery";
export type WelcomeSource = "ai" | "template" | "offline_intervention";

/**
 * Hook to manage screen navigation and related modal states
 * Centralizes all screen transition logic in one place
 */
export function useScreenNavigation() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [category, setCategory] = useState<AdviceCategory>("general");
  const [goalId, setGoalId] = useState<string>("unknown");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [missionNodeId, setMissionNodeId] = useState<string | null>(null);
  const [toolsBackScreen, setToolsBackScreen] = useState<Screen>("landing");
  const [showGym, setShowGym] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<FeatureFlagKey | null>(null);
  const [welcome, setWelcome] = useState<{ message: string; source: WelcomeSource } | null>(null);

  // Navigation helpers
  const goToMap = useCallback(
    (nextCategory: AdviceCategory, nextGoalId: string) => {
      setCategory(nextCategory);
      setGoalId(nextGoalId);
      setWelcome(null);
      setScreen("map");
    },
    []
  );

  const goToGoalPicker = useCallback(() => {
    setScreen("goal");
  }, []);

  const backToLanding = useCallback(() => {
    setScreen("landing");
    setSelectedNodeId(null);
  }, []);

  const openJourneyTools = useCallback(() => {
    setToolsBackScreen(screen);
    setScreen("tools");
  }, [screen]);

  const openMissionScreen = useCallback((nodeId: string) => {
    setMissionNodeId(nodeId);
    setScreen("mission");
  }, []);

  return {
    // State
    screen,
    category,
    goalId,
    selectedNodeId,
    missionNodeId,
    toolsBackScreen,
    showGym,
    showBaseline,
    showBreathing,
    lockedFeature,
    welcome,
    // Setters
    setScreen,
    setCategory,
    setGoalId,
    setSelectedNodeId,
    setMissionNodeId,
    setToolsBackScreen,
    setShowGym,
    setShowBaseline,
    setShowBreathing,
    setLockedFeature,
    setWelcome,
    // Navigation helpers
    goToMap,
    goToGoalPicker,
    backToLanding,
    openJourneyTools,
    openMissionScreen
  };
}
