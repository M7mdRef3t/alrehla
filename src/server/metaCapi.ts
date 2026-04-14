import { logger } from "@/services/logger";
import crypto from "crypto";

export interface MetaCapiEventData {
<<<<<<< HEAD
  eventName: "Lead" | "ViewContent" | "Contact" | "CompleteRegistration";
=======
  eventName: "Lead" | "ViewContent" | "Contact" | "CompleteRegistration" | "GateQualified";
>>>>>>> feat/sovereign-final-stabilization
  eventId: string; // lead_id for deduplication
  sourceUrl: string;
  userData: {
    email?: string | null;
    phone?: string | null;
    fbc?: string | null;
    fbp?: string | null;
    clientIpAddress?: string | null;
    clientUserAgent?: string | null;
  };
}

type MetaPayload = {
  data: Array<{
    event_name: MetaCapiEventData["eventName"];
    event_time: number;
    event_id: string;
    event_source_url: string;
    action_source: "website";
    user_data: Record<string, string | undefined>;
<<<<<<< HEAD
    test_event_code?: string;
  }>;
=======
  }>;
  test_event_code?: string;
>>>>>>> feat/sovereign-final-stabilization
};

function hashData(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function hashPhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  // Meta expects only digits for phone, including country code (e.g. 2010...)
  const normalized = phone.replace(/[^\d]/g, ""); 
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export async function sendMetaCapiEvent(params: MetaCapiEventData): Promise<boolean> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CONVERSIONS_API_TOKEN;

  // Wait for variables to be present
  if (!pixelId || !token) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Meta CAPI] Skipped ${params.eventName} (missing config PIXEL_ID or CAPI_TOKEN)`);
    }
    return false;
  }

  const { eventName, eventId, sourceUrl, userData } = params;

  // Clean undefined/null fields out of user_data to prevent FB API errors
  const user_data: Record<string, string | undefined> = {
    client_ip_address: userData.clientIpAddress || undefined,
    client_user_agent: userData.clientUserAgent || undefined,
    em: hashData(userData.email),
    ph: hashPhone(userData.phone),
    fbc: userData.fbc || undefined,
    fbp: userData.fbp || undefined,
  };

  // Remove undefined completely
  for (const key of Object.keys(user_data)) {
    if (user_data[key] === undefined) {
      delete user_data[key];
    }
  }

  const payload: MetaPayload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        event_id: eventId,
        event_source_url: sourceUrl,
        action_source: "website",
        user_data
      },
    ],
  };

  // Add Test Event Code if defined in environment variables
  if (process.env.META_TEST_EVENT_CODE) {
<<<<<<< HEAD
    payload.data[0].test_event_code = process.env.META_TEST_EVENT_CODE;
=======
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
>>>>>>> feat/sovereign-final-stabilization
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      logger.error("[Meta CAPI Error]", body);
      return false;
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[Meta CAPI] Success: ${eventName} for ${eventId}`);
    }
    return true;
  } catch (err) {
    logger.error("[Meta CAPI Fetch Error]", err);
    return false;
  }
}
