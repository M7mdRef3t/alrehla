import { getServiceSupabase, parseJsonBody } from "./_shared.js";

function toNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = await parseJsonBody(req);
  const decisionId = typeof body?.decisionId === "string" ? body.decisionId : null;
  if (!decisionId) {
    res.status(400).json({ error: "Missing decisionId" });
    return;
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    res.status(503).json({ error: "Supabase unavailable" });
    return;
  }

  const acted = Boolean(body?.acted);
  const completed = body?.completed == null ? null : Boolean(body.completed);
  const telemetry = {
    completionLatencySec: toNumber(body?.completionLatencySec ?? body?.timeToActionSec),
    hesitationSec: toNumber(body?.hesitationSec),
    idleTimeSec: toNumber(body?.idleTimeSec),
    rawElapsedSec: toNumber(body?.rawElapsedSec),
    interactionCount: toNumber(body?.interactionCount)
  };
  const payload = {
    decision_id: decisionId,
    user_id: typeof body?.userId === "string" ? body.userId : null,
    acted,
    completed,
    completion_latency_sec: telemetry.completionLatencySec,
    pulse_delta: toNumber(body?.pulseDelta),
    reported_at: new Date(typeof body?.reportedAt === "number" ? body.reportedAt : Date.now()).toISOString()
  };

  await supabase.from("routing_outcomes_v2").insert(payload);

  // Update swarm stats using chosen decision edge.
  const { data: decision } = await supabase
    .from("routing_decisions_v2")
    .select("segment_key,chosen_step")
    .eq("id", decisionId)
    .maybeSingle();

  const edgeId = String((decision?.chosen_step as any)?.actionPayload?.edgeId ?? "").trim();
  if (edgeId) {
    await supabase.rpc("update_swarm_edge_stats_after_outcome", {
      in_edge_id: edgeId,
      in_segment_key: String(decision?.segment_key ?? "unknown"),
      in_acted: acted,
      in_completed: completed === true,
      in_completion_latency_sec: payload.completion_latency_sec
    });
  }

  await supabase.from("routing_events").insert({
    user_id: typeof body?.userId === "string" ? body.userId : null,
    session_id: typeof body?.sessionId === "string" ? body.sessionId : null,
    event_type: "outcome_reported",
    payload: {
      decisionId,
      acted,
      completed,
      telemetry
    }
  });

  res.status(200).json({ ok: true });
}
