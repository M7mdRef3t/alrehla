import { memo, type ComponentProps } from "react";
import { type AppScreen } from "../../navigation/navigationMachine";
import { AppStartScreens } from "../AppStartScreens";
import { AppJourneyScreens } from "../AppJourneyScreens";
import { AppMetaScreens } from "../AppMetaScreens";

type StartScreensProps = ComponentProps<typeof AppStartScreens>;
type JourneyScreensProps = ComponentProps<typeof AppJourneyScreens>;
type MetaScreensProps = ComponentProps<typeof AppMetaScreens>;

interface AppMainExperienceContentProps {
  screen: AppScreen;
  authUserId: MetaScreensProps["authUserId"];
  ownerInstallRequestNonce: StartScreensProps["ownerInstallRequestNonce"];
  onOwnerInstallRequestHandled: StartScreensProps["onOwnerInstallRequestHandled"];
  welcome: StartScreensProps["welcome"];
  onClearWelcome: StartScreensProps["onClearWelcome"];
  category: StartScreensProps["category"];
  goalId: StartScreensProps["goalId"];
  selectedNodeId: StartScreensProps["selectedNodeId"];
  pulseMode: StartScreensProps["pulseMode"];
  pulseInsight: StartScreensProps["pulseInsight"];
  isLowPulseCocoonSuppressed: StartScreensProps["isLowPulseCocoonSuppressed"];
  canUseBasicDiagnosis: StartScreensProps["canUseBasicDiagnosis"];
  challengeTarget: StartScreensProps["challengeTarget"];
  challengeLabel: StartScreensProps["challengeLabel"];
  nextStepDecision: StartScreensProps["nextStepDecision"];
  hideBottomDock: StartScreensProps["hideBottomDock"];
  toolsBackScreen: JourneyScreensProps["toolsBackScreen"];
  missionNodeId: JourneyScreensProps["missionNodeId"];
  canUseMap: JourneyScreensProps["canUseMap"];
  availableFeatures: JourneyScreensProps["availableFeatures"];
  onStartJourney: StartScreensProps["onStartJourney"];
  onOpenSurvey: StartScreensProps["onOpenSurvey"];
  onGoalBack: StartScreensProps["onGoalBack"];
  onGoalSelected: StartScreensProps["onGoalSelected"];
  onSurveyComplete: StartScreensProps["onSurveyComplete"];
  onSelectNode: StartScreensProps["onSelectNode"];
  onOpenBreathing: StartScreensProps["onOpenBreathing"];
  onOpenMission: StartScreensProps["onOpenMission"];
  onOpenMissionFromAddPerson: StartScreensProps["onOpenMissionFromAddPerson"];
  onOpenCocoon: StartScreensProps["onOpenCocoon"];
  onOpenNoise: StartScreensProps["onOpenNoise"];
  onFeatureLocked: StartScreensProps["onFeatureLocked"];
  onTakeNextStep: StartScreensProps["onTakeNextStep"];
  onRefreshNextStep: StartScreensProps["onRefreshNextStep"];
  onOpenPulse: StartScreensProps["onOpenPulse"];
  onOpenLibrary: StartScreensProps["onOpenLibrary"];
  onOpenProfile: StartScreensProps["onOpenProfile"];
  onNavigate: JourneyScreensProps["onNavigate"];
  onOpenDawayir: JourneyScreensProps["onOpenDawayir"];
  onOpenDawayirSetup: JourneyScreensProps["onOpenDawayirSetup"];
  onOpenGoal: JourneyScreensProps["onOpenGoal"];
  onOpenMuteProtocol: MetaScreensProps["onOpenMuteProtocol"];
  onOpenMirror: MetaScreensProps["onOpenMirror"];
  onOpenConsciousnessArchive: MetaScreensProps["onOpenConsciousnessArchive"];
  onOpenTimeCapsule: MetaScreensProps["onOpenTimeCapsule"];
}

export const AppMainExperienceContent = memo(function AppMainExperienceContent({
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
  onOpenPulse,
  onOpenLibrary,
  onOpenProfile,
  onNavigate,
  onOpenDawayir,
  onOpenDawayirSetup,
  onOpenGoal,
  onOpenMuteProtocol,
  onOpenMirror,
  onOpenConsciousnessArchive,
  onOpenTimeCapsule
}: AppMainExperienceContentProps) {
  if (screen === "landing" || screen === "goal" || screen === "survey" || screen === "map") {
    return (
      <AppStartScreens
        screen={screen}
        ownerInstallRequestNonce={ownerInstallRequestNonce}
        onOwnerInstallRequestHandled={onOwnerInstallRequestHandled}
        welcome={welcome}
        onClearWelcome={onClearWelcome}
        category={category}
        goalId={goalId}
        selectedNodeId={selectedNodeId}
        pulseMode={pulseMode}
        pulseInsight={pulseInsight}
        isLowPulseCocoonSuppressed={isLowPulseCocoonSuppressed}
        canUseBasicDiagnosis={canUseBasicDiagnosis}
        challengeTarget={challengeTarget}
        challengeLabel={challengeLabel}
        nextStepDecision={nextStepDecision}
        hideBottomDock={hideBottomDock}
        onStartJourney={onStartJourney}
        onOpenSurvey={onOpenSurvey}
        onGoalBack={onGoalBack}
        onGoalSelected={onGoalSelected}
        onSurveyComplete={onSurveyComplete}
        onSelectNode={onSelectNode}
        onOpenBreathing={onOpenBreathing}
        onOpenMission={onOpenMission}
        onOpenMissionFromAddPerson={onOpenMissionFromAddPerson}
        onOpenCocoon={onOpenCocoon}
        onOpenNoise={onOpenNoise}
        onFeatureLocked={onFeatureLocked}
        onTakeNextStep={onTakeNextStep}
        onRefreshNextStep={onRefreshNextStep}
        onOpenPulse={onOpenPulse}
        onOpenLibrary={onOpenLibrary}
        onOpenProfile={onOpenProfile}
      />
    );
  }

  if (
    screen === "tools" ||
    screen === "settings" ||
    screen === "guided" ||
    screen === "mission" ||
    screen === "exit-scripts" ||
    screen === "grounding"
  ) {
    return (
      <AppJourneyScreens
        screen={screen}
        toolsBackScreen={toolsBackScreen}
        missionNodeId={missionNodeId}
        canUseMap={canUseMap}
        availableFeatures={availableFeatures}
        nextStepDecision={nextStepDecision}
        onNavigate={onNavigate}
        onOpenDawayir={onOpenDawayir}
        onOpenDawayirSetup={onOpenDawayirSetup}
        onFeatureLocked={onFeatureLocked}
        onOpenGoal={onOpenGoal}
        onTakeNextStep={onTakeNextStep}
        onRefreshNextStep={onRefreshNextStep}
      />
    );
  }

  if (
    screen === "enterprise" ||
    screen === "guilt-court" ||
    screen === "diplomacy" ||
    screen === "oracle-dashboard" ||
    screen === "armory"
  ) {
    return (
      <AppMetaScreens
        screen={screen}
        authUserId={authUserId}
        onNavigate={onNavigate}
        onOpenMuteProtocol={onOpenMuteProtocol}
        onOpenCocoon={onOpenCocoon}
        onOpenMirror={onOpenMirror}
        onOpenConsciousnessArchive={onOpenConsciousnessArchive}
        onOpenTimeCapsule={onOpenTimeCapsule}
      />
    );
  }

  return null;
});
