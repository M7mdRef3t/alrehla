import { createHmac, randomBytes } from "crypto";

// Use a secure random fallback that persists for the lifetime of the process
// if neither UNSUB_SECRET nor CRON_SECRET is provided. This prevents the app from
// failing in non-production environments while still avoiding hardcoded defaults.
const SECURE_RANDOM_FALLBACK = randomBytes(32).toString("hex");

function getUnsubSecret(): string {
  const secret = process.env.UNSUB_SECRET || process.env.CRON_SECRET || "";

  if (!secret.trim()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("UNSUB_SECRET or CRON_SECRET must be configured in production");
    }
    return SECURE_RANDOM_FALLBACK;
  }

  return secret.trim();
}

export function buildUnsubToken(leadId: string, email: string): string {
  const secret = getUnsubSecret();

  return createHmac("sha256", secret)
    .update(`${leadId}::${email}`)
    .digest("hex")
    .slice(0, 32);
}

export function buildUnsubLink(appUrl: string, leadId: string, email: string): string {
  const token = buildUnsubToken(leadId, email);
  return `${appUrl}/api/unsubscribe?id=${leadId}&token=${token}`;
}
