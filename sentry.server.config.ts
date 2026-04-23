import * as Sentry from "@sentry/nextjs";
import { runtimeEnv } from "@/config/runtimeEnv";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || "";

Sentry.init({
  dsn,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  
  environment: runtimeEnv.appEnv || (runtimeEnv.isDev ? "development" : "production"),

  ignoreErrors: [
    "signal is aborted without reason",
    "Notification is not defined",
    "Can't find variable: Notification",
    "d.closest is not a function",
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications.",
    "Non-Error promise rejection captured",
  ],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
