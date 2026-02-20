import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function toDayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  const client = getServiceClient();
  if (!client) {
    return NextResponse.json(
      { activeUnits30d: 0, retentionRate30d: 0, activity24h: 0, source: "not_configured" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const now = Date.now();
  const since30dIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since24h = now - 24 * 60 * 60 * 1000;

  const { data, error } = await client
    .from("journey_events")
    .select("session_id,created_at")
    .not("session_id", "is", null)
    .gte("created_at", since30dIso)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (error || !data) {
    return NextResponse.json(
      { activeUnits30d: 0, retentionRate30d: 0, activity24h: 0, source: "query_failed" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const sessionDays = new Map<string, Set<string>>();
  let activity24h = 0;

  for (const row of data as Array<Record<string, unknown>>) {
    const sessionId = String(row.session_id ?? "").trim();
    const createdAt = row.created_at ? new Date(String(row.created_at)).getTime() : NaN;
    if (!sessionId || Number.isNaN(createdAt)) continue;

    if (createdAt >= since24h) activity24h += 1;

    const dayKey = toDayKey(createdAt);
    const current = sessionDays.get(sessionId) ?? new Set<string>();
    current.add(dayKey);
    sessionDays.set(sessionId, current);
  }

  const activeUnits30d = sessionDays.size;
  const continuingSessions = Array.from(sessionDays.values()).filter((days) => days.size >= 2).length;
  const retentionRate30d = activeUnits30d > 0
    ? Math.round((continuingSessions / activeUnits30d) * 100)
    : 0;

  return NextResponse.json(
    { activeUnits30d, retentionRate30d, activity24h, source: "supabase" },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

