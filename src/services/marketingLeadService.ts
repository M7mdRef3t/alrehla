import type { MarketingLeadPayload } from "../types/marketingLead";
import { trackLead } from "./analytics";
import { recordFlowEvent } from "./journeyTracking";
import { getStoredUtmParams } from "./marketingAttribution";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";

const STORAGE_KEY_LEAD_ID = "dawayir_lead_id";
const STORAGE_KEY_LEAD_PHONE = "dawayir_lead_phone";

export type CaptureLeadResponse = {
  success: boolean;
  leadId?: string;
  phoneNormalized?: string;
  mergeConflict?: boolean;
  error?: string;
};

type CaptureMarketingLeadInput = {
  email?: string;
  phone?: string;
  note?: string;
  status?: MarketingLeadPayload["status"];
  source?: string;
  sourceType?: MarketingLeadPayload["sourceType"];
  metadata?: Record<string, any>;
};

function buildLeadPayload(input: CaptureMarketingLeadInput): MarketingLeadPayload {
  const utm = getStoredUtmParams();
  
  return {
    ...input,
    email: input.email || undefined,
    phone: input.phone || undefined,
    note: input.note?.trim() || undefined,
    status: input.status || "engaged",
    source: input.source || "landing",
    sourceType: input.sourceType || "website",
    utm: utm ?? undefined,
    campaign: utm?.utm_campaign,
    metadata: {
      ...input.metadata,
      capturedAt: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : undefined
    }
  };
}

/**
 * Capture or update a marketing lead.
 * This is the primary entry point for Lead CRM sync.
 */
export async function captureMarketingLead(
  input: CaptureMarketingLeadInput
): Promise<CaptureLeadResponse> {
  const payload = buildLeadPayload(input);

  try {
    const response = await fetch("/api/marketing/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to capture lead" };
    }

    // Persist identity for session continuity
    if (data.leadId) {
      setInLocalStorage(STORAGE_KEY_LEAD_ID, data.leadId);
    }
    if (data.phoneNormalized) {
      setInLocalStorage(STORAGE_KEY_LEAD_PHONE, data.phoneNormalized);
    }

    // Analytics & Event Tracking
    try {
      const campaign = payload.campaign || "unknown";
      const source = payload.source || "landing";
      
      recordFlowEvent("lead_captured", {
        meta: {
          leadId: data.leadId,
          status: payload.status,
          hasPhone: !!payload.phone,
          mergeConflict: data.mergeConflict
        }
      });

      trackLead({
        source,
        source_type: payload.sourceType || "website",
        campaign
      });
    } catch (e) {
      console.warn("Analytics failed, but lead captured:", e);
    }

    return {
      success: true,
      leadId: data.leadId,
      phoneNormalized: data.phoneNormalized,
      mergeConflict: data.mergeConflict
    };
  } catch (err) {
    console.error("Marketing Lead capture error:", err);
    return { success: false, error: "Network error" };
  }
}

/**
 * Get the stored lead ID for the current session.
 */
export function getStoredLeadId(): string | null {
  return getFromLocalStorage(STORAGE_KEY_LEAD_ID);
}

/**
 * Get the stored phone for the current session.
 */
export function getStoredLeadPhone(): string | null {
  return getFromLocalStorage(STORAGE_KEY_LEAD_PHONE);
}

/**
 * Unified Lead Sync Helper
 */
export async function syncLead(input: CaptureMarketingLeadInput): Promise<CaptureLeadResponse> {
  return captureMarketingLead(input);
}

export const marketingLeadService = {
  captureMarketingLead,
  getStoredLeadId,
  getStoredLeadPhone,
  syncLead
};
