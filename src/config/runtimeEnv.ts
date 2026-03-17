type RuntimeKey =
  | "VITE_APP_ENV"
  | "VITE_APP_CONTENT_REALTIME"
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
  | "VITE_OWNER_SECURITY_WEBHOOK_URL"
  | "VITE_TELEGRAM_BOT_TOKEN"
  | "VITE_TELEGRAM_CHAT_ID"
  | "VITE_AFFILIATE_WHITELIST"
  | "VITE_JULES_API_KEY"
  | "VITE_STRIPE_PUBLISHABLE_KEY"
  | "VITE_STRIPE_PRICE_PREMIUM"
  | "VITE_STRIPE_PRICE_COACH"
  | "VITE_DEMO_MODE"
  | "VITE_DAWAYIR_LIVE_ENABLED"
  | "VITE_DAWAYIR_LIVE_API_KEY"
  | "VITE_DAWAYIR_LIVE_MODEL"
  | "VITE_DAWAYIR_LIVE_VOICE";

type NextPublicKey =
  | "NEXT_PUBLIC_APP_ENV"
  | "NEXT_PUBLIC_APP_CONTENT_REALTIME"
  | "NEXT_PUBLIC_PHASE_ONE_USER_FLOW"
  | "NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER"
  | "NEXT_PUBLIC_ADMIN_ALLOWED_ROLES"
  | "NEXT_PUBLIC_ADMIN_CODE"
  | "NEXT_PUBLIC_ADMIN_API_BASE"
  | "NEXT_PUBLIC_GA_MEASUREMENT_ID"
  | "NEXT_PUBLIC_CLARITY_PROJECT_ID"
  | "NEXT_PUBLIC_CONTENTSQUARE_PROJECT_ID"
  | "NEXT_PUBLIC_AUTH_REDIRECT_URL"
  | "NEXT_PUBLIC_PUBLIC_APP_URL"
  | "NEXT_PUBLIC_GEMINI_AI_ENABLED"
  | "NEXT_PUBLIC_SENTRY_DSN"
  | "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"
  | "NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE"
  | "NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE"
  | "NEXT_PUBLIC_OWNER_SECURITY_WEBHOOK_URL"
  | "NEXT_PUBLIC_TELEGRAM_BOT_TOKEN"
  | "NEXT_PUBLIC_TELEGRAM_CHAT_ID"
  | "NEXT_PUBLIC_AFFILIATE_WHITELIST"
  | "NEXT_PUBLIC_JULES_API_KEY"
  | "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  | "NEXT_PUBLIC_STRIPE_PRICE_PREMIUM"
  | "NEXT_PUBLIC_STRIPE_PRICE_COACH"
  | "NEXT_PUBLIC_DEMO_MODE"
  | "NEXT_PUBLIC_DAWAYIR_LIVE_ENABLED"
  | "NEXT_PUBLIC_DAWAYIR_LIVE_API_KEY"
  | "NEXT_PUBLIC_DAWAYIR_LIVE_MODEL"
  | "NEXT_PUBLIC_DAWAYIR_LIVE_VOICE";

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

function toNextPublicKey(key: RuntimeKey): NextPublicKey {
  return key.replace("VITE_", "NEXT_PUBLIC_") as NextPublicKey;
}

function readNextPublicStatic(key: NextPublicKey): string | undefined {
  const candidates: Record<NextPublicKey, string | undefined> = {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_CONTENT_REALTIME: process.env.NEXT_PUBLIC_APP_CONTENT_REALTIME,
    NEXT_PUBLIC_PHASE_ONE_USER_FLOW: process.env.NEXT_PUBLIC_PHASE_ONE_USER_FLOW,
    NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED: process.env.NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER,
    NEXT_PUBLIC_ADMIN_ALLOWED_ROLES: process.env.NEXT_PUBLIC_ADMIN_ALLOWED_ROLES,
    NEXT_PUBLIC_ADMIN_CODE: process.env.NEXT_PUBLIC_ADMIN_CODE,
    NEXT_PUBLIC_ADMIN_API_BASE: process.env.NEXT_PUBLIC_ADMIN_API_BASE,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
    NEXT_PUBLIC_CONTENTSQUARE_PROJECT_ID: process.env.NEXT_PUBLIC_CONTENTSQUARE_PROJECT_ID,
    NEXT_PUBLIC_AUTH_REDIRECT_URL: process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL,
    NEXT_PUBLIC_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_PUBLIC_APP_URL,
    NEXT_PUBLIC_GEMINI_AI_ENABLED: process.env.NEXT_PUBLIC_GEMINI_AI_ENABLED,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    NEXT_PUBLIC_OWNER_SECURITY_WEBHOOK_URL: process.env.NEXT_PUBLIC_OWNER_SECURITY_WEBHOOK_URL,
    NEXT_PUBLIC_TELEGRAM_BOT_TOKEN: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN,
    NEXT_PUBLIC_TELEGRAM_CHAT_ID: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
    NEXT_PUBLIC_AFFILIATE_WHITELIST: process.env.NEXT_PUBLIC_AFFILIATE_WHITELIST,
    NEXT_PUBLIC_JULES_API_KEY: process.env.NEXT_PUBLIC_JULES_API_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PRICE_PREMIUM: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM,
    NEXT_PUBLIC_STRIPE_PRICE_COACH: process.env.NEXT_PUBLIC_STRIPE_PRICE_COACH,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    NEXT_PUBLIC_DAWAYIR_LIVE_ENABLED: process.env.NEXT_PUBLIC_DAWAYIR_LIVE_ENABLED,
    NEXT_PUBLIC_DAWAYIR_LIVE_API_KEY: process.env.NEXT_PUBLIC_DAWAYIR_LIVE_API_KEY,
    NEXT_PUBLIC_DAWAYIR_LIVE_MODEL: process.env.NEXT_PUBLIC_DAWAYIR_LIVE_MODEL,
    NEXT_PUBLIC_DAWAYIR_LIVE_VOICE: process.env.NEXT_PUBLIC_DAWAYIR_LIVE_VOICE
  };
  const value = candidates[key];
  return typeof value === "string" && value.length > 0 ? value.trim() : undefined;
}

function readViteEnvValue(key: RuntimeKey): string | undefined {
  try {
    // Keep access in property form for Next/Webpack compatibility.
    const viteEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
    const value = viteEnv?.[key];
    if (typeof value === "string" && value.length > 0) return value.trim();
  } catch {
    // ignore when import.meta.env is unavailable
  }
  return undefined;
}

function readEnv(key: RuntimeKey): string | undefined {
  // 1. Try Vite's import.meta.env first (for backward compatibility if needed)
  const viteVal = readViteEnvValue(key);
  if (viteVal) return viteVal;

  // 2. Try Next.js public env/runtime fallback via the safe process accessor.
  const nextKey = toNextPublicKey(key);
  const staticNextVal = readNextPublicStatic(nextKey);
  if (staticNextVal) return staticNextVal;

  const penv = safeProcessEnv();
  const nextVal = penv[nextKey];
  if (typeof nextVal === "string" && nextVal.length > 0) return nextVal.trim();

  // 3. Try direct key from process.env
  const directVal = penv[key];
  if (typeof directVal === "string" && directVal.length > 0) return directVal.trim();

  return undefined;
}

const penv = safeProcessEnv();
const processNodeEnv = typeof penv.NODE_ENV === "string" ? penv.NODE_ENV : undefined;

export const runtimeEnv = {
  isDev: processNodeEnv !== "production",
  isProd: processNodeEnv === "production",
  appEnv: readEnv("VITE_APP_ENV"),
  appContentRealtime: readEnv("VITE_APP_CONTENT_REALTIME"),
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
  ownerSecurityWebhookUrl: readEnv("VITE_OWNER_SECURITY_WEBHOOK_URL"),
  telegramBotToken: readEnv("VITE_TELEGRAM_BOT_TOKEN"),
  telegramChatId: readEnv("VITE_TELEGRAM_CHAT_ID"),
  affiliateWhitelist: readEnv("VITE_AFFILIATE_WHITELIST"),
  julesApiKey: readEnv("VITE_JULES_API_KEY"),
  stripePublishableKey: readEnv("VITE_STRIPE_PUBLISHABLE_KEY"),
  stripePricePremium: readEnv("VITE_STRIPE_PRICE_PREMIUM"),
  stripePriceCoach: readEnv("VITE_STRIPE_PRICE_COACH"),
  isDemoMode: readEnv("VITE_DEMO_MODE") === "true",
  dawayirLiveEnabled: readEnv("VITE_DAWAYIR_LIVE_ENABLED"),
  dawayirLiveApiKey: readEnv("VITE_DAWAYIR_LIVE_API_KEY"),
  dawayirLiveModel: readEnv("VITE_DAWAYIR_LIVE_MODEL"),
  dawayirLiveVoice: readEnv("VITE_DAWAYIR_LIVE_VOICE"),
} as const;
