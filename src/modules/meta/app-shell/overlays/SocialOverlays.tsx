import { lazy, Suspense, memo } from "react";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';

const CircleGrowthDashboard = lazy(() => import("../../CircleGrowthDashboard").then((m) => ({ default: m.CircleGrowthDashboard })));
const RecoveryPathwaysModal = lazy(() => import('@/modules/growth/RecoveryPathwaysModal').then(m => ({ default: m.RecoveryPathwaysModal })));
const PrivateCircleInvitationModal = lazy(() => import('@/modules/meta/PrivateCircleInvitationModal').then(m => ({ default: m.PrivateCircleInvitationModal })));
const DuoCommunityDashboard = lazy(() => import('@/modules/growth/DuoCommunityDashboard').then(m => ({ default: m.DuoCommunityDashboard })));

interface SocialOverlaysProps {
  isVisible: (id: string) => boolean;
}

export const SocialOverlays = memo(function SocialOverlays({ isVisible }: SocialOverlaysProps) {
  const flags = useAppOverlayState((s) => s.flags);
  const setOverlay = useAppOverlayState((s) => s.setOverlay);

  const {
    circleGrowth: showCircleGrowth,
    recoveryPathways: showRecoveryPathways,
    privateCircleInvitation: showPrivateCircleInvitation,
    duoCommunity: showDuoCommunity,
  } = flags;

  return (
    <Suspense fallback={<AwarenessSkeleton />}>
      {showCircleGrowth && isVisible("circleGrowth") && (
        <CircleGrowthDashboard 
          isOpen={showCircleGrowth}
          onClose={() => setOverlay("circleGrowth", false)}
        />
      )}
      
      {showRecoveryPathways && isVisible("recoveryPathways") && (
        <RecoveryPathwaysModal 
          isOpen={showRecoveryPathways}
          onClose={() => setOverlay("recoveryPathways", false)}
        />
      )}

      {showPrivateCircleInvitation && isVisible("privateCircleInvitation") && (
        <PrivateCircleInvitationModal 
          isOpen={showPrivateCircleInvitation}
          onClose={() => setOverlay("privateCircleInvitation", false)}
        />
      )}

      {showDuoCommunity && isVisible("duoCommunity") && (
        <DuoCommunityDashboard 
          isOpen={showDuoCommunity}
          onClose={() => setOverlay("duoCommunity", false)}
        />
      )}
    </Suspense>
  );
});
