import { lazy, Suspense, memo } from "react";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import type { FeedbackSubmission } from "../../FeedbackModal";

const DataManagement = lazy(() => import("../../DataManagement").then((m) => ({ default: m.DataManagement })));
const NotificationSettings = lazy(() => import("../../NotificationSettings").then((m) => ({ default: m.NotificationSettings })));
const ThemeSettings = lazy(() => import("../../ThemeSettings").then((m) => ({ default: m.ThemeSettings })));
const FeedbackModal = lazy(() => import("../../FeedbackModal").then((m) => ({ default: m.FeedbackModal })));
const FaqScreen = lazy(() => import("../../FaqScreen").then((m) => ({ default: m.FaqScreen })));
const PremiumBridgeModal = lazy(() => import("../../PremiumBridgeModal").then((m) => ({ default: m.PremiumBridgeModal })));
const AdvancedToolsModal = lazy(() => import('@/modules/action/AdvancedToolsModal').then((m) => ({ default: m.AdvancedToolsModal })));
const ClassicRecoveryModal = lazy(() => import('@/modules/action/ClassicRecoveryModal').then((m) => ({ default: m.ClassicRecoveryModal })));
const ManualPlacementModal = lazy(() => import('@/modules/action/ManualPlacementModal').then((m) => ({ default: m.ManualPlacementModal })));
const GoogleAuthModal = lazy(() => import('@/modules/exploration/GoogleAuthModal').then((m) => ({ default: m.GoogleAuthModal })));
const FeatureLockedModal = lazy(() => import("../../FeatureLockedModal").then((m) => ({ default: m.FeatureLockedModal })));

interface SystemOverlaysProps {
  isVisible: (id: string) => boolean;
  onFeedbackSubmit: (payload: FeedbackSubmission) => Promise<void> | void;
}

export const SystemOverlays = memo(function SystemOverlays({ isVisible, onFeedbackSubmit }: SystemOverlaysProps) {
  const flags = useAppOverlayState((s) => s.flags);
  const setOverlay = useAppOverlayState((s) => s.setOverlay);
  const postAuthIntent = useAppOverlayState((s) => s.postAuthIntent);
  const setAuthIntent = useAppOverlayState((s) => s.setAuthIntent);
  const lockedFeature = useAppOverlayState((s) => s.lockedFeature);
  const setLockedFeature = useAppOverlayState((s) => s.setLockedFeature);

  const {
    dataManagement: showDataManagement,
    ownerDataTools: showOwnerDataTools,
    notificationSettings: showNotificationSettings,
    themeSettings: showThemeSettings,
    feedback: showFeedback,
    faq: showFaq,
    premiumBridge: showPremiumBridge,
    advancedTools: showAdvancedTools,
    classicRecovery: showClassicRecovery,
    manualPlacement: showManualPlacement,
    authModal: showAuthModal,
  } = flags;

  return (
    <Suspense fallback={<AwarenessSkeleton />}>
      {showDataManagement && isVisible("dataManagement") && (
        <DataManagement
          isOpen={showDataManagement}
          onClose={() => setOverlay("dataManagement", false)}
          accountOnly
        />
      )}

      {showOwnerDataTools && isVisible("ownerDataTools") && (
        <DataManagement
          isOpen={showOwnerDataTools}
          onClose={() => setOverlay("ownerDataTools", false)}
          accountOnly={false}
        />
      )}

      {showNotificationSettings && isVisible("notificationSettings") && (
        <NotificationSettings
          isOpen={showNotificationSettings}
          onClose={() => setOverlay("notificationSettings", false)}
        />
      )}

      {showThemeSettings && isVisible("themeSettings") && (
        <ThemeSettings
          isOpen={showThemeSettings}
          onClose={() => setOverlay("themeSettings", false)}
        />
      )}

      {showFeedback && isVisible("feedback") && (
        <FeedbackModal
          isOpen={showFeedback}
          onClose={() => setOverlay("feedback", false)}
          onSubmit={onFeedbackSubmit}
        />
      )}

      {showFaq && isVisible("faq") && <FaqScreen onClose={() => setOverlay("faq", false)} />}

      {showPremiumBridge && isVisible("premiumBridge") && (
        <PremiumBridgeModal />
      )}

      {showAdvancedTools && isVisible("advancedTools") && (
        <AdvancedToolsModal
          isOpen={showAdvancedTools}
          onClose={() => setOverlay("advancedTools", false)}
        />
      )}

      {showClassicRecovery && isVisible("classicRecovery") && (
        <ClassicRecoveryModal
          isOpen={showClassicRecovery}
          onClose={() => setOverlay("classicRecovery", false)}
        />
      )}

      {showManualPlacement && isVisible("manualPlacement") && (
        <ManualPlacementModal
          isOpen={showManualPlacement}
          onClose={() => setOverlay("manualPlacement", false)}
        />
      )}

      {lockedFeature != null && (
        <FeatureLockedModal
          isOpen={lockedFeature != null}
          featureKey={lockedFeature}
          onClose={() => setLockedFeature(null)}
        />
      )}

      {postAuthIntent && isVisible("authModal") && (
        <GoogleAuthModal
          isOpen={showAuthModal}
          intent={postAuthIntent}
          onClose={() => {
            setOverlay("authModal", false);
            setAuthIntent(null);
          }}
          onNotNow={() => {
            setOverlay("authModal", false);
            setAuthIntent(null);
          }}
        />
      )}
    </Suspense>
  );
});
