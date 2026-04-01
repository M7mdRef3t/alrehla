import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin, type AdminRequest, type AdminResponse } from "../../../../server/admin/_shared";
import { GET as runMarketingCron } from "../../cron/marketing-outreach/route";

export const dynamic = "force-dynamic";

function buildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
}

async function checkAuth(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET || process.env.MARKETING_DEBUG_KEY;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const mockReq: AdminRequest = {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  };
  const mockRes: AdminResponse = {
    status: () => mockRes,
    json: () => mockRes,
  };
  return await verifyAdmin(mockReq, mockRes);
}

// ─── GET — stats + quick-send leads ─────────────────────────────────────────
export async function GET(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = buildClient();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.alrehla.app").replace(/\/$/, "");

  // Queue breakdown by status
  const { data: queueStats } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("status, channel");

  const counts: Record<string, number> = {};
  let totalLeads = 0;
  for (const row of queueStats ?? []) {
    counts[row.status as string] = (counts[row.status as string] ?? 0) + 1;
    totalLeads++;
  }

  // Real onboarding starts (leads who clicked personalized link)
  const { count: realStarts } = await supabase
    .from("routing_events")
    .select("*", { count: "exact", head: true })
    .not("lead_id", "is", null);

  // Last 5 errors
  const { data: recentErrors } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("lead_email, channel, last_error, updated_at")
    .eq("status", "failed")
    .order("updated_at", { ascending: false })
    .limit(5);

  // Top 10 recently sent
  const { data: recentSent } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("lead_email, channel, sent_at")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(10);

  // ─── Quick-Send: pending/not-started leads with phone numbers ─────────────
  // Get unique lead emails that are still pending (not converted)
  const { data: pendingQueue } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("lead_email, lead_id")
    .in("status", ["pending", "simulated"])
    .order("scheduled_at", { ascending: true })
    .limit(50);

  // Collect unique emails
  const uniqueLeads = new Map<string, string | null>();
  for (const row of pendingQueue ?? []) {
    if (!uniqueLeads.has(row.lead_email as string)) {
      uniqueLeads.set(row.lead_email as string, row.lead_id as string | null);
    }
  }

  // Fetch phone + name from marketing_leads
  const emails = [...uniqueLeads.keys()];
  let quickSendLeads: Array<{
    email: string;
    lead_id: string | null;
    phone: string | null;
    name: string | null;
    personalLink: string;
    emailSent: boolean;
  }> = [];

  if (emails.length > 0) {
    const { data: leadsData } = await supabase
      .from("marketing_leads")
      .select("id, email, phone, first_name, name, full_name")
      .in("email", emails.slice(0, 50));

    const leadMap = new Map<string, Record<string, unknown>>();
    for (const l of leadsData ?? []) {
      leadMap.set(l.email as string, l as Record<string, unknown>);
    }

    // Now let's check the status of the automated email directly
    const { data: emailRows } = await supabase
      .from("marketing_lead_outreach_queue")
      .select("lead_email, status, last_error")
      .in("lead_email", emails.slice(0, 50))
      .eq("channel", "email");
      
    const emailStatusMap = new Map<string, boolean>();
    for (const row of emailRows ?? []) {
      if (row.status === "sent" || row.last_error === "MANUAL_EMAIL_SENT") {
        emailStatusMap.set(row.lead_email as string, true);
      }
    }

    quickSendLeads = emails.map((email) => {
      const lead = leadMap.get(email);
      const leadId = (lead?.id as string) ?? uniqueLeads.get(email) ?? null;
      const rawName = ((lead?.first_name ?? lead?.name ?? lead?.full_name ?? "") as string).trim();
      const phone = (lead?.phone as string | undefined)?.trim() || null;
      const personalLink = leadId
        ? `${appUrl}/onboarding?ref=${leadId}&utm_source=manual&utm_medium=quicksend`
        : `${appUrl}/onboarding?utm_source=manual&utm_medium=quicksend`;

      return {
        email,
        lead_id: leadId,
        phone: phone ? normalizeEgyptianPhone(phone) : null,
        name: rawName || null,
        personalLink,
        emailSent: emailStatusMap.get(email) ?? false,
      };
    });
  }

  // ─── Email Engagement Metrics (from webhook tracking) ───────────────────────
  const { data: emailStats } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("opened_at, clicked_at, bounced, complained, status, channel")
    .eq("channel", "email");

  const emailSent    = emailStats?.filter(r => r.status === "sent").length ?? 0;
  const emailOpened  = emailStats?.filter(r => r.opened_at !== null).length ?? 0;
  const emailClicked = emailStats?.filter(r => r.clicked_at !== null).length ?? 0;
  const emailBounced = emailStats?.filter(r => r.bounced === true).length ?? 0;
  const emailComplained = emailStats?.filter(r => r.complained === true).length ?? 0;

  const openRate    = emailSent > 0 ? Math.round((emailOpened  / emailSent) * 100) : 0;
  const clickRate   = emailSent > 0 ? Math.round((emailClicked / emailSent) * 100) : 0;
  const bounceRate  = emailSent > 0 ? Math.round((emailBounced / emailSent) * 100) : 0;

  // Unsubscribe count
  const { count: unsubCount } = await supabase
    .from("marketing_leads")
    .select("*", { count: "exact", head: true })
    .eq("unsubscribed", true);

  return NextResponse.json({
    ok: true,
    totalLeads,
    counts,
    realStarts: realStarts ?? 0,
    recentErrors: recentErrors ?? [],
    recentSent: recentSent ?? [],
    quickSendLeads,
    emailMetrics: {
      sent: emailSent,
      opened: emailOpened,
      clicked: emailClicked,
      bounced: emailBounced,
      complained: emailComplained,
      unsubscribed: unsubCount ?? 0,
      openRate,
      clickRate,
      bounceRate,
    },
  });
}

// Normalize Egyptian phone to international format
function normalizeEgyptianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `+2${digits}`;
  if (digits.startsWith("2") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("+2")) return phone;
  return `+2${digits}`;
}

// ─── POST — actions ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    leadEmail?: string;
  };

  if (body.action === "reset_failed") {
    const supabase = buildClient();
    const { error } = await supabase
      .from("marketing_lead_outreach_queue")
      .update({
        status: "pending",
        last_error: null,
        attempts: 0,
        scheduled_at: new Date().toISOString(),
      })
      .eq("status", "failed");
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "reset_failed" });
  }

  if (body.action === "trigger_batch") {
    // Calling the Cron handler directly in memory (Direct Invocation)
    // This avoids Network Latency, DNS loops, and Vercel Proxy issues.
    const cronSecret = process.env.CRON_SECRET || "";
    
    // Construct an artificial Request just to pass the Cron's internal auth gate
    const internalReq = new Request("http://localhost/internal/cron", {
      method: "GET",
      headers: { authorization: `Bearer ${cronSecret}` }
    });

    try {
      const response = await runMarketingCron(internalReq);
      const data = (await response.json().catch(() => ({ ok: false }))) as Record<string, unknown>;
      return NextResponse.json({ ok: true, action: "trigger_batch", result: data });
    } catch (err) {
      return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "internal_fail" }, { status: 500 });
    }
  }

  if (body.action === "mark_contacted" && body.leadEmail) {
    const supabase = buildClient();
    await supabase
      .from("marketing_lead_outreach_queue")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("lead_email", body.leadEmail)
      .in("status", ["pending", "simulated"]);
    return NextResponse.json({ ok: true, action: "mark_contacted" });
  }

  if (body.action === "mark_email_manual_sent" && body.leadEmail) {
    const supabase = buildClient();
    await supabase
      .from("marketing_lead_outreach_queue")
      .update({ status: "simulated", last_error: "MANUAL_EMAIL_SENT" })
      .eq("lead_email", body.leadEmail)
      .in("status", ["pending", "simulated"]);
    return NextResponse.json({ ok: true, action: "mark_email_manual_sent" });
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
}
