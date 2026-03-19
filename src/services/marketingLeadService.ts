import type { MarketingLeadPayload } from "../types/marketingLead";
import { trackLead } from "./analytics";
import { recordFlowEvent } from "./journeyTracking";
import { getStoredUtmParams } from "./marketingAttribution";

type CaptureMarketingLeadInput = string | MarketingLeadPayload;

function buildLeadPayload(input: CaptureMarketingLeadInput, note?: string): MarketingLeadPayload {
  if (typeof input === "string") {
    const utm = getStoredUtmParams();
    const trimmedNote = note?.trim();
    return {
      email: input,
      note: trimmedNote || undefined,
      source: "landing",
      sourceType: "website",
      utm: utm ?? undefined,
      campaign: utm?.utm_campaign
    };
  }

  const storedUtm = getStoredUtmParams();
  const utm = input.utm ?? storedUtm ?? undefined;
  const trimmedNote = input.note?.trim();

  return {
    ...input,
    note: trimmedNote || undefined,
    source: input.source ?? "landing",
    sourceType: input.sourceType ?? "website",
    utm,
    campaign: input.campaign ?? utm?.utm_campaign
  };
}

export async function captureMarketingLead(
  input: CaptureMarketingLeadInput,
  note?: string
): Promise<boolean> {
  const payload = buildLeadPayload(input, note);

  try {
    const response = await fetch("/api/marketing/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return false;

    const campaign = payload.campaign ?? payload.utm?.utm_campaign ?? "unknown";
    const source = payload.source ?? "landing";
    const sourceType = payload.sourceType ?? "website";

    try {
      recordFlowEvent("lead_form_submitted", {
        meta: {
          source,
          sourceType,
          campaign
        }
      });
      trackLead({
        source,
        source_type: sourceType,
        campaign
      });
    } catch {
      // Keep lead capture resilient even if tracking providers fail.
    }

    return true;
  } catch {
    return false;
  }
}
