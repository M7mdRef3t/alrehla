/**
 * adminSupport.ts — Support tickets CRUD + activation resolve/reject + feedback.
 */

import { callAdminApi } from "./adminCore";
import type { SupportTicketEntry, AdminFeedbackEntry, OwnerAlertsResponse } from "./adminTypes";

// ─── Helpers ────────────────────────────────────────────────────────
function mapTicketRow(row: Record<string, unknown>): SupportTicketEntry {
  return {
    id: String(row.id ?? ""),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).getTime() : null,
    source: String(row.source ?? "manual"),
    status: String(row.status ?? "open"),
    priority: String(row.priority ?? "normal"),
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    sessionId: row.session_id ? String(row.session_id) : null,
    category: row.category ? String(row.category) : null,
    assignee: row.assignee ? String(row.assignee) : null,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null
  };
}

// ─── Fetch Support Tickets ──────────────────────────────────────────
export async function fetchSupportTickets(query?: {
  limit?: number;
  search?: string;
  status?: string;
}): Promise<SupportTicketEntry[] | null> {
  const params = new URLSearchParams();
  if (typeof query?.limit === "number" && Number.isFinite(query.limit) && query.limit > 0) {
    params.set("limit", String(Math.floor(query.limit)));
  }
  if (query?.search && query.search.trim()) params.set("search", query.search.trim());
  if (query?.status && query.status.trim()) params.set("status", query.status.trim());

  const path = params.toString()
    ? `overview?kind=support-tickets&${params.toString()}`
    : "overview?kind=support-tickets";
  const apiData = await callAdminApi<{ tickets: Array<Record<string, unknown>> }>(path);
  if (!apiData?.tickets) return null;
  return apiData.tickets.map(mapTicketRow);
}

export async function createSupportTicket(payload: {
  title: string;
  message: string;
  source?: string;
  priority?: string;
  status?: string;
  sessionId?: string | null;
  category?: string | null;
  assignee?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<SupportTicketEntry | null> {
  const apiData = await callAdminApi<{ ticket?: Record<string, unknown> }>("overview?kind=support-tickets", {
    method: "POST",
    body: JSON.stringify({ action: "create", ...payload })
  });
  const row = apiData?.ticket;
  if (!row) return null;
  return mapTicketRow(row);
}

export async function updateSupportTicketStatus(payload: {
  id: string;
  status: "open" | "in_progress" | "resolved";
  assignee?: string | null;
}): Promise<SupportTicketEntry | null> {
  const apiData = await callAdminApi<{ ticket?: Record<string, unknown> }>("overview?kind=support-tickets", {
    method: "POST",
    body: JSON.stringify({ action: "update-status", ...payload })
  });
  const row = apiData?.ticket;
  if (!row) return null;
  return mapTicketRow(row);
}

// ─── Activation Tickets ─────────────────────────────────────────────
export async function fetchOpenSupportTickets(): Promise<SupportTicketEntry[] | null> {
  const apiData = await callAdminApi<{ tickets: SupportTicketEntry[] }>("tickets/resolve", { method: "GET" });
  return apiData?.tickets ?? null;
}

export async function resolveActivationTicket(ticketId: string, userId: string, email: string | null, phone: string | null): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("tickets/resolve", {
    method: "POST",
    body: JSON.stringify({ action: "resolve", ticketId, userId, email, phone })
  });
  return Boolean(apiData?.ok);
}

export async function rejectActivationTicket(ticketId: string, reason?: string): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("tickets/resolve", {
    method: "POST",
    body: JSON.stringify({ action: "reject", ticketId, reason })
  });
  return Boolean(apiData?.ok);
}

// ─── Feedback ───────────────────────────────────────────────────────
export async function fetchFeedbackEntries(query?: {
  limit?: number;
  search?: string;
}): Promise<AdminFeedbackEntry[] | null> {
  const params = new URLSearchParams();
  if (typeof query?.limit === "number" && Number.isFinite(query.limit) && query.limit > 0) {
    params.set("limit", String(Math.floor(query.limit)));
  }
  if (query?.search && query.search.trim()) {
    params.set("search", query.search.trim());
  }
  const path = params.toString()
    ? `overview?kind=feedback&${params.toString()}`
    : "overview?kind=feedback";

  const apiData = await callAdminApi<{ entries: Array<Record<string, unknown>> }>(path);
  if (!apiData?.entries) return null;

  return apiData.entries.map((row) => ({
    id: String(row.id ?? row.created_at ?? row.session_id ?? `${Date.now()}`),
    sessionId: String(row.session_id ?? row.sessionId ?? "anonymous"),
    category: String(row.category ?? "general"),
    rating: typeof row.rating === "number" ? row.rating : null,
    message: String(row.message ?? ""),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
  }));
}

// ─── Owner Alerts ───────────────────────────────────────────────────
export async function fetchOwnerAlerts(query?: {
  since?: string;
  phaseTarget?: number;
}): Promise<OwnerAlertsResponse | null> {
  const params = new URLSearchParams();
  if (query?.since && query.since.trim()) params.set("since", query.since.trim());
  if (typeof query?.phaseTarget === "number" && Number.isFinite(query.phaseTarget) && query.phaseTarget > 0) {
    params.set("phaseTarget", String(Math.floor(query.phaseTarget)));
  }
  const path = params.toString()
    ? `overview?kind=owner-alerts&${params.toString()}`
    : "overview?kind=owner-alerts";
  return await callAdminApi<OwnerAlertsResponse>(path);
}
