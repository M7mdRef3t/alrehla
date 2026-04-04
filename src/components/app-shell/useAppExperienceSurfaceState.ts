import { useMemo, type ComponentProps } from "react";
import { useAppAgentExperience } from "./useAppAgentExperience";
import { useAppSurfaceActions } from "./useAppSurfaceActions";
import { useAppSurfaceMainProps } from "./useAppSurfaceMainProps";
import { useAppSurfaceOverlayProps } from "./useAppSurfaceOverlayProps";
import { AppOverlayHost } from "./AppOverlayHost";

type SurfaceActionsParams = Parameters<typeof useAppSurfaceActions>[0];
type AgentExperienceParams = Parameters<typeof useAppAgentExperience>[0];
type SurfaceMainPropsParams = Parameters<typeof useAppSurfaceMainProps>[0];
type SurfaceOverlayPropsParams = Parameters<typeof useAppSurfaceOverlayProps>[0];
type OverlayHostProps = ComponentProps<typeof AppOverlayHost>;

interface UseAppExperienceSurfaceStateParams {
  surfaceActions: SurfaceActionsParams;
  agentExperience: AgentExperienceParams;
  canShowAIChatbot: boolean;
  mainSurface: Omit<
    SurfaceMainPropsParams,
    | "onOwnerInstallRequestHandled"
    | "onOpenSurvey"
    | "onGoalBack"
    | "onSurveyComplete"
    | "onOpenMission"
    | "onOpenMissionFromAddPerson"
    | "onTakeNextStep"
    | "onRefreshNextStep"
    | "onOpenDawayir"
    | "onOpenDawayirSetup"
    | "onOpenMirror"
    | "onOpenMuteProtocol"
    | "onChromeProfileOpen"
    | "onChromeWhatsAppOpen"
    | "onChromePulseOpen"
    | "onChromeLibraryOpen"
    | "onChromeNavigate"
    | "onGoalSelected"
    | "onOpenBreathing"
    | "onOpenCocoon"
    | "onOpenNoise"
    | "onMainPulseOpen"
    | "onMainLibraryOpen"
    | "onMainProfileOpen"
    | "onMainNavigate"
    | "onOpenGoal"
    | "onOpenConsciousnessArchive"
    | "onOpenTimeCapsule"
  > & {
    openSurveyScreen: SurfaceMainPropsParams["onOpenSurvey"];
    openLandingScreen: SurfaceMainPropsParams["onGoalBack"];
    openMissionScreen: SurfaceMainPropsParams["onOpenMission"];
    openMissionFromAddPerson: SurfaceMainPropsParams["onOpenMissionFromAddPerson"];
    handleTakeNextStep: SurfaceMainPropsParams["onTakeNextStep"];
    handleRefreshNextStep: SurfaceMainPropsParams["onRefreshNextStep"];
    openDawayirTool: SurfaceMainPropsParams["onOpenDawayir"];
    openDawayirSetup: SurfaceMainPropsParams["onOpenDawayirSetup"];
    presentMirrorInsight: SurfaceMainPropsParams["onOpenMirror"];
    openRegularPulseCheck: SurfaceMainPropsParams["onMainPulseOpen"];
  };
  overlaySurface: SurfaceOverlayPropsParams & {
    onDismissBroadcast: SurfaceOverlayPropsParams["onDismissBroadcast"];
  };
  onOnboardingComplete?: (skipped?: boolean) => void;
}

export function useAppExperienceSurfaceState({
  surfaceActions,
  agentExperience,
  canShowAIChatbot,
  mainSurface,
  overlaySurface,
  onOnboardingComplete
}: UseAppExperienceSurfaceStateParams) {
  const actions = useAppSurfaceActions(surfaceActions);
  const { agentContext, agentSystemPrompt, agentActions } = useAppAgentExperience(agentExperience);

  const { chromeShellProps, mainContentProps } = useAppSurfaceMainProps({
    ...mainSurface,
    onOwnerInstallRequestHandled: actions.handleOwnerInstallRequestHandled,
    onChromeProfileOpen: actions.handleChromeProfileOpen,
    onChromeWhatsAppOpen: actions.handleChromeWhatsAppOpen,
    onChromePulseOpen: mainSurface.openRegularPulseCheck,
    onChromeLibraryOpen: actions.openLibraryOverlay,
    onChromeNavigate: actions.handleChromeNavigate,
    onGoalSelected: actions.handleGoalSelected,
    onOpenBreathing: actions.openBreathingOverlay,
    onOpenCocoon: actions.openManualCocoon,
    onOpenNoise: actions.openNoiseSilencingPulse,
    onMainPulseOpen: mainSurface.openRegularPulseCheck,
    onMainLibraryOpen: actions.openLibraryOverlay,
    onMainProfileOpen: actions.openProfileScreen,
    onMainNavigate: actions.handleExperienceNavigate,
    onOpenGoal: actions.handleJourneyGoalOpen,
    onOpenConsciousnessArchive: actions.openConsciousnessArchive,
    onOpenTimeCapsule: actions.openTimeCapsuleVault,
    onOpenSurvey: mainSurface.openSurveyScreen,
    onGoalBack: mainSurface.openLandingScreen,
    onSurveyComplete: mainSurface.openLandingScreen,
    onOpenMission: mainSurface.openMissionScreen,
    onOpenMissionFromAddPerson: mainSurface.openMissionFromAddPerson,
    onTakeNextStep: mainSurface.handleTakeNextStep,
    onRefreshNextStep: mainSurface.handleRefreshNextStep,
    onOpenDawayir: mainSurface.openDawayirTool,
    onOpenDawayirSetup: mainSurface.openDawayirSetup,
    onOpenMirror: mainSurface.presentMirrorInsight,
    onOpenMuteProtocol: actions.openNoiseSilencingPulse
  });

  const { transientChromeProps } = useAppSurfaceOverlayProps(overlaySurface);

  return useMemo(() => ({
    chromeShellProps,
    mainContentProps,
    transientChromeProps,
    overlayHostProps: {
      canShowAIChatbot,
      agentContext,
      agentActions,
      agentSystemPrompt,
      onFeedbackSubmit: actions.handleFeedbackSubmit,
      onOnboardingComplete
    } as OverlayHostProps,
    openConsciousnessArchive: actions.openConsciousnessArchive,
    openTimeCapsuleVault: actions.openTimeCapsuleVault,
    navigateToMap: actions.navigateToMap,
    toggleSystemOverclockPanel: actions.toggleSystemOverclockPanel,
    openAmbientReality: actions.openAmbientReality,
    openOracleDashboard: actions.openOracleDashboard
  }), [
    chromeShellProps,
    mainContentProps,
    transientChromeProps,
    canShowAIChatbot,
    agentContext,
    agentActions,
    agentSystemPrompt,
    onOnboardingComplete,
    actions.openConsciousnessArchive,
    actions.openTimeCapsuleVault,
    actions.handleFeedbackSubmit,
    actions.navigateToMap,
    actions.toggleSystemOverclockPanel,
    actions.openAmbientReality,
    actions.openOracleDashboard
  ]);
}
