import * as Sentry from "@sentry/react";
import { runtimeEnv } from "../config/runtimeEnv";

const LOCAL_STORAGE_KEY = "dawayir-error-log";
const MAX_LOCAL_ERRORS = 50;

/**
 * A centralized logger that integrates with Sentry for production
 * and localStorage for local debugging and health checks.
 */
export const logger = {
  error: (message: string, error?: any, ...args: any[]) => {
    // 1. Log to console for developer visibility
    console.error(message, error, ...args);

    // 2. In production, send to Sentry
    if (runtimeEnv.isProd) {
      if (error instanceof Error) {
        Sentry.captureException(error, { extra: { message, ...args } });
      } else {
        Sentry.captureMessage(message, {
          level: "error",
          extra: { error, ...args },
        });
      }
      // Do not store in localStorage in production to save space and avoid leaking info
      return;
    }

    // 3. In non-production, store in localStorage for the AutoHealthChecker
    if (typeof window !== "undefined") {
      try {
        const errorLogStr = localStorage.getItem(LOCAL_STORAGE_KEY) || "[]";
        let errorLog = JSON.parse(errorLogStr);
        if (!Array.isArray(errorLog)) {
          errorLog = [];
        }

        errorLog.push({
          message,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        });

        if (errorLog.length > MAX_LOCAL_ERRORS) {
          errorLog = errorLog.slice(-MAX_LOCAL_ERRORS);
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(errorLog));
      } catch (e) {
        // Ignore storage errors to avoid recursive logging loops
      }
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },

  log: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },
};
