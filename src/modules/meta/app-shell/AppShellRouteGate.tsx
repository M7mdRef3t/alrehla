import { Suspense, lazy, type ReactNode } from "react"; // Cache buster to clear stale LogoLab.tsx import
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { getHref, getPathname, pushUrl } from "@/services/navigation";
import type { AppScreen } from "@/navigation/navigationMachine";

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
  screen?: AppScreen;
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
  screen,
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
        className="min-h-screen min-h-[100dvh] w-full overflow-auto isolate relative bg-[var(--page-bg)]"
        dir="rtl"
      >
        {isFeaturePreviewSession && (
          <button
            type="button"
            onClick={goBackToFeatureFlags}
            className="fixed z-50 top-4 left-4 rounded-full border px-4 py-2 text-xs font-semibold transition-colors border-[color:var(--soft-teal)] bg-[rgba(255,255,255,0.95)] text-[var(--space-deep)]"
            title={previewedFeature ? `الرجوع من معاينة: ${previewedFeature}` : "الرجوع إلى Feature Flags"}
          >
            الرجوع إلى Feature Flags
          </button>
        )}
        <div className="nebula-bg absolute inset-0 -z-10" aria-hidden="true" />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]" />}>
          <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            <AdminOverviewPanel />
          </div>
        </Suspense>
      </div>
    );
  }

  if (isCoachPathname) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[var(--page-bg)]" />}>
        <CoachDashboard isOpen={true} onClose={() => pushUrl("/")} />
      </Suspense>
    );
  }

  // A tool is "active over admin" only when the admin intentionally opened it
  // (e.g. via a hash navigation). A stale `screen` value in the zustand store
  // (e.g. "map" from a previous `start_recovery`) must NOT hide the dashboard.
  const hasExplicitToolHash = typeof window !== "undefined" && window.location.hash.length > 1;
  const isToolActive = isAdminRoute && screen && (screen as string) !== "landing" && (screen as string) !== "goal" && (!isAdminPathname || hasExplicitToolHash);

  return (
    <>
      {/* Admin Layer - Only rendered if we're on an admin route or starting with /admin */}
      {(isAdminRoute || isAdminPathname) && (
        <div className={isToolActive ? "hidden opacity-0 pointer-events-none" : "block min-h-screen"}>
          <Suspense fallback={<div className="min-h-screen bg-[var(--page-bg)]" />}>
            <AdminDashboard onExit={onExitAdminRoute} />
          </Suspense>
        </div>
      )}

      {/* App / Tool Layer - Always mounted at / or when a tool is active over Admin */}
      {(!isAdminRoute || isToolActive) && (
        <div className={isToolActive ? "fixed inset-0 z-50 bg-[#0B0F19] overflow-y-auto" : "contents"}>
          {children}
        </div>
      )}
    </>
  );
}
