import { Suspense, lazy, type ReactNode } from "react"; // Cache buster to clear stale LogoLab.tsx import
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { getHref, getPathname, pushUrl } from "@/services/navigation";

const LegalPage = lazy(() => import("../LegalPage").then((m) => ({ default: m.LegalPage })));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const CoachDashboard = lazy(() => import("../CoachDashboard").then((m) => ({ default: m.CoachDashboard })));
const AdminOverviewPanel = lazy(() =>
  import('@/components/admin/dashboard/Overview/OverviewPanel').then((m) => ({ default: m.OverviewPanel }))
);
const DawayirApp = lazy(() => import("@/modules/dawayir/DawayirApp").then((m) => ({ default: m.default })));
const DebugLogoLab = lazy(() => import("../debug/DebugLogoLab"));

interface AppShellRouteGateProps {
  isAdminRoute: boolean;
  isAnalyticsRoute: boolean;
  isOwnerWatcher: boolean;
  isFeaturePreviewSession: boolean;
  previewedFeature: string | null;
  goBackToFeatureFlags: () => void;
  onExitAdminRoute: () => void;
  children: ReactNode;
}

export function AppShellRouteGate({
  isAdminRoute,
  isAnalyticsRoute,
  isOwnerWatcher,
  isFeaturePreviewSession,
  previewedFeature,
  goBackToFeatureFlags,
  onExitAdminRoute,
  children
}: AppShellRouteGateProps) {
  const pathname = getPathname();
  const isDawayirRoute = pathname === "/dawayir" || pathname === "/dawayir/";
  const isAdminPathname = pathname.startsWith("/admin");
  const isAnalyticsPathname = pathname === "/analytics";
  const isCoachPathname = getHref().includes("/coach");

  if (pathname === "/privacy" || pathname === "/terms") {
    return <LegalPage type={pathname === "/privacy" ? "privacy" : "terms"} />;
  }

  if (pathname === "/debug-logo-lab") {
    return (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#050A14" }} />}>
        <DebugLogoLab />
      </Suspense>
    );
  }

  if (isDawayirRoute) {
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
        <DawayirApp />
      </Suspense>
    );
  }

  if ((isAnalyticsRoute || isAnalyticsPathname) && isOwnerWatcher) {
    return (
      <div
        className="min-h-screen min-h-[100dvh] w-full overflow-auto isolate relative"
        style={{ background: "var(--space-void)" }}
        dir="rtl"
      >
        {isFeaturePreviewSession && (
          <button
            type="button"
            onClick={goBackToFeatureFlags}
            className="fixed z-50 top-4 left-4 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
            style={{
              borderColor: "var(--soft-teal)",
              background: "rgba(255, 255, 255, 0.95)",
              color: "var(--space-deep)"
            }}
            title={previewedFeature ? `الرجوع من معاينة: ${previewedFeature}` : "الرجوع إلى Feature Flags"}
          >
            الرجوع إلى Feature Flags
          </button>
        )}
        <div className="nebula-bg absolute inset-0 -z-10" aria-hidden="true" />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--space-void)" }} />}>
          <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            <AdminOverviewPanel />
          </div>
        </Suspense>
      </div>
    );
  }

  if (isCoachPathname) {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--space-void)" }} />}>
        <CoachDashboard isOpen={true} onClose={() => pushUrl("/")} />
      </Suspense>
    );
  }

  if (isAdminRoute || isAdminPathname) {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--space-void)" }} />}>
        <AdminDashboard onExit={onExitAdminRoute} />
      </Suspense>
    );
  }

  return <>{children}</>;
}
