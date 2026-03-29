import type { AppOverlayFlag } from "../state/appOverlayState";

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
  systemOverclockPanel: 0
};

export const CRITICAL_SEVERITY_THRESHOLD = 9;

export function getOverlaySeverity(flag: AppOverlayFlag | "emergency"): number {
  return OVERLAY_SEVERITY[flag] ?? 0;
}
