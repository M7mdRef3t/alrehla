import { logger } from "@/services/logger";
import { NextResponse } from "next/server";
import {
  dedupeMarketingLeadInputs,
  isValidMarketingLeadEmail,
  normalizeMarketingLeadPayload,
  sanitizePhone
} from "./marketingLeadUtils";
import { getSupabaseAdminClient } from "../../app/api/_lib/supabaseAdmin";
import type {
  MarketingLeadImportResult,
  MarketingLeadPayload,
  MarketingLeadSourceType,
  NormalizedMarketingLeadInput
} from "@/types/marketingLead";
import { sendMetaCapiEvent } from "./metaCapi";
import { WhatsAppCloudService } from "../services/whatsappCloudService";

type OutreachQueueStatus = "pending" | "sent" | "failed" | "simulated";

function hasSupabaseConfig(): boolean {
  return Boolean(getSupabaseAdminClient());
}

function getRequiredSupabaseAdminClient() {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("missing_supabase_config");
  }
  return client;
}

function isDebugAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const key = process.env.MARKETING_DEBUG_KEY;
  if (!key) return false;
  return request.headers.get("x-marketing-debug-key") === key;
}

/**
 * P0-2: Builds a personalized URL with lead_id and lead_source for full attribution tracking.
 * Every outreach message MUST use this — never a bare /onboarding or external handoff link.
 */
function buildPersonalizedUrl(leadId: string, source: string, path = "/onboarding"): string {
  const base = "https://www.alrehla.app";
  return `${base}${path}?lead_id=${encodeURIComponent(leadId)}&lead_source=${encodeURIComponent(source)}`;
}

function toLeadRow(input: NormalizedMarketingLeadInput) {
  const row: any = {
    email: input.email,
    phone: input.phone,
    phone_normalized: input.phoneNormalized,
    phone_raw: input.phoneRaw,
    name: input.name,
    source: input.source,
    source_type: input.sourceType,
    utm: input.utm,
    campaign: input.campaign,
    adset: input.adset,
    ad: input.ad,
    placement: input.placement,
    note: input.note,
    status: input.status,
    last_contacted_at: input.lastContactedAt,
    qualified_at: input.qualifiedAt,
    merge_conflict: input.mergeConflict ?? false,
    intent: input.intent,
    last_intent_at: new Date().toISOString()
  };
  if (input.leadId) {
    row.lead_id = input.leadId;
  }
  return row;
}

async function enqueueOutreach(
  email: string | null,
  source: string,
  utm: Record<string, string> | null,
  leadId: string, // P0-2: required — no generic URLs allowed
  phone?: string | null
): Promise<void> {
  const supabaseAdmin = getRequiredSupabaseAdminClient();
  const now = Date.now();
  const MINUTE = 60 * 1000;
  const DAY = 24 * 60 * 60 * 1000;

  // P0-2: Both URLs are personalized — carry lead_id + lead_source for full attribution
  const onboardingUrl = buildPersonalizedUrl(leadId, source, "/onboarding");
  const steps = [
    // ... (rest of steps remain same, but we only queue email steps if email exists)
  ];

  const emailSteps = [
    { step: 1, delay: 5 * MINUTE, subject: "أهلًا بك في الرحلة — خطوتك الأولى خلال 3 دقائق" },
    { step: 2, delay: 1 * DAY, subject: "هل جربت خريطة الوعي؟ — شوف إيه اللي اتغير" },
    { step: 3, delay: 3 * DAY, subject: "\"أتمنى لو كنت عملت ده من زمان\" — حكاية مستخدم حقيقي" },
    { step: 5, delay: 7 * DAY, subject: "آخر فرصة — عرض الرواد بيخلص قريب 🔥" }
  ];

  const rows: any[] = [];

  if (email) {
    emailSteps.forEach((s) => {
      rows.push({
        lead_email: email,
        lead_id: leadId,
        channel: "email",
        step: s.step,
        status: "pending",
        scheduled_at: new Date(now + s.delay).toISOString(),
        payload: { step: s.step, subject: s.subject, source, utm } // Simplified for code brevity here, but usually carries HTML
      });
    });
  }

  if (phone) {
    rows.push({
      lead_email: email || `phone_${phone}`,
      lead_id: leadId,
      channel: "whatsapp",
      step: 4,
      status: "pending",
      scheduled_at: new Date(now + 5 * DAY).toISOString(),
      payload: { 
        step: 4, 
        template: "alrehla_onboarding_5day", 
        message: `مرحباً 👋 لاحظنا إنك سجلت في الرحلة بس لسه ما بدأت. جرّب الرحلة من هنا: ${onboardingUrl}`, 
        source, 
        utm 
      }
    });
  }

  if (rows.length === 0) return;

  const { error } = await supabaseAdmin.from("marketing_lead_outreach_queue").insert(rows);
  if (error) throw error;
}

function enqueueOutreachAsync(
  email: string | null,
  source: string,
  utm: Record<string, string> | null,
  leadId: string,
  phone?: string | null
): void {
  void enqueueOutreach(email, source, utm, leadId, phone).catch((error) => {
    logger.error("[marketing/lead] enqueue_outreach_failed:", error);
  });
}

export async function upsertMarketingLead(input: NormalizedMarketingLeadInput): Promise<{
  lead_id: string;
  email: string | null;
  phone_normalized: string | null;
  is_new: boolean;
  conflict: boolean;
  intent?: string | null;
}> {
  if (!hasSupabaseConfig()) {
    throw new Error("missing_supabase_config");
  }
  const supabaseAdmin = getRequiredSupabaseAdminClient();

  // ATOMIC UPSERT VIA RPC (Hardening V2)
  const { data, error } = await supabaseAdmin.rpc("upsert_marketing_lead_v2", {
    p_email: input.email || null,
    p_phone_normalized: input.phoneNormalized || null,
    p_phone_raw: input.phoneRaw || null,
    p_name: input.name || null,
    p_source: input.source || "landing",
    p_source_type: input.sourceType || "website",
    p_utm: input.utm || {},
    p_note: input.note || "",
    p_status: input.status || "new",
    p_intent: input.intent || null,
    p_anonymous_id: input.anonymousId || null
  });

  if (error) {
    console.error("[marketing/lead] upsert_rpc_failed details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`upsert_rpc_failed: ${error.message || String(error)}`);
  }

  const result = Array.isArray(data) ? data[0] : (data as any);
  const storedLeadId = result.lead_id;
  const isNew = result.is_new;
  const conflictDetected = result.conflict;

  if (storedLeadId) {
    enqueueOutreachAsync(input.email || null, input.source, input.utm, storedLeadId, input.phoneNormalized);

    // Validate WhatsApp if phone is present and it's a NEW lead
    if (input.phoneNormalized && isNew) {
      void WhatsAppCloudService.validateNumber(input.phoneNormalized, storedLeadId).catch((err) => {
        console.error("[marketing/lead] whatsapp_validation_trigger_failed:", err);
      });
    }
  }

  return {
    lead_id: storedLeadId!,
    email: input.email || null,
    phone_normalized: input.phoneNormalized || null,
    is_new: isNew,
    conflict: conflictDetected,
    intent: input.intent || null
  };
}


export async function handleMarketingLeadGet(req: Request) {
  if (!isDebugAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }
  const supabaseAdmin = getRequiredSupabaseAdminClient();

  const url = new URL(req.url);
  const rawEmail = String(url.searchParams.get("email") ?? "").trim().toLowerCase();
  const rawPhone = String(url.searchParams.get("phone") ?? "").trim();
  
  const email = rawEmail && isValidMarketingLeadEmail(rawEmail) ? rawEmail : null;
  const phoneResult = rawPhone ? sanitizePhone(rawPhone) : null;
  const phoneNormalized = phoneResult?.normalized ?? null;

  if (!email && !phoneNormalized) {
    return NextResponse.json({ ok: false, error: "invalid_lookup_params" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("marketing_leads")
    .select("lead_id,email,phone,phone_normalized,name,source,source_type,status,campaign,adset,ad,placement,utm,note,last_contacted_at,qualified_at,created_at,updated_at,merge_conflict");

  if (phoneNormalized) {
    query = query.eq("phone_normalized", phoneNormalized);
  } else if (email) {
    query = query.eq("email", email);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    logger.error("[marketing/lead] lookup error:", error);
    return NextResponse.json({ ok: false, error: "lead_lookup_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, exists: Boolean(data), lead: data ?? null });
}

export async function handleMarketingLeadPost(req: Request, fallbackSourceType: MarketingLeadSourceType = "website") {
  try {
    let body = (await req.json()) as Record<string, any> | Record<string, any>[];
    
    // Zapier/Make resilience: if body is an array, take the first element
    if (Array.isArray(body) && body.length > 0) {
      body = body[0];
    }

    const bodyRecord = (body && typeof body === "object" && !Array.isArray(body)) ? body : {};

    // Sometimes Make wraps data inside a "data" object or "body" object if passed raw
    if (
      bodyRecord.data &&
      typeof bodyRecord.data === "object" &&
      !Array.isArray(bodyRecord.data) &&
      !bodyRecord.email &&
      !bodyRecord.phone
    ) {
      body = bodyRecord.data as Record<string, any>;
    }

    const payload = body as MarketingLeadPayload;
    const input = normalizeMarketingLeadPayload(payload, fallbackSourceType);

    if (!input) {
      return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
    }

    if (hasSupabaseConfig()) {
      const result = await upsertMarketingLead(input);

      // --- META CAPI Tracking Data Extraction ---
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
      const clientUserAgent = req.headers.get("user-agent") || null;
      const refUrl = req.headers.get("referer") || "https://www.alrehla.app";
      const cookieHeader = req.headers.get("cookie");
      
      let fbcData: string | null = null;
      let fbpData: string | null = null;

      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((c) => {
            const parts = c.split("=");
            return [parts[0], decodeURIComponent(parts.slice(1).join("="))];
          })
        );
        fbcData = cookies["_fbc"] || null;
        fbpData = cookies["_fbp"] || null;
      }

      // Fire and forget Meta CAPI Event
      void sendMetaCapiEvent({
        eventName: "Lead",
        eventId: input.clientEventId || result.lead_id, // Hardened Deduplication: Unified ID with Browser
        sourceUrl: refUrl,
        userData: {
          email: input.email,
          phone: input.phoneRaw, // Use raw since CAPI hasher will strip symbols
          fbc: fbcData,
          fbp: fbpData,
          clientIpAddress: ip,
          clientUserAgent
        }
      });

      return NextResponse.json({
        ok: true,
        lead: { 
          email: result.email, 
          phone: result.phone_normalized, 
          source: input.source, 
          lead_id: result.lead_id, 
          conflict: result.conflict 
        }
      });
    }

    return NextResponse.json({ ok: true, lead: { email: input.email, phone: input.phoneNormalized, source: input.source } });
  } catch (error: any) {
    logger.error("[marketing/lead] unexpected error:", error);
    
    // Provide a more descriptive error in Dev mode to help the user
    const isDev = process.env.NODE_ENV !== "production";
    const errorMessage = isDev ? `lead_store_failed: ${error.message || "Unknown error"}` : "lead_store_failed";

    return NextResponse.json({ 
      ok: false, 
      error: errorMessage,
      diagnostics: isDev ? {
        has_supabase_url: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
        has_service_role: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
      } : undefined
    }, { status: 500 });
  }
}

export async function handleMarketingLeadImportPost(req: Request) {
  if (!isDebugAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      leads?: MarketingLeadPayload[];
      sourceType?: MarketingLeadSourceType;
      source?: string;
    };

    const rawLeads = Array.isArray(body.leads) ? body.leads : [];
    if (rawLeads.length === 0) {
      return NextResponse.json({ ok: false, error: "missing_leads" }, { status: 400 });
    }

    const errors: string[] = [];
    const normalized = rawLeads
      .map((lead, index) => {
        const withDefaults = {
          ...lead,
          source: lead.source ?? body.source ?? "manual_import",
          sourceType: lead.sourceType ?? body.sourceType ?? "manual_import"
        };
        const input = normalizeMarketingLeadPayload(withDefaults, "manual_import");
        if (!input) {
          errors.push(`Row ${index + 1}: invalid_email`);
        }
        return input;
      })
      .filter((lead): lead is NormalizedMarketingLeadInput => Boolean(lead));

    const deduped = dedupeMarketingLeadInputs(normalized);
    const results = { imported: 0, updated: 0, skipped: 0, errors };
    const leadsWithIds: any[] = [];

    // Process each lead with the same Phone-First logic as handleMarketingLeadPost
    for (const input of deduped) {
      try {
        const stored = await upsertMarketingLead(input);
        
        leadsWithIds.push({
          email: stored.email,
          phone: stored.phone_normalized,
          source: input.source,
          lead_id: stored.lead_id
        });

        if (stored.is_new) {
          results.imported++;
        } else {
          results.updated++;
        }
      } catch (err) {
        logger.error("[marketing/lead/import] row processing failed:", err);
        errors.push(`Processing failed for ${input.email || input.phoneNormalized}`);
      }
    }

    return NextResponse.json({ ok: true, result: results, leads: leadsWithIds });
  } catch (error) {
    logger.error("[marketing/lead/import] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "lead_import_failed" }, { status: 500 });
  }
}
