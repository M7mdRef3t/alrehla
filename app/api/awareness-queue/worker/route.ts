import { NextResponse } from "next/server";
import { DynamicContextRouter } from "../../../../src/services/dynamicContextRouter";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type ClaimedAwarenessEvent = {
  id: string;
  user_id: string;
  action_type: string;
  payload: unknown;
  retry_count?: number;
};

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { data: events, error: claimError } = await supabaseAdmin.rpc(
      "claim_awareness_events_batch",
      { p_limit: 50 }
    ).abortSignal(AbortSignal.timeout(8_000));
    if (claimError) throw claimError;

    const claimedEvents = (events ?? []) as ClaimedAwarenessEvent[];
    if (claimedEvents.length === 0) {
      return NextResponse.json({ status: "no_pending_events" });
    }

    const outcomes = await Promise.all(
      claimedEvents.map(async (event) => {
        try {
          await DynamicContextRouter.route(
            {
              clientId: event.user_id,
              lastDDA: 0,
              lastBI: 0.5
            },
            { type: event.action_type, payload: event.payload }
          );
          return { id: event.id, status: "completed" as const };
        } catch (processingError) {
          const nextRetryCount = (event.retry_count ?? 0) + 1;
          const errorMessage =
            processingError instanceof Error ? processingError.message : "worker_processing_failed";

          if (nextRetryCount > 4) {
            return {
              id: event.id,
              status: "dlq" as const,
              retry_count: nextRetryCount,
              error: errorMessage
            };
          }

          const backoffMinutes = Math.pow(2, nextRetryCount);
          const nextRetryAt = new Date(Date.now() + backoffMinutes * 60_000).toISOString();
          return {
            id: event.id,
            status: "failed" as const,
            retry_count: nextRetryCount,
            next_retry_at: nextRetryAt,
            error: errorMessage
          };
        }
      })
    );

    const { data: applyResult, error: applyError } = await supabaseAdmin.rpc(
      "apply_awareness_event_results",
      { p_results: outcomes }
    ).abortSignal(AbortSignal.timeout(8_000));
    if (applyError) throw applyError;

    return NextResponse.json({
      claimed: claimedEvents.length,
      processed: applyResult ?? null
    });
  } catch (error) {
    console.error("Awareness worker error:", error);
    return NextResponse.json({ error: "Awareness worker unavailable" }, { status: 503 });
  }
}
