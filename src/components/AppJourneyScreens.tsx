import { Suspense, lazy, type ComponentProps } from "react";
import { AwarenessSkeleton } from "./AwarenessSkeleton";
import { type NextStepDecisionV1 } from "../modules/recommendation";
import { type FeatureFlagKey } from "../config/features";

const JourneyToolsScreen = lazy(() => import("./JourneyToolsScreen").then((m) => ({ default: m.JourneyToolsScreen })));
const SettingsScreen = lazy(() => import("./SettingsScreen").then((m) => ({ default: m.SettingsScreen })));
const GuidedJourneyFlow = lazy(() => import("./GuidedJourneyFlow").then((m) => ({ default: m.GuidedJourneyFlow })));
const MissionScreen = lazy(() => import("./MissionScreen").then((m) => ({ default: m.MissionScreen })));
const ExitScriptsLibrary = lazy(() => import("./ExitScriptsLibrary").then((m) => ({ default: m.ExitScriptsLibrary })));
const GroundingToolkit = lazy(() => import("./GroundingToolkit").then((m) => ({ default: m.GroundingToolkit })));

type JourneyScreen = "tools" | "settings" | "guided" | "mission" | "exit-scripts" | "grounding";

interface AppJourneyScreensProps {
  screen: JourneyScreen;
  toolsBackScreen: string;
  missionNodeId: string | null;
  canUseMap: boolean;
  availableFeatures: ComponentProps<typeof JourneyToolsScreen>["availableFeatures"];
  nextStepDecision: NextStepDecisionV1 | null;
  onNavigate: (screen: string) => void;
  onOpenDawayir: () => void;
  onOpenDawayirSetup: () => void;
  onFeatureLocked: (feature: FeatureFlagKey | null) => void;
  onOpenGoal: ComponentProps<typeof JourneyToolsScreen>["onOpenGoal"];
  onTakeNextStep: (decision: NextStepDecisionV1) => void;
  onRefreshNextStep: () => void;
}

export function AppJourneyScreens({
  screen,
  toolsBackScreen,
  missionNodeId,
  canUseMap,
  availableFeatures,
  nextStepDecision,
  onNavigate,
  onOpenDawayir,
  onOpenDawayirSetup,
  onFeatureLocked,
  onOpenGoal,
  onTakeNextStep,
  onRefreshNextStep
}: AppJourneyScreensProps) {
  if (screen === "tools") {
    return (
      <JourneyToolsScreen
        onBack={() => onNavigate(toolsBackScreen)}
        onOpenDawayir={onOpenDawayir}
        onOpenDawayirSetup={onOpenDawayirSetup}
        onFeatureLocked={onFeatureLocked}
        availableFeatures={availableFeatures}
        onOpenGoal={onOpenGoal}
        nextStepDecision={nextStepDecision}
        onTakeNextStep={onTakeNextStep}
        onRefreshNextStep={onRefreshNextStep}
  onOpenExitScripts={() => onNavigate("exit-scripts")}
  onOpenGrounding={() => onNavigate("grounding")}
  onOpenMeditation={() => onNavigate("meditation")}
  onOpenHistory={() => onNavigate("history")}
  onOpenDiplomacy={() => onNavigate("diplomacy")}
      />
    );
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        onClose={() => {
          if (canUseMap) {
            onNavigate("map");
            return;
          }
          onNavigate("landing");
        }}
      />
    );
  }

  if (screen === "guided") {
    return (
      <GuidedJourneyFlow
        onBackToLanding={() => onNavigate("landing")}
        onFinishJourney={() => onNavigate("map")}
      />
    );
  }

  if (screen === "mission" && missionNodeId) {
    return <MissionScreen nodeId={missionNodeId} onBack={() => onNavigate("map")} />;
  }

  if (screen === "exit-scripts") {
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
        <ExitScriptsLibrary onBack={() => onNavigate("tools")} />
      </Suspense>
    );
  }

  if (screen === "grounding") {
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
        <GroundingToolkit onBack={() => onNavigate("tools")} />
      </Suspense>
    );
  }

  return null;
}
