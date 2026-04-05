import { createHmac } from "crypto";

function getUnsubSecret(): string | null {
  const secret = process.env.UNSUB_SECRET || "";
  return secret.trim() || null;
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
