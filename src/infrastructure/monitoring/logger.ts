/* eslint-disable no-console */
/**
 * Infrastructure — Monitoring (Logger)
 * 
 * Centralized logging with console output (production)
 * and localStorage persistence (development).
 */

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

    // 2. Production errors are captured by the Sentry Next.js integration.
    if (runtimeEnv.isProd) {
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
