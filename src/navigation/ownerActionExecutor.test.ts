import { describe, expect, it, vi } from "vitest";
import { executeOwnerAction } from "./ownerActionExecutor";

const createContext = (overrides?: {
  canShowAIChatbot?: boolean;
  notificationSupported?: boolean;
  hasGlobalAtlas?: boolean;
  hasInternalBoundaries?: boolean;
}) => {
  const calls = {
    openJourneyGuideChat: vi.fn(),
    openAtlasDashboard: vi.fn(),
    openAdvancedTools: vi.fn(),
    openNotifications: vi.fn(),
    lockFeature: vi.fn()
  };

  return {
    calls,
    ctx: {
      flags: {
        canShowAIChatbot: overrides?.canShowAIChatbot ?? true,
        notificationSupported: overrides?.notificationSupported ?? true,
        hasGlobalAtlas: overrides?.hasGlobalAtlas ?? true,
        hasInternalBoundaries: overrides?.hasInternalBoundaries ?? true
      },
      callbacks: {
        openAdminDashboard: vi.fn(),
        openConsciousnessArchive: vi.fn(),
        openJourneyGuideChat: calls.openJourneyGuideChat,
        openJourneyTools: vi.fn(),
        openJourneyTimeline: vi.fn(),
        openDawayirTool: vi.fn(),
        openQuickExperience: vi.fn(),
        startJourney: vi.fn(),
        openGuidedJourney: vi.fn(),
        openBaselineCheck: vi.fn(),
        openNotifications: calls.openNotifications,
        openTrackingDashboard: vi.fn(),
        openAtlasDashboard: calls.openAtlasDashboard,
        openDataTools: vi.fn(),
        openShareStats: vi.fn(),
        openLibrary: vi.fn(),
        openSymptoms: vi.fn(),
        openRecoveryPlan: vi.fn(),
        openThemeSettings: vi.fn(),
        openAchievements: vi.fn(),
        openAdvancedTools: calls.openAdvancedTools,
        openClassicRecovery: vi.fn(),
        openManualPlacement: vi.fn(),
        openFeedbackModal: vi.fn(),
        requestInstallApp: vi.fn(),
        openNoiseSilencing: vi.fn(),
        openBreathingSession: vi.fn(),
        openAmbientReality: vi.fn(),
        openWisdomVault: vi.fn(),
        lockFeature: calls.lockFeature
      }
    }
  };
};

describe("executeOwnerAction", () => {
  it("locks and opens gated actions based on flags", () => {
    const guideLocked = createContext({ canShowAIChatbot: false });
    executeOwnerAction("journey_guide_chat", guideLocked.ctx);
    expect(guideLocked.calls.lockFeature).toHaveBeenCalledWith("ai_field");
    expect(guideLocked.calls.openJourneyGuideChat).not.toHaveBeenCalled();

    const atlasLocked = createContext({ hasGlobalAtlas: false });
    executeOwnerAction("atlas_dashboard", atlasLocked.ctx);
    expect(atlasLocked.calls.lockFeature).toHaveBeenCalledWith("global_atlas");
    expect(atlasLocked.calls.openAtlasDashboard).not.toHaveBeenCalled();

    const advancedLocked = createContext({ hasInternalBoundaries: false });
    executeOwnerAction("advanced_tools", advancedLocked.ctx);
    expect(advancedLocked.calls.lockFeature).toHaveBeenCalledWith("internal_boundaries");
    expect(advancedLocked.calls.openAdvancedTools).not.toHaveBeenCalled();
  });

  it("opens allowed actions when feature flags are enabled", () => {
    const ready = createContext({
      canShowAIChatbot: true,
      notificationSupported: true,
      hasGlobalAtlas: true,
      hasInternalBoundaries: true
    });

    executeOwnerAction("journey_guide_chat", ready.ctx);
    executeOwnerAction("atlas_dashboard", ready.ctx);
    executeOwnerAction("advanced_tools", ready.ctx);
    executeOwnerAction("notifications", ready.ctx);

    expect(ready.calls.openJourneyGuideChat).toHaveBeenCalledTimes(1);
    expect(ready.calls.openAtlasDashboard).toHaveBeenCalledTimes(1);
    expect(ready.calls.openAdvancedTools).toHaveBeenCalledTimes(1);
    expect(ready.calls.openNotifications).toHaveBeenCalledTimes(1);
    expect(ready.calls.lockFeature).not.toHaveBeenCalled();
  });
});
