import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { getSearch } from "./navigation";

const KEY_UTM = "dawayir-utm-params";
const KEY_UTM_CAPTURED_AT = "dawayir-utm-captured-at";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid"
] as const;

export type CapturedUtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

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
