import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/server/requireAdmin";

export const dynamic = "force-dynamic";

function buildAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = buildAdminClient();

  // Get stats for the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: stats, error } = await db
    .from("capi_telemetry")
    .select("status, event_name")
    .gte("created_at", yesterday);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = {
    total: stats.length,
    success: stats.filter((s: any) => s.status === "success").length,
    failed: stats.filter((s: any) => s.status === "failed" || s.status === "error").length,
    events: stats.reduce((acc: any, curr: any) => {
      acc[curr.event_name] = (acc[curr.event_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return NextResponse.json(summary);
}
