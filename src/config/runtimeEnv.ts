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

// Client-side only: Use getConfig from Next.js
function readEnv(key: RuntimeKey): string | undefined {
  try {
    // In client-side Next.js, import getConfig for publicRuntimeConfig
    const { getConfig } = require('next/config');
    const config = getConfig?.();
    if (config?.publicRuntimeConfig) {
      const nextKey = key.replace("VITE_", "NEXT_PUBLIC_");
      const val = config.publicRuntimeConfig[nextKey];
      if (typeof val === "string" && val.length > 0) return val.trim();
    }
  } catch (e) {
    // Fall through if not in Next.js context
  }

  // Fallback: Direct environment variable access (build-time inlined by Next.js)
  try {
    // Next.js inlines NEXT_PUBLIC_* vars at build time
    if (typeof global !== 'undefined' && (global as Record<string, unknown>).__NEXT_DATA__) {
      // In server-side context during build
      const nextKey = key.replace("VITE_", "NEXT_PUBLIC_");
      const val = (process.env as Record<string, unknown>)?.[nextKey];
      if (typeof val === "string" && val.length > 0) return val.trim();
    }
  } catch (e) {
    // ignore
  }

  // Try Vite's import.meta.env (for Vite projects or SSR)
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    if (metaEnv && typeof metaEnv === "object") {
      const val = metaEnv[key];
      if (typeof val === "string" && val.length > 0) return val.trim();
    }
  } catch {
    // ignore import.meta access errors
  }
  
  return undefined;
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

// Debug: Log all environment variable checks on client
if (typeof window !== 'undefined') {
  const allProcessEnv = Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('supabase'));
  console.log('=== Debug runtimeEnv ===');
  console.log('process.env keys (SUPABASE):', allProcessEnv.map(k => `${k}=${process.env[k]}`));
  console.log('runtimeEnv.supabaseUrl:', runtimeEnv.supabaseUrl);
  console.log('runtimeEnv.supabaseAnonKey:', runtimeEnv.supabaseAnonKey ? 'SET' : 'UNDEFINED');
  console.log('=======================');
}
