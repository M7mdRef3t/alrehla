import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function buildAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * GET /api/admin/email/stats
 * Returns email analytics: totals, rates, time-series data.
 * Query params: period=7d|30d|90d (default: 30d)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30d";

  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[period] || 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const supabase = buildAdmin();

  // Total sends in period
  const { count: totalSent } = await supabase
    .from("email_sends")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  // Status breakdown
  const { data: statusData } = await supabase
    .from("email_sends")
    .select("status")
    .gte("created_at", since);

  const statusCounts: Record<string, number> = {};
  (statusData || []).forEach((row: any) => {
    statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
  });

  const total = (statusData || []).filter((r: any) => !["failed", "queued"].includes(r.status)).length;
  const delivered = (statusCounts["delivered"] || 0) + (statusCounts["opened"] || 0) + (statusCounts["clicked"] || 0);
  const opened = (statusCounts["opened"] || 0) + (statusCounts["clicked"] || 0);
  const clicked = statusCounts["clicked"] || 0;
  const bounced = statusCounts["bounced"] || 0;
  const complained = statusCounts["complained"] || 0;

  // Daily time series
  const { data: dailyData } = await supabase
    .from("email_sends")
    .select("created_at, status")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  const dailyMap: Record<string, { sent: number; delivered: number; opened: number; clicked: number; bounced: number }> = {};
  (dailyData || []).forEach((row: any) => {
    const day = row.created_at?.substring(0, 10);
    if (!day) return;
    if (!dailyMap[day]) dailyMap[day] = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    dailyMap[day].sent++;
    if (["delivered", "opened", "clicked"].includes(row.status)) dailyMap[day].delivered++;
    if (["opened", "clicked"].includes(row.status)) dailyMap[day].opened++;
    if (row.status === "clicked") dailyMap[day].clicked++;
    if (row.status === "bounced") dailyMap[day].bounced++;
  });

  const timeSeries = Object.entries(dailyMap).map(([date, stats]) => ({
    date,
    ...stats,
  }));

  // Recent sends
  const { data: recent } = await supabase
    .from("email_sends")
    .select("id, to_email, subject, status, campaign_tag, created_at, resend_id")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    period,
    totals: {
      sent: total,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
    },
    rates: {
      delivery: total > 0 ? Math.round((delivered / total) * 100) : 0,
      open: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
      click: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      bounce: total > 0 ? Math.round((bounced / total) * 100) : 0,
    },
    timeSeries,
    recent: recent || [],
  });
}
