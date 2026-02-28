import { AwarenessSkeleton } from './components/AwarenessSkeleton';

import { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initAnalytics } from "./services/analytics";
import { initMonitoring } from "./services/monitoring";
import { getDocumentOrNull, getWindowOrNull } from "./services/clientRuntime";
import { runtimeEnv } from "./config/runtimeEnv";
import { MicroTelemetryEngine } from "./services/telemetry/MicroTelemetryEngine";
import { isDevMode } from "./config/appEnv";
import { startWeeklyEgyptianAdABTesting } from "./ai/aiMarketingCopy";
import { startDailyEmotionalCheck } from "./ai/emotionalPricingEngine";
import "./styles.css";
import "./styles/consciousness-theme.css";
import "./styles/breathing-logo.css";
import { registerSW } from "virtual:pwa-register";

const Analytics = lazy(() => import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights })));

// --- UTM Capture — التقاط مصدر الزيارة التسويقي قبل أي تتبع ---
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const UTM_STORAGE_KEY = "dawayir-utm-params";

(function captureUtmParams() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const params: Record<string, string> = {};
    let hasAny = false;
    for (const key of UTM_KEYS) {
      const val = url.searchParams.get(key);
      if (val) { params[key] = val; hasAny = true; }
    }
    if (hasAny) {
      window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
    }
  } catch { /* ignore */ }
})();

// Fire utm_captured event (deferred to avoid circular import timing issues)
void import("./services/journeyTracking").then(({ recordFlowEvent }) => {
  try {
    const stored = window.localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) recordFlowEvent("utm_captured", { meta: JSON.parse(stored) });
  } catch { /* ignore */ }
});

// Initialize analytics (only if consent given)
initAnalytics();
initMonitoring();
if (typeof window !== "undefined") {
  // Keep startup deterministic for end users: no autonomous AI jobs on landing boot.
  if (isDevMode) {
    startWeeklyEgyptianAdABTesting();
    startDailyEmotionalCheck();
  }

  // Start the Subconscious Mirror
  MicroTelemetryEngine.init();
}

if (runtimeEnv.isProd) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Ensure the new build is activated and shown without manual multi-refresh.
      void updateSW(true);
    }
  });

  const windowRef = getWindowOrNull();
  windowRef?.setInterval(() => {
    void updateSW();
  }, 60_000);
}

const rootElement = getDocumentOrNull()?.getElementById("root") ?? null;

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
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

