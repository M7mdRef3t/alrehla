import { lazy, Suspense, memo } from "react";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { SafePulseCheckModal, SafeAIChatbot } from "../../WrappedComponents";
import type { AgentActions, AgentContext } from '@/agent/types';

const CocoonModeModal = lazy(() => import('@/modules/action/CocoonModeModal').then((m) => ({ default: m.CocoonModeModal })));
const MuteProtocol = lazy(() => import('@/modules/action/MuteProtocol').then((m) => ({ default: m.MuteProtocol })));
const BreathingOverlay = lazy(() => import('@/modules/exploration/BreathingOverlay').then((m) => ({ default: m.BreathingOverlay })));
const EmergencyOverlay = lazy(() => import('@/modules/action/EmergencyOverlay').then((m) => ({ default: m.EmergencyOverlay })));
const OnboardingFlow = lazy(() => import("../../OnboardingFlow").then((m) => ({ default: m.OnboardingFlow })));
const RelationshipGym = lazy(() => import('@/modules/exploration/RelationshipGym').then((m) => ({ default: m.RelationshipGym })));
const ConsciousnessArchiveModal = lazy(() => import('@/modules/action/ConsciousnessArchiveModal').then((m) => ({ default: m.ConsciousnessArchiveModal })));
const JourneyToast = lazy(() => import('@/modules/action/JourneyToast').then((m) => ({ default: m.JourneyToast })));
const SymptomsOverviewModal = lazy(() => import('@/modules/action/SymptomsOverviewModal').then((m) => ({ default: m.SymptomsOverviewModal })));
const RecoveryPlanModal = lazy(() => import('@/modules/action/RecoveryPlanModal').then((m) => ({ default: m.RecoveryPlanModal })));

interface CoreExperienceOverlaysProps {
  isVisible: (id: string) => boolean;
  canShowAIChatbot: boolean;
  agentContext: AgentContext;
  agentActions?: AgentActions;
  agentSystemPrompt?: string;
  onNavigateToMap: () => void;
  onOnboardingComplete: (skipped?: boolean) => void;
  storedMirrorName?: string;
  isEmergencyOpen: boolean;
  closeEmergency: () => void;
  setSelectedNodeId: (id: string) => void;
  // Sanctuary flow specific handlers
  handlePulseOverlaySubmit: (data: any) => void;
  handlePulseOverlayClose: () => void;
  handleCocoonStart: () => void;
  handleCocoonSkip: () => void;
  handleCocoonClose: () => void;
  handleNoiseSessionComplete: () => void;
  handleBreathingOverlayClose: () => void;
  // Mind Signals specific handlers
  activeNudge: any;
  handleNudgeToastClose: () => void;
  handleNudgeCtaAction: () => void;
}

export const CoreExperienceOverlays = memo(function CoreExperienceOverlays({
  isVisible,
  canShowAIChatbot,
  agentContext,
  agentActions,
  agentSystemPrompt,
  onNavigateToMap,
  onOnboardingComplete,
  storedMirrorName,
  isEmergencyOpen,
  closeEmergency,
  setSelectedNodeId,
  handlePulseOverlaySubmit,
  handlePulseOverlayClose,
  handleCocoonStart,
  handleCocoonSkip,
  handleCocoonClose,
  handleNoiseSessionComplete,
  handleBreathingOverlayClose,
  activeNudge,
  handleNudgeToastClose,
  handleNudgeCtaAction,
}: CoreExperienceOverlaysProps) {
  const flags = useAppOverlayState((s) => s.flags);
  const pulseCheckState = useAppOverlayState((s) => s.pulseCheck);
  const setOverlay = useAppOverlayState((s) => s.setOverlay);

  const {
    gym: showGym,
    cocoon: showCocoon,
    noiseSilencingPulse: showNoiseSilencingPulse,
    consciousnessArchive: showConsciousnessArchive,
    breathing: showBreathing,
    onboarding: showOnboarding,
    journeyGuideChat: showJourneyGuideChat,
    welcomeToast: showWelcomeToast,
    nudgeToast: showNudgeToast,
    symptomsOverview: showSymptomsOverview,
    recoveryPlan: showRecoveryPlan,
  } = flags;

  return (
    <Suspense fallback={<AwarenessSkeleton />}>
      {showGym && isVisible("gym") && (
        <RelationshipGym
          onClose={() => setOverlay("gym", false)}
          onStartJourney={() => {
            setOverlay("gym", false);
            onNavigateToMap(); 
          }}
        />
      )}

      {showJourneyGuideChat && canShowAIChatbot && agentActions && isVisible("journeyGuideChat") && (
        <SafeAIChatbot
          agentContext={agentContext}
          agentActions={agentActions}
          systemPromptOverride={agentSystemPrompt}
          onOpenBreathing={() => setOverlay("breathing", true)}
          onNavigateToMap={onNavigateToMap}
          showLauncher={false}
          defaultOpen
          onRequestClose={() => setOverlay("journeyGuideChat", false)}
        />
      )}

      {showConsciousnessArchive && isVisible("consciousnessArchive") && (
        <ConsciousnessArchiveModal
          isOpen={true}
          onClose={() => setOverlay("consciousnessArchive", false)}
        />
      )}

      {pulseCheckState.isOpen && isVisible("pulseCheck") && (
        <SafePulseCheckModal
          isOpen={pulseCheckState.isOpen}
          context={pulseCheckState.context}
          onSubmit={handlePulseOverlaySubmit}
          onClose={handlePulseOverlayClose}
        />
      )}

      {showCocoon && isVisible("cocoon") && (
        <CocoonModeModal
          isOpen={showCocoon}
          onStart={handleCocoonStart}
          canSkip={true}
          onSkip={handleCocoonSkip}
          onClose={handleCocoonClose}
        />
      )}

      {showNoiseSilencingPulse && isVisible("noiseSilencingPulse") && (
        <MuteProtocol
          isOpen={showNoiseSilencingPulse}
          onClose={() => setOverlay("noiseSilencingPulse", false)}
          onSessionComplete={handleNoiseSessionComplete}
        />
      )}

      {showBreathing && isVisible("breathing") && <BreathingOverlay onClose={handleBreathingOverlayClose} />}

      {isEmergencyOpen && isVisible("emergency") && (
        <EmergencyOverlay
          onStartBreathing={() => setOverlay("breathing", true)}
          onStartScenario={() => {}}
          onOpenPowerBank={(nodeId: string) => {
            setSelectedNodeId(nodeId);
            closeEmergency();
          }}
        />
      )}

      {showOnboarding && isVisible("onboarding") && (
        <OnboardingFlow 
          onComplete={onOnboardingComplete} 
          initialMirrorName={storedMirrorName} 
        />
      )}

      <JourneyToast
        variant="onboarding_complete"
        visible={showWelcomeToast && isVisible("welcomeToast")}
        onClose={() => setOverlay("welcomeToast", false)}
      />

      <JourneyToast
        variant="nudge"
        visible={showNudgeToast && !!activeNudge && isVisible("nudgeToast")}
        nudgeData={activeNudge ?? undefined}
        onClose={handleNudgeToastClose}
        onCtaAction={handleNudgeCtaAction}
      />

      {showSymptomsOverview && isVisible("symptomsOverview") && (
        <SymptomsOverviewModal
          isOpen={showSymptomsOverview}
          onClose={() => setOverlay("symptomsOverview", false)}
        />
      )}

      {showRecoveryPlan && isVisible("recoveryPlan") && (
        <RecoveryPlanModal
          isOpen={showRecoveryPlan}
          onClose={() => setOverlay("recoveryPlan", false)}
        />
      )}
    </Suspense>
  );
});
