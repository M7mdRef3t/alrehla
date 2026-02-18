import { getServiceSupabase, parseJsonBody } from "../user/_shared.js";

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

  const payload = {
    decision_id: decisionId,
    acted: Boolean(body?.acted),
    completed: body?.completed == null ? null : Boolean(body.completed),
    pulse_delta: typeof body?.pulseDelta === "number" ? body.pulseDelta : null,
    time_to_action_sec: typeof body?.timeToActionSec === "number" ? body.timeToActionSec : null,
    reported_at: new Date(typeof body?.reportedAt === "number" ? body.reportedAt : Date.now()).toISOString()
  };

  const supabase = getServiceSupabase();
  if (supabase) {
    await supabase.from("next_step_outcomes").insert(payload);
  }

  res.status(200).json({ ok: true });
}
