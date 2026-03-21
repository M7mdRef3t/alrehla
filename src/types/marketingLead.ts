export const MARKETING_LEAD_SOURCE_TYPES = ["website", "meta_instant_form", "manual_import"] as const;
export const MARKETING_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "unresponsive",
  "started",
  "converted"
] as const;

export type MarketingLeadSourceType = (typeof MARKETING_LEAD_SOURCE_TYPES)[number];
export type MarketingLeadStatus = (typeof MARKETING_LEAD_STATUSES)[number];

export type MarketingLeadUtm = Record<string, string>;

export interface MarketingLeadPayload {
  [key: string]: any; // Allow index signature for raw data processing
  leadId?: string;
  email?: string;
  phone?: string;
  name?: string;
  source?: string;
  sourceType?: MarketingLeadSourceType;
  utm?: MarketingLeadUtm;
  campaign?: string;
  adset?: string;
  ad?: string;
  placement?: string;
  note?: string;
  status?: MarketingLeadStatus;
  lastContactedAt?: string;
  qualifiedAt?: string;
}

export interface NormalizedMarketingLeadInput {
  leadId?: string;
  email: string;
  phone: string | null;
  name: string | null;
  source: string;
  sourceType: MarketingLeadSourceType;
  utm: MarketingLeadUtm | null;
  campaign: string | null;
  adset: string | null;
  ad: string | null;
  placement: string | null;
  note: string | null;
  status: MarketingLeadStatus;
  lastContactedAt: string | null;
  qualifiedAt: string | null;
}

export interface MarketingLeadImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}
