import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlagKey,
  type FeatureFlagMode
} from "../config/features";
import { isFeatureEnabled } from "../utils/featureFlags";

export interface ScoringWeights {
  often: number;
  sometimes: number;
  rarely: number;
  never: number;
}

export interface ScoringThresholds {
  lowMax: number;
  mediumMax: number;
}

export interface AiLogEntry {
  id: string;
  createdAt: number;
  prompt: string;
  response: string;
  source: "playground" | "system";
  rating?: "up" | "down";
}

export interface AdminMission {
  id: string;
  title: string;
  track: string;
  difficulty: "سهل" | "متوسط" | "صعب";
  createdAt: number;
}

export interface AdminBroadcast {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}

interface AdminState {
  adminAccess: boolean;
  adminCode: string | null;
  featureFlags: Record<FeatureFlagKey, FeatureFlagMode>;
  betaAccess: boolean;
  systemPrompt: string;
  scoringWeights: ScoringWeights;
  scoringThresholds: ScoringThresholds;
  aiLogs: AiLogEntry[];
  missions: AdminMission[];
  broadcasts: AdminBroadcast[];
  setAdminAccess: (value: boolean) => void;
  setAdminCode: (value: string | null) => void;
  setFeatureFlags: (flags: Record<FeatureFlagKey, FeatureFlagMode>) => void;
  updateFeatureFlag: (key: FeatureFlagKey, mode: FeatureFlagMode) => void;
  setBetaAccess: (value: boolean) => void;
  setSystemPrompt: (prompt: string) => void;
  setScoringWeights: (weights: ScoringWeights) => void;
  setScoringThresholds: (thresholds: ScoringThresholds) => void;
  addAiLog: (entry: AiLogEntry) => void;
  setAiLogs: (logs: AiLogEntry[]) => void;
  rateAiLog: (id: string, rating: "up" | "down") => void;
  clearAiLogs: () => void;
  addMission: (mission: AdminMission) => void;
  setMissions: (missions: AdminMission[]) => void;
  removeMission: (id: string) => void;
  addBroadcast: (broadcast: AdminBroadcast) => void;
  setBroadcasts: (broadcasts: AdminBroadcast[]) => void;
  removeBroadcast: (id: string) => void;
}

const DEFAULT_PROMPT =
  "أنت مرشد الرحلة. لهجتك مصرية، أسلوبك حنون وواضح، وتركّز على الحماية وبناء الحدود.";

const DEFAULT_WEIGHTS: ScoringWeights = {
  often: 3,
  sometimes: 2,
  rarely: 1,
  never: 0
};

const DEFAULT_THRESHOLDS: ScoringThresholds = {
  lowMax: 2,
  mediumMax: 5
};

export const useAdminState = create<AdminState>()(
  persist(
    (set) => ({
      adminAccess: false,
      adminCode: null,
      featureFlags: DEFAULT_FEATURE_FLAGS,
      betaAccess: false,
      systemPrompt: DEFAULT_PROMPT,
      scoringWeights: DEFAULT_WEIGHTS,
      scoringThresholds: DEFAULT_THRESHOLDS,
      aiLogs: [],
      missions: [],
      broadcasts: [],
      setAdminAccess: (value) => set({ adminAccess: value }),
      setAdminCode: (value) => set({ adminCode: value }),
      setFeatureFlags: (flags) => set({ featureFlags: flags }),
      updateFeatureFlag: (key, mode) =>
        set((state) => ({
          featureFlags: { ...state.featureFlags, [key]: mode }
        })),
      setBetaAccess: (value) => set({ betaAccess: value }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setScoringWeights: (weights) => set({ scoringWeights: weights }),
      setScoringThresholds: (thresholds) => set({ scoringThresholds: thresholds }),
      addAiLog: (entry) =>
        set((state) => ({
          aiLogs: [entry, ...state.aiLogs].slice(0, 50)
        })),
      setAiLogs: (logs) => set({ aiLogs: logs }),
      rateAiLog: (id, rating) =>
        set((state) => ({
          aiLogs: state.aiLogs.map((log) => (log.id === id ? { ...log, rating } : log))
        })),
      clearAiLogs: () => set({ aiLogs: [] }),
      addMission: (mission) =>
        set((state) => ({ missions: [mission, ...state.missions] })),
      setMissions: (missions) => set({ missions }),
      removeMission: (id) =>
        set((state) => ({ missions: state.missions.filter((m) => m.id !== id) })),
      addBroadcast: (broadcast) =>
        set((state) => ({ broadcasts: [broadcast, ...state.broadcasts] })),
      setBroadcasts: (broadcasts) => set({ broadcasts }),
      removeBroadcast: (id) =>
        set((state) => ({ broadcasts: state.broadcasts.filter((b) => b.id !== id) }))
    }),
    {
      name: "dawayir-admin-state"
    }
  )
);

export function isFeatureAllowed(key: FeatureFlagKey): boolean {
  const state = useAdminState.getState();
  return isFeatureEnabled(state.featureFlags[key], state.betaAccess);
}

export function getScoringWeights(): ScoringWeights {
  return useAdminState.getState().scoringWeights ?? DEFAULT_WEIGHTS;
}

export function getScoringThresholds(): ScoringThresholds {
  return useAdminState.getState().scoringThresholds ?? DEFAULT_THRESHOLDS;
}

export const ADMIN_ACCESS_CODE = "alrehla-admin";
