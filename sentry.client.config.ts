import * as Sentry from "@sentry/nextjs";
import { runtimeEnv } from "@/config/runtimeEnv";

// ═══ Skip Sentry in local development to save ~200MB RAM ═══
if (runtimeEnv.isDev && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Sentry is dormant — the journey is lighter locally
} else {

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || "";

Sentry.init({
  dsn,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0.1),

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  environment: runtimeEnv.appEnv || (runtimeEnv.isDev ? "development" : "production"),

  ignoreErrors: [
    "signal is aborted without reason",
    "Notification is not defined",
    "Can't find variable: Notification",
    "d.closest is not a function",
    // Adding some other common noisy ones just in case
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications.",
    "Non-Error promise rejection captured",
  ],

  replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || 0.2),
  replaysSessionSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0.0),

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

} // end else — Sentry active in production only
