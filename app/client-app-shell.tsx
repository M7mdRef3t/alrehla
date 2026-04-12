"use client";

import { useCallback, useEffect, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { AwarenessSkeleton } from "@/modules/meta/AwarenessSkeleton";
import { ErrorBoundary } from "@/modules/action/ErrorBoundary";
import { initAnalytics, trackPageView, trackLandingView } from "@/services/analytics";
import { initMonitoring } from "@/services/monitoring";
import { runtimeEnv } from "@/config/runtimeEnv";
import { applyDesignSystemTokens } from "@/services/designSystemTokens";
import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import { AnalyticsConsentBanner } from "@/modules/meta/AnalyticsConsentBanner";
import { AnalyticsDiagnosticsOverlay } from "@/modules/meta/AnalyticsDiagnosticsOverlay";
import { PlatformHeader } from "@/modules/meta/PlatformHeader";
import type { PostAuthIntent } from "@/utils/postAuthIntent";
import { hasRevenueAccess } from "@/services/revenueAccess";
import type { Data } from "@measured/puck";

const App = dynamic(() => import("@/App"), { ssr: false });
const Landing = dynamic(() => import("@/modules/meta/Landing").then((m) => m.Landing), { ssr: false }) as typeof import("@/modules/meta/Landing").Landing;
const GoogleAuthModal = dynamic(() => import("@/modules/exploration/GoogleAuthModal").then((m) => m.GoogleAuthModal), {
  ssr: false
}) as typeof import("@/modules/exploration/GoogleAuthModal").GoogleAuthModal;
const Analytics = dynamic(() => import("@vercel/analytics/react").then((m) => m.Analytics), { ssr: false });
const SpeedInsights = dynamic(() => import("@vercel/speed-insights/react").then((m) => m.SpeedInsights), { ssr: false });
const PuckLandingAdapter = dynamic(() => import("./PuckLandingAdapter").then((m) => m.PuckLandingAdapter), { ssr: false });

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";
const APP_SCREEN_BOOT_ACTION_PREFIX = "navigate:";

function hasRenderablePuckData(data: Data | null | undefined): data is Data {
  if (!data || typeof data !== "object") return false;

  // Puck data can exist as an object but still contain no blocks to render.
  if ("content" in data && Array.isArray(data.content)) {
    return data.content.length > 0;
  }

  return Object.keys(data).length > 0;
}

function shouldSilenceAiLog(args: unknown[]): boolean {
  if (!runtimeEnv.isDev) return false;

  const text = args
    .map((item) => {
      if (typeof item === "string") return item;
      if (item instanceof Error) return `${item.name}: ${item.message}\n${item.stack ?? ""}`;
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    })
    .join(" ");

  return (
    text.includes("Download the React DevTools for a better development experience") ||
    text.includes("Auto Health Check") ||
    text.includes("Weekly Revenue Analysis") ||
    text.includes("Emotional Pricing") ||
    text.includes("Telegram Bot not configured") ||
    text.includes("[Telegram Bot Disabled]") ||
    text.includes("[STRESS TEST]") ||
    text.includes("Sovereign Override") ||
    text.includes("Subscription synced with server") ||
    text.includes("[Mock Inngest]") ||
    text.includes("[Mock Pinecone]") ||
    text.includes("[Sync Hook]") ||
    text.includes("[Graph Engine]") ||
    text.includes("[Background Job]") ||
    text.includes("Running health check") ||
    text.includes("Health check complete") ||
    text.includes("Running weekly revenue analysis") ||
    text.includes("Running daily emotional check") ||
    text.includes("Requesting pricing optimization from AI") ||
    text.includes("Pricing recommendation generated") ||
    text.includes("Generated question failed quality check") ||
    text.includes("Content packet failed quality check") ||
    text.includes("[ORCHESTRATOR] SANCTUARY_MODE_ACTIVATED") ||
    text.includes("[ORCHESTRATOR] Sanctuary Mode deactivated") ||
    text.includes("[Decision]") ||
    text.includes("Question generation requires approval")
  );
}

function shouldBootIntoFullApp(): boolean {
  if (typeof window === "undefined") return true;
  const { pathname, hash, search } = window.location;
  const hasBootAction = Boolean(window.sessionStorage.getItem(APP_BOOT_ACTION_KEY));
  if (hasBootAction) return true;
  if (pathname !== "/") return true;
  if (hash && hash !== "#landing") return true;
  if (search) return true;
  return false;
}

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  // In development, stale SW/caches can serve old chunks and cause _next 404s.
  if (runtimeEnv.isDev) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });

    if ("caches" in window) {
      void caches.keys().then((cacheKeys) => {
        cacheKeys.forEach((key) => {
          void caches.delete(key);
        });
      });
    }
    return;
  }

  const isSecureOrigin =
    window.location.protocol === "https:" || window.location.hostname === "localhost";
  if (!isSecureOrigin) return;

  const installWorker = () => {
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  };

  if (window.document.readyState === "complete") installWorker();
  else window.addEventListener("load", installWorker, { once: true });
}

interface ClientAppShellProps {
  onBeforeInit?: () => void;
  puckData?: any;
}

export function ClientAppShell({ onBeforeInit, puckData }: ClientAppShellProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldLoadFullApp, setShouldLoadFullApp] = useState(true);
  const [lockFullAppMode, setLockFullAppMode] = useState(false);
  const [landingAuthIntent, setLandingAuthIntent] = useState<PostAuthIntent | null>(null);

  useEffect(() => {
    if (!runtimeEnv.isDev || typeof window === "undefined") return;

    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);
    const originalInfo = console.info.bind(console);

    console.warn = (...args: unknown[]) => {
      if (!shouldSilenceAiLog(args)) originalWarn(...args);
    };

    console.error = (...args: unknown[]) => {
      if (!shouldSilenceAiLog(args)) originalError(...args);
    };

    console.info = (...args: unknown[]) => {
      if (!shouldSilenceAiLog(args)) originalInfo(...args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  const handleExitToLanding = useCallback(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      return;
    }
    if (lockFullAppMode) {
      return;
    }
    setShouldLoadFullApp(false);
  }, [lockFullAppMode]);

  const startRecoveryFromLanding = useCallback(() => {
    if (!hasRevenueAccess()) {
      window.location.href = "/activation?blocked=map&source=landing";
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, "start_recovery");
    }
    setLockFullAppMode(true);
    setShouldLoadFullApp(true);
  }, []);

  const openLoginFromLanding = useCallback(() => {
    setLandingAuthIntent({ kind: "login", createdAt: Date.now() });
  }, []);

  const openAppScreenFromLanding = useCallback((screen: string) => {
    if (!hasRevenueAccess()) {
      window.location.href = "/activation?blocked=screen&source=landing";
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, `${APP_SCREEN_BOOT_ACTION_PREFIX}${screen}`);
    }
    setLockFullAppMode(true);
    setShouldLoadFullApp(true);
  }, []);

  const handleLandingNavigate = useCallback((screen: string) => {
    switch (screen) {
      case "home":
      case "landing":
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
          document.body.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      case "profile":
        openAppScreenFromLanding("profile");
        return;
      case "settings":
        openAppScreenFromLanding("settings");
        return;
      case "stories":
        window.location.href = "/stories";
        return;
      case "about":
        window.location.href = "/about";
        return;
      case "tools":
      case "insights":
      case "resources":
      case "quizzes":
      case "behavioral-analysis":
        openAppScreenFromLanding(screen);
        return;
      default:
        startRecoveryFromLanding();
    }
  }, [openAppScreenFromLanding, startRecoveryFromLanding]);

  useEffect(() => {
    setMounted(true);

    // ── Handle Query-based Boot Action ──
    // Useful for server-side redirects that can't set sessionStorage
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const bootActionParam = search.get("boot_action");
      if (bootActionParam === "start_recovery") {
        if (!hasRevenueAccess()) {
          window.location.replace("/activation?blocked=boot_action&source=url");
          return;
        }

        window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, "start_recovery");
        setLockFullAppMode(true);
        setShouldLoadFullApp(true);
        // Clean URL
        const newUrl = window.location.pathname + (window.location.hash || "");
        window.history.replaceState({}, "", newUrl);
      }
    }

    const bootIntoFullApp = shouldBootIntoFullApp();
    setShouldLoadFullApp(bootIntoFullApp);
    if (bootIntoFullApp) {
      setLockFullAppMode(true);
    }
    applyDesignSystemTokens();
    onBeforeInit?.();
    
    // P0 Trace: Ensure analytics are initialized to capture first touch
    initAnalytics();
    initMonitoring();

    if (bootIntoFullApp) {
      trackPageView("alrehla_app_root");
    } else {
      trackLandingView();
    }

    registerServiceWorker();
  }, [onBeforeInit]);

  if (!mounted) return null;

  return (
    <>
      <ErrorBoundary>
        {shouldLoadFullApp ? (
          <Suspense fallback={<AwarenessSkeleton />}>
            <App onExitToLanding={handleExitToLanding} />
          </Suspense>
        ) : (
          <PWAInstallProvider>
            <PlatformHeader
              activeScreen="landing"
              onLogin={openLoginFromLanding}
              onNavigate={handleLandingNavigate}
            />
            <Suspense fallback={<AwarenessSkeleton />}>
              {hasRenderablePuckData(puckData) ? (
                <PuckLandingAdapter data={puckData} />
              ) : (
                <Landing
                  onStartJourney={startRecoveryFromLanding}
                />
              )}
            </Suspense>
            {landingAuthIntent && (
              <GoogleAuthModal
                isOpen
                intent={landingAuthIntent}
                onGuestMode={() => {
                  setLandingAuthIntent(null);
                  setLockFullAppMode(true);
                  setShouldLoadFullApp(true);
                }}
                onClose={() => setLandingAuthIntent(null)}
                onNotNow={() => setLandingAuthIntent(null)}
              />
            )}
          </PWAInstallProvider>
        )}
        <AnalyticsConsentBanner />
        <AnalyticsDiagnosticsOverlay />
        {runtimeEnv.isProd && (
          <Suspense fallback={<AwarenessSkeleton />}>
            <Analytics />
            <SpeedInsights />
          </Suspense>
        )}
      </ErrorBoundary>
    </>
  );
}
