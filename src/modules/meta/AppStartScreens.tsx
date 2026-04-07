import { Suspense, lazy, type ComponentProps } from "react";
import { Landing } from "./Landing";
import { GoalPicker } from "./GoalPicker";
import { OnboardingWelcomeBubble } from "./OnboardingWelcomeBubble";
import { useJourneyState } from "@/state/journeyState";
import { recordFlowEvent } from "@/services/journeyTracking";
import { type AdviceCategory } from "@/data/adviceScripts";
import { type FeatureFlagKey } from "@/config/features";
import { type WelcomeSource } from "./OnboardingWelcomeBubble";

import { type NextStepDecisionV1 } from "../recommendation";

import { SafeCoreMapScreen } from "./WrappedComponents";
import type { CoreMapScreen } from "@/modules/exploration/CoreMapScreen";
import { trackEvent, AnalyticsEvents } from "@/services/analytics";

const ResearchSurvey = lazy(() => import("./ResearchSurvey").then((m) => ({ default: m.ResearchSurvey })));


import { PageShell } from "./app-shell/PageShell";

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
  pulseMode?: ComponentProps<typeof CoreMapScreen>["pulseMode"];
  pulseInsight?: ComponentProps<typeof CoreMapScreen>["pulseInsight"];
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
  onNavigate?: (screen: string) => void;
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
  onOpenProfile,
  onNavigate: _onNavigate
}: AppStartScreensProps) {
  if (screen === "landing") {
    return (
      <PageShell headerMode="none" tabBarVisible={false} disableAnimation maxWidth="max-w-none px-0 sm:px-0 lg:px-0">
        <Landing
          onStartJourney={onStartJourney}
          onOpenSurvey={onOpenSurvey}
          ownerInstallRequestNonce={ownerInstallRequestNonce}
          onOwnerInstallRequestHandled={onOwnerInstallRequestHandled}
        />
      </PageShell>
    );
  }

  if (screen === "goal") {
    return (
      <PageShell headerMode="standard" tabBarVisible={false} maxWidth="max-w-4xl">
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
            trackEvent(AnalyticsEvents.GOAL_SELECTED, {
              goal_id: nextGoalId,
              category: nextCategory
            });
            onClearWelcome();
            useJourneyState.getState().setLastGoal(nextGoalId, nextCategory);
            onGoalSelected(nextCategory, nextGoalId);
          }}
        />
      </PageShell>
    );
  }

  if (screen === "survey") {
    return (
      <PageShell headerMode="none" tabBarVisible={false}>
        <Suspense fallback={null}>
          <ResearchSurvey onComplete={onSurveyComplete} />
        </Suspense>
      </PageShell>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <SafeCoreMapScreen
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
    </div>
  );
}

