import { createHmac } from "crypto";

// Fallback logic for random secrets in an edge-compatible way
let SECURE_RANDOM_FALLBACK = "";

function getFallbackSecret(): string {
  if (!SECURE_RANDOM_FALLBACK) {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
       const array = new Uint8Array(32);
       crypto.getRandomValues(array);
       SECURE_RANDOM_FALLBACK = Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
    } else {
       // Node.js fallback or less secure fallback if web crypto is completely unavailable
       SECURE_RANDOM_FALLBACK = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    }
  }
  return SECURE_RANDOM_FALLBACK;
}

function getUnsubSecret(): string {
  const secret = process.env.UNSUB_SECRET || process.env.CRON_SECRET || "";

  if (!secret.trim()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("UNSUB_SECRET or CRON_SECRET must be configured in production");
    }
    return getFallbackSecret();
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
