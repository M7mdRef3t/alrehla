"use client";

import { useEffect, lazy, Suspense, useState } from "react";
import { AwarenessSkeleton } from "../src/components/AwarenessSkeleton";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { initAnalytics } from "../src/services/analytics";
import { initMonitoring } from "../src/services/monitoring";
import { runtimeEnv } from "../src/config/runtimeEnv";
import { applyDesignSystemTokens } from "../src/services/designSystemTokens";
import { captureUtmFromCurrentUrl } from "../src/services/marketingAttribution";
import { recordFlowEvent } from "../src/services/journeyTracking";

const App = lazy(() => import("../src/App"));
const Analytics = lazy(() => import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights })));

export default function ClientApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyDesignSystemTokens();
    const utm = captureUtmFromCurrentUrl();
    if (utm) {
      recordFlowEvent("utm_captured", { meta: utm });
    }
    initAnalytics();
    initMonitoring();

    // Unregister stale Vite-PWA service workers (sw.js) in ALL environments
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.active?.scriptURL?.includes("sw.js")) {
            void registration.unregister();
          }
        });
      }).catch(() => {});
    }
  }, []);

  if (!mounted) return null;

  return (
    <ErrorBoundary>
      <Suspense fallback={<AwarenessSkeleton />}>
        <App />
      </Suspense>
      {runtimeEnv.isProd && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}

