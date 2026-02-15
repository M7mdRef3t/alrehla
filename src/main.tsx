import { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initAnalytics } from "./services/analytics";
import { initMonitoring } from "./services/monitoring";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";

const Analytics = lazy(() => import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights })));

// Initialize analytics (only if consent given)
initAnalytics();
initMonitoring();

if (import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Ensure the new build is activated and shown without manual multi-refresh.
      void updateSW(true);
    }
  });

  window.setInterval(() => {
    void updateSW();
  }, 60_000);
}

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
      <Suspense fallback={null}>
        <Analytics />
        <SpeedInsights />
      </Suspense>
    </ErrorBoundary>
  );
}
