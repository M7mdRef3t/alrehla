import * as Sentry from "@sentry/node";

let initialized = false;

export function initServerMonitoring(): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "production",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1)
  });
  initialized = true;
}

export function captureServerError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) initServerMonitoring();
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}


