import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase, parseJsonBody } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

const ACTIVE_INCIDENT_STATUSES = ["open", "ack"] as const;

function getBearerToken(req: AdminRequest): string | null {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (typeof auth !== "string") return null;
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

async function resolveActor(client: SupabaseClient, req: AdminRequest) {
  const token = getBearerToken(req);
  if (!token) return { actorId: null, actorRole: null };
  const adminSecrets = [process.env.CRON_SECRET, process.env.ADMIN_API_SECRET]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());
  if (adminSecrets.includes(token)) {
    return { actorId: "system-secret", actorRole: "system" };
  }
  const { data } = await client.auth.getUser(token);
  const userId = data?.user?.id ?? null;
  if (!userId) return { actorId: null, actorRole: null };
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return { actorId: userId, actorRole: typeof profile?.role === "string" ? profile.role : null };
}

async function logIncidentHistory(
  client: SupabaseClient,
  incidentIds: string[],
  payload: { fromStatus: string | null; toStatus: string; reason: string | null; actorId: string | null; actorRole: string | null }
) {
  if (!incidentIds.length) return;
  await client.from("alert_incident_history").insert(
    incidentIds.map((incidentId) => ({
      incident_id: incidentId,
      from_status: payload.fromStatus,
      to_status: payload.toStatus,
      changed_by: payload.actorId,
      changed_by_role: payload.actorRole,
      reason: payload.reason
    }))
  );
}

export async function handleAlerts(req: AdminRequest, res: AdminResponse) {
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Admin API not configured" });
    return;
  }

  if (req.method === "GET") {
    const { data, error } = await client
      .from("v_active_alert_incidents")
      .select("*")
      .order("severity", { ascending: false })
      .order("opened_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: "Failed to fetch alerts", details: error.message });
      return;
    }

    res.status(200).json({ incidents: data ?? [] });
    return;
  }

  if (req.method === "PATCH") {
    const body = await parseJsonBody(req);
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const status = typeof body?.status === "string" ? body.status.trim() : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : null;

    if (!id || !ACTIVE_INCIDENT_STATUSES.includes(status as (typeof ACTIVE_INCIDENT_STATUSES)[number]) && status !== "resolved") {
      res.status(400).json({ error: "Invalid alert update payload" });
      return;
    }

    const { data: currentIncident } = await client
      .from("alert_incidents")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === "resolved") {
      payload.resolved_at = new Date().toISOString();
    }

    const { error } = await client
      .from("alert_incidents")
      .update(payload)
      .eq("id", id);

    if (error) {
      res.status(500).json({ error: "Failed to update alert", details: error.message });
      return;
    }

    const actor = await resolveActor(client, req);
    await logIncidentHistory(client, [id], {
      fromStatus: typeof currentIncident?.status === "string" ? currentIncident.status : null,
      toStatus: status,
      reason,
      actorId: actor.actorId,
      actorRole: actor.actorRole
    });

    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    const body = await parseJsonBody(req);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "Manual reset from War Room";
    const { data: activeIncidents } = await client
      .from("alert_incidents")
      .select("id,status")
      .in("status", ["open", "ack"]);

    const { error } = await client
      .from("alert_incidents")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_reason: reason,
        updated_at: new Date().toISOString()
      })
      .in("status", ["open", "ack"]);

    if (error) {
      res.status(500).json({ error: "Failed to reset alerts", details: error.message });
      return;
    }

    const actor = await resolveActor(client, req);
    if (activeIncidents?.length) {
      await client.from("alert_incident_history").insert(
        activeIncidents.map((incident: { id: string; status: string }) => ({
          incident_id: incident.id,
          from_status: incident.status,
          to_status: "resolved",
          changed_by: actor.actorId,
          changed_by_role: actor.actorRole,
          reason
        }))
      );
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

