"use client";

import { useEffect, lazy, Suspense, useState } from "react";
import App from "../src/App";
import { AwarenessSkeleton } from "../src/components/AwarenessSkeleton";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { initAnalytics } from "../src/services/analytics";
import { initMonitoring } from "../src/services/monitoring";
import { runtimeEnv } from "../src/config/runtimeEnv";
import { applyDesignSystemTokens } from "../src/services/designSystemTokens";

const Analytics = lazy(() => import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights })));

export default function ClientAppEntry() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyDesignSystemTokens();
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
      {runtimeEnv.isProd && (
        <Suspense fallback={<AwarenessSkeleton />}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
