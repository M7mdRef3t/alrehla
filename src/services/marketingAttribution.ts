import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { getSearch } from "./navigation";

const KEY_UTM = "dawayir-utm-params";
const KEY_UTM_CAPTURED_AT = "dawayir-utm-captured-at";
const KEY_LEAD_ATTRIBUTION = "dawayir-lead-attribution";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid"
] as const;

const LEAD_ATTRIBUTION_KEYS = ["lead_id", "lead_source"] as const;

export type CapturedUtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;
export type CapturedLeadAttribution = Partial<Record<(typeof LEAD_ATTRIBUTION_KEYS)[number], string>>;

function sanitizeValue(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getStoredUtmParams(): CapturedUtmParams | null {
  try {
    const raw = getFromLocalStorage(KEY_UTM);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CapturedUtmParams;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function getStoredLeadAttribution(): CapturedLeadAttribution | null {
  try {
    const raw = getFromLocalStorage(KEY_LEAD_ATTRIBUTION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CapturedLeadAttribution;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function captureUtmFromCurrentUrl(): CapturedUtmParams | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(getSearch());
  const captured: CapturedUtmParams = {};

  UTM_KEYS.forEach((key) => {
    const value = sanitizeValue(params.get(key));
    if (value) captured[key] = value;
  });

  if (Object.keys(captured).length === 0) return null;

  const alreadyStored = getStoredUtmParams();
  if (alreadyStored && Object.keys(alreadyStored).length > 0) {
    return alreadyStored;
  }

  setInLocalStorage(KEY_UTM, JSON.stringify(captured));
  setInLocalStorage(KEY_UTM_CAPTURED_AT, String(Date.now()));
  return captured;
}

export function captureLeadAttributionFromCurrentUrl(): CapturedLeadAttribution | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(getSearch());
  const captured: CapturedLeadAttribution = {};

  LEAD_ATTRIBUTION_KEYS.forEach((key) => {
    const value = sanitizeValue(params.get(key));
    if (value) captured[key] = value;
  });

  if (Object.keys(captured).length === 0) return null;

  const alreadyStored = getStoredLeadAttribution();
  if (alreadyStored && Object.keys(alreadyStored).length > 0) {
    return alreadyStored;
  }

  // Verify signature if lead_id is present
  const leadId = captured.lead_id;
  const sig = sanitizeValue(params.get("sig"));

  if (leadId) {
    if (!sig) {
      console.warn("Lead attribution missing signature, ignoring");
      return null;
    }

    // We do async verification but don't block the UI return.
    // However, if we want to prevent IDOR we should only store it after validation.
    // For simplicity, we can fetch immediately.
    fetch(`/api/marketing/lead/verify?lead_id=${encodeURIComponent(leadId)}&sig=${encodeURIComponent(sig)}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setInLocalStorage(KEY_LEAD_ATTRIBUTION, JSON.stringify(captured));
        } else {
          console.warn("Lead attribution signature invalid, ignoring");
        }
      })
      .catch(err => console.error("Lead verification failed", err));

    // We return captured immediately but storage is delayed until verification.
    return captured;
  }

  setInLocalStorage(KEY_LEAD_ATTRIBUTION, JSON.stringify(captured));
  return captured;
}
