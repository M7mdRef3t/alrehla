import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = getSupabaseAdminClient();
  let supabase = "unconfigured";

  if (client) {
    const probe = await client.from("maraya_duo_rooms").select("id").limit(1);
    supabase = probe.error ? "error" : "ok";
  }

  return NextResponse.json({
    status: "ok",
    supabase,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    realtimeConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    timestamp: new Date().toISOString(),
  });
}
