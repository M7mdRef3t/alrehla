import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initAnalytics } from "./services/analytics";
import "./styles.css";

// Initialize analytics (only if consent given)
initAnalytics();

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
