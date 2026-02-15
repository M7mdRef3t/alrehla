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
  | "VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE";

function readEnv(key: RuntimeKey): string | undefined {
  const processValue = process.env[key];
  if (typeof processValue === "string" && processValue.length > 0) return processValue;

  const nextPublicKey = key.startsWith("VITE_") ? `NEXT_PUBLIC_${key.slice(5)}` : key;
  const nextValue = process.env[nextPublicKey];
  if (typeof nextValue === "string" && nextValue.length > 0) return nextValue;

  const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
  const metaValue = metaEnv[key];
  return typeof metaValue === "string" && metaValue.length > 0 ? metaValue : undefined;
}

const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
const processNodeEnv = process.env.NODE_ENV;
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
  sentryReplaysOnErrorSampleRate: readEnv("VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE")
} as const;
