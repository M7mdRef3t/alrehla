import { lazy, Suspense, memo, useCallback, type ComponentProps } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { ErrorBoundary } from "../ErrorBoundary";
import { InstallHintBanner } from "../InstallHintBanner";
import { AppChromeShell } from "./AppChromeShell";
import { AppMainExperienceContent } from "./AppMainExperienceContent";
import { AppOverlayHost } from "./AppOverlayHost";
import { AppTransientChromeHost } from "./AppTransientChromeHost";
import { PlatformHeader } from "../PlatformHeader";
import { PlatformTabBar } from "../PlatformTabBar";
import { PlatformBreadcrumb, buildBreadcrumb } from "../PlatformBreadcrumb";
import { supabase } from "../../services/supabaseClient";
import type { AppScreen } from "../../navigation/navigationMachine";

const SyncStatusUI = lazy(() => import("../SyncStatusUI").then((m) => ({ default: m.SyncStatusUI })));
const OnboardingWelcomeBubble = lazy(() =>
  import("../OnboardingWelcomeBubble").then((m) => ({ default: m.OnboardingWelcomeBubble }))
);
const StartupSequence = lazy(() => import("../StartupSequence").then((m) => ({ default: m.StartupSequence })));
const AscensionRitual = lazy(() =>
  import("../Oracle/AscensionRitual").then((m) => ({ default: m.AscensionRitual }))
);
const GraphEventToast = lazy(() => import("../GraphEventToast").then((m) => ({ default: m.GraphEventToast })));
const GlobalToast = lazy(() => import("../GlobalToast").then((m) => ({ default: m.GlobalToast })));
const NotificationEnableButton = lazy(() => import("../NotificationEnableButton").then((m) => ({ default: m.NotificationEnableButton })));

type TransientChromeProps = ComponentProps<typeof AppTransientChromeHost>;
type ChromeShellProps = Omit<ComponentProps<typeof AppChromeShell>, "children">;
type MainContentProps = ComponentProps<typeof AppMainExperienceContent>;
type OverlayHostProps = ComponentProps<typeof AppOverlayHost>;

interface AppExperienceSurfaceProps {
  screen: AppScreen;
  isLandingScreen: boolean;
  showPulseCheck: boolean;
  showStartup: boolean;
  onStartupComplete: () => void;
  isFeaturePreviewSession: boolean;
  previewedFeature: string | null;
  onBackToFeatureFlags: () => void;
  transientChromeProps: TransientChromeProps;
  chromeShellProps: ChromeShellProps;
  mainContentProps: MainContentProps;
  overlayHostProps: OverlayHostProps;
  welcome: MainContentProps["welcome"];
  onClearWelcome: MainContentProps["onClearWelcome"];
  showSystemOverclockControls: boolean;
  showSystemOverclockPanel: boolean;
  onToggleSystemOverclockPanel: () => void;
  onOpenConsciousnessArchive: () => void;
  onOpenAmbientReality: () => void;
  onOpenTimeCapsuleVault: () => void;
  onOpenOracleDashboard: () => void;
  onNavigateToMap: () => void;
}

export const AppExperienceSurface = memo(function AppExperienceSurface({
  screen,
  isLandingScreen,
  showPulseCheck,
  showStartup,
  onStartupComplete,
  isFeaturePreviewSession,
  previewedFeature,
  onBackToFeatureFlags,
  transientChromeProps,
  chromeShellProps,
  mainContentProps,
  overlayHostProps,
  welcome,
  onClearWelcome,
  showSystemOverclockControls,
  showSystemOverclockPanel,
  onToggleSystemOverclockPanel,
  onOpenConsciousnessArchive,
  onOpenAmbientReality,
  onOpenTimeCapsuleVault,
  onOpenOracleDashboard,
  onNavigateToMap
}: AppExperienceSurfaceProps) {
  const isLivePage = typeof window !== "undefined" && window.location.pathname.includes("dawayir-live");
  const actuallyShowingPulse = showPulseCheck && !isLivePage;

  // ── Header navigation handlers ──
  const handleHeaderNavigate = useCallback((id: string) => {
    // Map header nav IDs to app screens / actions
    if (id === "home" || id === "landing") {
      mainContentProps.onNavigate?.("landing" as AppScreen);
    } else if (id === "tools") {
      mainContentProps.onNavigate?.("tools" as AppScreen);
    } else if (id === "settings") {
      mainContentProps.onNavigate?.("settings" as AppScreen);
    } else if (id === "stories") {
      mainContentProps.onNavigate?.("stories" as AppScreen);
    } else if (id === "about") {
      mainContentProps.onNavigate?.("about" as AppScreen);
    } else if (id === "profile") {
      mainContentProps.onOpenProfile?.();
    }
  }, [mainContentProps]);

  const handleHeaderLogin = useCallback(() => {
    mainContentProps.onStartJourney?.();
  }, [mainContentProps]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase?.auth.signOut();
    } catch {
      // fail silently
    }
    // #4 — Redirect to landing after logout
    mainContentProps.onNavigate?.("landing" as AppScreen);
  }, [mainContentProps]);

  return (
    <>
      {/* ── Global platform header (desktop) ── */}
      <PlatformHeader
        activeScreen={screen}
        onNavigate={handleHeaderNavigate}
        onLogin={handleHeaderLogin}
        onLogout={handleLogout}
      />
      {/* ── Mobile bottom tab bar ── */}
      <PlatformTabBar
        activeScreen={screen}
        onNavigate={handleHeaderNavigate}
        onLogin={handleHeaderLogin}
      />
      {/* ── Push Notification prompt (floating pill) ── */}
      <Suspense fallback={null}>
        <NotificationEnableButton />
      </Suspense>
      {/* ── Breadcrumb: only on inner screens (not landing) ── */}
      {screen !== "landing" && (
        <>
          {/* Desktop breadcrumb below header */}
          <div className="fixed top-16 right-0 left-0 z-40 px-6 lg:px-10 py-2 hidden md:block">
            <PlatformBreadcrumb
              items={buildBreadcrumb(screen)}
              onNavigate={handleHeaderNavigate}
            />
          </div>
          {/* Mobile breadcrumb above content, below status bar */}
          <div className="fixed top-[calc(env(safe-area-inset-top)+0.5rem)] right-0 left-0 z-40 px-4 py-1.5 md:hidden">
            <PlatformBreadcrumb
              items={buildBreadcrumb(screen)}
              onNavigate={handleHeaderNavigate}
            />
          </div>
        </>
      )}
      <div
        className={`min-h-screen flex flex-col transition-colors relative isolate ${screen !== "landing" ? "overflow-visible" : ""}`}
        dir="rtl"
        style={{ background: "var(--space-void)" }}
      >
        {showStartup && screen !== "landing" && (
          <StartupSequence onComplete={onStartupComplete} />
        )}
        {isFeaturePreviewSession && (
          <button
            type="button"
            onClick={onBackToFeatureFlags}
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
        <div className="nebula-bg" aria-hidden="true" />
        <AppTransientChromeHost {...transientChromeProps} />
        <AppChromeShell {...chromeShellProps}>
          <main
            className={`flex-1 min-w-0 flex flex-col pb-14 md:pb-0 ${actuallyShowingPulse ? "opacity-0 pointer-events-none select-none" : ""} overflow-visible`}
            aria-hidden={actuallyShowingPulse}
          >
            <InstallHintBanner />
            <SyncStatusUI />
            {welcome?.source === "offline_intervention" && (
              <div className="fixed z-[75] top-[calc(env(safe-area-inset-top)+3.5rem)] left-1/2 -translate-x-1/2 w-[min(680px,calc(100%-1.25rem))] pointer-events-none">
                <div className="pointer-events-auto">
                  <OnboardingWelcomeBubble
                    message={welcome.message}
                    source={welcome.source}
                    onClose={onClearWelcome}
                   />
                </div>
              </div>
            )}
            <Suspense fallback={<div className="text-sm" style={{ color: "var(--text-muted)" }}>...جاري التحميل</div>}>
              <ErrorBoundary
                fallback={
                  <div className="min-h-[260px] w-full flex items-center justify-center p-6">
                    <div className="text-center space-y-3">
                      <h3 className="text-lg font-bold text-orange-400">حدث خطأ في مسار الرحلة</h3>
                      <p className="text-sm text-slate-400">جلسة دواير معزولة. تقدر ترجع للخريطة فورًا بدون إعادة تحميل.</p>
                      <button
                        type="button"
                        onClick={onNavigateToMap}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors"
                      >
                        العودة لدواير
                      </button>
                    </div>
                  </div>
                }
              >
                <div
                  className={`min-w-0 flex transition-all duration-300 ease-in-out ${isLandingScreen ? "flex-col" : "flex-1 flex-col w-full h-full"}`}
                >
                  {showSystemOverclockControls && (
                    <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3 pointer-events-auto">
                      <AnimatePresence>
                        {showSystemOverclockPanel && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 20 }}
                            className="glass-heavy flex flex-col gap-2 p-3 border-amber-500/30 min-w-[140px]"
                          >
                            <button onClick={onOpenConsciousnessArchive} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-teal-400 border border-teal-500/20 rounded-xl hover:bg-teal-500/10 text-right">Archive</button>
                            <button onClick={onOpenAmbientReality} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 text-right">Ambient</button>
                            <button onClick={onOpenTimeCapsuleVault} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 text-right">Vault</button>
                            <button onClick={onOpenOracleDashboard} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 text-right">Oracle</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggleSystemOverclockPanel}
                        className="w-12 h-12 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center text-slate-950 border-2 border-slate-900 z-[61]"
                      >
                        <Cpu size={20} className={showSystemOverclockPanel ? "animate-spin" : "animate-pulse"} />
                      </motion.button>
                    </div>
                  )}
                  <AppMainExperienceContent {...mainContentProps} />
                </div>
              </ErrorBoundary>
            </Suspense>
          </main>
          <AppOverlayHost {...overlayHostProps} />
        </AppChromeShell>
        <AscensionRitual />
      </div>
      <GlobalToast />
      <GraphEventToast />
    </>
  );
});
