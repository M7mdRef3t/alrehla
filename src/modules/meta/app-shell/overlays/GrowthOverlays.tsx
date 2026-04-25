import { lazy, Suspense, memo } from "react";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';

// Lazy imports for Growth Overlays
const ShareStats = lazy(() => import('@/modules/growth/ShareStats').then((m) => ({ default: m.ShareStats })));
const EducationalLibrary = lazy(() => import('@/modules/growth/EducationalLibrary').then((m) => ({ default: m.EducationalLibrary })));
const InsightsLibrary = lazy(() => import('@/modules/growth/InsightsLibrary').then((m) => ({ default: m.InsightsLibrary })));
const Goals2025Dashboard = lazy(() => import('@/modules/growth/Goals2025Dashboard').then((m) => ({ default: m.Goals2025Dashboard })));
const PersonalProgressDashboard = lazy(() => import('@/modules/exploration/PersonalProgressDashboard').then((m) => ({ default: m.PersonalProgressDashboard })));
const WeeklyActionPlanModal = lazy(() => import('@/modules/action/WeeklyActionPlanModal').then((m) => ({ default: m.WeeklyActionPlanModal })));
const MonthlyReadingPlanModal = lazy(() => import('@/modules/action/MonthlyReadingPlanModal').then((m) => ({ default: m.MonthlyReadingPlanModal })));
const AwarenessGrowthDashboard = lazy(() => import("../../AwarenessGrowthDashboard").then((m) => ({ default: m.AwarenessGrowthDashboard })));
const CommunityImpactDashboard = lazy(() => import('@/modules/growth/CommunityImpactDashboard').then((m) => ({ default: m.CommunityImpactDashboard })));
const RelationshipAnalysisModal = lazy(() => import('@/modules/exploration/RelationshipAnalysisModal').then((m) => ({ default: m.RelationshipAnalysisModal })));
const WisdomMatrixHub = lazy(() => import('@/modules/growth/WisdomMatrixHub').then(m => ({ default: m.WisdomMatrixHub })));
const ImmersionPathDetails = lazy(() => import('@/modules/growth/ImmersionPathDetails').then(m => ({ default: m.ImmersionPathDetails })));
const VanguardCollective = lazy(() => import('@/modules/growth/VanguardCollective').then(m => ({ default: m.VanguardCollective })));
const Achievements = lazy(() => import('@/modules/growth/Achievements').then((m) => ({ default: m.Achievements })));
const TrackingDashboard = lazy(() => import("../../TrackingDashboard").then((m) => ({ default: m.TrackingDashboard })));
const AtlasDashboard = lazy(() => import("../../AtlasDashboard").then((m) => ({ default: m.AtlasDashboard })));
const AchievementToast = lazy(() => import('@/modules/growth/AchievementToast').then((m) => ({ default: m.AchievementToast })));
const PastSessionsLogModal = lazy(() => import("../../PastSessionsLogModal").then(m => ({ default: m.PastSessionsLogModal })));
const RewardStoreModal = lazy(() => import('@/modules/growth/RewardStoreDashboard').then(m => ({ default: m.RewardStoreModal })));
const TajmeedHub = lazy(() => import('@/modules/gamification/EvolutionHub').then(m => ({ default: m.TajmeedHub })));

interface GrowthOverlaysProps {
  isVisible: (id: string) => boolean;
  achievementToastVisible: boolean;
}

export const GrowthOverlays = memo(function GrowthOverlays({ isVisible, achievementToastVisible }: GrowthOverlaysProps) {
  const flags = useAppOverlayState((s) => s.flags);
  const setOverlay = useAppOverlayState((s) => s.setOverlay);

  const {
    shareStats: showShareStats,
    library: showLibrary,
    insightsLibrary: showInsightsLibrary,
    goals2025: showGoals2025,
    personalProgress: showPersonalProgress,
    weeklyActionPlan: showWeeklyActionPlan,
    readingPlan: showReadingPlan,
    awarenessGrowth: showAwarenessGrowth,
    communityImpact: showCommunityImpact,
    relationshipAnalysis: showRelationshipAnalysis,
    wisdomMatrix: showWisdomMatrix,
    immersionPath: showImmersionPath,
    vanguardCollective: showVanguardCollective,
    achievements: showAchievements,
    trackingDashboard: showTrackingDashboard,
    atlasDashboard: showAtlasDashboard,
    pastSessionsLog: showPastSessionsLog,
    rewardStore: showRewardStore,
    evolutionHub: showEvolutionHub,
  } = flags;

  return (
    <Suspense fallback={<AwarenessSkeleton />}>
      {achievementToastVisible && isVisible("achievements") && <AchievementToast />}

      {showShareStats && isVisible("shareStats") && (
        <ShareStats isOpen={showShareStats} onClose={() => setOverlay("shareStats", false)} />
      )}

      {showLibrary && isVisible("library") && (
        <EducationalLibrary isOpen={showLibrary} onClose={() => setOverlay("library", false)} />
      )}

      {showInsightsLibrary && isVisible("insightsLibrary") && (
        <InsightsLibrary isOpen={showInsightsLibrary} onClose={() => setOverlay("insightsLibrary", false)} />
      )}

      {showGoals2025 && isVisible("goals2025") && (
        <Goals2025Dashboard isOpen={showGoals2025} onClose={() => setOverlay("goals2025", false)} />
      )}

      {showPersonalProgress && isVisible("personalProgress") && (
        <PersonalProgressDashboard isOpen={showPersonalProgress} onClose={() => setOverlay("personalProgress", false)} />
      )}

      {showWeeklyActionPlan && isVisible("weeklyActionPlan") && (
        <WeeklyActionPlanModal isOpen={showWeeklyActionPlan} onClose={() => setOverlay("weeklyActionPlan", false)} />
      )}

      {showReadingPlan && isVisible("readingPlan") && (
        <MonthlyReadingPlanModal isOpen={showReadingPlan} onClose={() => setOverlay("readingPlan", false)} />
      )}

      {showAwarenessGrowth && isVisible("awarenessGrowth") && (
        <AwarenessGrowthDashboard isOpen={showAwarenessGrowth} onClose={() => setOverlay("awarenessGrowth", false)} />
      )}

      {showCommunityImpact && isVisible("communityImpact") && (
        <CommunityImpactDashboard isOpen={showCommunityImpact} onClose={() => setOverlay("communityImpact", false)} />
      )}

      {showRelationshipAnalysis && isVisible("relationshipAnalysis") && (
        <RelationshipAnalysisModal isOpen={showRelationshipAnalysis} onClose={() => setOverlay("relationshipAnalysis", false)} />
      )}

      {showWisdomMatrix && isVisible("wisdomMatrix") && (
        <WisdomMatrixHub />
      )}

      {showImmersionPath && isVisible("immersionPath") && (
        <ImmersionPathDetails />
      )}

      {showVanguardCollective && isVisible("vanguardCollective") && (
        <VanguardCollective />
      )}

      {showAchievements && isVisible("achievements") && (
        <Achievements onClose={() => setOverlay("achievements", false)} />
      )}

      {showTrackingDashboard && isVisible("trackingDashboard") && (
        <TrackingDashboard
          isOpen={showTrackingDashboard}
          onClose={() => setOverlay("trackingDashboard", false)}
        />
      )}

      {showAtlasDashboard && isVisible("atlasDashboard") && (
        <AtlasDashboard
          isOpen={showAtlasDashboard}
          onClose={() => setOverlay("atlasDashboard", false)}
        />
      )}

      {showPastSessionsLog && isVisible("pastSessionsLog") && (
        <PastSessionsLogModal 
          isOpen={showPastSessionsLog}
          onClose={() => setOverlay("pastSessionsLog", false)}
        />
      )}

      {showRewardStore && isVisible("rewardStore") && (
        <RewardStoreModal 
          isOpen={showRewardStore}
          onClose={() => setOverlay("rewardStore", false)}
        />
      )}

      {showEvolutionHub && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOverlay("evolutionHub", false); }}
        >
          <TajmeedHub 
            onClose={() => setOverlay("evolutionHub", false)}
          />
        </div>
      )}
    </Suspense>
  );
});
