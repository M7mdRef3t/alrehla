import { logger } from "@/services/logger";
import type { MarketingLeadPayload } from "@/types/marketingLead";
import type { FunnelIdentifiers } from "@/domains/funnel/contracts";
import { trackLead, getOrCreateAnonymousId, getStoredClientEventId } from "./analytics";
import { recordFlowEvent } from "./journeyTracking";
import { getStoredUtmParams } from "./marketingAttribution";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { loadDiagnosisState } from "@/modules/diagnosis/types";
import { BotpressService } from "./botpressService";

const STORAGE_KEY_LEAD_ID = "dawayir_lead_id";
const STORAGE_KEY_LEAD_PHONE = "dawayir_lead_phone";

export type CaptureLeadResponse = {
  success: boolean;
  leadId?: string;
  phoneNormalized?: string;
  mergeConflict?: boolean;
  error?: string;
};

export type CaptureMarketingLeadInput = {
  email?: string;
  phone?: string;
  note?: string;
  status?: MarketingLeadPayload["status"];
  source?: string;
  sourceType?: MarketingLeadPayload["sourceType"];
  metadata?: Record<string, any>;
  anonymousId?: string;
  clientEventId?: string;
  attribution?: FunnelIdentifiers;
};

function buildLeadPayload(input: CaptureMarketingLeadInput): MarketingLeadPayload {
  const { attribution, ...payloadInput } = input;
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
    ...payloadInput,
    ...(attribution ?? {}),
    email: input.email || undefined,
    phone: input.phone || undefined,
    note: input.note?.trim() || undefined,
    status: input.status || "engaged",
    source: input.source || "landing",
    sourceType: inferredSourceType as any,
    utm: utm ?? undefined,
    campaign: utm?.utm_campaign,
    anonymousId: input.anonymousId || getOrCreateAnonymousId(),
    clientEventId: getStoredClientEventId(), // Unified ID for Meta Deduplication
    metadata: {
      ...input.metadata,
      capturedAt: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      poeticState: input.metadata?.state,
      leadIntent: input.metadata?.intent,
      diagnosis: loadDiagnosisState() ?? undefined
    }
  };
}

/**
 * Capture or update a marketing lead.
 * This is the primary entry point for Lead CRM sync.
 */
if (typeof window !== "undefined") { (window as any).marketingLeadService = { captureMarketingLead, syncLead: captureMarketingLead }; } export async function captureMarketingLead(
  input: CaptureMarketingLeadInput
): Promise<CaptureLeadResponse> {
  const payload = buildLeadPayload(input);

  try {
    // Analytics & Event Tracking - Fire immediately upon user intent
    // We do NOT wait for API response here to ensure marketing attribution persists even on network failure
    try {
      const campaign = payload.campaign || "unknown";
      const source = payload.source || "landing";
      
      recordFlowEvent("lead_captured", {
        meta: {
          status: payload.status,
          hasPhone: !!payload.phone,
          sourceType: payload.sourceType
        }
      });

      trackLead({
        source,
        source_type: payload.sourceType || "website",
        campaign,
        client_event_id: payload.clientEventId
      });
    } catch (e) {
      console.warn("Analytics tracking failed:", e);
    }

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

    // P0-2: Trigger Botpress if phone is captured and diagnosis exists
    if (resolvedPhone && payload.metadata?.diagnosis) {
      void BotpressService.sendMessage({
        userId: resolvedPhone,
        text: `DIAGNOSIS_COMPLETED: ${payload.metadata.diagnosis.type}`,
        metadata: {
          phone: resolvedPhone,
          name: payload.name,
          diagnosis: payload.metadata.diagnosis,
          source: payload.source
        }
      }).catch(err => console.error("Botpress trigger failed:", err));
    }

    return {
      success: true,
      leadId: resolvedLeadId,
      phoneNormalized: resolvedPhone,
      mergeConflict: resolvedConflict
    };
  } catch (err) {
    logger.error("Marketing Lead capture error:", err);
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
