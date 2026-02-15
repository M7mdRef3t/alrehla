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
}

