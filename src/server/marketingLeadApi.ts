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
  return {
    lead_id: input.leadId ?? undefined, // P0-1: if provided use it; else DB generates uuid via DEFAULT
    email: input.email,
    phone: input.phone,
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
    qualified_at: input.qualifiedAt
  };
}

async function enqueueOutreach(
  email: string,
  source: string,
  utm: Record<string, string> | null,
  leadId: string // P0-2: required — no generic URLs allowed
): Promise<void> {
  const now = Date.now();
  const MINUTE = 60 * 1000;
  const DAY = 24 * 60 * 60 * 1000;

  // P0-2: Both URLs are personalized — carry lead_id + lead_source for full attribution
  const onboardingUrl = buildPersonalizedUrl(leadId, source, "/onboarding");
  const checkoutUrl = buildPersonalizedUrl(leadId, source, "/checkout");

  const steps = [
    {
      channel: "email" as const,
      delay: 5 * MINUTE,
      payload: {
        step: 1,
        subject: "أهلًا بك في الرحلة — خطوتك الأولى خلال 3 دقائق",
        html: `
          <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.9;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:16px">
            <h2 style="color:#2dd4bf;margin-bottom:8px">مرحباً بك في الرحلة 🌙</h2>
            <p>في أقل من 3 دقائق، هتشوف خريطة علاقاتك لأول مرة.</p>
            <p>مش محتاج تعرف كل حاجة — المهم تبدأ.</p>
            <a href="${onboardingUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;margin-top:16px">ابدأ رحلتك الآن</a>
            <p style="color:#64748b;font-size:12px;margin-top:24px">— فريق الرحلة</p>
          </div>`,
        source,
        utm
      }
    },
    {
      channel: "email" as const,
      delay: 1 * DAY,
      payload: {
        step: 2,
        subject: "هل جربت خريطة الوعي؟ — شوف إيه اللي اتغير",
        html: `
          <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.9;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:16px">
            <h2 style="color:#2dd4bf">خريطة وعيك مستنياك 🗺️</h2>
            <p>ناس كتير بتفضل مترددة... لحد ما بتشوف أول دايرة.</p>
            <p><strong style="color:#f59e0b">سؤال واحد بس:</strong> مين أكثر شخص واخد مساحة من تفكيرك النهاردة؟</p>
            <p>حطه في الخريطة وشوف إيه اللي هيظهر.</p>
            <a href="${onboardingUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;margin-top:16px">جرّب دلوقتي</a>
          </div>`,
        source,
        utm
      }
    },
    {
      channel: "email" as const,
      delay: 3 * DAY,
      payload: {
        step: 3,
        subject: "\"أتمنى لو كنت عملت ده من زمان\" — حكاية مستخدم حقيقي",
        html: `
          <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.9;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:16px">
            <h2 style="color:#2dd4bf">حكاية من الرحلة 💬</h2>
            <blockquote style="border-right:3px solid #7c3aed;padding-right:16px;margin:16px 0;color:#94a3b8;font-style:italic">
              "كنت فاكر إن العلاقة دي طبيعية. بس لما شفت الخريطة، اكتشفت إنها بتسحب 70% من طاقتي. قررت أحط حدود... والنتيجة؟ راحة بال حقيقية."
            </blockquote>
            <p>الخريطة مش بتحكم — هي بتوضّح. والوضوح هو أول خطوة للتغيير.</p>
            <a href="${onboardingUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;margin-top:16px">ابدأ خريطتك</a>
          </div>`,
        source,
        utm
      }
    },
    {
      channel: "whatsapp" as const,
      delay: 5 * DAY,
      payload: {
        step: 4,
        template: "alrehla_onboarding_5day",
        message: `مرحباً 👋 لاحظنا إنك سجلت في الرحلة بس لسه ما بدأت. لو عندك أي سؤال أو محتاج مساعدة، إحنا هنا. جرّب الرحلة من هنا: ${onboardingUrl}`,
        source,
        utm
      }
    },
    {
      channel: "email" as const,
      delay: 7 * DAY,
      payload: {
        step: 5,
        subject: "آخر فرصة — عرض الرواد بيخلص قريب 🔥",
        html: `
          <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.9;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:16px">
            <h2 style="color:#f59e0b">عرض الرواد — المقاعد بتخلص ⏰</h2>
            <p>فاضل <strong style="color:#ef4444">مقاعد محدودة</strong> في فوج التأسيس:</p>
            <ul style="color:#94a3b8;padding-right:20px">
              <li>21 يوم تركيز عميق</li>
              <li>100 نقطة وعي</li>
              <li>ذكاء اصطناعي شخصي</li>
              <li><strong style="color:#2dd4bf">السعر: 12-15 دولار فقط</strong></li>
            </ul>
            <a href="${checkoutUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">احجز مقعدك الآن</a>
            <p style="color:#64748b;font-size:12px;margin-top:24px">لو مش مهتم، تقدر تتجاهل الرسالة. مش هنزعجك تاني.</p>
          </div>`,
        source,
        utm
      }
    }
  ];

  const rows = steps.map((step) => ({
    lead_email: email,
    lead_id: leadId, // P0-1: store lead_id in every outreach row for full traceability
    channel: step.channel,
    step: step.payload.step,
    status: "pending" as OutreachQueueStatus,
    scheduled_at: new Date(now + step.delay).toISOString(),
    payload: step.payload
  }));

  const { error } = await supabaseAdmin
    .from("marketing_lead_outreach_queue")
    .upsert(rows, { onConflict: "lead_email,channel,step", ignoreDuplicates: true });
  if (error) throw error;
}

function enqueueOutreachAsync(
  email: string,
  source: string,
  utm: Record<string, string> | null,
  leadId: string
): void {
  void enqueueOutreach(email, source, utm, leadId).catch((error) => {
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
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    if (hasSupabaseConfig()) {
      const { error } = await supabaseAdmin.from("marketing_leads").upsert(toLeadRow(input), { onConflict: "email" });
      if (error) {
        console.error("[marketing/lead] Supabase upsert failed:", error);
        return NextResponse.json({ ok: false, error: "lead_store_failed" }, { status: 500 });
      }

      // P0-1: Fetch the stored lead_id (DB-generated uuid if not provided by caller)
      const { data: stored } = await supabaseAdmin
        .from("marketing_leads")
        .select("lead_id")
        .eq("email", input.email)
        .single();

      const storedLeadId = stored?.lead_id as string | undefined;
      if (storedLeadId) {
        enqueueOutreachAsync(input.email, input.source, input.utm, storedLeadId);
      }

      return NextResponse.json({
        ok: true,
        lead: { email: input.email, source: input.source, sourceType: input.sourceType, lead_id: storedLeadId }
      });
    }

    return NextResponse.json({ ok: true, lead: { email: input.email, source: input.source, sourceType: input.sourceType } });
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
      console.error("[marketing/lead/import] Supabase upsert failed:", error);
      return NextResponse.json({ ok: false, error: "lead_store_failed" }, { status: 500 });
    }

    // P0-1: Fetch stored lead_ids after upsert (DB may have generated them)
    const { data: storedLeads } = await supabaseAdmin
      .from("marketing_leads")
      .select("email, lead_id")
      .in("email", emails);

    const leadIdMap = new Map((storedLeads ?? []).map((r: { email: string; lead_id: string }) => [r.email, r.lead_id]));

    deduped.forEach((lead) => {
      const storedLeadId = leadIdMap.get(lead.email);
      if (storedLeadId) {
        enqueueOutreachAsync(lead.email, lead.source, lead.utm, storedLeadId);
      }
    });

    const result: MarketingLeadImportResult = {
      imported: deduped.filter((lead) => !existingEmails.has(lead.email)).length,
      updated: deduped.filter((lead) => existingEmails.has(lead.email)).length,
      skipped: rawLeads.length - deduped.length,
      errors
    };

    // P0-1: Return leads with lead_ids so follow-up scripts can build personalized URLs
    const leadsWithIds = deduped.map((lead) => ({
      email: lead.email,
      source: lead.source,
      lead_id: leadIdMap.get(lead.email) ?? null
    }));

    return NextResponse.json({ ok: true, result, leads: leadsWithIds });
  } catch (error) {
    console.error("[marketing/lead/import] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "lead_import_failed" }, { status: 500 });
  }
}
