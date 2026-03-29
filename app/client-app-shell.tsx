"use client";

import { useCallback, useEffect, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { AwarenessSkeleton } from "../src/components/AwarenessSkeleton";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { initAnalytics, logAnalyticsDiagnostics } from "../src/services/analytics";
import { initMonitoring } from "../src/services/monitoring";
import { runtimeEnv } from "../src/config/runtimeEnv";
import { applyDesignSystemTokens } from "../src/services/designSystemTokens";
import { PWAInstallProvider } from "../src/contexts/PWAInstallContext";
import { AnalyticsConsentBanner } from "../src/components/AnalyticsConsentBanner";
import { AnalyticsDiagnosticsOverlay } from "../src/components/AnalyticsDiagnosticsOverlay";
import { PlatformHeader } from "../src/components/PlatformHeader";

const App = dynamic(() => import("../src/App"), { ssr: false });
const Landing = dynamic(() => import("../src/components/Landing").then((m) => m.Landing), { ssr: false }) as typeof import("../src/components/Landing").Landing;
const Analytics = dynamic(() => import("@vercel/analytics/react").then((m) => m.Analytics), { ssr: false });
const SpeedInsights = dynamic(() => import("@vercel/speed-insights/react").then((m) => m.SpeedInsights), { ssr: false });

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";
const APP_SCREEN_BOOT_ACTION_PREFIX = "navigate:";

function shouldBootIntoFullApp(): boolean {
  if (typeof window === "undefined") return true;
  const { pathname, hash, search } = window.location;
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
}

export function ClientAppShell({ onBeforeInit }: ClientAppShellProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldLoadFullApp, setShouldLoadFullApp] = useState(true);

  const startRecoveryFromLanding = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, "start_recovery");
    }
    setShouldLoadFullApp(true);
  }, []);

  const openAppScreenFromLanding = useCallback((screen: string) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, `${APP_SCREEN_BOOT_ACTION_PREFIX}${screen}`);
    }
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
    setShouldLoadFullApp(shouldBootIntoFullApp());
    applyDesignSystemTokens();
    onBeforeInit?.();
    initAnalytics();
    logAnalyticsDiagnostics("client-app-shell");
    initMonitoring();
    registerServiceWorker();
  }, [onBeforeInit]);

  if (!mounted) return null;

  return (
    <>
      <ErrorBoundary>
        {shouldLoadFullApp ? (
          <Suspense fallback={<AwarenessSkeleton />}>
            <App onExitToLanding={() => setShouldLoadFullApp(false)} />
          </Suspense>
        ) : (
          <PWAInstallProvider>
            <PlatformHeader
              activeScreen="landing"
              onLogin={startRecoveryFromLanding}
              onNavigate={handleLandingNavigate}
            />
            <Suspense fallback={<AwarenessSkeleton />}>
              <Landing
                onStartJourney={startRecoveryFromLanding}
              />
            </Suspense>
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
