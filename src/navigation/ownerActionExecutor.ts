import type { FeatureFlagKey } from "@/config/features";
import type { OwnerActionKey } from "./actionRoutingMachine";

interface OwnerActionFlags {
  canShowAIChatbot: boolean;
  notificationSupported: boolean;
  hasGlobalAtlas: boolean;
  hasInternalBoundaries: boolean;
}

interface OwnerActionCallbacks {
  openAdminDashboard: () => void;
  openConsciousnessArchive: () => void;
  openJourneyGuideChat: () => void;
  openJourneyTools: () => void;
  openJourneyTimeline: () => void;
  openDawayirTool: () => void;
  openQuickExperience: () => void;
  startJourney: () => void;
  openGuidedJourney: () => void;
  openBaselineCheck: () => void;
  openNotifications: () => void;
  openTrackingDashboard: () => void;
  openAtlasDashboard: () => void;
  openDataTools: () => void;
  openShareStats: () => void;
  openLibrary: () => void;
  openSymptoms: () => void;
  openRecoveryPlan: () => void;
  openThemeSettings: () => void;
  openAchievements: () => void;
  openAdvancedTools: () => void;
  openClassicRecovery: () => void;
  openManualPlacement: () => void;
  openFeedbackModal: () => void;
  requestInstallApp: () => void;
  openNoiseSilencing: () => void;
  openBreathingSession: () => void;
  openAmbientReality: () => void;
  openWisdomVault: () => void;
  openEnterpriseDashboard: () => void;
  lockFeature: (feature: FeatureFlagKey) => void;
}

export interface OwnerActionExecutionContext {
  flags: OwnerActionFlags;
  callbacks: OwnerActionCallbacks;
}

export function executeOwnerAction(action: OwnerActionKey, ctx: OwnerActionExecutionContext): void {
  const { flags, callbacks } = ctx;

  switch (action) {
    case "admin_dashboard":
      callbacks.openAdminDashboard();
      break;
    case "consciousness_archive":
      callbacks.openConsciousnessArchive();
      break;
    case "journey_guide_chat":
      if (!flags.canShowAIChatbot) callbacks.lockFeature("ai_field");
      else callbacks.openJourneyGuideChat();
      break;
    case "journey_tools":
      callbacks.openJourneyTools();
      break;
    case "journey_timeline":
      callbacks.openJourneyTimeline();
      break;
    case "open_dawayir":
      callbacks.openDawayirTool();
      break;
    case "quick_experience":
      callbacks.openQuickExperience();
      break;
    case "start_journey":
      callbacks.startJourney();
      break;
    case "guided_journey":
      callbacks.openGuidedJourney();
      break;
    case "baseline_check":
      callbacks.openBaselineCheck();
      break;
    case "notifications":
      if (flags.notificationSupported) callbacks.openNotifications();
      break;
    case "tracking_dashboard":
      callbacks.openTrackingDashboard();
      break;
    case "atlas_dashboard":
      if (!flags.hasGlobalAtlas) callbacks.lockFeature("global_atlas");
      else callbacks.openAtlasDashboard();
      break;
    case "data_tools":
      callbacks.openDataTools();
      break;
    case "share_stats":
      callbacks.openShareStats();
      break;
    case "library":
      callbacks.openLibrary();
      break;
    case "symptoms":
      callbacks.openSymptoms();
      break;
    case "recovery_plan":
      callbacks.openRecoveryPlan();
      break;
    case "theme_settings":
      callbacks.openThemeSettings();
      break;
    case "achievements":
      callbacks.openAchievements();
      break;
    case "advanced_tools":
      if (!flags.hasInternalBoundaries) callbacks.lockFeature("internal_boundaries");
      else callbacks.openAdvancedTools();
      break;
    case "classic_recovery":
      if (!flags.hasInternalBoundaries) callbacks.lockFeature("internal_boundaries");
      else callbacks.openClassicRecovery();
      break;
    case "manual_placement":
      if (!flags.hasInternalBoundaries) callbacks.lockFeature("internal_boundaries");
      else callbacks.openManualPlacement();
      break;
    case "feedback_modal":
      callbacks.openFeedbackModal();
      break;
    case "install_app":
      callbacks.requestInstallApp();
      break;
    case "noise_silencing":
      callbacks.openNoiseSilencing();
      break;
    case "breathing_session":
      callbacks.openBreathingSession();
      break;
    case "ambient_reality":
      callbacks.openAmbientReality();
      break;
    case "wisdom_vault":
      callbacks.openWisdomVault();
      break;
    case "enterprise_dashboard":
      callbacks.openEnterpriseDashboard();
      break;
    default:
      break;
  }
}
