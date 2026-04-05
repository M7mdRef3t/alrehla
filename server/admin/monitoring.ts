type SentryModule = typeof import("@sentry/node");

let initialized = false;
let sentryModulePromise: Promise<SentryModule | null> | null = null;

async function loadSentry(): Promise<SentryModule | null> {
  if (sentryModulePromise) return sentryModulePromise;

  sentryModulePromise = (async () => {
    const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
    if (!dsn) return null;

    try {
      const dynamicImport = new Function("specifier", "return import(specifier);") as (
        specifier: string
      ) => Promise<SentryModule>;
      return await dynamicImport("@sentry/node");
    } catch (error) {
      console.warn("[monitoring] Failed to load Sentry module", error);
      return null;
    }
  })();

  return sentryModulePromise;
}

export function initServerMonitoring(): void {
  void (async () => {
    if (initialized) return;
    const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
    if (!dsn) return;

    const Sentry = await loadSentry();
    if (!Sentry || initialized) return;

    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "production",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });

    initialized = true;
  })();
}

export function captureServerError(error: unknown, context?: Record<string, unknown>): void {
  void (async () => {
    if (!initialized) {
      initServerMonitoring();
      const Sentry = await loadSentry();
      if (!Sentry || !initialized) return;
    }

    const Sentry = await loadSentry();
    if (!Sentry || !initialized) return;

    Sentry.withScope((scope) => {
      if (context) {
        for (const [key, value] of Object.entries(context)) {
          scope.setExtra(key, value);
        }
      }

      Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    });
  })();
}
