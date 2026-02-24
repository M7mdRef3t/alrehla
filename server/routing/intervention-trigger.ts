import { getServiceSupabase, parseJsonBody } from "./_shared.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = await parseJsonBody(req);
  const decisionId = typeof body?.decisionId === "string" ? body.decisionId.trim() : "";
  if (!decisionId) {
    res.status(400).json({ error: "Missing decisionId" });
    return;
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    res.status(503).json({ error: "Supabase unavailable" });
    return;
  }

  const { data: decision } = await supabase
    .from("routing_decisions_v2")
    .select("segment_key,surface,source")
    .eq("id", decisionId)
    .maybeSingle();

  await supabase.from("routing_events").insert({
    user_id: typeof body?.userId === "string" ? body.userId : null,
    session_id: typeof body?.sessionId === "string" ? body.sessionId : null,
    event_type: "intervention_triggered",
    payload: {
      decisionId,
      segmentKey: String(decision?.segment_key ?? body?.segmentKey ?? "unknown"),
      surface: String(decision?.surface ?? body?.surface ?? "map"),
      source: String(decision?.source ?? body?.source ?? "cloud_ranker_v2"),
      hesitationSec: typeof body?.hesitationSec === "number" ? body.hesitationSec : null,
      cognitiveLoadRequired: typeof body?.cognitiveLoadRequired === "number" ? body.cognitiveLoadRequired : null,
      actionType: typeof body?.actionType === "string" ? body.actionType : null
    }
  });

  res.status(200).json({ ok: true });
}

