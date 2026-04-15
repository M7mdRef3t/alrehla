import * as Sentry from "@sentry/react";
import Clarity from "@microsoft/clarity";
import { runtimeEnv } from "@/config/runtimeEnv";

let initialized = false;

export function initMonitoring(): void {
  if (initialized) return;
  const dsn = runtimeEnv.sentryDsn?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: runtimeEnv.appEnv || (runtimeEnv.isDev ? "development" : "production"),
    tracesSampleRate: Number(runtimeEnv.sentryTracesSampleRate ?? 0.1),
    replaysSessionSampleRate: Number(runtimeEnv.sentryReplaysSessionSampleRate ?? 0),
    replaysOnErrorSampleRate: Number(runtimeEnv.sentryReplaysOnErrorSampleRate ?? 0.2)
  });
  
  // Initialize Microsoft Clarity
  const clarityId = runtimeEnv.clarityProjectId?.trim();
  if (clarityId) {
    Clarity.init(clarityId);
  }

  // Final Professional Hardening: Capture global errors for Analytics/Clarity matching
  if (typeof window !== "undefined") {
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      try {
        const { trackError } = require("./analytics");
        trackError(error || String(message), { source, lineno, colno });
      } catch (e) { /* ignore import/tracking failures */ }
      
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };
  }

  initialized = true;
}

export function identifyUser(userId: string, email?: string): void {
  // Sentry
  Sentry.setUser({ id: userId, email });
  
  // Clarity identity syncing
  try {
    Clarity.identify(userId);
    
    // Cross-link Sentry and Clarity IDs if possible
    const sentryId = Sentry.lastEventId();
    if (sentryId) {
      Clarity.setTag("sentry_event_id", sentryId);
    }
  } catch (e) {
    // Clarity non-critical
  }
}

