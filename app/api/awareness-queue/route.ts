import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function triggerWorker(originUrl: string): Promise<void> {
  const workerUrl = new URL("/api/awareness-queue/worker", originUrl).toString();
  await fetch(workerUrl, { method: "POST", signal: AbortSignal.timeout(3_000) });
}

type QueuePayload = {
  userId: string;
  actionType: string;
  [key: string]: unknown;
};

async function enqueueWithRetry(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>,
  payload: QueuePayload
) {
  if (!supabaseAdmin) {
    return { error: { message: "Supabase is not configured" } };
  }

  let { error } = await supabaseAdmin
    .from("awareness_events_queue")
    .insert({
      user_id: payload.userId,
      action_type: payload.actionType,
      payload,
      status: "pending"
    })
    .abortSignal(AbortSignal.timeout(8_000));

  // Retry once for transient timeout/network hiccups.
  if (error?.message?.toLowerCase().includes("timeout")) {
    ({ error } = await supabaseAdmin
      .from("awareness_events_queue")
      .insert({
        user_id: payload.userId,
        action_type: payload.actionType,
        payload,
        status: "pending"
      })
      .abortSignal(AbortSignal.timeout(12_000)));
  }

  return { error };
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const payload = (await req.json()) as QueuePayload;
    if (!payload?.userId || !payload?.actionType) {
      return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
    }
    if (!UUID_V4_REGEX.test(String(payload.userId))) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    const { error } = await enqueueWithRetry(supabaseAdmin, payload);
    const errorCode = (error as { code?: string } | null)?.code;
    if (errorCode === "23503") {
      return NextResponse.json({ error: "Unknown userId" }, { status: 400 });
    }
    if (error) throw error;

    // Fire-and-forget wake-up to keep ingestion non-blocking.
    void triggerWorker(req.url).catch(() => undefined);

    return NextResponse.json({ status: "queued" }, { status: 202 });
  } catch (error) {
    console.error("Queue ingestion error:", error);
    return NextResponse.json({ error: "Queue ingestion unavailable" }, { status: 503 });
  }
}
