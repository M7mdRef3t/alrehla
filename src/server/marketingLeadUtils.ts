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

export function sanitizePhone(value: unknown): { raw: string; normalized: string } | null {
  const text = sanitizeText(value, 40);
  if (!text) return null;

  // 1. Keep only digits
  let digits = text.replace(/\D/g, "");
  if (!digits) return null;

  // 2. Normalize Egyptian prefixes specifically to fix local entry
  // If user typed 01... (11 digits), remove the 0 -> becomes 1...
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  // If after dropping 0 it's 10 digits starting with 10,11,12,15 -> Local Egyptian -> Prepend 20
  if (digits.length === 10 && ["10", "11", "12", "15"].includes(digits.slice(0, 2))) {
    return { raw: text, normalized: `20${digits}` };
  }

  // 3. For all other numbers (GCC, International, etc.)
  // We accept any digit string between 10 and 15 digits (standard E.164 length without +)
  if (digits.length >= 10 && digits.length <= 15) {
    return { raw: text, normalized: digits };
  }

  // Final Strict Rejection: Doesn't look like a valid phone number length
  return null;
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
  // More robust regex to catch common "dirty" inputs like email+phone concatenation
  return /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(value);
}

export function normalizeMarketingLeadPayload(
  payload: MarketingLeadPayload & Record<string, unknown>,
  fallbackSourceType: MarketingLeadSourceType = "website"
): NormalizedMarketingLeadInput | null {
  const email = sanitizeText(payload.email, 160)?.toLowerCase() ?? null;
  const name = sanitizeText(payload.name || payload.full_name, 120);
  const phoneResult = sanitizePhone(payload.phone || payload.phone_number);

  // Requirement: EITHER valid email OR valid phone
  const hasValidEmail = email && isValidMarketingLeadEmail(email);
  const hasValidPhone = phoneResult && phoneResult.normalized.length >= 10;

  if (!hasValidEmail && !hasValidPhone) return null;

  const campaign = sanitizeText(payload.campaign || payload.campaign_name, 160);
  const adset = sanitizeText(payload.adset || payload.adset_name, 160);
  const ad = sanitizeText(payload.ad || payload.ad_name, 160);

  return {
    email: hasValidEmail ? email : null,
    phone: phoneResult?.normalized ?? null,
    phoneNormalized: phoneResult?.normalized ?? null,
    phoneRaw: phoneResult?.raw ?? null,
    name,
    source: sanitizeSource(payload.source),
    sourceType: sanitizeSourceType(payload.sourceType, fallbackSourceType),
    utm: sanitizeUtm(payload.utm),
    campaign,
    adset,
    ad,
    placement: sanitizeText(payload.placement, 160),
    note: sanitizeText(payload.note, 600),
    status: sanitizeStatus(payload.status),
    lastContactedAt: sanitizeIsoDate(payload.lastContactedAt),
    qualifiedAt: sanitizeIsoDate(payload.qualifiedAt),
    intent: sanitizeText(payload.intent, 100)
  };
}

export function dedupeMarketingLeadInputs(inputs: NormalizedMarketingLeadInput[]): NormalizedMarketingLeadInput[] {
  const deduped = new Map<string, NormalizedMarketingLeadInput>();
  inputs.forEach((input) => {
    // Priority: Email, then Phone
    const key = input.email || input.phoneNormalized || "anonymous";
    deduped.set(key, input);
  });
  return Array.from(deduped.values());
}
