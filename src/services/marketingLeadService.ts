import { getStoredUtmParams } from "./marketingAttribution";

export async function captureMarketingLead(email: string, note?: string): Promise<boolean> {
  try {
    const response = await fetch("/api/marketing/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        note: note?.trim() || null,
        source: "landing",
        utm: getStoredUtmParams()
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}
