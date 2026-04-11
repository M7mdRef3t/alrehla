import type { AppOverlayFlag } from "@/domains/consciousness/store/overlay.store";

/**
 * SeverityIndex (0-10)
 * 10: Critical / Emergency (Must lock everything)
 * 9: High Priority Therapy (Breathing, Cocoon)
 * 8: Core Assessment (Pulse Check, Baseline)
 * 5: Actionable Intelligence (Mirror, AI Chat)
 * 2: Awareness / Feedback (Achievements, Feedback, FAQ)
 * 0: Passive (Banners)
 */
export const OVERLAY_SEVERITY: Record<AppOverlayFlag | "emergency" | "pulseCheck", number> = {
  emergency: 10,
  breathing: 9,
  cocoon: 9,
  noiseSilencingPulse: 9,
  pulseCheck: 8,
  baseline: 8,
  mirrorOverlay: 7,
  journeyGuideChat: 6,
  manualPlacement: 6,
  advancedTools: 5,
  classicRecovery: 5,
  recoveryPlan: 5,
  symptomsOverview: 5,
  onboarding: 4,
  authModal: 9,
  gym: 3,
  themeSettings: 2,
  faq: 2,
  feedback: 2,
  achievements: 2,
  premiumBridge: 4,
  welcomeToast: 1,
  nudgeToast: 1,
  shareStats: 1,
  library: 1,
  atlasDashboard: 1,
  trackingDashboard: 1,
  notificationSettings: 1,
  dataManagement: 1,
  ownerDataTools: 1,
  ambientReality: 1,
  timeCapsuleVault: 1,
  consciousnessArchive: 1,
  journeyTimeline: 1,
  startup: 0,
  systemOverclockPanel: 0,
  // Stitch integrated components
  insightsLibrary: 2,
  goals2025: 1,
  personalProgress: 2,
  weeklyActionPlan: 3,
  readingPlan: 1,
  awarenessGrowth: 2,
  communityImpact: 1,
  relationshipAnalysis: 3,
  circleGrowth: 1,
  sovereignChronicle: 1,
  recoveryPathways: 3,
  privateCircleInvitation: 5,
  duoCommunity: 1,
  pastSessionsLog: 2,
  rewardStore: 2,
  evolutionHub: 4,
  blindCapsuleOpener: 5,
  ruthlessMirror: 5,
  egoDeath: 5,
  wisdomMatrix: 5,
  immersionPath: 5,
  vanguardCollective: 5
};

export const CRITICAL_SEVERITY_THRESHOLD = 9;

export function getOverlaySeverity(flag: AppOverlayFlag | "emergency"): number {
  return OVERLAY_SEVERITY[flag] ?? 0;
}
