/**
 * adminAlerts.ts — War Room alerts + Sovereign Oracle insights.
 */

import { callAdminApi } from "./adminCore";
import type { AlertIncident, CommandInsight, CommandStats } from "./adminTypes";

// ─── Alert Incidents ────────────────────────────────────────────────
export async function fetchAlertIncidents(): Promise<AlertIncident[] | null> {
  const apiData = await callAdminApi<{ incidents: AlertIncident[] }>("alerts");
  return apiData?.incidents ?? null;
}

export async function updateAlertIncidentStatus(
  id: string,
  status: "ack" | "resolved",
  reason?: string
): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("alerts", {
    method: "PATCH",
    body: JSON.stringify({ id, status, reason: reason ?? null })
  });
  return Boolean(apiData?.ok);
}

export async function resetAlertIncidents(): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("alerts", {
    method: "DELETE",
    body: JSON.stringify({ reason: "Manual reset from War Room" })
  });
  return Boolean(apiData?.ok);
}

// ─── Sovereign Oracle Insights ──────────────────────────────────────
export async function fetchCommandInsights(): Promise<{
  insights: CommandInsight[];
  stats: CommandStats | null;
  timestamp?: string;
  error?: string;
  retryAfterSec?: number;
} | null> {
  const apiData = await callAdminApi<{ 
    insights: CommandInsight[]; 
    stats: CommandStats;
    timestamp?: string;
    error?: string;
    retryAfterSec?: number;
  }>("oracle-pulse");
  
  if (!apiData) return null;
  return {
    insights: apiData.insights || [],
    stats: apiData.stats || null,
    timestamp: apiData.timestamp,
    retryAfterSec: apiData.retryAfterSec,
    error: apiData.error
  };
}

export async function respondToOracleInsight(
  insightId: string,
  message: string,
  type: 'breakthrough' | 'shadow_pattern' | 'boundary_set' = 'breakthrough'
): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("oracle-pulse", {
    method: "POST",
    body: JSON.stringify({ insightId, message, type })
  });
  return Boolean(apiData?.ok);
}
