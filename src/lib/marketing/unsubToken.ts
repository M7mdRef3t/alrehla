import { createHmac } from "crypto";

const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CRON_SECRET || "default_unsub_secret";

export function buildUnsubToken(leadId: string, email: string): string {
  return createHmac("sha256", UNSUB_SECRET)
    .update(`${leadId}::${email}`)
    .digest("hex")
    .slice(0, 32);
}

export function buildUnsubLink(appUrl: string, leadId: string, email: string): string {
  const token = buildUnsubToken(leadId, email);
  return `${appUrl}/api/unsubscribe?id=${leadId}&token=${token}`;
}
