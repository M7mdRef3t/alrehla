import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type LeadPayload = {
  email?: string;
  source?: string;
  utm?: Record<string, string>;
  note?: string;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type OutreachQueueStatus = "pending" | "sent" | "failed" | "simulated";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isDebugAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const key = process.env.MARKETING_DEBUG_KEY;
  if (!key) return false;
  return request.headers.get("x-marketing-debug-key") === key;
}

async function enqueueOutreach(
  email: string,
  source: string,
  utm: Record<string, string> | null
): Promise<void> {
  const now = Date.now();
  const emailPayload = {
    subject: "أهلاً بك في الرحلة - خطوتك الأولى خلال 3 دقائق",
    source,
    utm
  };
  const whatsappPayload = {
    template: "alrehla_onboarding_24h",
    source,
    utm
  };
  const rows = [
    {
      lead_email: email,
      channel: "email",
      status: "pending" as OutreachQueueStatus,
      scheduled_at: new Date(now + 5 * 60 * 1000).toISOString(),
      payload: emailPayload
    },
    {
      lead_email: email,
      channel: "whatsapp",
      status: "pending" as OutreachQueueStatus,
      scheduled_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      payload: whatsappPayload
    }
  ];
  const { error } = await supabaseAdmin
    .from("marketing_lead_outreach_queue")
    .upsert(rows, { onConflict: "lead_email,channel" });
  if (error) {
    throw error;
  }
}

function enqueueOutreachAsync(
  email: string,
  source: string,
  utm: Record<string, string> | null
): void {
  void enqueueOutreach(email, source, utm).catch((error) => {
    console.error("[marketing/lead] enqueue_outreach_failed:", error);
  });
}

export async function GET(req: Request) {
  if (!isDebugAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }
  const url = new URL(req.url);
  const email = String(url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("marketing_leads")
    .select("email,source,created_at,updated_at")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: "lead_lookup_failed" }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    exists: Boolean(data),
    lead: data ?? null
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadPayload;
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const row = {
      email,
      source: String(body.source ?? "landing"),
      utm: body.utm ?? null,
      note: body.note ? String(body.note).slice(0, 300) : null,
      created_at: new Date().toISOString()
    };

    if (hasSupabaseConfig()) {
      const { error } = await supabaseAdmin.from("marketing_leads").upsert(row, { onConflict: "email" });
      if (error) {
        console.error("[marketing/lead] Supabase upsert failed:", error);
        return NextResponse.json({ ok: false, error: "lead_store_failed" }, { status: 500 });
      }
      // Fail-fast: never block lead capture on outreach queue delays.
      enqueueOutreachAsync(email, row.source, row.utm as Record<string, string> | null);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[marketing/lead] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "lead_store_failed" }, { status: 500 });
  }
}
