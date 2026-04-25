import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/server/requireAdmin";
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
  const secret = process.env.CRON_SECRET || process.env.MARKETING_DEBUG_KEY || process.env.ADMIN_API_SECRET;
  const auth = req.headers.get("authorization");

  // 1. Secret/Cron/Admin Auth
  if (secret && auth === `Bearer ${secret}`) return true;

  // 2. Head-less requireAdmin check
  const denied = await requireAdmin(req);
  if (!denied) return true;

  return false;
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
    .select("status, channel, lead_email, lead_id, opened_at, clicked_at, bounced, complained, sent_at");

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
  const { data: dbLeads, count: dbLeadsCount, error: dbLeadsError } = await supabase
    .from("marketing_leads")
    .select("id, name, email, phone_normalized, source_type, campaign, adset, ad, status, email_status, created_at, unsubscribed, utm, note, metadata", { count: "exact" });

  if (dbLeadsError) {
    console.error("[MarketingOps] marketing_leads fetch error:", dbLeadsError);
  }

  const totalDatabaseLeads = dbLeadsCount ?? 0;
  const leadsBySource: Record<string, number> = {};
  const leadsByCampaign: Record<string, number> = {};

  const rawLeads = dbLeads ?? [];

  // ─── Email Outreach Engagement Mapping (by ID or Email) ───────────────────
  const emailEngagementMap: Record<string, any> = {};
  const idEngagementMap: Record<string, any> = {};

  if (queueStats) {
    for (const qs of queueStats) {
      if (qs.channel !== 'email') continue;
      
      const entry = {
        sent: qs.status === 'sent',
        pending: qs.status === 'pending',
        opened: !!qs.opened_at,
        clicked: !!qs.clicked_at,
        bounced: !!(qs.bounced || qs.complained || qs.status === 'failed')
      };

      if (qs.lead_id) {
        idEngagementMap[String(qs.lead_id)] = entry;
      }
      if (qs.lead_email) {
        emailEngagementMap[qs.lead_email.toLowerCase().trim()] = entry;
      }
    }
  }

  for (const lead of rawLeads) {
    const s = (lead.source_type as string) || "unknown";
    const c = (lead.campaign as string) || "unattributed";
    leadsBySource[s] = (leadsBySource[s] ?? 0) + 1;
    leadsByCampaign[c] = (leadsByCampaign[c] ?? 0) + 1;
    
    // Attach email engagement status (Robust match: ID first, then Email)
    let emailStatus = (lead.email_status as string) || "none";
    
    if (lead.unsubscribed) {
      emailStatus = "unsubscribed";
    } else {
      const eng = idEngagementMap[String(lead.id)] || (lead.email ? emailEngagementMap[String(lead.email).toLowerCase().trim()] : null);
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
  
  // Deep conversions (leads who actually generated a map)
  const { data: deepConversionEvents } = await supabase
    .from("journey_events")
    .select("payload")
    .eq("type", "flow_event")
    .in("payload->>step", ["map_generated", "add_person_done_show_on_map"]);

  const deepConvertedLeadIds = new Set<string>();
  if (deepConversionEvents) {
    for (const ev of deepConversionEvents) {
      const payload = ev.payload as any;
      const leadId = payload?.extra?.lead?.lead_id;
      if (leadId) deepConvertedLeadIds.add(String(leadId));
    }
  }

  const conversionsByCampaign: Record<string, number> = {};
  const conversionsBySource: Record<string, number> = {};
  const deepConversionsByCampaign: Record<string, number> = {};
  const deepConversionsBySource: Record<string, number> = {};
  const revenueByCampaign: Record<string, number> = {};
  const revenueBySource: Record<string, number> = {};
  let totalRevenue = 0;
  
  for (const lead of rawLeads) {
    const c = (lead.campaign as string) || "unattributed";
    const s = (lead.source_type as string) || "unknown";
    const converted = convertedLeadIds.has(String(lead.id));
    const deepConverted = deepConvertedLeadIds.has(String(lead.id));
    
    (lead as any).has_converted = converted; // Added for per-lead status
    (lead as any).has_deep_converted = deepConverted; // Added for per-lead status
    
    if (converted) {
      conversionsByCampaign[c] = (conversionsByCampaign[c] ?? 0) + 1;
      conversionsBySource[s] = (conversionsBySource[s] ?? 0) + 1;
    }
    if (deepConverted) {
      deepConversionsByCampaign[c] = (deepConversionsByCampaign[c] ?? 0) + 1;
      deepConversionsBySource[s] = (deepConversionsBySource[s] ?? 0) + 1;
    }
    
    // Revenue Attributions 
    if (["activated", "converted", "proof_received"].includes((lead.status as string)?.toLowerCase())) {
        const metadata = (lead.metadata as any) || {};
        const amount = Number(metadata.amount) || Number(metadata.amount_egp) || 0;
        
        revenueByCampaign[c] = (revenueByCampaign[c] ?? 0) + amount;
        revenueBySource[s] = (revenueBySource[s] ?? 0) + amount;
        totalRevenue += amount;
    }
  }

  // ─── High-Value Prospect Rescue (Gate Session Dropouts) ───────────────────
  const { data: gateSessions, error: gateError } = await supabase
    .from("gate_sessions")
    .select("id, email, utm_source, utm_campaign, lead_submitted_at")
    .not("email", "is", null)
    .order("lead_submitted_at", { ascending: false })
    .limit(100);

  if (gateError) {
    console.error("[MarketingOps] gate_sessions fetch error:", gateError);
  }

  const existingEmails = new Set(rawLeads.map(l => l.email?.toLowerCase().trim()));
  const prospectLeads: any[] = [];

  for (const session of (gateSessions ?? [])) {
    const email = session.email?.toLowerCase().trim();
    if (email && !existingEmails.has(email)) {
      // Create a "pseudo-lead" from the gate session
      prospectLeads.push({
        id: session.id,
        email: session.email,
        name: "زائر (بوابة)",
        source_type: session.utm_source || "direct",
        campaign: session.utm_campaign || "unattributed",
        status: "prospect", // Special internal status
        is_high_value_prospect: true,
        created_at: session.lead_submitted_at,
        metadata: {
          gate_id: session.id,
          is_prospect: true
        }
      });
      // Avoid duplicates from multiple gate sessions
      existingEmails.add(email);
    }
  }

  // Merge prospects into rawLeads for the dashboard to render
  const mergedLeads = [...prospectLeads, ...rawLeads].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 50);
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
  const rippleTree: any[] = [];

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
    deepConversionsByCampaign,
    deepConversionsBySource,
    revenueByCampaign,
    revenueBySource,
    totalRevenue,
    rawLeads: mergedLeads,
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
    const sentAt = new Date().toISOString();
    
    // Update queue
    await supabase
      .from("marketing_lead_outreach_queue")
      .update({ status: "sent", sent_at: sentAt, last_error: "MANUAL_EMAIL_SENT" })
      .eq("lead_email", body.leadEmail)
      .in("status", ["pending", "simulated", "failed"]);

    // Update main marketing lead table
    await supabase
      .from("marketing_leads")
      .update({ 
        status: "engaged", 
        email_status: "sent", 
        last_contacted_at: sentAt 
      })
      .ilike("email", body.leadEmail);

    return NextResponse.json({ ok: true, action: "mark_contacted" });
  }

  if (body.action === "mark_email_manual_sent" && (body.leadId || body.leadEmail)) {
    const supabase = buildClient();
    const leadId = body.leadId;
    const leadEmail = body.leadEmail?.toLowerCase().trim();
    const sentAt = new Date().toISOString();
    
    // 1. Get the target lead row
    let query = supabase.from("marketing_leads").select("id, email, status, email_status");
    if (leadId) query = query.eq("id", leadId);
    else if (leadEmail) query = query.ilike("email", leadEmail);
    
    const { data: leadRow, error: findError } = await query.maybeSingle();

    if (findError) {
      console.error("[ManualGmail] Query error:", findError);
    }

    if (!leadRow) {
      console.error("[ManualGmail] Lead not found for:", body.leadId || body.leadEmail);
      return NextResponse.json({ ok: false, error: "lead_not_found" }, { status: 404 });
    }

    const normalizedEmail = leadRow.email?.toLowerCase().trim();

    // 2. Direct Update/Insert for Outreach Queue
    // We search first to avoid upsert conflict issues if index is missing
    const { data: existingQueue } = await supabase
      .from("marketing_lead_outreach_queue")
      .select("id")
      .eq("lead_id", leadRow.id)
      .eq("channel", "email")
      .maybeSingle();

    if (existingQueue) {
       await supabase
        .from("marketing_lead_outreach_queue")
        .update({ 
          status: "sent", 
          sent_at: sentAt, 
          last_error: "MANUAL_EMAIL_SENT", 
          resend_message_id: 'manual_gmail',
          lead_email: normalizedEmail // Sync email too
        })
        .eq("id", existingQueue.id);
    } else {
       await supabase
        .from("marketing_lead_outreach_queue")
        .insert({ 
          lead_id: leadRow.id,
          lead_email: normalizedEmail,
          channel: "email",
          status: "sent", 
          sent_at: sentAt, 
          last_error: "MANUAL_EMAIL_SENT", 
          resend_message_id: 'manual_gmail'
        });
    }

    // 3. Update the main marketing_leads table correctly
    const { error: updateError } = await supabase
      .from("marketing_leads")
      .update({ 
        status: "engaged", 
        email_status: "sent", 
        last_contacted_at: sentAt 
      })
      .eq("id", leadRow.id);

    if (updateError) {
      console.error("[ManualGmail] marketing_leads update error:", updateError);
    }

    return NextResponse.json({ ok: true, action: "mark_email_manual_sent" });
  }

  if (body.action === "mark_bounced" && (body.leadId || body.leadEmail)) {
    const supabase = buildClient();
    const leadId = body.leadId;
    const leadEmail = body.leadEmail?.toLowerCase().trim();

    // 1. Get the target lead row
    let query = supabase.from("marketing_leads").select("id, email, status, email_status");
    if (leadId) query = query.eq("id", leadId);
    else if (leadEmail) query = query.ilike("email", leadEmail);
    
    const { data: leadRow } = await query.maybeSingle();
    if (!leadRow) {
      return NextResponse.json({ ok: false, error: "lead_not_found" }, { status: 404 });
    }

    // 2. Update outreach queue
    await supabase
      .from("marketing_lead_outreach_queue")
      .update({ 
        status: "failed", 
        last_error: "MANUAL_BOUNCE_REPORT", 
        updated_at: new Date().toISOString() 
      })
      .eq("lead_id", leadRow.id)
      .eq("channel", "email");

    // 3. Update marketing_leads status
    await supabase
      .from("marketing_leads")
      .update({ 
        email_status: "bounced",
        status: "bounced"
      })
      .eq("id", leadRow.id);

    console.log(`[ManualBounce] 🚫 Lead marked as bounced: ${leadRow.email || leadRow.id}`);
    return NextResponse.json({ ok: true, action: "mark_bounced" });
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
}
