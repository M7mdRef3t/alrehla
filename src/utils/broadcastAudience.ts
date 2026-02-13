export type BroadcastAudience = "all" | "users" | "installed" | "visitors";

const AUDIENCE_REGEX = /__aud_(all|users|installed|visitors)$/i;

export function withBroadcastAudienceId(baseId: string, audience: BroadcastAudience): string {
  const clean = String(baseId ?? "").trim();
  if (!clean) return `broadcast_${Date.now()}__aud_${audience}`;
  const withoutSuffix = clean.replace(AUDIENCE_REGEX, "");
  return `${withoutSuffix}__aud_${audience}`;
}

export function getBroadcastAudienceFromId(id: string | null | undefined): BroadcastAudience {
  const text = String(id ?? "");
  const match = text.match(AUDIENCE_REGEX);
  const raw = (match?.[1] ?? "").toLowerCase();
  if (raw === "users" || raw === "installed" || raw === "visitors" || raw === "all") return raw;
  return "all";
}

