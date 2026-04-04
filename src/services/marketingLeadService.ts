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
  const utmSource = (utm?.utm_source || "").toLowerCase();
  const utmMedium = (utm?.utm_medium || "").toLowerCase();

  // Smart Inference (consistent with server-side)
  let inferredSourceType = input.sourceType || "website";
  if (inferredSourceType === "website") {
    const isMeta = ["facebook", "meta", "fb", "instagram", "ig", "fbad"].includes(utmSource) || utmMedium === "paidsocial";
    if (isMeta) inferredSourceType = "meta_instant_form";
    else if (["whatsapp", "wa"].includes(utmSource) || utmMedium === "whatsapp") inferredSourceType = "whatsapp";
  }
  
  return {
    ...input,
    email: input.email || undefined,
    phone: input.phone || undefined,
    note: input.note?.trim() || undefined,
    status: input.status || "engaged",
    source: input.source || "landing",
    sourceType: inferredSourceType as any,
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

    // API returns: { ok: true, lead: { lead_id, phone, conflict, email } }
    // Normalize to consistent internal shape
    const leadObj = data.lead ?? data; // fallback to top-level for backwards compat
    const resolvedLeadId: string | undefined = leadObj.lead_id ?? leadObj.leadId;
    const resolvedPhone: string | undefined = leadObj.phone ?? leadObj.phoneNormalized;
    const resolvedConflict: boolean = leadObj.conflict ?? leadObj.mergeConflict ?? false;

    // Persist identity for session continuity
    if (resolvedLeadId) {
      setInLocalStorage(STORAGE_KEY_LEAD_ID, resolvedLeadId);
    }
    if (resolvedPhone) {
      setInLocalStorage(STORAGE_KEY_LEAD_PHONE, resolvedPhone);
    }

    // Analytics & Event Tracking
    try {
      const campaign = payload.campaign || "unknown";
      const source = payload.source || "landing";
      
      recordFlowEvent("lead_captured", {
        meta: {
          leadId: resolvedLeadId,
          status: payload.status,
          hasPhone: !!payload.phone,
          mergeConflict: resolvedConflict
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
      leadId: resolvedLeadId,
      phoneNormalized: resolvedPhone,
      mergeConflict: resolvedConflict
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
