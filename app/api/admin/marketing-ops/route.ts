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

  const { data: queueStats } = await supabase
    .from("marketing_lead_outreach_queue")
    .select("status, channel, lead_email, opened_at, clicked_at, bounced, complained, sent_at");

  const counts: Record<string, number> = {};
  const channelBreakdown: Record<string, number> = {};
  const uniqueEntitiesSet = new Set<string>();
  let totalLeads = 0;

  for (const row of queueStats ?? []) {
    const status = (row.status as string) || "unknown";
    const channel = (row.channel as string) || "unknown";
    const email = (row.lead_email as string) || "";

    counts[status] = (counts[status] ?? 0) + 1;
    
    if (status === "sent" || status === "simulated") {
      if (email) uniqueEntitiesSet.add(email);
      channelBreakdown[channel] = (channelBreakdown[channel] ?? 0) + 1;
    }
    
    totalLeads++;
  }
  const uniqueEntitiesReached = uniqueEntitiesSet.size;

  // ─── Lead Acquisition & Attribution ─────────────────────────────────────────
  const { data: dbLeads, count: dbLeadsCount } = await supabase
    .from("marketing_leads")
    .select("id, name, email, phone_normalized, source_type, campaign, adset, ad, status, created_at, unsubscribed, utm, note", { count: "exact" });

  const totalDatabaseLeads = dbLeadsCount ?? 0;
  const leadsBySource: Record<string, number> = {};
  const leadsByCampaign: Record<string, number> = {};

  const rawLeads = dbLeads ?? [];

  // ─── Email Outreach Engagement Mapping ─────────────────────────────────────
  const emailEngagementMap: Record<string, any> = {};
  if (queueStats) {
    for (const qs of queueStats) {
      if (qs.channel !== 'email' || !qs.lead_email) continue;
      const email = (qs.lead_email as string).toLowerCase().trim();
      
      if (!emailEngagementMap[email]) {
        emailEngagementMap[email] = {
          sent: false, opened: false, clicked: false, bounced: false, pending: false
        };
      }
      
      const stats = emailEngagementMap[email];
      if (qs.status === 'sent') stats.sent = true;
      if (qs.status === 'pending') stats.pending = true;
      if (qs.opened_at) stats.opened = true;
      if (qs.clicked_at) stats.clicked = true;
      if (qs.bounced || qs.complained || qs.status === 'failed') stats.bounced = true;
    }
  }

  for (const lead of rawLeads) {
    const s = (lead.source_type as string) || "unknown";
    const c = (lead.campaign as string) || "unattributed";
    leadsBySource[s] = (leadsBySource[s] ?? 0) + 1;
    leadsByCampaign[c] = (leadsByCampaign[c] ?? 0) + 1;
    
    // Attach email engagement status
    let emailStatus = "none";
    if (lead.unsubscribed) {
      emailStatus = "unsubscribed";
    } else if (lead.email) {
      const normalizedEmail = String(lead.email).toLowerCase().trim();
      const eng = emailEngagementMap[normalizedEmail];
      if (eng) {
        if (eng.bounced) emailStatus = "bounced";
        else if (eng.clicked) emailStatus = "clicked";
        else if (eng.opened) emailStatus = "opened";
        else if (eng.sent) emailStatus = "sent";
        else if (eng.pending) emailStatus = "pending";
      }
    }
    
    (lead as any).email_status = emailStatus;
  }

  // Real onboarding starts (leads who clicked personalized link)
  const { data: routingEventsData } = await supabase
    .from("routing_events")
    .select("lead_id")
    .not("lead_id", "is", null);
    
  const convertedLeadIds = new Set((routingEventsData || []).map(r => String(r.lead_id)));
  const realStarts = convertedLeadIds.size;
  
  const conversionsByCampaign: Record<string, number> = {};
  const conversionsBySource: Record<string, number> = {};
  
  for (const lead of rawLeads) {
    const c = (lead.campaign as string) || "unattributed";
    const s = (lead.source_type as string) || "unknown";
    const converted = convertedLeadIds.has(String(lead.id));
    
    (lead as any).has_converted = converted; // Added for per-lead status
    
    if (converted) {
      conversionsByCampaign[c] = (conversionsByCampaign[c] ?? 0) + 1;
      conversionsBySource[s] = (conversionsBySource[s] ?? 0) + 1;
    }
  }
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

  // ─── Simulated Ripple Effect Tracker Data ─────────────────────────────────────
  const rippleTree = [
    { id: "root", label: "الشرارة الأولى", status: "active", parentId: null },
    { id: "n1", label: "أحمد ج.", status: "active", parentId: "root" },
    { id: "n2", label: "عمر س.", status: "active", parentId: "root" },
    { id: "n3", label: "مها و.", status: "faded", parentId: "root" },
    { id: "n4", label: "محمود ع.", status: "pending", parentId: "n1" },
    { id: "n5", label: "ياسين أ.", status: "active", parentId: "n1" },
    { id: "n6", label: "فرح ب.", status: "active", parentId: "n2" },
    { id: "n7", label: "سارة م.", status: "pending", parentId: "n2" },
    { id: "n8", label: "نور ي.", status: "faded", parentId: "n6" }
  ];

  // ─── Awareness Funnel (Flow Stats & Conversion Health) ──────────────────────
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: funnel24h } = await supabase
    .from("journey_events")
    .select("payload->step")
    .eq("type", "flow_event")
    .gte("created_at", twentyFourHoursAgo);

  let pathStarted24h = 0;
  let mapsGenerated24h = 0;
  let addPersonOpened24h = 0;
  let addPersonDone24h = 0;

  if (funnel24h) {
    for (const ev of funnel24h) {
      const step = (ev.step as string) || "";
      if (["pulse_opened", "onboarding_opened", "landing_viewed"].includes(step)) pathStarted24h++;
      if (step === "map_generated") mapsGenerated24h++;
      if (step === "add_person_opened") addPersonOpened24h++;
      if (step === "add_person_done_show_on_map") addPersonDone24h++;
    }
  }

  const { count: journeyMapsTotal } = await supabase
    .from("journey_maps")
    .select("*", { count: "exact", head: true });

  const { data: pulseAbandonEvents } = await supabase
    .from("journey_events")
    .select("payload")
    .eq("type", "flow_event")
    .eq("payload->>step", "pulse_abandoned");

  const pulseAbandonedByReason: Record<string, number> = {};
  if (pulseAbandonEvents) {
    for (const row of pulseAbandonEvents) {
      const payload = row.payload as any;
      const reason = (payload?.extra?.closeReason as string) || "unknown";
      pulseAbandonedByReason[reason] = (pulseAbandonedByReason[reason] || 0) + 1;
    }
  }

  const addPersonCompletionRate24h = addPersonOpened24h > 0 ? Math.round((addPersonDone24h / addPersonOpened24h) * 100) : 0;

  const conversionHealth = {
    pathStarted24h,
    mapsGenerated24h,
    addPersonOpened24h,
    addPersonDone24h,
    journeyMapsTotal: journeyMapsTotal ?? 0
  };

  const flowStats = {
    byStep: {},
    avgTimeToActionMs: null,
    addPersonCompletionRate: addPersonCompletionRate24h,
    pulseAbandonedByReason
  };

  return NextResponse.json({
    ok: true,
    totalLeads, // queue count
    counts,
    uniqueEntitiesReached,
    channelBreakdown,
    totalDatabaseLeads,
    leadsBySource,
    leadsByCampaign,
    conversionsByCampaign,
    conversionsBySource,
    rawLeads,
    realStarts: realStarts ?? 0,
    recentErrors: recentErrors ?? [],
    recentSent: recentSent ?? [],
    quickSendLeads,
    rippleTree,
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
    conversionHealth,
    flowStats
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
    leadId?: string;
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
    let cronUrl = "http://localhost/internal/cron?force=true";
    if (body.leadId) {
      cronUrl += `&lead_id=${encodeURIComponent(body.leadId)}`;
    }
    const internalReq = new Request(cronUrl, {
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
    const normalizedEmail = body.leadEmail.toLowerCase().trim();
    const sentAt = new Date().toISOString();
    
    // Check if queue entry exists
    const { data: existing } = await supabase
      .from("marketing_lead_outreach_queue")
      .select("id")
      .ilike("lead_email", normalizedEmail)
      .eq("channel", "email")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("marketing_lead_outreach_queue")
        .update({ status: "sent", sent_at: sentAt, last_error: "MANUAL_EMAIL_SENT", resend_message_id: 'manual_gmail' })
        .eq("id", existing.id);
    } else {
      // No queue entry exists yet — create one
      const { data: leadRow } = await supabase
        .from("marketing_leads")
        .select("id")
        .ilike("email", normalizedEmail)
        .maybeSingle();
      
      await supabase.from("marketing_lead_outreach_queue").insert({
        lead_email: normalizedEmail,
        lead_id: leadRow?.id ?? null,
        channel: "email",
        status: "sent",
        step: 1,
        attempts: 1,
        sent_at: sentAt,
        last_error: "MANUAL_EMAIL_SENT",
        resend_message_id: 'manual_gmail'
      });
    }
    return NextResponse.json({ ok: true, action: "mark_email_manual_sent" });
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
}
