import { create } from "zustand";
import { supabase, isSupabaseReady } from "../services/supabaseClient";

type AppContentSource = "remote" | "fallback";

export interface AppContentEntry {
  key: string;
  content: string;
  page: string | null;
  updatedAt: string | null;
  source: AppContentSource;
}

interface AppContentState {
  byKey: Record<string, AppContentEntry>;
  status: Record<string, "idle" | "loading" | "ready" | "error">;
  errors: Record<string, string | null>;
  ensure: (key: string, fallback: string, options?: { page?: string }) => Promise<AppContentEntry>;
  upsert: (key: string, content: string, options?: { page?: string }) => Promise<boolean>;
}

const TABLE = "app_content";
type PendingRequest = { fallback: string; page: string | null };

// Avoid N requests for N texts by batching lookups within the same tick.
const inflight = new Map<string, Promise<AppContentEntry>>();
const inflightResolvers = new Map<string, (entry: AppContentEntry) => void>();
const pendingBatch = new Map<string, PendingRequest>();
let flushScheduled = false;

function normalizeKey(raw: string): string {
  return String(raw ?? "").trim();
}

function buildFallbackEntry(key: string, request: PendingRequest): AppContentEntry {
  return {
    key,
    content: request.fallback,
    page: request.page,
    updatedAt: null,
    source: "fallback"
  };
}

function createDeferred(key: string): Promise<AppContentEntry> {
  const existing = inflight.get(key);
  if (existing) return existing;

  let resolve!: (entry: AppContentEntry) => void;
  const promise = new Promise<AppContentEntry>((res) => {
    resolve = res;
  });
  inflight.set(key, promise);
  inflightResolvers.set(key, resolve);
  return promise;
}

function settleDeferred(key: string, entry: AppContentEntry): void {
  const resolve = inflightResolvers.get(key);
  if (resolve) resolve(entry);
  inflightResolvers.delete(key);
  inflight.delete(key);
}

export const useAppContentState = create<AppContentState>((set, get) => ({
  byKey: {},
  status: {},
  errors: {},
  ensure: async (rawKey, fallback, options) => {
    const key = normalizeKey(rawKey);
    if (!key) {
      return {
        key: "",
        content: fallback,
        page: options?.page ?? null,
        updatedAt: null,
        source: "fallback"
      };
    }

    const cached = get().byKey[key];
    if (cached) return cached;

    const pending = inflight.get(key);
    if (pending) return pending;

    // SSR / non-browser env: never hang on a deferred batch.
    if (typeof window === "undefined") {
      const entry: AppContentEntry = buildFallbackEntry(key, { fallback, page: options?.page ?? null });
      set((state) => ({
        byKey: { ...state.byKey, [key]: entry },
        status: { ...state.status, [key]: "ready" }
      }));
      return entry;
    }

    const task = createDeferred(key);
    pendingBatch.set(key, { fallback, page: options?.page ?? null });

    set((state) => ({
      status: { ...state.status, [key]: "loading" },
      errors: { ...state.errors, [key]: null }
    }));

    scheduleContentFlush();
    return task;
  },
  upsert: async (rawKey, content, options) => {
    const key = normalizeKey(rawKey);
    if (!key) return false;

    if (!isSupabaseReady || !supabase) {
      set((state) => ({
        status: { ...state.status, [key]: "error" },
        errors: { ...state.errors, [key]: "Supabase غير متاح حالياً." }
      }));
      return false;
    }

    set((state) => ({
      status: { ...state.status, [key]: "loading" },
      errors: { ...state.errors, [key]: null }
    }));

    try {
      const payload = {
        key,
        content: String(content ?? ""),
        page: options?.page ?? null
      };
      const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: "key" });
      if (error) {
        set((state) => ({
          status: { ...state.status, [key]: "error" },
          errors: { ...state.errors, [key]: error.message || "فشل حفظ النص." }
        }));
        return false;
      }

      set((state) => ({
        byKey: {
          ...state.byKey,
          [key]: {
            key,
            content: payload.content,
            page: payload.page,
            updatedAt: new Date().toISOString(),
            source: "remote"
          }
        },
        status: { ...state.status, [key]: "ready" }
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل حفظ النص.";
      set((state) => ({
        status: { ...state.status, [key]: "error" },
        errors: { ...state.errors, [key]: message }
      }));
      return false;
    }
  }
}));

async function flushPendingBatch(): Promise<void> {
  const batch = Array.from(pendingBatch.entries());
  if (batch.length === 0) return;
  pendingBatch.clear();

  const keys = batch.map(([key]) => key);
  const requestByKey = new Map(batch);

  let fetchError: string | null = null;
  const remoteByKey = new Map<string, { content: string; page: string | null; updatedAt: string | null }>();

  if (isSupabaseReady && supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("key,content,page,updated_at")
      .in("key", keys);

    if (error) {
      fetchError = error.message || "تعذر تحميل النص.";
    } else if (data) {
      for (const row of data as Array<Record<string, unknown>>) {
        const rowKey = normalizeKey(String(row.key ?? ""));
        if (!rowKey) continue;
        const content = typeof row.content === "string" ? row.content : String(row.content ?? "");
        const page = typeof row.page === "string" ? row.page : null;
        const updatedAt = typeof row.updated_at === "string" ? row.updated_at : null;
        remoteByKey.set(rowKey, { content, page, updatedAt });
      }
    }
  }

  const byKeyUpdate: Record<string, AppContentEntry> = {};
  const statusUpdate: Record<string, "ready" | "error"> = {};
  const errorUpdate: Record<string, string | null> = {};

  for (const key of keys) {
    const existing = useAppContentState.getState().byKey[key];
    if (existing?.source === "remote") {
      settleDeferred(key, existing);
      continue;
    }

    const remote = remoteByKey.get(key);
    const request = requestByKey.get(key) ?? { fallback: "", page: null };

    const entry: AppContentEntry = remote
      ? {
          key,
          content: remote.content,
          page: remote.page,
          updatedAt: remote.updatedAt,
          source: "remote"
        }
      : buildFallbackEntry(key, request);

    byKeyUpdate[key] = entry;
    statusUpdate[key] = fetchError ? "error" : "ready";
    errorUpdate[key] = fetchError ? fetchError : null;
    settleDeferred(key, entry);
  }

  useAppContentState.setState((state) => ({
    byKey: { ...state.byKey, ...byKeyUpdate },
    status: { ...state.status, ...statusUpdate },
    errors: { ...state.errors, ...errorUpdate }
  }));

  // If new keys were queued while we were fetching, flush again.
  if (pendingBatch.size > 0) scheduleContentFlush();
}

function scheduleContentFlush(): void {
  if (typeof window === "undefined") return;
  if (flushScheduled) return;
  flushScheduled = true;
  window.setTimeout(() => {
    flushScheduled = false;
    void flushPendingBatch();
  }, 0);
}

let realtimeStopper: (() => void) | null = null;

/**
 * Optional: keeps open sessions in sync when `app_content` changes.
 * Requires enabling Realtime on the `app_content` table in Supabase.
 */
export function initAppContentRealtime(): () => void {
  if (realtimeStopper) return realtimeStopper;
  if (!isSupabaseReady || !supabase || typeof window === "undefined") {
    realtimeStopper = () => {};
    return realtimeStopper;
  }

  try {
    const client = supabase;
    const channel = client
      .channel("app_content_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        (payload) => {
          const row = (payload as { new?: Record<string, unknown> }).new ?? null;
          if (!row) return;
          const key = normalizeKey(String(row.key ?? ""));
          if (!key) return;

          const content = typeof row.content === "string" ? row.content : String(row.content ?? "");
          const page = typeof row.page === "string" ? row.page : null;
          const updatedAt = typeof row.updated_at === "string" ? row.updated_at : null;

          useAppContentState.setState((state) => ({
            byKey: {
              ...state.byKey,
              [key]: { key, content, page, updatedAt, source: "remote" }
            },
            status: { ...state.status, [key]: "ready" }
          }));
        }
      )
      .subscribe();

    realtimeStopper = () => {
      try {
        void client.removeChannel(channel);
      } catch {
        // ignore
      }
    };
    return realtimeStopper;
  } catch {
    realtimeStopper = () => {};
    return realtimeStopper;
  }
}
