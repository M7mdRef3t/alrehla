import { lazy, Suspense, memo, useCallback, useMemo, useState, useEffect, type ComponentProps } from "react";
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
import { signOut } from "../../services/authService";
import { type AppScreen } from "../../navigation/navigationMachine";

// â”€â”€ Module-level constants (created once, never re-allocated on render) â”€â”€

/** All valid AppScreen values â€” kept in sync with navigationMachine.ts */
const KNOWN_SCREENS = new Set<AppScreen>([
  "landing", "goal", "map", "guided", "mission", "tools",
  "settings", "enterprise", "guilt-court", "diplomacy",
  "oracle-dashboard", "armory", "survey", "exit-scripts",
  "grounding", "stories", "about", "insights", "quizzes",
  "behavioral-analysis", "resources",
  "profile",
]);

/** Type guard: narrows `string` â†’ `AppScreen` safely */
function isAppScreen(value: string): value is AppScreen {
  return KNOWN_SCREENS.has(value as AppScreen);
}

const SyncStatusUI = lazy(() => import("../SyncStatusUI").then((m) => ({ default: m.SyncStatusUI })));
const OnboardingWelcomeBubble = lazy(() =>
  import("../OnboardingWelcomeBubble").then((m) => ({ default: m.OnboardingWelcomeBubble }))
);
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
  onOpenLogin: () => void;
}

export const AppExperienceSurface = memo(function AppExperienceSurface({
  screen,
  isLandingScreen,
  showPulseCheck,
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
  onNavigateToMap,
  onOpenLogin
}: AppExperienceSurfaceProps) {
  const isLivePage = typeof window !== "undefined" && window.location.pathname.includes("dawayir-live");
  const actuallyShowingPulse = showPulseCheck && !isLivePage;
  const breadcrumbItems = useMemo(() => buildBreadcrumb(screen), [screen]);

  // â”€â”€ Scroll state for header-breadcrumb sync â”€â”€
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // â”€â”€ Header navigation handlers â”€â”€
  const handleHeaderNavigate = useCallback((id: string) => {
    // #1 - Special screens handled by specific props
    if (id === "profile") {
      mainContentProps.onOpenProfile?.();
      return;
    }

    // #2 - Standard AppScreen navigation
    if (isAppScreen(id)) {
      mainContentProps.onNavigate?.(id);
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn(`[AppExperienceSurface] Unknown nav target: "${id}" â€” ignoring.`);
    }
  }, [mainContentProps]);

  const handleHeaderLogin = useCallback(() => {
    onOpenLogin();
  }, [onOpenLogin]);

  const handleLogout = useCallback(async () => {
    await signOut(); // centralised â€” errors swallowed inside signOut()
    mainContentProps.onNavigate?.("landing");
  }, [mainContentProps]);

  return (
    <>
      {screen !== "map" && (
        <PlatformHeader
          activeScreen={screen}
          onNavigate={handleHeaderNavigate}
          onLogin={handleHeaderLogin}
          onLogout={handleLogout}
        />
      )}
      {screen !== "map" && (
        <PlatformTabBar
          activeScreen={screen}
          onNavigate={handleHeaderNavigate}
          onLogin={handleHeaderLogin}
        />
      )}
      {screen !== "map" && (
        <Suspense fallback={null}>
          <NotificationEnableButton />
        </Suspense>
      )}
      {screen !== "landing" && (
        <>
          <div
            className="fixed right-0 left-0 z-40 px-6 lg:px-10 py-2 hidden md:block transition-all duration-500"
            style={{ top: scrolled ? "64px" : "80px" }}
          >
            <PlatformBreadcrumb items={breadcrumbItems} onNavigate={handleHeaderNavigate} />
          </div>
          <div className="fixed top-[calc(env(safe-area-inset-top)+0.5rem)] right-0 left-0 z-40 px-4 py-1.5 md:hidden">
            <PlatformBreadcrumb items={breadcrumbItems} onNavigate={handleHeaderNavigate} />
          </div>
        </>
      )}
      <div
        className={`min-h-screen flex flex-col transition-colors relative isolate ${screen !== "landing" ? "overflow-visible" : ""}`}
        dir="rtl"
        style={{ background: "var(--app-bg)" }}
      >
        {isFeaturePreviewSession && (
          <button
            type="button"
            onClick={onBackToFeatureFlags}
            className="fixed z-50 top-4 left-4 rounded-full border px-4 py-2 text-xs font-semibold transition-colors bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-teal-500/50"
            title={previewedFeature ? `الرجوع من معاينة: ${previewedFeature}` : "الرجوع إلى Feature Flags"}
          >
            الرجوع إلى Feature Flags
          </button>
        )}
        <div className="nebula-bg" aria-hidden="true" />
        <AppTransientChromeHost {...transientChromeProps} />
        <AppChromeShell {...chromeShellProps}>
          <main
            className={`flex-1 min-w-0 flex flex-col ${screen === "map" ? "pb-0" : "pb-14 md:pb-0"} ${
              screen !== "landing" && screen !== "map" ? "pt-[110px] md:pt-[140px]" : ""
            } ${actuallyShowingPulse ? "opacity-0 pointer-events-none select-none" : ""} overflow-visible`}
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
                  {screen !== "map" && showSystemOverclockControls && (
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
                            <button onClick={onOpenOracleDashboard} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 text-right">رادار السيادة</button>
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

