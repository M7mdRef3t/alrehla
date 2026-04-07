import { useMemo, type ComponentProps } from "react";
import { AppChromeShell } from "./AppChromeShell";
import { AppMainExperienceContent } from "./AppMainExperienceContent";

type ChromeShellProps = Omit<ComponentProps<typeof AppChromeShell>, "children">;
type MainContentProps = ComponentProps<typeof AppMainExperienceContent>;
type LibraryOpenState = boolean;

interface UseAppSurfaceMainPropsParams {
  showBreathing: boolean;
  showCocoon: boolean;
  isEmergencyOpen: boolean;
  challengeNodeId: string | null;
  chromeVisibility: ChromeShellProps["chromeVisibility"];
  screen: MainContentProps["screen"];
  authUserId: MainContentProps["authUserId"];
  authUser: ChromeShellProps["authUser"];
  whatsAppLink: ChromeShellProps["whatsAppLink"];
  ownerInstallRequestNonce: MainContentProps["ownerInstallRequestNonce"];
  onOwnerInstallRequestHandled: MainContentProps["onOwnerInstallRequestHandled"];
  welcome: MainContentProps["welcome"];
  onClearWelcome: MainContentProps["onClearWelcome"];
  category: MainContentProps["category"];
  goalId: MainContentProps["goalId"];
  selectedNodeId: MainContentProps["selectedNodeId"];
  pulseMode: MainContentProps["pulseMode"];
  pulseInsight: MainContentProps["pulseInsight"];
  isLowPulseCocoonSuppressed: MainContentProps["isLowPulseCocoonSuppressed"];
  canUseBasicDiagnosis: MainContentProps["canUseBasicDiagnosis"];
  challengeLabel: MainContentProps["challengeLabel"];
  nextStepDecision: MainContentProps["nextStepDecision"];
  toolsBackScreen: MainContentProps["toolsBackScreen"];
  missionNodeId: MainContentProps["missionNodeId"];
  canUseMap: MainContentProps["canUseMap"];
  availableFeatures: MainContentProps["availableFeatures"];
  onChromeProfileOpen: ChromeShellProps["onOpenProfile"];
  onChromeWhatsAppOpen: ChromeShellProps["onOpenWhatsApp"];
  onChromePulseOpen: ChromeShellProps["onOpenPulse"];
  onChromeLibraryOpen: ChromeShellProps["onOpenLibrary"];
  onChromeNavigate: ChromeShellProps["onNavigate"];
  libraryOpen: LibraryOpenState;
  onStartJourney: MainContentProps["onStartJourney"];
  onOpenSurvey: MainContentProps["onOpenSurvey"];
  onGoalBack: MainContentProps["onGoalBack"];
  onGoalSelected: MainContentProps["onGoalSelected"];
  onSurveyComplete: MainContentProps["onSurveyComplete"];
  onSelectNode: MainContentProps["onSelectNode"];
  onOpenBreathing: MainContentProps["onOpenBreathing"];
  onOpenMission: MainContentProps["onOpenMission"];
  onOpenMissionFromAddPerson: MainContentProps["onOpenMissionFromAddPerson"];
  onOpenCocoon: MainContentProps["onOpenCocoon"];
  onOpenNoise: MainContentProps["onOpenNoise"];
  onFeatureLocked: MainContentProps["onFeatureLocked"];
  onTakeNextStep: MainContentProps["onTakeNextStep"];
  onRefreshNextStep: MainContentProps["onRefreshNextStep"];
  onMainPulseOpen: MainContentProps["onOpenPulse"];
  onMainLibraryOpen: MainContentProps["onOpenLibrary"];
  onMainProfileOpen: MainContentProps["onOpenProfile"];
  onMainNavigate: MainContentProps["onNavigate"];
  onOpenDawayir: MainContentProps["onOpenDawayir"];
  onOpenDawayirSetup: MainContentProps["onOpenDawayirSetup"];
  onOpenGoal: MainContentProps["onOpenGoal"];
  onOpenMuteProtocol: MainContentProps["onOpenMuteProtocol"];
  onOpenMirror: MainContentProps["onOpenMirror"];
  onOpenConsciousnessArchive: MainContentProps["onOpenConsciousnessArchive"];
  onOpenTimeCapsule: MainContentProps["onOpenTimeCapsule"];
}

export function useAppSurfaceMainProps({
  showBreathing,
  showCocoon,
  isEmergencyOpen,
  challengeNodeId,
  chromeVisibility,
  screen,
  authUserId,
  authUser,
  whatsAppLink,
  ownerInstallRequestNonce,
  onOwnerInstallRequestHandled,
  welcome,
  onClearWelcome,
  category,
  goalId,
  selectedNodeId,
  pulseMode,
  pulseInsight,
  isLowPulseCocoonSuppressed,
  canUseBasicDiagnosis,
  challengeLabel,
  nextStepDecision,
  toolsBackScreen,
  missionNodeId,
  canUseMap,
  availableFeatures,
  onChromeProfileOpen,
  onChromeWhatsAppOpen,
  onChromePulseOpen,
  onChromeLibraryOpen,
  onChromeNavigate,
  libraryOpen,
  onStartJourney,
  onOpenSurvey,
  onGoalBack,
  onGoalSelected,
  onSurveyComplete,
  onSelectNode,
  onOpenBreathing,
  onOpenMission,
  onOpenMissionFromAddPerson,
  onOpenCocoon,
  onOpenNoise,
  onFeatureLocked,
  onTakeNextStep,
  onRefreshNextStep,
  onMainPulseOpen,
  onMainLibraryOpen,
  onMainProfileOpen,
  onMainNavigate,
  onOpenDawayir,
  onOpenDawayirSetup,
  onOpenGoal,
  onOpenMuteProtocol,
  onOpenMirror,
  onOpenConsciousnessArchive,
  onOpenTimeCapsule
}: UseAppSurfaceMainPropsParams) {
  const hideBottomDock = showBreathing || showCocoon || isEmergencyOpen;
  const challengeTarget = useMemo(
    () => (challengeNodeId ? { nodeId: challengeNodeId } : null),
    [challengeNodeId]
  );

  const chromeShellProps = useMemo<ChromeShellProps>(
    () => ({
      chromeVisibility,
      authUser,
      whatsAppLink,
      screen,
      onOpenProfile: onChromeProfileOpen,
      onOpenWhatsApp: onChromeWhatsAppOpen,
      onOpenPulse: onChromePulseOpen,
      onOpenLibrary: onChromeLibraryOpen,
      onNavigate: onChromeNavigate,
      libraryOpen
    }),
    [
      chromeVisibility,
      authUser,
      whatsAppLink,
      screen,
      onChromeProfileOpen,
      onChromeWhatsAppOpen,
      onChromePulseOpen,
      onChromeLibraryOpen,
      onChromeNavigate,
      libraryOpen
    ]
  );

  const mainContentProps = useMemo<MainContentProps>(
    () => ({
      screen,
      authUserId,
      ownerInstallRequestNonce,
      onOwnerInstallRequestHandled,
      welcome,
      onClearWelcome,
      category,
      goalId,
      selectedNodeId,
      pulseMode,
      pulseInsight,
      isLowPulseCocoonSuppressed,
      canUseBasicDiagnosis,
      challengeTarget,
      challengeLabel,
      nextStepDecision,
      hideBottomDock,
      toolsBackScreen,
      missionNodeId,
      canUseMap,
      availableFeatures,
      onStartJourney,
      onOpenSurvey,
      onGoalBack,
      onGoalSelected,
      onSurveyComplete,
      onSelectNode,
      onOpenBreathing,
      onOpenMission,
      onOpenMissionFromAddPerson,
      onOpenCocoon,
      onOpenNoise,
      onFeatureLocked,
      onTakeNextStep,
      onRefreshNextStep,
      onOpenPulse: onMainPulseOpen,
      onOpenLibrary: onMainLibraryOpen,
      onOpenProfile: onMainProfileOpen,
      onNavigate: onMainNavigate,
      onOpenDawayir,
      onOpenDawayirSetup,
      onOpenGoal,
      onOpenMuteProtocol,
      onOpenMirror,
      onOpenConsciousnessArchive,
      onOpenTimeCapsule
    }),
    [
      screen,
      authUserId,
      ownerInstallRequestNonce,
      onOwnerInstallRequestHandled,
      welcome,
      onClearWelcome,
      category,
      goalId,
      selectedNodeId,
      pulseMode,
      pulseInsight,
      isLowPulseCocoonSuppressed,
      canUseBasicDiagnosis,
      challengeTarget,
      challengeLabel,
      nextStepDecision,
      hideBottomDock,
      toolsBackScreen,
      missionNodeId,
      canUseMap,
      availableFeatures,
      onStartJourney,
      onOpenSurvey,
      onGoalBack,
      onGoalSelected,
      onSurveyComplete,
      onSelectNode,
      onOpenBreathing,
      onOpenMission,
      onOpenMissionFromAddPerson,
      onOpenCocoon,
      onOpenNoise,
      onFeatureLocked,
      onTakeNextStep,
      onRefreshNextStep,
      onMainPulseOpen,
      onMainLibraryOpen,
      onMainProfileOpen,
      onMainNavigate,
      onOpenDawayir,
      onOpenDawayirSetup,
      onOpenGoal,
      onOpenMuteProtocol,
      onOpenMirror,
      onOpenConsciousnessArchive,
      onOpenTimeCapsule
    ]
  );

  return {
    chromeShellProps,
    mainContentProps
  };
}
