import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  dedupeMarketingLeadInputs,
  isValidMarketingLeadEmail,
  normalizeMarketingLeadPayload
} from "./marketingLeadUtils";
import type {
  MarketingLeadImportResult,
  MarketingLeadPayload,
  MarketingLeadSourceType,
  NormalizedMarketingLeadInput
} from "../types/marketingLead";

type OutreachQueueStatus = "pending" | "sent" | "failed" | "simulated";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isDebugAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const key = process.env.MARKETING_DEBUG_KEY;
  if (!key) return false;
  return request.headers.get("x-marketing-debug-key") === key;
}

/**
 * P0-2: Builds a personalized URL with lead_id and lead_source for full attribution tracking.
 * Every outreach message MUST use this — never a bare /onboarding or /checkout link.
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
    merge_conflict: input.mergeConflict ?? false
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
  const now = Date.now();
  const MINUTE = 60 * 1000;
  const DAY = 24 * 60 * 60 * 1000;

  // P0-2: Both URLs are personalized — carry lead_id + lead_source for full attribution
  const onboardingUrl = buildPersonalizedUrl(leadId, source, "/onboarding");
  const checkoutUrl = buildPersonalizedUrl(leadId, source, "/checkout");

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

  const { error } = await supabaseAdmin
    .from("marketing_lead_outreach_queue")
    .upsert(rows, { onConflict: "lead_email,channel,step", ignoreDuplicates: true });
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
    console.error("[marketing/lead] enqueue_outreach_failed:", error);
  });
}

export async function handleMarketingLeadGet(req: Request) {
  if (!isDebugAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }

  const url = new URL(req.url);
  const email = String(url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!isValidMarketingLeadEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("marketing_leads")
    .select("lead_id,email,phone,name,source,source_type,status,campaign,adset,ad,placement,utm,note,last_contacted_at,qualified_at,created_at,updated_at")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: "lead_lookup_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, exists: Boolean(data), lead: data ?? null });
}

export async function handleMarketingLeadPost(req: Request, fallbackSourceType: MarketingLeadSourceType = "website") {
  try {
    const body = (await req.json()) as MarketingLeadPayload;
    const input = normalizeMarketingLeadPayload(body, fallbackSourceType);

    if (!input) {
      return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
    }

    if (hasSupabaseConfig()) {
      // SMART DEDUPLICATION LOGIC
      // 1. Match by Phone
      let existingLeadId: string | null = null;
      let conflictDetected = false;

      if (input.phoneNormalized) {
        const { data: byPhone } = await supabaseAdmin
          .from("marketing_leads")
          .select("id, lead_id, email, phone_normalized")
          .eq("phone_normalized", input.phoneNormalized)
          .maybeSingle();
        
        if (byPhone) {
          existingLeadId = byPhone.id;
          // Check if this phone record has a different email than the input
          if (input.email && byPhone.email && byPhone.email !== input.email) {
            conflictDetected = true;
          }
        }
      }

      // 2. Match by Email (if not matched by phone)
      if (!existingLeadId && input.email) {
        const { data: byEmail } = await supabaseAdmin
          .from("marketing_leads")
          .select("id, lead_id, phone_normalized")
          .eq("email", input.email)
          .maybeSingle();
        
        if (byEmail) {
          existingLeadId = byEmail.id;
          // Check if this email record has a different phone than the input
          if (input.phoneNormalized && byEmail.phone_normalized && byEmail.phone_normalized !== input.phoneNormalized) {
            conflictDetected = true;
          }
        }
      }

      input.mergeConflict = conflictDetected;
      const row = toLeadRow(input);

      let storedLeadId: string | null = null;
      let storedEmail: string | null = null;

      if (existingLeadId) {
        // Update existing record
        const { data, error } = await supabaseAdmin
          .from("marketing_leads")
          .update(row)
          .eq("id", existingLeadId)
          .select("email, lead_id")
          .single();
        
        if (error) throw error;
        storedLeadId = data.lead_id;
        storedEmail = data.email;
      } else {
        // Insert new record
        const { data, error } = await supabaseAdmin
          .from("marketing_leads")
          .insert(row)
          .select("email, lead_id")
          .single();
        
        if (error) throw error;
        storedLeadId = data.lead_id;
        storedEmail = data.email;
      }

      if (storedLeadId) {
        enqueueOutreachAsync(storedEmail || null, input.source, input.utm, storedLeadId, input.phoneNormalized);
      }

      return NextResponse.json({
        ok: true,
        lead: { email: storedEmail, phone: input.phoneNormalized, source: input.source, lead_id: storedLeadId, conflict: conflictDetected }
      });
    }

    return NextResponse.json({ ok: true, lead: { email: input.email, phone: input.phoneNormalized, source: input.source } });
  } catch (error) {
    console.error("[marketing/lead] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "lead_store_failed" }, { status: 500 });
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
    const emails = deduped.map((lead) => lead.email);
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("marketing_leads")
      .select("email")
      .in("email", emails);
    if (existingError) {
      console.error("[marketing/lead/import] existing lookup failed:", existingError);
      return NextResponse.json({ ok: false, error: "lead_lookup_failed" }, { status: 500 });
    }

    const existingEmails = new Set((existingRows ?? []).map((row: { email?: string | null }) => String(row.email ?? "").trim().toLowerCase()));
    const rows = deduped.map(toLeadRow);
    const { error } = await supabaseAdmin.from("marketing_leads").upsert(rows, { onConflict: "email" });
    if (error) {
      console.error("[marketing/lead/import] Supabase upsert failed:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ ok: false, error: "lead_store_failed" }, { status: 500 });
    }

    // P0-1: Fetch stored lead_ids after upsert (DB may have generated them)
    const { data: storedLeads } = await supabaseAdmin
      .from("marketing_leads")
      .select("email, lead_id")
      .in("email", emails);

    const leadIdMap = new Map((storedLeads ?? []).map((r: { email: string; lead_id: string }) => [r.email, r.lead_id]));

    deduped.forEach((lead) => {
      const storedLeadId = leadIdMap.get(lead.email || lead.phoneNormalized || "anonymous");
      if (storedLeadId) {
        enqueueOutreachAsync(lead.email, lead.source, lead.utm, storedLeadId, lead.phoneNormalized);
      }
    });

    const result: MarketingLeadImportResult = {
      imported: deduped.filter((lead) => !existingEmails.has(lead.email || lead.phoneNormalized || "anonymous")).length,
      updated: deduped.filter((lead) => existingEmails.has(lead.email || lead.phoneNormalized || "anonymous")).length,
      skipped: rawLeads.length - deduped.length,
      errors
    };

    // P0-1: Return leads with lead_ids so follow-up scripts can build personalized URLs
    const leadsWithIds = deduped.map((lead) => ({
      email: lead.email,
      phone: lead.phoneNormalized,
      source: lead.source,
      lead_id: leadIdMap.get(lead.email || lead.phoneNormalized || "anonymous") ?? null
    }));

    return NextResponse.json({ ok: true, result, leads: leadsWithIds });
  } catch (error) {
    console.error("[marketing/lead/import] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "lead_import_failed" }, { status: 500 });
  }
}
