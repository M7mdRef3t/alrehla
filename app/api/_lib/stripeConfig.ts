import Stripe from "stripe";

export type StripeRuntimeMode = "test" | "live";

export type StripeResolvedConfig = {
  mode: StripeRuntimeMode;
  secretKey: string;
  webhookSecret: string;
  pricePremium: string;
  priceCoach: string;
  siteUrl: string;
};

function read(value: string | undefined | null): string {
  return String(value ?? "").trim();
}

function resolveMode(): StripeRuntimeMode {
  const raw = read(process.env.STRIPE_MODE).toLowerCase();
  return raw === "live" ? "live" : "test";
}

function pickByMode(mode: StripeRuntimeMode, testValue: string, liveValue: string, legacyFallback = ""): string {
  if (mode === "live") return read(liveValue) || read(legacyFallback);
  return read(testValue) || read(legacyFallback);
}

export function resolveStripeConfig(): StripeResolvedConfig {
  const mode = resolveMode();
  return {
    mode,
    secretKey: pickByMode(
      mode,
      process.env.STRIPE_SECRET_KEY_TEST ?? "",
      process.env.STRIPE_SECRET_KEY_LIVE ?? "",
      process.env.STRIPE_SECRET_KEY ?? ""
    ),
    webhookSecret: pickByMode(
      mode,
      process.env.STRIPE_WEBHOOK_SECRET_TEST ?? "",
      process.env.STRIPE_WEBHOOK_SECRET_LIVE ?? "",
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    ),
    pricePremium: pickByMode(
      mode,
      process.env.STRIPE_PRICE_PREMIUM_TEST ?? "",
      process.env.STRIPE_PRICE_PREMIUM_LIVE ?? "",
      process.env.VITE_STRIPE_PRICE_PREMIUM ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM ?? ""
    ),
    priceCoach: pickByMode(
      mode,
      process.env.STRIPE_PRICE_COACH_TEST ?? "",
      process.env.STRIPE_PRICE_COACH_LIVE ?? "",
      process.env.VITE_STRIPE_PRICE_COACH ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_COACH ?? ""
    ),
    siteUrl: read(process.env.NEXT_PUBLIC_SITE_URL) || read(process.env.PUBLIC_APP_URL) || "http://localhost:3000"
  };
}

export function getStripeClient(): { client: Stripe | null; config: StripeResolvedConfig } {
  const config = resolveStripeConfig();
  if (!config.secretKey) {
    return { client: null, config };
  }
  return {
    client: new Stripe(config.secretKey, {
      apiVersion: "2025-02-24.acacia"
    }),
    config
  };
}

export function isValidWebhookSecret(secret: string): boolean {
  return secret.startsWith("whsec_");
}

export function isAutomatedCardCheckoutEnabled(): boolean {
  const raw = read(
    process.env.NEXT_PUBLIC_AUTOMATED_CARD_CHECKOUT_ENABLED ??
      process.env.VITE_AUTOMATED_CARD_CHECKOUT_ENABLED ??
      process.env.AUTOMATED_CARD_CHECKOUT_ENABLED ??
      ""
  ).toLowerCase();
  return raw === "true";
}
