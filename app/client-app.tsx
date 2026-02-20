"use client";

import { useEffect, lazy, Suspense, useState } from "react";
import App from "../src/App";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { AnalyticsConsentBanner } from "../src/components/AnalyticsConsentBanner";
import { initAnalytics } from "../src/services/analytics";
import { initMonitoring } from "../src/services/monitoring";
import { runtimeEnv } from "../src/config/runtimeEnv";

const Analytics = lazy(() => import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights })));

export function ClientApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      <App />
      <AnalyticsConsentBanner />
      {runtimeEnv.isProd && (
        <Suspense fallback={null}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
