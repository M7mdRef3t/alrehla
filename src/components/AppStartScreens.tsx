import { Suspense, lazy, type ComponentProps } from "react";
import { Landing } from "./Landing";
import { GoalPicker } from "./GoalPicker";
import { OnboardingWelcomeBubble } from "./OnboardingWelcomeBubble";
import { ErrorBoundary, MapErrorFallback } from "./ErrorBoundary";
import { useJourneyState } from "../state/journeyState";
import { recordFlowEvent } from "../services/journeyTracking";
import { AwarenessSkeleton } from "./AwarenessSkeleton";
import { type AdviceCategory } from "../data/adviceScripts";
import { type FeatureFlagKey } from "../config/features";
import { type WelcomeSource } from "./OnboardingWelcomeBubble";
import { type NextStepDecisionV1 } from "../modules/recommendation";

const ResearchSurvey = lazy(() => import("./ResearchSurvey").then((m) => ({ default: m.ResearchSurvey })));
const CoreMapScreen = lazy(() => import("./CoreMapScreen").then((m) => ({ default: m.CoreMapScreen })));

type StartScreen = "landing" | "goal" | "survey" | "map";

type WelcomeState = {
  message: string;
  source: WelcomeSource;
} | null;

interface AppStartScreensProps {
  screen: StartScreen;
  ownerInstallRequestNonce: number;
  onOwnerInstallRequestHandled: () => void;
  welcome: WelcomeState;
  onClearWelcome: () => void;
  category: AdviceCategory;
  goalId: string;
  selectedNodeId: string | null;
  pulseMode: ComponentProps<typeof CoreMapScreen>["pulseMode"];
  pulseInsight: ComponentProps<typeof CoreMapScreen>["pulseInsight"];
  isLowPulseCocoonSuppressed: boolean;
  canUseBasicDiagnosis: boolean;
  challengeTarget: { nodeId: string } | null;
  challengeLabel?: string | null;
  nextStepDecision: NextStepDecisionV1 | null;
  hideBottomDock: boolean;
  onStartJourney: () => void;
  onOpenSurvey: () => void;
  onGoalBack: () => void;
  onGoalSelected: (nextCategory: AdviceCategory, nextGoalId: string) => void;
  onSurveyComplete: () => void;
  onSelectNode: (nodeId: string | null) => void;
  onOpenBreathing: () => void;
  onOpenMission: (nodeId: string) => void;
  onOpenMissionFromAddPerson: (nodeId: string) => void;
  onOpenCocoon: () => void;
  onOpenNoise: () => void;
  onFeatureLocked: (feature: FeatureFlagKey | null) => void;
  onTakeNextStep: (decision: NextStepDecisionV1) => void;
  onRefreshNextStep: () => void;
  onOpenPulse: () => void;
  onOpenLibrary: () => void;
  onOpenProfile: () => void;
}

export function AppStartScreens({
  screen,
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
  onOpenProfile
}: AppStartScreensProps) {
  if (screen === "landing") {
    return (
      <Landing
        onStartJourney={onStartJourney}
        onOpenSurvey={onOpenSurvey}
        ownerInstallRequestNonce={ownerInstallRequestNonce}
        onOwnerInstallRequestHandled={onOwnerInstallRequestHandled}
      />
    );
  }

  if (screen === "goal") {
    return (
      <div className="w-full flex-1 min-h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col px-3 sm:px-4">
        {welcome && welcome.source !== "offline_intervention" && (
          <OnboardingWelcomeBubble
            message={welcome.message}
            source={welcome.source}
            onClose={onClearWelcome}
          />
        )}
        <GoalPicker
          onBack={onGoalBack}
          onContinue={(nextCategory, nextGoalId) => {
            recordFlowEvent("goal_selected", {
              meta: { goalId: nextGoalId, category: nextCategory }
            });
            onClearWelcome();
            useJourneyState.getState().setLastGoal(nextGoalId, nextCategory);
            onGoalSelected(nextCategory, nextGoalId);
          }}
        />
      </div>
    );
  }

  if (screen === "survey") {
    return (
      <div className="w-full flex-1 min-h-[100dvh] max-h-[100dvh] overflow-auto flex flex-col items-center justify-center">
        <Suspense fallback={null}>
          <ResearchSurvey onComplete={onSurveyComplete} />
        </Suspense>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<MapErrorFallback />}>
      <Suspense fallback={<AwarenessSkeleton />}>
        <CoreMapScreen
          category={category}
          goalId={goalId}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onOpenBreathing={onOpenBreathing}
          onOpenMission={onOpenMission}
          onOpenMissionFromAddPerson={onOpenMissionFromAddPerson}
          pulseMode={pulseMode}
          pulseInsight={pulseInsight}
          onOpenCocoon={onOpenCocoon}
          suppressLowPulseCocoon={isLowPulseCocoonSuppressed}
          onOpenNoise={onOpenNoise}
          canUseBasicDiagnosis={canUseBasicDiagnosis}
          onFeatureLocked={onFeatureLocked}
          onOpenChallenge={challengeTarget ? () => onOpenMission(challengeTarget.nodeId) : undefined}
          challengeLabel={challengeLabel}
          nextStepDecision={nextStepDecision}
          onTakeNextStep={onTakeNextStep}
          onRefreshNextStep={onRefreshNextStep}
          onOpenPulse={onOpenPulse}
          onOpenLibrary={onOpenLibrary}
          onOpenProfile={onOpenProfile}
          hideBottomDock={hideBottomDock}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
