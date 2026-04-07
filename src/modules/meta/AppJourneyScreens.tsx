import { Suspense, lazy, type ComponentProps } from "react";
import { AwarenessSkeleton } from "@/modules/meta/AwarenessSkeleton";

import { type NextStepDecisionV1 } from "../recommendation";
import { type FeatureFlagKey } from "@/config/features";


const JourneyToolsScreen = lazy(() => import("../action/JourneyToolsScreen").then((m) => ({ default: m.JourneyToolsScreen })));
const SettingsScreen = lazy(() => import("../meta/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));
const GuidedJourneyFlow = lazy(() => import("../action/GuidedJourneyFlow").then((m) => ({ default: m.GuidedJourneyFlow })));
const MissionScreen = lazy(() => import("../action/MissionScreen").then((m) => ({ default: m.MissionScreen })));
const ExitScriptsLibrary = lazy(() => import("../growth/ExitScriptsLibrary").then((m) => ({ default: m.ExitScriptsLibrary })));
const GroundingToolkit = lazy(() => import("../action/GroundingToolkit").then((m) => ({ default: m.GroundingToolkit })));



import { PageShell } from "./app-shell/PageShell";

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
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
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
        />
      </PageShell>
    );
  }

  if (screen === "settings") {
    return (
      <PageShell headerMode="standard" tabBarVisible={false} breadcrumbVisible={true}>
        <SettingsScreen
          onClose={() => {
            if (canUseMap) {
              onNavigate("map");
              return;
            }
            onNavigate("landing");
          }}
        />
      </PageShell>
    );
  }

  if (screen === "guided") {
    return (
      <PageShell headerMode="none" tabBarVisible={false}>
        <GuidedJourneyFlow
          onBackToLanding={() => onNavigate("landing")}
          onFinishJourney={() => onNavigate("map")}
        />
      </PageShell>
    );
  }

  if (screen === "mission" && missionNodeId) {
    return (
      <PageShell headerMode="none" tabBarVisible={false} maxWidth="max-w-none px-0">
        <MissionScreen nodeId={missionNodeId} onBack={() => onNavigate("map")} />
      </PageShell>
    );
  }

  if (screen === "exit-scripts") {
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <Suspense fallback={<AwarenessSkeleton />}>
          <ExitScriptsLibrary onBack={() => onNavigate("tools")} />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "grounding") {
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <Suspense fallback={<AwarenessSkeleton />}>
          <GroundingToolkit onBack={() => onNavigate("tools")} />
        </Suspense>
      </PageShell>
    );
  }

  return null;
}

