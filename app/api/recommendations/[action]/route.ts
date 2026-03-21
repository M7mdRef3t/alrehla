import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";
import nextStepHandlerV2 from "../../../../server/routing/next-step-v2";
import outcomeHandlerV2 from "../../../../server/routing/outcome-v2";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const FOUNDING_COHORT_CAPACITY = 50;

export async function GET() {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json(
      {
        total_seats: FOUNDING_COHORT_CAPACITY,
        seats_left: null,
        active_premium: null,
        closes_at: null,
        source: "unavailable",
        is_live: false
      },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  const { data: scarcityRpcData, error: scarcityRpcError } = await client.rpc("get_founding_cohort_scarcity");
  const scarcityRow = Array.isArray(scarcityRpcData)
    ? (scarcityRpcData[0] as Record<string, unknown> | undefined)
    : (scarcityRpcData as Record<string, unknown> | null);

  if (!scarcityRpcError && scarcityRow) {
    const totalSeats = Number(scarcityRow.total_seats ?? FOUNDING_COHORT_CAPACITY);
    const seatsLeftRaw = Number(scarcityRow.seats_left ?? 0);
    const activePremiumRaw = Number(scarcityRow.active_premium ?? 0);
    const isLive = Boolean(scarcityRow.is_live);
    const closesAt = typeof scarcityRow.closes_at === "string" ? scarcityRow.closes_at : null;

    return NextResponse.json(
      {
        total_seats: Number.isFinite(totalSeats) && totalSeats > 0 ? totalSeats : FOUNDING_COHORT_CAPACITY,
        seats_left: Number.isFinite(seatsLeftRaw) ? Math.max(seatsLeftRaw, 0) : null,
        active_premium: Number.isFinite(activePremiumRaw) ? Math.max(activePremiumRaw, 0) : null,
        closes_at: closesAt,
        source: "cohort_seats_rpc",
        is_live: isLive
      },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  // Backward-compatible fallback while the migration is rolling out.
  const { count, error } = await client
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gt("awareness_tokens", 0)
    .gt("journey_expires_at", new Date().toISOString());

  if (error) {
    return NextResponse.json(
      {
        total_seats: FOUNDING_COHORT_CAPACITY,
        seats_left: null,
        active_premium: null,
        closes_at: null,
        source: "unavailable",
        is_live: false
      },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  const activePremium = Number(count ?? 0);
  const seatsLeft = Math.max(FOUNDING_COHORT_CAPACITY - activePremium, 0);
  const { data: cohortWindowRows } = await client
    .from("profiles")
    .select("journey_expires_at")
    .gt("awareness_tokens", 0)
    .gt("journey_expires_at", new Date().toISOString())
    .order("journey_expires_at", { ascending: true })
    .limit(1);

  const closesAt =
    cohortWindowRows?.[0] && typeof cohortWindowRows[0].journey_expires_at === "string"
      ? cohortWindowRows[0].journey_expires_at
      : null;

  return NextResponse.json(
    {
      total_seats: FOUNDING_COHORT_CAPACITY,
      seats_left: seatsLeft,
      active_premium: activePremium,
      closes_at: closesAt,
      source: "supabase",
      is_live: true
    },
    { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}

export async function POST(req: NextRequest, { params }: { params: { action: string } }) {
  const action = params.action;

  let parsedBody: unknown = null;
  try {
    parsedBody = await req.json();
  } catch {
    parsedBody = {};
  }

  let statusCode = 200;
  let responseBody: unknown = null;

  const fakeReq = {
    method: "POST",
    body: parsedBody as any
  };

  const fakeRes = {
    status(code: number) {
      statusCode = code;
      return fakeRes;
    },
    json(body: unknown) {
      responseBody = body;
    }
  };

  if (action === "next-step") {
    await nextStepHandlerV2(fakeReq, fakeRes);
  } else if (action === "outcome") {
    await outcomeHandlerV2(fakeReq, fakeRes);
  } else {
    return NextResponse.json({ error: `Action ${action} not supported via POST` }, { status: 405 });
  }

  return NextResponse.json(responseBody, { status: statusCode });
}
