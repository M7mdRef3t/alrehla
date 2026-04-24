import { Suspense, lazy, type ComponentProps } from "react";
import { Landing } from "./Landing";
import { GoalPicker } from "./GoalPicker";
import { OnboardingWelcomeBubble } from "./OnboardingWelcomeBubble";
import { useJourneyProgress } from "@/domains/journey";
import { trackingService } from "@/domains/journey";
import { type AdviceCategory } from "@/data/adviceScripts";
import { type FeatureFlagKey } from "@/config/features";
import { type WelcomeSource } from "./OnboardingWelcomeBubble";

import { type NextStepDecisionV1 } from "../recommendation";

import { SafeCoreMapScreen } from "./WrappedComponents";
import type { CoreMapScreen } from "@/modules/exploration/CoreMapScreen";
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";

import { PageShell } from "./app-shell/PageShell";
import { AdaptiveIntake } from "./AdaptiveIntake";
import { ReflectionOutput } from "./ReflectionOutput";
import { ProtocolEngine } from "./ProtocolEngine";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { useState } from "react";
import { DiagnosisScreen } from "@/modules/diagnosis";
import type { UserStateObject, RecommendedProduct } from "@/modules/diagnosis";

type StartScreen = "landing" | "goal" | "survey" | "map" | "dawayir" | "protocol" | "diagnosis";

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
  onOpenSurvey: (goalId?: string, category?: AdviceCategory) => void;
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
  // Conversion Engine
  onDiagnosisComplete?: (state: UserStateObject) => void;
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
  onNavigate: _onNavigate,
  onDiagnosisComplete,
}: AppStartScreensProps) {
  const journey = useJourneyProgress();
  const [showReflection, setShowReflection] = useState(true);
  const detectedState = useJourneyState((s) => s.detectedState);

  // ── Diagnosis Screen (Conversion Engine Entry Point) ──
  if (screen === "diagnosis") {
    return (
      <PageShell headerMode="none" tabBarVisible={false} disableAnimation maxWidth="max-w-none px-0 sm:px-0 lg:px-0">
        <DiagnosisScreen
          onComplete={(state: UserStateObject, product?: RecommendedProduct) => {
            trackingService.recordFlow("diagnosis_completed", {
              meta: {
                type: state.type,
                mainPain: state.mainPain,
                readiness: state.readiness,
                recommendedProduct: state.recommendedProduct,
                score: state.diagnosisScore,
                overrideProduct: product,
              }
            });
            if (onDiagnosisComplete) {
              onDiagnosisComplete(state);
            } else {
              const productScreenMap: Record<RecommendedProduct, string> = {
                dawayir: "map",
                masarat: "masarat",
                session: "session-intake",
                atmosfera: "atmosfera",
              };
              const finalProduct = product || state.recommendedProduct;
              _onNavigate?.(productScreenMap[finalProduct] ?? "map");
            }
          }}
          onSkip={() => _onNavigate?.("landing")}
        />
      </PageShell>
    );
  }

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
            trackingService.recordFlow("goal_selected", {
              meta: { goalId: nextGoalId, category: nextCategory }
            });
            analyticsService.goal({
              goal_id: nextGoalId,
              category: nextCategory
            });
            onClearWelcome();
            journey.setLastGoal(nextGoalId, nextCategory);
            onOpenSurvey(nextGoalId, nextCategory as AdviceCategory); // Open Adaptive Intake instead of direct map
          }}
        />
      </PageShell>
    );
  }

  if (screen === "survey") {
    return (
      <PageShell headerMode="none" tabBarVisible={false}>
        <AdaptiveIntake onComplete={onSurveyComplete} />
      </PageShell>
    );
  }

  if (screen === "protocol") {
    return (
      <PageShell headerMode="none" tabBarVisible={false}>
          <ProtocolEngine onFinish={() => _onNavigate?.("map")} />
      </PageShell>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden relative">
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
      
      {screen === "map" && detectedState && showReflection && (
          <ReflectionOutput onStartProtocol={() => {
              setShowReflection(false);
              _onNavigate?.("protocol");
          }} />
      )}
    </div>
  );
}
