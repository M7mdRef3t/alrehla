/**
 * adminUsers.ts — User management, state export/import, journey maps, sessions.
 */

import { supabase, isSupabaseReady } from "../supabaseClient";
import { callAdminApi } from "./adminCore";
import type {
  AdminUserRow,
  UserStateRow,
  UserStateExport,
  JourneyMapSnapshot,
  SessionEventRow,
  VisitorSessionSummary,
  AIInterpretation,
  TransformationDiagnosis,
  MapNode,
} from "./adminTypes";

// ─── Users ──────────────────────────────────────────────────────────
export async function fetchUsers(limit = 100): Promise<AdminUserRow[] | null> {
  if (!isSupabaseReady || !supabase) return [];
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 100;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    fullName: String(row.full_name ?? row.email ?? "Unknown"),
    email: String(row.email ?? ""),
    role: String(row.role ?? "user"),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
  }));
}

export async function updateUserRole(id: string, role: string): Promise<boolean> {
  const apiRes = await callAdminApi<{ ok: boolean }>("roles", {
    method: "POST",
    body: JSON.stringify({ id, role })
  });
  return Boolean(apiRes?.ok);
}

// ─── User State ─────────────────────────────────────────────────────
export async function fetchUserStates(limit = 50): Promise<UserStateRow[] | null> {
  const apiData = await callAdminApi<{ rows: Array<{ device_token: string; owner_id?: string | null; updated_at?: string }> }>(
    `user-state?limit=${limit}`
  );
  if (apiData?.rows) {
    return apiData.rows.map((row) => ({
      deviceToken: row.device_token,
      ownerId: row.owner_id ?? null,
      updatedAt: row.updated_at ? new Date(String(row.updated_at)).getTime() : null
    }));
  }
  return null;
}

export async function fetchUserStateDetail(params: { deviceToken?: string; ownerId?: string }): Promise<UserStateRow | null> {
  const query = params.deviceToken
    ? `user-state?deviceToken=${encodeURIComponent(params.deviceToken)}`
    : params.ownerId
      ? `user-state?ownerId=${encodeURIComponent(params.ownerId)}`
      : null;
  if (!query) return null;
  const apiData = await callAdminApi<{ deviceToken: string; ownerId?: string | null; updatedAt?: string; data?: Record<string, string> }>(query);
  if (!apiData) return null;
  return {
    deviceToken: apiData.deviceToken,
    ownerId: apiData.ownerId ?? null,
    updatedAt: apiData.updatedAt ? new Date(String(apiData.updatedAt)).getTime() : null,
    data: apiData.data ?? {}
  };
}

export async function exportUserStates(limit = 200): Promise<UserStateExport | null> {
  const apiData = await callAdminApi<UserStateExport>(`user-state-export?limit=${limit}`);
  return apiData ?? null;
}

export async function importUserStates(rows: UserStateExport["rows"]): Promise<boolean> {
  const apiRes = await callAdminApi<{ ok: boolean; count?: number }>("user-state-import", {
    method: "POST",
    body: JSON.stringify({ rows })
  });
  return Boolean(apiRes?.ok);
}

// ─── Journey Maps ───────────────────────────────────────────────────
export async function fetchJourneyMap(sessionId: string): Promise<JourneyMapSnapshot | null> {
  const apiData = await callAdminApi<{ sessionId: string; nodes: MapNode[]; updatedAt?: string; aiInterpretation?: string | null; transformationDiagnosis?: any | null }>(
    `journey-map?sessionId=${encodeURIComponent(sessionId)}`
  );
  if (apiData) {
    return {
      sessionId: apiData.sessionId ?? sessionId,
      nodes: apiData.nodes ?? [],
      updatedAt: apiData.updatedAt ? new Date(String(apiData.updatedAt)).getTime() : null,
      aiInterpretation: apiData.aiInterpretation as any,
      transformationDiagnosis: apiData.transformationDiagnosis
    };
  }
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from("journey_maps")
    .select("session_id,nodes,updated_at,ai_interpretation,transformation_diagnosis")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    sessionId: String(data.session_id ?? sessionId),
    nodes: (data.nodes as MapNode[]) ?? [],
    updatedAt: data.updated_at ? new Date(String(data.updated_at)).getTime() : null,
    aiInterpretation: (typeof data.ai_interpretation === 'string' ? JSON.parse(data.ai_interpretation) : data.ai_interpretation) as unknown as AIInterpretation,
    transformationDiagnosis: (typeof data.transformation_diagnosis === 'string' ? JSON.parse(data.transformation_diagnosis) : data.transformation_diagnosis) as unknown as TransformationDiagnosis
  };
}

// ─── Session Events ─────────────────────────────────────────────────
export async function fetchSessionEvents(
  sessionId: string,
  limit = 200
): Promise<SessionEventRow[] | null> {
  const sid = sessionId.trim();
  if (!sid) return null;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 200;
  
  const apiData = await callAdminApi<{ events: SessionEventRow[] }>(
    `session-events?sessionId=${encodeURIComponent(sid)}&limit=${safeLimit}`
  );
  
  if (apiData?.events) {
    return apiData.events;
  }
  
  return null;
}

// ─── Visitor Sessions ───────────────────────────────────────────────
export async function fetchVisitorSessions(limit = 300): Promise<VisitorSessionSummary[] | null> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 300;
  const apiData = await callAdminApi<VisitorSessionSummary[]>(`overview?kind=visitor-sessions&limit=${safeLimit}`);
  return apiData ?? null;
}
