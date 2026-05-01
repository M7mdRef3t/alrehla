import { create } from "zustand";
import type { AdviceCategory } from "@/data/adviceScripts";
import type { AppScreen } from "@/navigation/navigationMachine";

export type AppShellScreen = AppScreen;

type MapContextUpdate = {
  screen?: AppShellScreen;
  goalId?: string;
  category?: AdviceCategory;
  selectedNodeId?: string | null;
  missionNodeId?: string | null;
  toolsBackScreen?: AppShellScreen;
};

export interface AppShellNavigationState {
  screen: AppShellScreen;
  category: AdviceCategory;
  goalId: string;
  selectedNodeId: string | null;
  missionNodeId: string | null;
  toolsBackScreen: AppShellScreen;
  setScreen: (screen: AppShellScreen) => void;
  setCategory: (category: AdviceCategory) => void;
  setGoalId: (goalId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setMissionNodeId: (nodeId: string | null) => void;
  setToolsBackScreen: (screen: AppShellScreen) => void;
  setGoalContext: (goalId: string, category: AdviceCategory) => void;
  updateMapContext: (update: MapContextUpdate) => void;
  resetAppShellNavigation: () => void;
}

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";

function getInitialScreen(): AppShellScreen {
  if (typeof window === "undefined") return "landing";

  // Admin routes have their own navigation; don't let stale boot actions
  // set an initial screen that would hide the admin dashboard.
  if (window.location.pathname.startsWith("/admin")) return "landing";
  
  if (window.location.pathname.startsWith("/dawayir")) return "dawayir";
  if (window.location.pathname.startsWith("/map")) return "map";

  const bootAction = window.sessionStorage.getItem(APP_BOOT_ACTION_KEY);
  if (!bootAction) return "landing";
  
  if (bootAction === "start_recovery") return "map";
  
  const APP_SCREEN_BOOT_ACTION_PREFIX = "navigate:";
  if (bootAction.startsWith(APP_SCREEN_BOOT_ACTION_PREFIX)) {
    return bootAction.replace(APP_SCREEN_BOOT_ACTION_PREFIX, "") as AppShellScreen;
  }
  
  return "landing";
}

const defaultNavigationState = {
  screen: getInitialScreen(),
  category: "general" as AdviceCategory,
  goalId: "unknown",
  selectedNodeId: null as string | null,
  missionNodeId: null as string | null,
  toolsBackScreen: "landing" as AppShellScreen
};

export const useAppShellNavigationState = create<AppShellNavigationState>((set) => ({
  ...defaultNavigationState,
  setScreen: (screen) => set({ screen }),
  setCategory: (category) => set({ category }),
  setGoalId: (goalId) => set({ goalId }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setMissionNodeId: (missionNodeId) => set({ missionNodeId }),
  setToolsBackScreen: (toolsBackScreen) => set({ toolsBackScreen }),
  setGoalContext: (goalId, category) => set({ goalId, category }),
  updateMapContext: (update) =>
    set((state) => ({
      screen: update.screen ?? state.screen,
      goalId: update.goalId ?? state.goalId,
      category: update.category ?? state.category,
      selectedNodeId:
        Object.prototype.hasOwnProperty.call(update, "selectedNodeId") ? (update.selectedNodeId ?? null) : state.selectedNodeId,
      missionNodeId:
        Object.prototype.hasOwnProperty.call(update, "missionNodeId") ? (update.missionNodeId ?? null) : state.missionNodeId,
      toolsBackScreen: update.toolsBackScreen ?? state.toolsBackScreen
    })),
  resetAppShellNavigation: () => set(defaultNavigationState)
}));
