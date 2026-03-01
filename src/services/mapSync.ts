import type { MapNode } from "../modules/map/mapTypes";
import { isSupabaseReady, supabase } from "./supabaseClient";
import {
  ensureIdentifiedTrackingSession,
  getTrackingMode,
  getTrackingSessionId
} from "./journeyTracking";
import { runtimeEnv } from "../config/runtimeEnv";
import { getFromLocalStorage, removeFromLocalStorage, setInLocalStorage } from "./browserStorage";

const SUPABASE_MAPS_TABLE = "journey_maps";
const SYNC_DEBOUNCE_MS = 1200;
const SYNC_MAX_ATTEMPTS = 4; // initial attempt + 3 retries
const RETRY_BASE_DELAY_MS = 1200;
const SYNC_BUFFER_KEY = "dawayir-map-sync-buffer";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBuffer: PendingSyncBuffer | null = null;
let isFlushing = false;
let isInitialized = false;
let successResetTimer: ReturnType<typeof setTimeout> | null = null;

export type MapSyncStatus = "idle" | "queued" | "retrying" | "succeeded" | "failed";

export interface MapSyncSnapshot {
  status: MapSyncStatus;
  retryCount: number;
  nextRetryInMs: number | null;
  lastError: string | null;
  updatedAt: number;
}

interface PendingSyncBuffer {
  sessionId: string;
  nodes: MapNode[];
  updatedAt: string;
  attempt: number;
  needsSync: true;
  lastError?: string | null;
}

let currentSnapshot: MapSyncSnapshot = {
  status: "idle",
  retryCount: 0,
  nextRetryInMs: null,
  lastError: null,
  updatedAt: Date.now()
};

const listeners = new Set<(snapshot: MapSyncSnapshot) => void>();

function notifySnapshot(): void {
  listeners.forEach((listener) => listener(currentSnapshot));
}

function setSnapshot(
  patch: Partial<MapSyncSnapshot> & Pick<MapSyncSnapshot, "status">
): void {
  currentSnapshot = {
    ...currentSnapshot,
    ...patch,
    updatedAt: Date.now()
  };
  notifySnapshot();
}

export function getMapSyncSnapshot(): MapSyncSnapshot {
  return currentSnapshot;
}

export function subscribeMapSyncStatus(
  listener: (snapshot: MapSyncSnapshot) => void
): () => void {
  listeners.add(listener);
  listener(currentSnapshot);
  return () => {
    listeners.delete(listener);
  };
}

function loadPendingBuffer(): PendingSyncBuffer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getFromLocalStorage(SYNC_BUFFER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSyncBuffer;
    if (
      !parsed ||
      typeof parsed.sessionId !== "string" ||
      !Array.isArray(parsed.nodes) ||
      parsed.needsSync !== true
    ) {
      return null;
    }
    return {
      ...parsed,
      attempt: Number.isFinite(parsed.attempt) ? Number(parsed.attempt) : 0
    };
  } catch {
    return null;
  }
}

function persistPendingBuffer(buffer: PendingSyncBuffer | null): void {
  if (typeof window === "undefined") return;
  if (!buffer) {
    removeFromLocalStorage(SYNC_BUFFER_KEY);
    return;
  }
  setInLocalStorage(SYNC_BUFFER_KEY, JSON.stringify(buffer));
}

function scheduleFlush(delayMs: number): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void flushMapSync();
  }, Math.max(0, delayMs));
}

function resetToIdleLater(): void {
  if (successResetTimer) clearTimeout(successResetTimer);
  successResetTimer = setTimeout(() => {
    setSnapshot({
      status: "idle",
      retryCount: 0,
      nextRetryInMs: null,
      lastError: null
    });
  }, 1200);
}

function getRetryDelayMs(attempt: number): number {
  return RETRY_BASE_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1));
}

function ensureSessionIdForSync(): string | null {
  // In user mode we force identified silently.
  const forcedSessionId = ensureIdentifiedTrackingSession();
  if (forcedSessionId) return forcedSessionId;
  if (getTrackingMode() !== "identified") return null;
  return getTrackingSessionId();
}

export function queueMapSync(nodes: MapNode[]): void {
  const sessionId = ensureSessionIdForSync();
  if (!sessionId) return;

  pendingBuffer = {
    sessionId,
    nodes,
    updatedAt: new Date().toISOString(),
    attempt: 0,
    needsSync: true,
    lastError: null
  };
  persistPendingBuffer(pendingBuffer);

  setSnapshot({
    status: "queued",
    retryCount: 0,
    nextRetryInMs: null,
    lastError: null
  });
  scheduleFlush(SYNC_DEBOUNCE_MS);
}

async function flushMapSync(): Promise<void> {
  if (isFlushing) return;
  if (!pendingBuffer) pendingBuffer = loadPendingBuffer();
  if (!pendingBuffer) return;

  const sessionId = ensureSessionIdForSync();
  if (!sessionId) {
    setSnapshot({
      status: "failed",
      retryCount: pendingBuffer.attempt,
      nextRetryInMs: null,
      lastError: "missing_session_id"
    });
    return;
  }

  pendingBuffer = { ...pendingBuffer, sessionId };
  persistPendingBuffer(pendingBuffer);

  if (!isSupabaseReady || !supabase) {
    setSnapshot({
      status: "failed",
      retryCount: pendingBuffer.attempt,
      nextRetryInMs: null,
      lastError: "supabase_unavailable"
    });
    return;
  }

  isFlushing = true;
  const attemptNumber = pendingBuffer.attempt + 1;
  const { data: { user } } = await supabase.auth.getUser();

  const payload: any = {
    session_id: pendingBuffer.sessionId,
    nodes: pendingBuffer.nodes,
    updated_at: pendingBuffer.updatedAt
  };

  if (user?.id) {
    payload.user_id = user.id;
  }

  const { error } = await supabase.from(SUPABASE_MAPS_TABLE).upsert(payload, {
    onConflict: "session_id"
  });

  if (!error) {
    pendingBuffer = null;
    persistPendingBuffer(null);
    setSnapshot({
      status: "succeeded",
      retryCount: Math.max(0, attemptNumber - 1),
      nextRetryInMs: null,
      lastError: null
    });
    resetToIdleLater();
    isFlushing = false;
    return;
  }

  const lastError = String(error.message ?? "map_sync_failed");
  if (attemptNumber < SYNC_MAX_ATTEMPTS) {
    const retryDelayMs = getRetryDelayMs(attemptNumber);
    pendingBuffer = {
      ...pendingBuffer,
      attempt: attemptNumber,
      lastError
    };
    persistPendingBuffer(pendingBuffer);
    setSnapshot({
      status: "retrying",
      retryCount: attemptNumber,
      nextRetryInMs: retryDelayMs,
      lastError
    });
    scheduleFlush(retryDelayMs);
  } else {
    pendingBuffer = {
      ...pendingBuffer,
      attempt: attemptNumber,
      lastError
    };
    persistPendingBuffer(pendingBuffer);
    setSnapshot({
      status: "failed",
      retryCount: attemptNumber,
      nextRetryInMs: null,
      lastError
    });
    if (runtimeEnv.isDev) {
      console.warn("mapSync: max retries reached", error);
    }
  }

  isFlushing = false;
}

function initializeMapSync(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  pendingBuffer = loadPendingBuffer();
  if (pendingBuffer) {
    if (pendingBuffer.attempt >= SYNC_MAX_ATTEMPTS) {
      pendingBuffer = { ...pendingBuffer, attempt: 0 };
      persistPendingBuffer(pendingBuffer);
    }
    setSnapshot({
      status: "queued",
      retryCount: pendingBuffer.attempt,
      nextRetryInMs: null,
      lastError: pendingBuffer.lastError ?? null
    });
    scheduleFlush(400);
  }

  window.addEventListener("online", () => {
    pendingBuffer = loadPendingBuffer();
    if (!pendingBuffer) return;
    if (pendingBuffer.attempt >= SYNC_MAX_ATTEMPTS) {
      pendingBuffer = { ...pendingBuffer, attempt: 0 };
      persistPendingBuffer(pendingBuffer);
    }
    setSnapshot({
      status: "retrying",
      retryCount: pendingBuffer.attempt,
      nextRetryInMs: 300,
      lastError: pendingBuffer.lastError ?? null
    });
    scheduleFlush(300);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    pendingBuffer = loadPendingBuffer();
    if (!pendingBuffer) return;
    if (pendingBuffer.attempt >= SYNC_MAX_ATTEMPTS) {
      pendingBuffer = { ...pendingBuffer, attempt: 0 };
      persistPendingBuffer(pendingBuffer);
    }
    scheduleFlush(300);
  });
}

if (typeof window !== "undefined") {
  initializeMapSync();
}
