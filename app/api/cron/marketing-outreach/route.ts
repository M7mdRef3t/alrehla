import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildUnsubLink } from "@/lib/marketing/unsubToken";
import { buildMarketingEmail } from "@/lib/marketing/emailTemplate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── Types ──────────────────────────────────────────────────────────────────

type QueueRow = {
  id: string;
  lead_email: string;
  lead_id: string | null;
  channel: "email" | "whatsapp";
  attempts: number;
  step: number | null;
  payload: Record<string, unknown> | null;
};

// ─── Drip Config ─────────────────────────────────────────────────────────────
// Step 1: Immediate (sent at import)
// Step 2: +3 days — soft follow-up
// Step 3: +7 days — last-chance nudge

const DRIP_STEPS: Record<number, { delayDays: number; subject_a: string; subject_b: string }> = {
  1: {
    delayDays: 0,
    subject_a: "خطوتك الأولى في الرحلة تنتظرك ✦",
    subject_b: "فهمت إيه من علاقاتك؟ — الرحلة عارفة 🧭",
  },
  2: {
    delayDays: 3,
    subject_a: "لسه وقتك — الخريطة مستنياك 🗺️",
    subject_b: "في دقيقتين تقدر تشوف علاقاتك بعيون مختلفة",
  },
  3: {
    delayDays: 7,
    subject_a: "آخر تذكرة — مكانك محجوز 💜",
    subject_b: "واحدة بس ودّيكَ في مكان مختلف تماماً",
  },
};

// ─── A/B Subject Assignment ───────────────────────────────────────────────────
// Uses lead_id hash for deterministic split — same lead always gets same variant
function pickSubject(step: number, leadId: string | null): string {
  const config = DRIP_STEPS[step];
  if (!config) return "رسالة من الرحلة";

  if (!leadId) return config.subject_a;

  // Simple deterministic hash: sum of char codes
  const hash = leadId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % 2 === 0 ? config.subject_a : config.subject_b;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "unknown_error");
}

function buildSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Personalized Email Templates ────────────────────────────────────────────

function emailFooter(unsubLink: string): string {
  return `<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
    <p style="margin:0;font-size:11px;color:#334155;">الرحلة — منصة الوعي الذاتي وخريطة العلاقات<br/>
    <a href="https://www.alrehla.app" style="color:#6366f1;text-decoration:none;">www.alrehla.app</a></p>
    <p style="margin:8px 0 0;font-size:10px;color:#1e293b;">لا تريد تلقي رسائلنا؟ <a href="${unsubLink}" style="color:#475569;text-decoration:underline;">إلغاء الاشتراك</a></p>
  </td></tr>`;
}
void emailFooter;

function buildStep1Html(opts: { firstName: string; personalLink: string; unsubLink: string }): string {
  return buildMarketingEmail({
    name: opts.firstName || undefined,
    personalLink: opts.personalLink,
    previewText: "خريطة علاقاتك جاهزة — ابدأ الرحلة الآن",
    senderName: "فريق عمل",
    unsubLink: opts.unsubLink,
  });
}

function buildStep2Html(opts: { firstName: string; personalLink: string; unsubLink: string }): string {
  return buildMarketingEmail({
    name: opts.firstName || undefined,
    personalLink: opts.personalLink,
    previewText: "الخريطة لسه مستنياك — مكانك محجوز",
    senderName: "فريق عمل",
    unsubLink: opts.unsubLink,
  });
}

function buildStep3Html(opts: { firstName: string; personalLink: string; unsubLink: string }): string {
  return buildMarketingEmail({
    name: opts.firstName || undefined,
    personalLink: opts.personalLink,
    previewText: "رسالة أخيرة — اللينك ده هيوصلك لخريطتك في أي وقت",
    senderName: "فريق عمل",
    unsubLink: opts.unsubLink,
  });
}

// ─── Send Email ─────────────────────────────────────────────────────────────
async function sendEmail(
  leadEmail: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<{ status: "sent" | "simulated"; providerResponse: Record<string, unknown> }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MARKETING_EMAIL_FROM || process.env.REPORT_EMAIL_FROM;
  if (!apiKey || !from) {
    return { status: "simulated", providerResponse: { reason: "missing_resend_config" } };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: leadEmail, subject, html, reply_to: replyTo }),
      signal: controller.signal
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(`resend_failed:${response.status}:${JSON.stringify(body)}`);
    }
    return { status: "sent", providerResponse: body };
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error(`resend_timeout: API didn't respond in 8 seconds`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Send WhatsApp ──────────────────────────────────────────────────────────
async function sendWhatsapp(
  leadEmail: string,
  payload: Record<string, unknown> | null
): Promise<{ status: "sent" | "simulated"; providerResponse: Record<string, unknown> }> {
  const webhook = process.env.MARKETING_WHATSAPP_WEBHOOK_URL;
  if (!webhook) {
    return { status: "simulated", providerResponse: { reason: "missing_whatsapp_webhook" } };
  }
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: leadEmail, template: String(payload?.template ?? "alrehla_onboarding_24h"), payload }),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`whatsapp_failed:${response.status}:${JSON.stringify(body)}`);
  }
  return { status: "sent", providerResponse: body };
}

// ─── Cron Handler ───────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }

  const supabase = buildSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";
  const targetLeadId = searchParams.get("lead_id");

  const nowIso = new Date().toISOString();
  
  let query = supabase
    .from("marketing_lead_outreach_queue")
    .select("id,lead_email,channel,attempts,payload,lead_id,step")
    .eq("status", "pending");

  if (targetLeadId) {
    query = query.eq("lead_id", targetLeadId);
  }

  if (!force) {
    query = query.lte("scheduled_at", nowIso);
  }

  const { data, error } = await query
    .order("scheduled_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ ok: false, error: "queue_fetch_failed", details: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as QueueRow[];
  const results: Array<Record<string, unknown>> = [];
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.alrehla.app").replace(/\/$/, "");

    // --- BATCH FETCHING DATA (Optimization) ---
  const leadEmails = [...new Set(rows.map(r => r.lead_email))];
  const leadIds = [...new Set(rows.map(r => r.lead_id).filter(Boolean))] as string[];

  // 1. Fetch leads by email (for both email and whatsapp channels)
  const { data: leadsData } = await supabase
    .from("marketing_leads")
    .select("email, first_name, name, full_name, unsubscribed, phone")
    .in("email", leadEmails);

  const leadsByEmail = new Map((leadsData || []).map((l: any) => [l.email, l]));

  // 2. Fetch routing events by lead_id (to check if they started onboarding)
  let routingSet = new Set<string>();
  if (leadIds.length > 0) {
    const { data: routingData } = await supabase
      .from("routing_events")
      .select("lead_id")
      .in("lead_id", leadIds);
    routingSet = new Set((routingData || []).map((r: any) => r.lead_id));
  }

  // Arrays to hold bulk database operations
  const queueUpdates: Promise<any>[] = [];
  const queueInserts: any[] = [];

  for (const row of rows) {
    try {
      let outcome;
      const currentStep = row.step ?? 1;

      if (row.channel === "email") {
        // 0. Check unsubscribed (batched)
        const leadCheck = leadsByEmail.get(row.lead_email);

        if ((leadCheck as Record<string, unknown> | null)?.unsubscribed === true) {
          queueUpdates.push(
            Promise.resolve(
              supabase
                .from("marketing_lead_outreach_queue")
                .update({ status: "cancelled", last_error: "unsubscribed" })
                .eq("id", row.id)
            )
              .then((res) => res)
          );
          results.push({ id: row.id, status: "cancelled", reason: "unsubscribed" });
          continue;
        }

        const rawName = ((leadCheck as Record<string, unknown> | null)?.first_name
          ?? (leadCheck as Record<string, unknown> | null)?.name
          ?? (leadCheck as Record<string, unknown> | null)?.full_name
          ?? "") as string;
        const firstName = rawName.trim().split(/\s+/)[0] ?? "";

        // 2. Build personalized link + unsubscribe link
        const personalLink = row.lead_id
          ? `${appUrl}/onboarding?ref=${row.lead_id}&utm_source=email&utm_medium=drip&utm_campaign=step${currentStep}`
          : `${appUrl}/onboarding?utm_source=email&utm_medium=drip&utm_campaign=step${currentStep}`;

        const unsubLink = row.lead_id
          ? buildUnsubLink(appUrl, row.lead_id, row.lead_email)
          : `${appUrl}/api/unsubscribe`;

        // 3. A/B subject
        const subject = pickSubject(currentStep, row.lead_id);

        // 4. Step-specific template (now with unsubLink)
        const htmlBuilders: Record<number, (o: { firstName: string; personalLink: string; unsubLink: string }) => string> = {
          1: buildStep1Html,
          2: buildStep2Html,
          3: buildStep3Html,
        };
        const buildHtml = htmlBuilders[currentStep] ?? buildStep1Html;
        const html = buildHtml({ firstName, personalLink, unsubLink });

        const replyTo = (row.payload?.reply_to as string | undefined) || "hello@alrehla.app";
        outcome = await sendEmail(row.lead_email, subject, html, replyTo);

        // 5. Schedule next drip step (if not last step and lead hasn't started onboarding)
        const nextStep = currentStep + 1;
        if (nextStep <= 3 && row.lead_id) {
          // Check if lead already converted (batched)
          const started = routingSet.has(row.lead_id);

          if (!started) {
            const nextConfig = DRIP_STEPS[nextStep];
            if (nextConfig) {
              const scheduledAt = addDays(new Date(), nextConfig.delayDays);
              queueInserts.push({
                lead_email: row.lead_email,
                lead_id: row.lead_id,
                channel: "email",
                status: "pending",
                step: nextStep,
                scheduled_at: scheduledAt.toISOString(),
                attempts: 0,
                payload: { ...row.payload, ab_variant: pickSubject(nextStep, row.lead_id) },
              });
            }
          }
        }
      } else {
        // WhatsApp (batched)
        const lead = leadsByEmail.get(row.lead_email);

        const payloadWithPhone = {
          ...row.payload,
          phone: (lead as Record<string, unknown> | null)?.phone ?? null,
          lead_id: row.lead_id,
        };
        outcome = await sendWhatsapp(row.lead_email, payloadWithPhone);
      }

      const status = outcome.status === "sent" ? "sent" : "simulated";
      const resendId = (outcome.providerResponse?.id as string | undefined) ?? null;
      queueUpdates.push(
        Promise.resolve(
          supabase
            .from("marketing_lead_outreach_queue")
            .update({
              status,
              attempts: (row.attempts ?? 0) + 1,
              sent_at: new Date().toISOString(),
              provider_response: outcome.providerResponse,
              resend_message_id: resendId,
              last_error: null,
            })
            .eq("id", row.id)
        )
          .then(({ error }) => {
            if (error) console.error("Failed to update queue row", row.id, error);
            return null;
          })
      );
      results.push({ id: row.id, channel: row.channel, status, step: row.step ?? 1 });
    } catch (err) {
      const message = toErrorMessage(err).slice(0, 500);
      queueUpdates.push(
        Promise.resolve(
          supabase
            .from("marketing_lead_outreach_queue")
            .update({ status: "failed", attempts: (row.attempts ?? 0) + 1, last_error: message })
            .eq("id", row.id)
        )
          .then((res) => res)
      );
      results.push({ id: row.id, channel: row.channel, status: "failed", error: message });
    }
  }

  // --- BATCH PROCESS DB UPDATES ---
  if (queueInserts.length > 0) {
    const { error: insertError } = await supabase
      .from("marketing_lead_outreach_queue")
      .insert(queueInserts);
    if (insertError) {
      console.error("Bulk insert failed for next steps", insertError);
    }
  }

  // Await all updates
  await Promise.allSettled(queueUpdates);

  return NextResponse.json({ ok: true, processed: rows.length, results });
}
