import { lazy, Suspense, memo, useState, useCallback, useEffect } from "react";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { Z_LAYERS } from "@/config/zIndices";
import type { Nudge } from "@/services/nudgeEngine";
import type { MirrorInsight } from "@/services/mirrorLogic";
import type { CognitiveBiasAlert } from "@/services/cognitiveBiasEngine";
import { dismissBiasAlert } from "@/services/cognitiveBiasEngine";
import { recordTruthEvent, onTruthMilestone } from "@/services/truthScoreEngine";
import type { TruthEventType } from "@/services/truthScoreEngine";
import { getReconnectionMessage, shouldTriggerRitual } from "@/data/reconnectionMessages";
import type { ReconnectionMessage } from "@/data/reconnectionMessages";

const AmbientRealityMode = lazy(() => import('@/modules/exploration/AmbientRealityMode').then((m) => ({ default: m.AmbientRealityMode })));
const TimeCapsuleVault = lazy(() => import('@/modules/action/TimeCapsuleVault').then((m) => ({ default: m.TimeCapsuleVault })));
const BlindCapsuleOpener = lazy(() => import('@/modules/action/BlindCapsuleOpener').then((m) => ({ default: m.BlindCapsuleOpener })));
const ChronicleOverlay = lazy(() => import('@/modules/gamification/ChronicleOverlay').then(m => ({ default: m.ChronicleOverlay })));
const SanctuaryLockdownExperience = lazy(() => import('@/modules/action/SanctuaryLockdownExperience').then(m => ({ default: m.SanctuaryLockdownExperience })));
const MirrorOverlay = lazy(() => import('@/modules/exploration/MirrorOverlay').then((m) => ({ default: m.MirrorOverlay })));
const GamificationNudgeToast = lazy(() => import('@/modules/growth/GamificationNudgeToast').then(m => ({ default: m.GamificationNudgeToast })));

// ⚔️ Truth Engine Components
const BiasAlertCard = lazy(() => import('@/modules/maraya/components/BiasAlertCard').then(m => ({ default: m.BiasAlertCard })));
const TruthScoreWidget = lazy(() => import('@/modules/maraya/components/TruthScoreWidget').then(m => ({ default: m.TruthScoreWidget })));
const PredictionJournalCard = lazy(() => import('@/modules/maraya/components/PredictionJournalCard').then(m => ({ default: m.PredictionJournalCard })));
const CollectivePulseWidget = lazy(() => import('@/modules/maraya/components/CollectivePulseWidget'));
const ReconnectionRitual = lazy(() => import('@/modules/maraya/components/ReconnectionRitual'));

interface AmbientOverlaysProps {
  screen: string;
  isVisible: (id: string) => boolean;
  activeNudge: Nudge | null;
  activeMirrorInsight: MirrorInsight | null;
  activeBiasAlerts: CognitiveBiasAlert[];
  handleNudgeToastClose: () => void;
  handleNudgeCtaAction: () => void;
  handleMirrorResolve: (insight: MirrorInsight) => void;
}

export const AmbientOverlays = memo(function AmbientOverlays({ 
  screen,
  isVisible,
  activeNudge,
  activeMirrorInsight,
  activeBiasAlerts,
  handleNudgeToastClose,
  handleNudgeCtaAction,
  handleMirrorResolve
}: AmbientOverlaysProps) {
  const flags = useAppOverlayState((s) => s.flags);
  const setOverlay = useAppOverlayState((s) => s.setOverlay);
  const [dismissedBiasIds, setDismissedBiasIds] = useState<Set<string>>(new Set());
  const [ritualMessage, setRitualMessage] = useState<ReconnectionMessage | null>(null);

  // Subscribe to truth milestones for Reconnection Ritual
  useEffect(() => {
    const unsub = onTruthMilestone((type: TruthEventType) => {
      if (shouldTriggerRitual(type)) {
        const msg = getReconnectionMessage(type);
        if (msg) setRitualMessage(msg);
      }
    });
    return unsub;
  }, []);

  const handleBiasDismiss = useCallback((alertId: string) => {
    dismissBiasAlert(alertId);
    recordTruthEvent("ignored_truth", "تجاهل تنبيه انحياز");
    setDismissedBiasIds(prev => new Set(prev).add(alertId));
  }, []);

  const visibleBiasAlerts = activeBiasAlerts.filter(a => !dismissedBiasIds.has(a.id));

  const {
    ambientReality: showAmbientReality,
    timeCapsuleVault: showTimeCapsuleVault,
    blindCapsuleOpener: showBlindCapsuleOpener,
    sovereignChronicle: showSovereignChronicle,
    sanctuary: showSanctuary,
    nudgeToast: showNudgeToast,
    mirrorOverlay: showMirrorOverlay,
  } = flags;

  return (
    <Suspense fallback={<AwarenessSkeleton />}>
      {showSanctuary && isVisible("sanctuary") && (
        <div 
          className="fixed inset-0 pointer-events-none" 
          style={{ zIndex: Z_LAYERS.TACTICAL_BACKDROP }}
        >
          <SanctuaryLockdownExperience 
            onExit={() => setOverlay("sanctuary", false)} 
          />
        </div>
      )}

      {showBlindCapsuleOpener && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <BlindCapsuleOpener />
        </Suspense>
      )}

      {showAmbientReality && isVisible("ambientReality") && (
        <AmbientRealityMode onClose={() => setOverlay("ambientReality", false)} />
      )}

      {showTimeCapsuleVault && isVisible("timeCapsuleVault") && (
        <TimeCapsuleVault onClose={() => setOverlay("timeCapsuleVault", false)} />
      )}

      {showSovereignChronicle && isVisible("sovereignChronicle") && (
        <ChronicleOverlay />
      )}

      {showNudgeToast && activeNudge && isVisible("nudgeToast") && (
        <Suspense fallback={null}>
          <GamificationNudgeToast />
        </Suspense>
      )}

      {showMirrorOverlay && isVisible("mirrorOverlay") && (
        <MirrorOverlay
          insight={activeMirrorInsight}
          onConfront={handleMirrorResolve}
          onDeny={handleMirrorResolve}
        />
      )}

      {/* ⚔️ Truth Engine: Bias Alert Cards — floating bottom-left */}
      {visibleBiasAlerts.length > 0 && (
        <Suspense fallback={null}>
          <div 
            className="fixed bottom-4 left-4 z-50 w-[380px] max-h-[80vh] overflow-y-auto space-y-3 no-scrollbar pointer-events-auto"
            dir="rtl"
          >
            {visibleBiasAlerts.slice(0, 2).map(alert => (
              <BiasAlertCard 
                key={alert.id}
                alert={alert}
                onDismiss={() => handleBiasDismiss(alert.id)}
              />
            ))}
          </div>
        </Suspense>
      )}

      {/* ⚔️ Truth Engine: Truth Score + Prediction Journal — only on map screens */}
      {(screen === "map" || screen === "dawayir") && (
        <Suspense fallback={null}>
          <div 
            className="fixed bottom-4 right-4 z-40 w-[320px] space-y-3 pointer-events-auto"
            dir="rtl"
          >
            <TruthScoreWidget compact />
            <PredictionJournalCard />
          </div>
        </Suspense>
      )}

      {/* 🌍 Collective Pulse Widget — only on map screens */}
      {(screen === "map" || screen === "dawayir") && (
        <Suspense fallback={null}>
          <CollectivePulseWidget />
        </Suspense>
      )}

      {/* 🕊️ Reconnection Ritual — fullscreen overlay */}
      {ritualMessage && (
        <Suspense fallback={null}>
          <ReconnectionRitual
            message={ritualMessage}
            onComplete={() => setRitualMessage(null)}
          />
        </Suspense>
      )}
    </Suspense>
  );
});
