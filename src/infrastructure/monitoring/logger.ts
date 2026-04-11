/**
 * Infrastructure — Monitoring (Logger)
 * 
 * Centralized logging with Sentry integration (production)
 * and localStorage persistence (development).
 */

import * as Sentry from "@sentry/react";
import { runtimeEnv } from "@/config/runtimeEnv";

const LOCAL_STORAGE_KEY = "dawayir-error-log";
const MAX_LOCAL_ERRORS = 50;

export const logger = {
  error: (messageOrError: string | unknown, error?: unknown, ...args: unknown[]) => {
    let message = "";
    let actualError = error;

    if (typeof messageOrError === "string") {
      message = messageOrError;
    } else {
      if (messageOrError instanceof Error) {
        message = messageOrError.message;
        actualError = actualError || messageOrError;
      } else {
        message = String(messageOrError);
        actualError = actualError || messageOrError;
      }
    }

    // 1. Console
    console.error(messageOrError, error, ...args);

    // 2. Sentry in production
    if (runtimeEnv.isProd) {
      if (actualError instanceof Error) {
        Sentry.captureException(actualError, { extra: { message, ...args } });
      } else if (messageOrError instanceof Error) {
        Sentry.captureException(messageOrError, { extra: { ...args } });
      } else {
        Sentry.captureMessage(message || "Unknown error", {
          level: "error",
          extra: { error: actualError, ...args },
        });
      }
      return;
    }

    // 3. LocalStorage in dev
    if (typeof window !== "undefined") {
      try {
        const errorLogStr = localStorage.getItem(LOCAL_STORAGE_KEY) || "[]";
        let errorLog = JSON.parse(errorLogStr);
        if (!Array.isArray(errorLog)) {
          errorLog = [];
        }

        errorLog.push({
          message,
          error: actualError instanceof Error ? actualError.message : String(actualError),
          timestamp: Date.now(),
        });

        if (errorLog.length > MAX_LOCAL_ERRORS) {
          errorLog = errorLog.slice(-MAX_LOCAL_ERRORS);
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(errorLog));
      } catch {
        // Ignore storage errors
      }
    }
  },

  warn: (message: string | unknown, ...args: unknown[]) => {
    console.warn(message, ...args);
  },

  log: (message: string | unknown, ...args: unknown[]) => {
    console.log(message, ...args);
  },
};
