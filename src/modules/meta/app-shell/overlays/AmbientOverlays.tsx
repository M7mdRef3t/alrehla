import { lazy, Suspense, memo } from "react";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { Z_LAYERS } from "@/config/zIndices";

const AmbientRealityMode = lazy(() => import('@/modules/exploration/AmbientRealityMode').then((m) => ({ default: m.AmbientRealityMode })));
const TimeCapsuleVault = lazy(() => import('@/modules/action/TimeCapsuleVault').then((m) => ({ default: m.TimeCapsuleVault })));
const BlindCapsuleOpener = lazy(() => import('@/modules/action/BlindCapsuleOpener').then((m) => ({ default: m.BlindCapsuleOpener })));
const ChronicleOverlay = lazy(() => import('@/modules/gamification/ChronicleOverlay').then(m => ({ default: m.ChronicleOverlay })));
const SanctuaryLockdownExperience = lazy(() => import('@/modules/action/SanctuaryLockdownExperience').then(m => ({ default: m.SanctuaryLockdownExperience })));
const MirrorOverlay = lazy(() => import('@/modules/exploration/MirrorOverlay').then((m) => ({ default: m.MirrorOverlay })));
const GamificationNudgeToast = lazy(() => import('@/modules/growth/GamificationNudgeToast').then(m => ({ default: m.GamificationNudgeToast })));

interface AmbientOverlaysProps {
  isVisible: (id: string) => boolean;
  activeNudge: any;
  activeMirrorInsight: any;
  handleNudgeToastClose: () => void;
  handleNudgeCtaAction: () => void;
  handleMirrorResolve: () => void;
}

export const AmbientOverlays = memo(function AmbientOverlays({ 
  isVisible,
  activeNudge,
  activeMirrorInsight,
  handleNudgeToastClose,
  handleNudgeCtaAction,
  handleMirrorResolve
}: AmbientOverlaysProps) {
  const flags = useAppOverlayState((s) => s.flags);
  const setOverlay = useAppOverlayState((s) => s.setOverlay);

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
    </Suspense>
  );
});
