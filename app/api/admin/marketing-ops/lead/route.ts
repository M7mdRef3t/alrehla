import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("id");
  const email = searchParams.get("email");

  if (!leadId && !email) {
    return NextResponse.json({ ok: false, error: "missing_id_or_email" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "no_supabase" }, { status: 503 });

  // 1. Fetch Routing Events for this lead
  const { data: routingEvents } = await supabase
    .from("routing_events")
    .select("session_id, created_at, metadata")
    .or(`lead_id.eq.${leadId},email.eq.${email}`);

  const sessionIds = (routingEvents || []).map(r => r.session_id);
  
  // 2. Fetch Journey Events for these sessions
  let history: any[] = [];
  if (sessionIds.length > 0) {
     const { data: events } = await supabase
       .from("journey_events")
       .select("type, payload, created_at")
       .in("session_id", sessionIds)
       .order("created_at", { ascending: true });
     history = events || [];
  }

  return NextResponse.json({ ok: true, history, routing: routingEvents || [] });
}

export async function PATCH(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, phone_normalized, email, source_type, campaign, status, note } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_lead_id" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
    }
    
    const { error } = await supabase
      .from("marketing_leads")
      .update({
        name,
        phone_normalized,
        email,
        source_type,
        campaign,
        status,
        note,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("[marketing-ops/lead] Update error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[marketing-ops/lead] Unexpected error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, action } = body;

    if (action === "mark_sent_manual") {
      if (!email) {
        return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
      }

      const supabase = getSupabaseAdminClient();
      if (!supabase) return NextResponse.json({ ok: false, error: "no_supabase" }, { status: 503 });

      const sentAt = new Date().toISOString();
      const { data: leadData } = await supabase
        .from("marketing_leads")
        .select("lead_id")
        .eq("email", email)
        .maybeSingle();

      const { data: existing } = await supabase
        .from("marketing_lead_outreach_queue")
        .select("id")
        .eq("lead_email", email)
        .eq("channel", "email")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("marketing_lead_outreach_queue")
          .update({ status: "sent", sent_at: sentAt, attempts: 1, last_error: null, resend_message_id: 'manual_gmail' })
          .eq("id", existing.id);
      } else {
        await supabase.from("marketing_lead_outreach_queue").insert({
          lead_email: email, lead_id: leadData?.lead_id || null, channel: "email",
          status: "sent", step: 1, attempts: 1, sent_at: sentAt, resend_message_id: 'manual_gmail'
        });
      }

      return NextResponse.json({ ok: true, method: "manual_logged" });
    }

    if (action === "resend_email") {
      if (!email) {
        return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
      }

      const supabase = getSupabaseAdminClient();
      if (!supabase) {
        return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
      }

      // 1. Fetch lead data for personalization
      const { data: leadData } = await supabase
        .from("marketing_leads")
        .select("name, lead_id, unsubscribed")
        .eq("email", email)
        .maybeSingle();

      if ((leadData as any)?.unsubscribed) {
        return NextResponse.json({ ok: false, error: "lead_unsubscribed" }, { status: 400 });
      }

      const leadName = (leadData?.name || "").trim().split(/\s+/)[0] || "";
      const leadId = leadData?.lead_id || "";
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.alrehla.app").replace(/\/$/, "");
      const personalLink = leadId
        ? `${appUrl}/onboarding?ref=${leadId}&utm_source=email&utm_medium=manual&utm_campaign=admin_send`
        : `${appUrl}/onboarding?utm_source=email&utm_medium=manual&utm_campaign=admin_send`;

      // 2. Send email immediately via Resend
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.MARKETING_EMAIL_FROM || process.env.REPORT_EMAIL_FROM;

      if (!apiKey || !from) {
        // Fallback: queue it for cron
        const { data: existing } = await supabase
          .from("marketing_lead_outreach_queue")
          .select("id")
          .eq("lead_email", email)
          .eq("channel", "email")
          .maybeSingle();

        if (existing) {
          await supabase
            .from("marketing_lead_outreach_queue")
            .update({ status: "pending", scheduled_at: new Date().toISOString(), attempts: 0, last_error: null })
            .eq("id", existing.id);
        } else {
          await supabase.from("marketing_lead_outreach_queue").insert({
            lead_email: email, lead_id: leadId || null, channel: "email",
            status: "pending", step: 1, attempts: 0, scheduled_at: new Date().toISOString()
          });
        }
        return NextResponse.json({ ok: true, method: "queued" });
      }

      // Build email HTML using the marketing template
      let buildMarketingEmail: any;
      try {
        buildMarketingEmail = (await import("@/lib/marketing/emailTemplate")).buildMarketingEmail;
      } catch {
        buildMarketingEmail = null;
      }
      
      let unsubLink = appUrl + "/api/unsubscribe";
      try {
        const { buildUnsubLink } = await import("@/lib/marketing/unsubToken");
        if (leadId) unsubLink = buildUnsubLink(appUrl, leadId, email);
      } catch {}

      const subject = `خطوتك الأولى في الرحلة تنتظرك ✦`;
      let html = "";
      if (buildMarketingEmail) {
        html = buildMarketingEmail({ name: leadName || undefined, personalLink, previewText: "خريطة علاقاتك جاهزة — ابدأ الرحلة الآن", senderName: "فريق عمل", unsubLink });
      } else {
        html = `<p>أهلاً ${leadName || "يا بطل"}،</p><p>خريطة علاقاتك جاهزة: <a href="${personalLink}">${personalLink}</a></p>`;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: email, subject, html, reply_to: "hello@alrehla.app" }),
      });
      const resendBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        return NextResponse.json({ ok: false, error: `send_failed: ${JSON.stringify(resendBody)}` }, { status: 500 });
      }

      // 3. Update queue record
      const sentAt = new Date().toISOString();
      const { data: existing } = await supabase
        .from("marketing_lead_outreach_queue")
        .select("id")
        .eq("lead_email", email)
        .eq("channel", "email")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("marketing_lead_outreach_queue")
          .update({ status: "sent", sent_at: sentAt, attempts: 1, last_error: null, resend_message_id: resendBody.id || null })
          .eq("id", existing.id);
      } else {
        await supabase.from("marketing_lead_outreach_queue").insert({
          lead_email: email, lead_id: leadId || null, channel: "email",
          status: "sent", step: 1, attempts: 1, sent_at: sentAt, resend_message_id: resendBody.id || null
        });
      }

      return NextResponse.json({ ok: true, method: "sent_immediately", resendId: resendBody.id });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (error: any) {
    console.error("[marketing-ops/lead] Resend error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
