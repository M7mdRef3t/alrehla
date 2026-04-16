import { logger } from "@/services/logger";
import crypto from "crypto";

export interface MetaCapiEventData {
  eventName: "Lead" | "ViewContent" | "Contact" | "CompleteRegistration" | "GateQualified" | "Purchase";
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
  }>;
  test_event_code?: string;
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
    // P0: Silence dev noise if keys are missing (common in local env)
    // We only warn if it's NOT development or if we explicitly want to debug
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_CAPI === "true") {
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
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  let retryCount = 0;
  const maxRetries = 2; // Total 3 attempts
  const baseDelay = 1000;

  while (retryCount <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8s
      
      const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[Meta CAPI] Success: ${eventName} for ${eventId}`);
        }
        // Log telemetry
        await logCapiTelemetry({
          event_name: eventName,
          event_id: eventId,
          status: "success",
          response_code: res.status,
          payload
        });
        return true;
      }

      const body = await res.json().catch(() => ({}));
      
      // If server error (5xx), we retry. If 4xx (except rate limit), we stop.
      const isRateLimit = res.status === 429;
      const isServerError = res.status >= 500;
      
      if (!isRateLimit && !isServerError) {
        logger.error("[Meta CAPI Fatal Error]", { status: res.status, body });
        await logCapiTelemetry({
          event_name: eventName,
          event_id: eventId,
          status: "failed",
          response_code: res.status,
          payload,
          error_message: JSON.stringify(body)
        });
        return false;
      }

      logger.warn(`[Meta CAPI] Attempt ${retryCount + 1} failed (${res.status}). Retrying...`);
      retryCount++;
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, retryCount)));
      } else {
        await logCapiTelemetry({
          event_name: eventName,
          event_id: eventId,
          status: "failed",
          response_code: res.status,
          payload,
          error_message: "Max retries reached"
        });
      }
    } catch (err) {
      logger.error(`[Meta CAPI Attempt ${retryCount + 1}] Error:`, err);
      retryCount++;
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, retryCount)));
      } else {
        await logCapiTelemetry({
          event_name: eventName,
          event_id: eventId,
          status: "error",
          payload,
          error_message: err instanceof Error ? err.message : String(err)
        });
        return false;
      }
    }
  }

  return false;
}

/**
 * Log CAPI event to the database for monitoring.
 */
async function logCapiTelemetry(data: {
  event_name: string;
  event_id: string;
  status: string;
  response_code?: number;
  payload: any;
  error_message?: string;
}) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      { auth: { persistSession: false } }
    );
    
    await admin.from("capi_telemetry").insert([data]);
  } catch (err) {
    console.error("[CAPI Telemetry] Failed to log to DB:", err);
  }
}
