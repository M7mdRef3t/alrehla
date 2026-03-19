import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type QueueRow = {
  id: string;
  lead_email: string;
  channel: "email" | "whatsapp";
  attempts: number;
  payload: Record<string, unknown> | null;
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "unknown_error");
}

function buildSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
}

async function sendEmail(leadEmail: string, payload: Record<string, unknown> | null): Promise<{
  status: "sent" | "simulated";
  providerResponse: Record<string, unknown>;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MARKETING_EMAIL_FROM || process.env.REPORT_EMAIL_FROM;
  if (!apiKey || !from) {
    return {
      status: "simulated",
      providerResponse: { reason: "missing_resend_config" }
    };
  }
  const subject = String(payload?.subject ?? "أهلاً بك في الرحلة");
  const html = typeof payload?.html === "string" && payload.html.trim()
    ? payload.html
    : `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
      <h2>مرحباً بك في الرحلة</h2>
      <p>نرسل لك أول خطوة عملية تبدأ بها اليوم.</p>
      <p><a href="https://www.alrehla.app/onboarding" target="_blank" rel="noopener noreferrer">ابدأ من هنا</a></p>
    </div>
  `;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: leadEmail,
      subject,
      html
    })
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`resend_failed:${response.status}:${JSON.stringify(body)}`);
  }
  return { status: "sent", providerResponse: body };
}

async function sendWhatsapp(leadEmail: string, payload: Record<string, unknown> | null): Promise<{
  status: "sent" | "simulated";
  providerResponse: Record<string, unknown>;
}> {
  const webhook = process.env.MARKETING_WHATSAPP_WEBHOOK_URL;
  if (!webhook) {
    return {
      status: "simulated",
      providerResponse: { reason: "missing_whatsapp_webhook" }
    };
  }
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: leadEmail,
      template: String(payload?.template ?? "alrehla_onboarding_24h"),
      payload
    })
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`whatsapp_failed:${response.status}:${JSON.stringify(body)}`);
  }
  return { status: "sent", providerResponse: body };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 500 });
  }

  const supabase = buildSupabaseClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("id,lead_email,channel,attempts,payload")
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ ok: false, error: "queue_fetch_failed", details: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as QueueRow[];
  const results: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    try {
      const outcome =
        row.channel === "email"
          ? await sendEmail(row.lead_email, row.payload)
          : await sendWhatsapp(row.lead_email, row.payload);

      const status = outcome.status === "sent" ? "sent" : "simulated";
      const { error: updateError } = await supabase
        .from("marketing_lead_outreach_queue")
        .update({
          status,
          attempts: (row.attempts ?? 0) + 1,
          sent_at: new Date().toISOString(),
          provider_response: outcome.providerResponse,
          last_error: null
        })
        .eq("id", row.id);
      if (updateError) throw updateError;
      results.push({ id: row.id, channel: row.channel, status });
    } catch (err) {
      const message = toErrorMessage(err).slice(0, 500);
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({
          status: "failed",
          attempts: (row.attempts ?? 0) + 1,
          last_error: message
        })
        .eq("id", row.id);
      results.push({ id: row.id, channel: row.channel, status: "failed", error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: rows.length,
    results
  });
}
