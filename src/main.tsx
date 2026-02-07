import { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initAnalytics } from "./services/analytics";
import "./styles.css";

const Analytics = lazy(() => import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights })));

// Initialize analytics (only if consent given)
initAnalytics();

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
