/**
 * adminAiLogs.ts — AI log management (fetch, save, rate).
 */

import { callAdminApi } from "./adminCore";
import type { AdminAiLog, AiLogEntry } from "./adminTypes";

export async function fetchAdminAiLogs(limit = 20): Promise<AdminAiLog[] | null> {
  const apiData = await callAdminApi<{ logs: Array<Record<string, unknown>> }>(`ai-logs?limit=${limit}`);
  if (!apiData?.logs) return null;
  return apiData.logs.map((row) => ({
    id: String(row.id ?? ""),
    userId: row.user_id ? String(row.user_id) : null,
    prompt: String(row.prompt ?? ""),
    response: String(row.response ?? ""),
    tokens: Number(row.tokens ?? 0),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
  }));
}

export async function fetchAiLogs(limit = 20): Promise<AiLogEntry[] | null> {
  const logs = await fetchAdminAiLogs(limit);
  if (!logs) return null;
  return logs.map((log) => ({
    id: log.id,
    source: log.source === "system" ? "system" : "playground",
    prompt: log.prompt,
    response: log.response,
    tokens: log.tokens,
    rating: log.rating === 1 ? "up" : log.rating === -1 ? "down" : undefined,
    createdAt: log.createdAt ?? Date.now()
  }));
}

export async function saveAiLog(entry: Partial<AiLogEntry>): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("ai-logs", {
    method: "POST",
    body: JSON.stringify(entry)
  });
  return Boolean(apiData?.ok);
}

export async function rateAiLog(id: string, rating: "up" | "down" | 1 | -1): Promise<boolean> {
  const normalized = rating === "up" ? 1 : rating === "down" ? -1 : rating;
  const apiData = await callAdminApi<{ ok: boolean }>("ai-logs", {
    method: "PATCH",
    body: JSON.stringify({ id, rating: normalized })
  });
  return Boolean(apiData?.ok);
}
