import { createHmac, randomBytes } from "crypto";

let fallbackSecret: string | null = null;

function getUnsubSecret(): string | null {
  const secret = process.env.UNSUB_SECRET || process.env.CRON_SECRET || "";
  if (secret.trim()) {
    return secret.trim();
  }

  if (!fallbackSecret) {
    console.warn("⚠️ UNSUB_SECRET and CRON_SECRET are not configured. Falling back to a secure random string for this session.");
    fallbackSecret = randomBytes(32).toString("hex");
  }

  return fallbackSecret;
}

export function buildUnsubToken(leadId: string, email: string): string {
  const secret = getUnsubSecret();
  if (!secret) {
    throw new Error("UNSUB_SECRET is not configured");
  }

  return createHmac("sha256", secret)
    .update(`${leadId}::${email}`)
    .digest("hex")
    .slice(0, 32);
}

export function buildUnsubLink(appUrl: string, leadId: string, email: string): string {
  const token = buildUnsubToken(leadId, email);
  return `${appUrl}/api/unsubscribe?id=${leadId}&token=${token}`;
}
