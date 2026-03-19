import {
  MARKETING_LEAD_SOURCE_TYPES,
  MARKETING_LEAD_STATUSES,
  type MarketingLeadPayload,
  type MarketingLeadSourceType,
  type MarketingLeadStatus,
  type MarketingLeadUtm,
  type NormalizedMarketingLeadInput
} from "../types/marketingLead";

function sanitizeText(value: unknown, max = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function sanitizePhone(value: unknown): string | null {
  const text = sanitizeText(value, 40);
  if (!text) return null;
  const normalized = text.replace(/[^\d+]/g, "");
  return normalized || null;
}

function sanitizeIsoDate(value: unknown): string | null {
  const text = sanitizeText(value, 80);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function sanitizeSource(value: unknown): string {
  return sanitizeText(value, 80) ?? "landing";
}

function sanitizeSourceType(value: unknown, fallback: MarketingLeadSourceType): MarketingLeadSourceType {
  if (typeof value !== "string") return fallback;
  return (MARKETING_LEAD_SOURCE_TYPES as readonly string[]).includes(value) ? (value as MarketingLeadSourceType) : fallback;
}

function sanitizeStatus(value: unknown): MarketingLeadStatus {
  if (typeof value !== "string") return "new";
  return (MARKETING_LEAD_STATUSES as readonly string[]).includes(value) ? (value as MarketingLeadStatus) : "new";
}

function sanitizeUtm(value: unknown): MarketingLeadUtm | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const safeEntries = Object.entries(value as Record<string, unknown>)
    .map(([key, raw]) => {
      const safeKey = sanitizeText(key, 64);
      const safeValue = sanitizeText(raw, 200);
      return safeKey && safeValue ? [safeKey, safeValue] : null;
    })
    .filter((entry): entry is [string, string] => Array.isArray(entry));
  if (safeEntries.length === 0) return null;
  return Object.fromEntries(safeEntries);
}

export function isValidMarketingLeadEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeMarketingLeadPayload(
  payload: MarketingLeadPayload,
  fallbackSourceType: MarketingLeadSourceType = "website"
): NormalizedMarketingLeadInput | null {
  const email = sanitizeText(payload.email, 160)?.toLowerCase() ?? null;
  if (!email || !isValidMarketingLeadEmail(email)) return null;

  return {
    email,
    phone: sanitizePhone(payload.phone),
    name: sanitizeText(payload.name, 120),
    source: sanitizeSource(payload.source),
    sourceType: sanitizeSourceType(payload.sourceType, fallbackSourceType),
    utm: sanitizeUtm(payload.utm),
    campaign: sanitizeText(payload.campaign, 160),
    adset: sanitizeText(payload.adset, 160),
    ad: sanitizeText(payload.ad, 160),
    placement: sanitizeText(payload.placement, 160),
    note: sanitizeText(payload.note, 600),
    status: sanitizeStatus(payload.status),
    lastContactedAt: sanitizeIsoDate(payload.lastContactedAt),
    qualifiedAt: sanitizeIsoDate(payload.qualifiedAt)
  };
}

export function dedupeMarketingLeadInputs(inputs: NormalizedMarketingLeadInput[]): NormalizedMarketingLeadInput[] {
  const deduped = new Map<string, NormalizedMarketingLeadInput>();
  inputs.forEach((input) => {
    deduped.set(input.email, input);
  });
  return Array.from(deduped.values());
}
