import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type PublicPulsePayload = {
  global_phoenix_avg: number | null;
  generated_at: string | null;
};

export async function GET() {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json(
      {
        global_phoenix_avg: null,
        generated_at: new Date().toISOString(),
        source: "not_configured",
        is_live: false
      },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
    );
  }

  const { data, error } = await client.rpc("get_public_awareness_pulse");
  const payload = (data ?? null) as PublicPulsePayload | null;

  if (error || !payload) {
    return NextResponse.json(
      {
        global_phoenix_avg: null,
        generated_at: new Date().toISOString(),
        source: "query_failed",
        is_live: false
      },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
    );
  }

  const avg =
    typeof payload.global_phoenix_avg === "number" && Number.isFinite(payload.global_phoenix_avg)
      ? payload.global_phoenix_avg
      : null;

  if (avg === null) {
    return NextResponse.json(
      {
        global_phoenix_avg: null,
        generated_at: new Date().toISOString(),
        source: "no_data",
        is_live: false
      },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
    );
  }

  return NextResponse.json(
    {
      global_phoenix_avg: avg,
      generated_at: payload.generated_at ?? new Date().toISOString(),
      source: "supabase",
      is_live: true
    },
    { status: 200, headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
  );
}
