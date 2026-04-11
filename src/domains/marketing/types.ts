/**
 * Domain: Marketing — Types
 */

export type LeadSource =
  | "meta_ads"
  | "google_ads"
  | "organic"
  | "referral"
  | "telegram"
  | "whatsapp"
  | "direct"
  | "other";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost"
  | "nurturing";

export interface MarketingLead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  notes?: string;
  createdAt: string;
  convertedAt?: string;
}

export interface CampaignMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  spend: number;
  revenue: number;
  roas: number;
}

export interface AttributionEvent {
  eventName: string;
  leadId?: string;
  source: LeadSource;
  value?: number;
  timestamp: string;
}
