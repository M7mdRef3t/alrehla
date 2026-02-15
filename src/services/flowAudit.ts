import { getAuthRole, getAuthUserId } from "../state/authState";
import { isSupabaseReady, supabase } from "./supabaseClient";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";

export interface FlowAuditLogEntry {
  id: string;
  createdAt: number;
  action: string;
  actorUserId: string | null;
  actorRole: string | null;
  targetNodeId: string | null;
  targetNodeTitle: string | null;
  payload: Record<string, unknown> | null;
  source: "local" | "remote";
}

export interface FlowAuditLogInput {
  action: string;
  targetNodeId?: string | null;
  targetNodeTitle?: string | null;
  payload?: Record<string, unknown> | null;
}

const TABLE = "admin_flow_audit_logs";
const LOCAL_AUDIT_KEY = "flow-map-audit-local";
const MAX_LOCAL_LOGS = 300;

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toLogEntry(row: Record<string, unknown>, source: "local" | "remote"): FlowAuditLogEntry {
  const createdAtRaw = row.created_at ?? row.createdAt ?? Date.now();
  const createdAt = new Date(String(createdAtRaw)).getTime();
  return {
    id: String(row.id ?? `flow-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    action: String(row.action ?? "unknown"),
    actorUserId: normalizeText(row.actor_user_id ?? row.actorUserId),
    actorRole: normalizeText(row.actor_role ?? row.actorRole),
    targetNodeId: normalizeText(row.target_node_id ?? row.targetNodeId),
    targetNodeTitle: normalizeText(row.target_node_title ?? row.targetNodeTitle),
    payload: (row.payload && typeof row.payload === "object") ? (row.payload as Record<string, unknown>) : null,
    source
  };
}

function loadLocalLogs(): FlowAuditLogEntry[] {
  try {
    const raw = getFromLocalStorage(LOCAL_AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => toLogEntry(item as Record<string, unknown>, "local"))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function saveLocalLogs(logs: FlowAuditLogEntry[]) {
  try {
    setInLocalStorage(LOCAL_AUDIT_KEY, JSON.stringify(logs.slice(0, MAX_LOCAL_LOGS)));
  } catch {
    // ignore persistence errors
  }
}

function appendLocalLog(entry: FlowAuditLogEntry): FlowAuditLogEntry {
  const logs = loadLocalLogs();
  const next = [entry, ...logs.filter((item) => item.id !== entry.id)].slice(0, MAX_LOCAL_LOGS);
  saveLocalLogs(next);
  return entry;
}

export async function fetchFlowAuditLogs(limit = 80): Promise<FlowAuditLogEntry[]> {
  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(300, limit)));
    if (!error && data) {
      return data
        .map((row) => toLogEntry(row as Record<string, unknown>, "remote"))
        .sort((a, b) => b.createdAt - a.createdAt);
    }
  }
  return loadLocalLogs().slice(0, limit);
}

export async function saveFlowAuditLog(input: FlowAuditLogInput): Promise<FlowAuditLogEntry> {
  const now = Date.now();
  const actorRole = normalizeText(getAuthRole());
  const actorUserId = normalizeText(getAuthUserId());
  const baseEntry: FlowAuditLogEntry = {
    id: `flow-audit-${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    action: input.action,
    actorUserId,
    actorRole,
    targetNodeId: normalizeText(input.targetNodeId),
    targetNodeTitle: normalizeText(input.targetNodeTitle),
    payload: input.payload ?? null,
    source: "local"
  };

  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        id: baseEntry.id,
        created_at: new Date(baseEntry.createdAt).toISOString(),
        action: baseEntry.action,
        actor_user_id: baseEntry.actorUserId,
        actor_role: baseEntry.actorRole,
        target_node_id: baseEntry.targetNodeId,
        target_node_title: baseEntry.targetNodeTitle,
        payload: baseEntry.payload ?? {}
      })
      .select("*")
      .single();
    if (!error && data) {
      return toLogEntry(data as Record<string, unknown>, "remote");
    }
  }

  return appendLocalLog(baseEntry);
}

export function subscribeFlowAuditLogs(onInsert: (entry: FlowAuditLogEntry) => void): () => void {
  if (!isSupabaseReady || !supabase) return () => {};
  try {
    const client = supabase;
    const channel = client
      .channel("admin_flow_audit_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLE
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          onInsert(toLogEntry(row, "remote"));
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}
