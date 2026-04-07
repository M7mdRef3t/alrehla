import * as Sentry from "@sentry/react";
import { runtimeEnv } from "../config/runtimeEnv";

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

  initialized = true;

  // Replace local storage error logging globally:
  // Catch any unhandled errors and report them to Sentry.
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      if (!runtimeEnv.isProd) {
        // Fallback for dev: you could write to local storage here if needed,
        // but typically console.error is enough.
        try {
          const errorLog = JSON.parse(localStorage.getItem("dawayir-error-log") || "[]");
          errorLog.push({ message: event.message, timestamp: Date.now() });
          localStorage.setItem("dawayir-error-log", JSON.stringify(errorLog.slice(-50)));
        } catch {
          // Ignore storage errors
        }
      }
      // Sentry automatically captures unhandled errors, so we don't need to manually call Sentry.captureException here unless we want to do something custom.
    });

    window.addEventListener("unhandledrejection", (event) => {
      if (!runtimeEnv.isProd) {
        try {
          const errorLog = JSON.parse(localStorage.getItem("dawayir-error-log") || "[]");
          errorLog.push({ message: String(event.reason), timestamp: Date.now() });
          localStorage.setItem("dawayir-error-log", JSON.stringify(errorLog.slice(-50)));
        } catch {
          // Ignore
        }
      }
    });
  }
}

