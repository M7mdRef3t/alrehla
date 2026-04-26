import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";
import nextStepHandlerV2 from "../../../../server/routing/next-step-v2";
import outcomeHandlerV2 from "../../../../server/routing/outcome-v2";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const FOUNDING_COHORT_CAPACITY = 50;

export async function GET(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const client = getSupabaseAdminClient();
  
  // Scarcity stats are the primary GET action for this route
  if (action === "scarcity" || action === "cohort") {
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
  }

  // Default Fallback / Health check
  return NextResponse.json(
    {
      status: "ready",
      action: action,
      version: "2.0.0",
      total_seats: FOUNDING_COHORT_CAPACITY
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action: rawAction } = await params;
  const action = rawAction.trim().toLowerCase(); // Normalize action string
  
  console.log(`[Recommendations API] Action: ${action}, URL: ${req.url}`);

  let parsedBody: unknown = null;
  try {
    parsedBody = await req.json();
  } catch {
    parsedBody = {};
  }

  let statusCode = 200;
  let responseBody: unknown = null;

  type LegacyRequest = {
    method: string;
    body: unknown;
  };
  type LegacyResponse = {
    status: (code: number) => LegacyResponse;
    json: (body: unknown) => void;
  };

  const fakeReq = {
    method: "POST",
    body: parsedBody
  } as LegacyRequest;

  const fakeRes = {
    status(code: number) {
      statusCode = code;
      return fakeRes;
    },
    json(body: unknown) {
      responseBody = body;
    }
  } as LegacyResponse;

  // Handle both next-step and next_step to be resilient
  if (action === "next-step" || action === "next_step") {
    await nextStepHandlerV2(
      fakeReq as unknown as Parameters<typeof nextStepHandlerV2>[0],
      fakeRes as unknown as Parameters<typeof nextStepHandlerV2>[1]
    );
  } else if (action === "outcome") {
    await outcomeHandlerV2(
      fakeReq as unknown as Parameters<typeof outcomeHandlerV2>[0],
      fakeRes as unknown as Parameters<typeof outcomeHandlerV2>[1]
    );
  } else {
    return NextResponse.json(
      { error: `Action ${action} not supported via POST`, received: action }, 
      { status: 405 }
    );
  }

  return NextResponse.json(responseBody, { status: statusCode });
}
