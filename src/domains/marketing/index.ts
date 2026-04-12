/**
 * Domain: Marketing — Public API
 */

export type {
  LeadSource,
  LeadStatus,
  MarketingLead,
  CampaignMetrics,
  AttributionEvent,
} from "./types";

export { marketingService } from "./services/marketing.service";
