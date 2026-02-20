type RuntimeKey =
  | "VITE_APP_ENV"
  | "VITE_PHASE_ONE_USER_FLOW"
  | "VITE_SUPABASE_URL"
  | "VITE_SUPABASE_ANON_KEY"
  | "VITE_WHATSAPP_CONTACT_NUMBER"
  | "VITE_ADMIN_ALLOWED_ROLES"
  | "VITE_ADMIN_CODE"
  | "VITE_ADMIN_API_BASE"
  | "VITE_GA_MEASUREMENT_ID"
  | "VITE_CLARITY_PROJECT_ID"
  | "VITE_CONTENTSQUARE_PROJECT_ID"
  | "VITE_AUTH_REDIRECT_URL"
  | "VITE_PUBLIC_APP_URL"
  | "VITE_GEMINI_AI_ENABLED"
  | "VITE_SENTRY_DSN"
  | "VITE_SENTRY_TRACES_SAMPLE_RATE"
  | "VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE"
  | "VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE"
  | "VITE_OWNER_SECURITY_WEBHOOK_URL";

/** Safe accessor for process.env that never throws in browser/Vite */
function safeProcessEnv(): Record<string, unknown> {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env as Record<string, unknown>;
    }
  } catch {
    // process is not defined in Vite browser context
  }
  return {};
}

function readEnv(key: RuntimeKey): string | undefined {
  // 1. Try Vite's import.meta.env first (works in both dev and prod)
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    if (metaEnv && typeof metaEnv === "object") {
      const val = metaEnv[key];
      if (typeof val === "string" && val.length > 0) return val.trim();
    }
  } catch {
    // ignore import.meta access errors
  }

  // 2. Try Next.js process.env (build-time inlined NEXT_PUBLIC_*)
  const penv = safeProcessEnv();
  const nextKey = key.replace("VITE_", "NEXT_PUBLIC_");
  const nextVal = penv[nextKey];
  if (typeof nextVal === "string" && nextVal.length > 0) return nextVal.trim();

  // 3. Try direct key from process.env
  const directVal = penv[key];
  if (typeof directVal === "string" && directVal.length > 0) return directVal.trim();

  // 4. Try Next.js publicRuntimeConfig (client-side)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getConfig } = require("next/config");
    const config = getConfig?.();
    if (config?.publicRuntimeConfig) {
      const val = config.publicRuntimeConfig[nextKey];
      if (typeof val === "string" && val.length > 0) return val.trim();
    }
  } catch {
    // Not in Next.js context
  }

  return undefined;
}

const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
const penv = safeProcessEnv();
const processNodeEnv = typeof penv.NODE_ENV === "string" ? penv.NODE_ENV : undefined;
const metaDev = Boolean(metaEnv.DEV);
const metaProd = Boolean(metaEnv.PROD);

export const runtimeEnv = {
  isDev: processNodeEnv ? processNodeEnv !== "production" : metaDev,
  isProd: processNodeEnv ? processNodeEnv === "production" : metaProd,
  appEnv: readEnv("VITE_APP_ENV"),
  phaseOneUserFlow: readEnv("VITE_PHASE_ONE_USER_FLOW"),
  supabaseUrl: readEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnv("VITE_SUPABASE_ANON_KEY"),
  whatsappContactNumber: readEnv("VITE_WHATSAPP_CONTACT_NUMBER"),
  adminAllowedRoles: readEnv("VITE_ADMIN_ALLOWED_ROLES"),
  adminCode: readEnv("VITE_ADMIN_CODE"),
  adminApiBase: readEnv("VITE_ADMIN_API_BASE") ?? "",
  gaMeasurementId: readEnv("VITE_GA_MEASUREMENT_ID"),
  clarityProjectId: readEnv("VITE_CLARITY_PROJECT_ID"),
  contentsquareProjectId: readEnv("VITE_CONTENTSQUARE_PROJECT_ID"),
  authRedirectUrl: readEnv("VITE_AUTH_REDIRECT_URL"),
  publicAppUrl: readEnv("VITE_PUBLIC_APP_URL"),
  geminiEnabled: readEnv("VITE_GEMINI_AI_ENABLED"),
  sentryDsn: readEnv("VITE_SENTRY_DSN"),
  sentryTracesSampleRate: readEnv("VITE_SENTRY_TRACES_SAMPLE_RATE"),
  sentryReplaysSessionSampleRate: readEnv("VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE"),
  sentryReplaysOnErrorSampleRate: readEnv("VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE"),
  ownerSecurityWebhookUrl: readEnv("VITE_OWNER_SECURITY_WEBHOOK_URL")
} as const;
