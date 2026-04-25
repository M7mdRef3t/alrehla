import Clarity from "@microsoft/clarity";
import * as Sentry from "@sentry/nextjs";
import { runtimeEnv } from "@/config/runtimeEnv";
import { trackError } from "./analytics";

let initialized = false;

export function initMonitoring(): void {
  if (initialized) return;
  const dsn = runtimeEnv.sentryDsn?.trim();
  if (!dsn) return;

  // Sentry initialization is now handled automatically by @sentry/nextjs via sentry.*.config.ts files
  
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
  // Set Sentry user context — Sentry is a no-op if not initialized (dev without DSN)
  try {
    Sentry.setUser({ id: userId, email });
  } catch {
    // Sentry is non-critical for the user journey.
  }

  // Clarity identity syncing
  try {
    Clarity.identify(userId);
  } catch {
    // Clarity non-critical
  }
}
