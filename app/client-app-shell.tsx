"use client";

import { useEffect, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { AwarenessSkeleton } from "../src/components/AwarenessSkeleton";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { initAnalytics } from "../src/services/analytics";
import { initMonitoring } from "../src/services/monitoring";
import { runtimeEnv } from "../src/config/runtimeEnv";
import { applyDesignSystemTokens } from "../src/services/designSystemTokens";
import { PWAInstallProvider } from "../src/contexts/PWAInstallContext";

const App = dynamic(() => import("../src/App"), { ssr: false });
const Landing = dynamic(() => import("../src/components/Landing").then((m) => m.Landing), { ssr: false }) as typeof import("../src/components/Landing").Landing;
const Analytics = dynamic(() => import("@vercel/analytics/react").then((m) => m.Analytics), { ssr: false });
const SpeedInsights = dynamic(() => import("@vercel/speed-insights/react").then((m) => m.SpeedInsights), { ssr: false });

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";

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

  useEffect(() => {
    setMounted(true);
    setShouldLoadFullApp(shouldBootIntoFullApp());
    applyDesignSystemTokens();
    onBeforeInit?.();
    initAnalytics();
    initMonitoring();
    registerServiceWorker();
  }, [onBeforeInit]);

  if (!mounted) return null;

  return (
    <ErrorBoundary>
      {shouldLoadFullApp ? (
        <Suspense fallback={<AwarenessSkeleton />}>
          <App />
        </Suspense>
      ) : (
        <PWAInstallProvider>
          <Suspense fallback={<AwarenessSkeleton />}>
            <Landing
              onStartJourney={() => {
                if (typeof window !== "undefined") {
                  window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, "start_recovery");
                }
                setShouldLoadFullApp(true);
              }}
            />
          </Suspense>
        </PWAInstallProvider>
      )}
      {runtimeEnv.isProd && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
