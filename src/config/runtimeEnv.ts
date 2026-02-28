type RuntimeKey =
  | "VITE_APP_ENV"
  | "VITE_PHASE_ONE_USER_FLOW"
  | "VITE_PUBLIC_PAYMENTS_ENABLED"
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

function readNextPublicStatic(key: RuntimeKey): string | undefined {
  switch (key) {
    case "VITE_APP_ENV":
      return process.env.NEXT_PUBLIC_APP_ENV?.trim();
    case "VITE_PHASE_ONE_USER_FLOW":
      return process.env.NEXT_PUBLIC_PHASE_ONE_USER_FLOW?.trim();
    case "VITE_PUBLIC_PAYMENTS_ENABLED":
      return process.env.NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED?.trim();
    case "VITE_SUPABASE_URL":
      return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    case "VITE_SUPABASE_ANON_KEY":
      return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    case "VITE_WHATSAPP_CONTACT_NUMBER":
      return process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER?.trim();
    case "VITE_ADMIN_ALLOWED_ROLES":
      return process.env.NEXT_PUBLIC_ADMIN_ALLOWED_ROLES?.trim();
    case "VITE_ADMIN_CODE":
      return process.env.NEXT_PUBLIC_ADMIN_CODE?.trim();
    case "VITE_ADMIN_API_BASE":
      return process.env.NEXT_PUBLIC_ADMIN_API_BASE?.trim();
    case "VITE_GA_MEASUREMENT_ID":
      return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    case "VITE_CLARITY_PROJECT_ID":
      return process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();
    case "VITE_CONTENTSQUARE_PROJECT_ID":
      return process.env.NEXT_PUBLIC_CONTENTSQUARE_PROJECT_ID?.trim();
    case "VITE_AUTH_REDIRECT_URL":
      return process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL?.trim();
    case "VITE_PUBLIC_APP_URL":
      return process.env.NEXT_PUBLIC_PUBLIC_APP_URL?.trim();
    case "VITE_GEMINI_AI_ENABLED":
      return process.env.NEXT_PUBLIC_GEMINI_AI_ENABLED?.trim();
    case "VITE_SENTRY_DSN":
      return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
    case "VITE_SENTRY_TRACES_SAMPLE_RATE":
      return process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE?.trim();
    case "VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE":
      return process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE?.trim();
    case "VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE":
      return process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE?.trim();
    case "VITE_OWNER_SECURITY_WEBHOOK_URL":
      return process.env.NEXT_PUBLIC_OWNER_SECURITY_WEBHOOK_URL?.trim();
    default:
      return undefined;
  }
}

function readEnv(key: RuntimeKey): string | undefined {
  // 1. Try Vite's import.meta.env first (works in both dev and prod)
  try {
    const val = import.meta.env[key];
    if (typeof val === "string" && val.length > 0) return val.trim();
  } catch {
    // ignore import.meta access errors
  }

  // 2. Try explicit Next.js public env access so values are statically inlined in client bundles.
  const staticNextVal = readNextPublicStatic(key);
  if (typeof staticNextVal === "string" && staticNextVal.length > 0) return staticNextVal;

  // 3. Try Next.js process.env (server/runtime fallback)
  const penv = safeProcessEnv();
  const nextKey = key.replace("VITE_", "NEXT_PUBLIC_");
  const nextVal = penv[nextKey];
  if (typeof nextVal === "string" && nextVal.length > 0) return nextVal.trim();

  // 4. Try direct key from process.env
  const directVal = penv[key];
  if (typeof directVal === "string" && directVal.length > 0) return directVal.trim();

  // 5. Try Next.js publicRuntimeConfig (client-side)
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

const metaEnv = import.meta.env ?? {};
const penv = safeProcessEnv();
const processNodeEnv = typeof penv.NODE_ENV === "string" ? penv.NODE_ENV : undefined;
const metaDev = Boolean(metaEnv.DEV);
const metaProd = Boolean(metaEnv.PROD);

export const runtimeEnv = {
  isDev: processNodeEnv ? processNodeEnv !== "production" : metaDev,
  isProd: processNodeEnv ? processNodeEnv === "production" : metaProd,
  appEnv: readEnv("VITE_APP_ENV"),
  phaseOneUserFlow: readEnv("VITE_PHASE_ONE_USER_FLOW"),
  publicPaymentsEnabled: readEnv("VITE_PUBLIC_PAYMENTS_ENABLED"),
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
