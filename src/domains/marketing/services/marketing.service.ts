/**
 * Domain: Marketing — Attribution & Lead Service
 *
 * Facade فوق marketingAttribution.ts + marketingLeadService.ts
 */

import {
  getStoredLeadAttribution,
  getStoredUtmParams,
  captureLeadAttributionFromCurrentUrl,
  captureUtmFromCurrentUrl,
} from "@/services/marketingAttribution";

export const marketingService = {
  getLeadAttribution() {
    return getStoredLeadAttribution();
  },

  getUtmParams() {
    return getStoredUtmParams();
  },

  storeAttribution(): void {
    captureLeadAttributionFromCurrentUrl();
  },

  storeUtm(): void {
    captureUtmFromCurrentUrl();
  },

  /**
   * هل المستخدم قادم من حملة تسويقية؟
   */
  hasCampaignSource(): boolean {
    const utm = getStoredUtmParams();
    return Boolean(utm?.utm_source);
  },

  /**
   * ملخص الـ attribution للـ analytics
   */
  getAttributionSummary(): {
    leadId: string | null;
    source: string | null;
    campaign: string | null;
    medium: string | null;
  } {
    const attr = getStoredLeadAttribution();
    const utm = getStoredUtmParams();
    return {
      leadId: attr?.lead_id ?? null,
      source: utm?.utm_source ?? attr?.lead_source ?? null,
      campaign: utm?.utm_campaign ?? null,
      medium: utm?.utm_medium ?? null,
    };
  },
};
