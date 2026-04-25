import * as Sentry from "@sentry/nextjs";
import { runtimeEnv } from "../config/runtimeEnv";

const LOCAL_STORAGE_KEY = "dawayir-error-log";
const MAX_LOCAL_ERRORS = 50;

/**
 * Centralized logger interface for strict typing.
 */
export interface Logger {
  error(messageOrError: string | unknown, error?: any, ...args: any[]): void;
  warn(message: string | unknown, ...args: any[]): void;
  log(message: string | unknown, ...args: any[]): void;
  info(message: string | unknown, ...args: any[]): void;
  debug?(message: string | unknown, ...args: any[]): void;
}

/**
 * A centralized logger that integrates with Sentry for production
 * and localStorage for local debugging and health checks.
 */
export const logger: Logger = {
  error: (messageOrError: string | unknown, error?: any, ...args: any[]) => {
    let message = "";
    let actualError = error;

    if (typeof messageOrError === "string") {
      message = messageOrError;
    } else {
      // If the first argument is an error object
      if (messageOrError instanceof Error) {
        message = messageOrError.message;
        actualError = actualError || messageOrError;
      } else {
        message = String(messageOrError);
        actualError = actualError || messageOrError;
      }
    }

    // 1. Log to console for developer visibility
    console.error(messageOrError, error, ...args);

    // 2. In production, send to Sentry
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
          error: actualError instanceof Error ? actualError.message : String(actualError),
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

  warn: (message: string | unknown, ...args: any[]) => {
    console.warn(message, ...args);
  },

  log: (message: string | unknown, ...args: any[]) => {
    console.log(message, ...args);
  },

  info: (message: string | unknown, ...args: any[]) => {
    console.info(message, ...args);
  },

  debug: (message: string | unknown, ...args: any[]) => {
    if (!runtimeEnv.isProd) {
      console.debug(message, ...args);
    }
  },
};

