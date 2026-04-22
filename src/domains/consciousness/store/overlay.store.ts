import { useCallback } from "react";
import { create } from "zustand";
import type { FeatureFlagKey } from "@/config/features";
import type { PostAuthIntent } from "@/utils/postAuthIntent";
import type { PulseCheckContext } from "@/hooks/usePulseCheckLogic";
import type { PulseSubmitPayload } from "@/domains/consciousness/store/pulse.store";

export type AppOverlayFlag =
  | "startup"
  | "gym"
  | "baseline"
  | "breathing"
  | "cocoon"
  | "noiseSilencingPulse"
  | "consciousnessArchive"
  | "authModal"
  | "dataManagement"
  | "ownerDataTools"
  | "ambientReality"
  | "timeCapsuleVault"
  | "systemOverclockPanel"
  | "notificationSettings"
  | "trackingDashboard"
  | "atlasDashboard"
  | "shareStats"
  | "library"
  | "insightsLibrary"
  | "goals2025"
  | "personalProgress"
  | "weeklyActionPlan"
  | "readingPlan"
  | "awarenessGrowth"
  | "communityImpact"
  | "relationshipAnalysis"
  | "circleGrowth"
  | "symptomsOverview"
  | "recoveryPlan"
  | "themeSettings"
  | "achievements"
  | "advancedTools"
  | "classicRecovery"
  | "manualPlacement"
  | "feedback"
  | "onboarding"
  | "welcomeToast"
  | "faq"
  | "journeyGuideChat"
  | "journeyTimeline"
  | "nudgeToast"
  | "mirrorOverlay"
  | "blindCapsuleOpener"
  | "premiumBridge"
  | "recoveryPathways"
  | "privateCircleInvitation"
  | "duoCommunity"
  | "pastSessionsLog"
  | "rewardStore"
  | "evolutionHub"
  | "ruthlessMirror"
  | "egoDeath"
  | "wisdomMatrix"
  | "immersionPath"
  | "vanguardCollective"
  | "sovereignChronicle"
  | "sanctuary";

export type AppOverlayFlags = Record<AppOverlayFlag, boolean>;

const defaultOverlayFlags: AppOverlayFlags = {
  startup: false,
  gym: false,
  baseline: false,
  breathing: false,
  cocoon: false,
  noiseSilencingPulse: false,
  consciousnessArchive: false,
  authModal: false,
  dataManagement: false,
  ownerDataTools: false,
  ambientReality: false,
  timeCapsuleVault: false,
  systemOverclockPanel: false,
  notificationSettings: false,
  trackingDashboard: false,
  atlasDashboard: false,
  shareStats: false,
  library: false,
  insightsLibrary: false,
  goals2025: false,
  personalProgress: false,
  weeklyActionPlan: false,
  readingPlan: false,
  awarenessGrowth: false,
  communityImpact: false,
  relationshipAnalysis: false,
  circleGrowth: false,
  symptomsOverview: false,
  recoveryPlan: false,
  themeSettings: false,
  achievements: false,
  advancedTools: false,
  classicRecovery: false,
  manualPlacement: false,
  feedback: false,
  onboarding: false,
  welcomeToast: false,
  faq: false,
  journeyGuideChat: false,
  journeyTimeline: false,
  nudgeToast: false,
  mirrorOverlay: false,
  blindCapsuleOpener: false,
  premiumBridge: false,
  recoveryPathways: false,
  privateCircleInvitation: false,
  duoCommunity: false,
  pastSessionsLog: false,
  rewardStore: false,
  evolutionHub: false,
  ruthlessMirror: false,
  egoDeath: false,
  wisdomMatrix: false,
  immersionPath: false,
  vanguardCollective: false,
  sovereignChronicle: false,
  sanctuary: false
};

interface AppOverlayState {
  flags: AppOverlayFlags;
  lockedFeature: FeatureFlagKey | null;
  postAuthIntent: PostAuthIntent | null;
  pulseCheck: {
    isOpen: boolean;
    context: PulseCheckContext;
    pendingPulse?: PulseSubmitPayload;
  };
  lastPulseCheckScreen: string;
  evolutionHubTab: 'quests' | 'guide';
  isOpen: (flag: AppOverlayFlag) => boolean;
  openOverlay: (flag: AppOverlayFlag) => void;
  closeOverlay: (flag: AppOverlayFlag) => void;
  setOverlay: (flag: AppOverlayFlag, value: boolean, tab?: 'quests' | 'guide') => void;
  setLockedFeature: (feature: FeatureFlagKey | null) => void;
  setAuthIntent: (intent: PostAuthIntent | null) => void;
  setPulseCheck: (isOpen: boolean, context?: PulseCheckContext, pendingPulse?: PulseSubmitPayload) => void;
  setLastPulseCheckScreen: (screen: string) => void;
  patchOverlays: (patch: Partial<AppOverlayFlags>) => void;
  resetOverlays: () => void;
}

export const useAppOverlayState = create<AppOverlayState>((set, get) => ({
  flags: defaultOverlayFlags,
  lockedFeature: null,
  postAuthIntent: null,
  pulseCheck: {
    isOpen: false,
    context: "regular"
  },
  lastPulseCheckScreen: "landing",
  evolutionHubTab: 'quests',
  isOpen: (flag) => get().flags[flag],
  openOverlay: (flag) =>
    set((state) => ({
      flags: { ...state.flags, [flag]: true }
    })),
  closeOverlay: (flag) =>
    set((state) => ({
      flags: { ...state.flags, [flag]: false }
    })),
  setOverlay: (flag, value, tab) =>
    set((state) => ({
      flags: { ...state.flags, [flag]: value },
      evolutionHubTab: tab ?? state.evolutionHubTab
    })),
  setLockedFeature: (feature) => set({ lockedFeature: feature }),
  setAuthIntent: (intent) => set({ postAuthIntent: intent }),
  setPulseCheck: (isOpen, context = "regular", pendingPulse) =>
    set((state) => ({
      pulseCheck: {
        isOpen,
        context,
        pendingPulse: pendingPulse ?? state.pulseCheck.pendingPulse
      }
    })),
  setLastPulseCheckScreen: (screen) => set({ lastPulseCheckScreen: screen }),
  patchOverlays: (patch) =>
    set((state) => ({
      flags: { ...state.flags, ...patch }
    })),
  resetOverlays: () => set({ flags: defaultOverlayFlags, lockedFeature: null, postAuthIntent: null })
}));

export function useOverlayFlag(flag: AppOverlayFlag): [boolean, (value: boolean) => void] {
  const value = useAppOverlayState((state) => state.flags[flag]);
  const setOverlay = useAppOverlayState((state) => state.setOverlay);
  const setValue = useCallback((nextValue: boolean) => {
    setOverlay(flag, nextValue);
  }, [flag, setOverlay]);
  return [value, setValue];
}
