const fs = require('fs');

const path = 'src/services/marketingAttribution.ts';
let code = fs.readFileSync(path, 'utf8');

const replacement = `export function captureLeadAttributionFromCurrentUrl(): CapturedLeadAttribution | null {
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
    fetch(\`/api/marketing/lead/verify?lead_id=\${encodeURIComponent(leadId)}&sig=\${encodeURIComponent(sig)}\`)
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
}`;

code = code.replace(
  /export function captureLeadAttributionFromCurrentUrl\(\): CapturedLeadAttribution \| null \{[\s\S]*?return captured;\n\}/,
  replacement
);

fs.writeFileSync(path, code);
