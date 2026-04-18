import { Suspense, lazy, type ComponentProps } from "react";
import { useJourneyProgress } from "@/domains/journey";
import { trackingService } from "@/domains/journey";
import { type AdviceCategory } from "@/data/adviceScripts";
import { type FeatureFlagKey } from "@/config/features";
import { type WelcomeSource } from "./OnboardingWelcomeBubble";

import { type NextStepDecisionV1 } from "../recommendation";

import { SafeCoreMapScreen } from "./WrappedComponents";
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";

import { PageShell } from "./app-shell/PageShell";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { useState } from "react";
import type { UserStateObject, RecommendedProduct } from "@/modules/diagnosis";

const Landing = lazy(() => import("./Landing").then((m) => ({ default: m.Landing })));
const GoalPicker = lazy(() => import("./GoalPicker").then((m) => ({ default: m.GoalPicker })));
const OnboardingWelcomeBubble = lazy(() =>
  import("./OnboardingWelcomeBubble").then((m) => ({ default: m.OnboardingWelcomeBubble }))
);
const AdaptiveIntake = lazy(() => import("./AdaptiveIntake").then((m) => ({ default: m.AdaptiveIntake })));
const ReflectionOutput = lazy(() => import("./ReflectionOutput").then((m) => ({ default: m.ReflectionOutput })));
const ProtocolEngine = lazy(() => import("./ProtocolEngine").then((m) => ({ default: m.ProtocolEngine })));
import { DiagnosisScreen } from "@/modules/diagnosis";

type StartScreen = "landing" | "goal" | "survey" | "map" | "protocol" | "diagnosis";

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
  pulseMode?: ComponentProps<typeof SafeCoreMapScreen>["pulseMode"];
  pulseInsight?: ComponentProps<typeof SafeCoreMapScreen>["pulseInsight"];
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
        <Suspense fallback={null}>
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
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "landing") {
    return (
      <PageShell headerMode="none" tabBarVisible={false} disableAnimation maxWidth="max-w-none px-0 sm:px-0 lg:px-0">
        <Suspense fallback={null}>
          <Landing
            onStartJourney={onStartJourney}
            onOpenSurvey={onOpenSurvey}
            ownerInstallRequestNonce={ownerInstallRequestNonce}
            onOwnerInstallRequestHandled={onOwnerInstallRequestHandled}
          />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "goal") {
    return (
      <PageShell headerMode="standard" tabBarVisible={false} maxWidth="max-w-4xl">
        {welcome && welcome.source !== "offline_intervention" && (
          <Suspense fallback={null}>
            <OnboardingWelcomeBubble
              message={welcome.message}
              source={welcome.source}
              onClose={onClearWelcome}
            />
          </Suspense>
        )}
        <Suspense fallback={null}>
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
              onOpenSurvey(); // Open Adaptive Intake instead of direct map
            }}
          />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "survey") {
    return (
      <PageShell headerMode="none" tabBarVisible={false}>
        <Suspense fallback={null}>
          <AdaptiveIntake onComplete={onSurveyComplete} />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "protocol") {
    return (
      <PageShell headerMode="none" tabBarVisible={false}>
        <Suspense fallback={null}>
          <ProtocolEngine onFinish={() => _onNavigate?.("map")} />
        </Suspense>
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
        <Suspense fallback={null}>
          <ReflectionOutput onStartProtocol={() => {
            setShowReflection(false);
            _onNavigate?.("protocol");
          }} />
        </Suspense>
      )}
    </div>
  );
}
