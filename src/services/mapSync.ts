import { logger } from "../services/logger";
// mapSync.ts
import type { MapNode } from "@/modules/map/mapTypes";
import { isSupabaseReady, supabase } from "./supabaseClient";
import {
  getTrackingSessionId
} from "./journeyTracking";
import { runtimeEnv } from "@/config/runtimeEnv";
import { getFromLocalStorage, removeFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { useSyncState } from "@/state/syncState";
import { useJourneyState } from "@/state/journeyState";
import { triggerMapCompletionCheck } from "../lib/gate/handoffCore";

const SUPABASE_MAPS_TABLE = "journey_maps";
const SYNC_DEBOUNCE_MS = 1200;
const SYNC_BUFFER_KEY = "dawayir-map-sync-buffer";


interface PendingSyncBuffer {
  sessionId: string;
  nodes: MapNode[];
  updatedAt: string; // ISO
  needsSync: boolean;
  lastError?: string | null;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBuffer: PendingSyncBuffer | null = null;
let isFlushing = false;
let isInitialized = false;



function loadPendingBuffer(): PendingSyncBuffer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getFromLocalStorage(SYNC_BUFFER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
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

export function queueMapSync(nodes: MapNode[]): void {
  const sessionId = getTrackingSessionId();
  if (!sessionId) return;

  const now = new Date().toISOString();
  pendingBuffer = {
    sessionId,
    nodes,
    updatedAt: now,
    needsSync: true,
    lastError: null
  };

  // 1. Always persist locally (Local-First)
  persistPendingBuffer(pendingBuffer);
  useSyncState.getState().markLocalSaved(now);

  // 2. Only attempt cloud sync if user is authenticated
  void tryCloudSync();
}

async function tryCloudSync() {
  if (!isSupabaseReady || !supabase) return;
  if (!navigator.onLine) {
    useSyncState.getState().setOffline(true);
    return;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return;
  }
  scheduleFlush(SYNC_DEBOUNCE_MS);
}

async function flushMapSync(): Promise<void> {
  if (isFlushing || !pendingBuffer) return;

  if (!isSupabaseReady || !supabase) {
    useSyncState.getState().setError("supabase_unavailable");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Guard against mid-sync sign out

  isFlushing = true;
  useSyncState.getState().setSyncing();

  const payload: any = {
    session_id: pendingBuffer.sessionId,
    nodes: pendingBuffer.nodes,
    updated_at: pendingBuffer.updatedAt,
    user_id: user.id,
    last_sync_at: new Date().toISOString(),
    last_local_save_at: pendingBuffer.updatedAt
  };

  try {
    const { error } = await supabase.from(SUPABASE_MAPS_TABLE).upsert(payload, {
      onConflict: "session_id"
    });

    if (!error) {
      useSyncState.getState().setSynced(new Date().toISOString());
      if (pendingBuffer) {
        pendingBuffer.needsSync = false;
        persistPendingBuffer(pendingBuffer);
      }

      // Check external funnel status. If user originated from a Gate Session,
      // now is the exact moment his Map is "Persisted" Server-Side.
      const { gateSessionId, isGateConverted, setGateConverted } = useJourneyState.getState();
      if (gateSessionId && !isGateConverted) {
        setGateConverted(true);
        void triggerMapCompletionCheck(gateSessionId).then((success) => {
          if (!success) setGateConverted(false);
        });
      }
    } else {
      const errorMsg = error.message || "sync_failed";
      useSyncState.getState().setError(errorMsg);
      if (runtimeEnv.isDev) logger.error("[MapSync] Sync error:", error);
    }
  } catch (err: any) {
    // Check if it's a network/fetch error
    if (err.message?.includes("fetch") || !navigator.onLine) {
      useSyncState.getState().setOffline(true);
    } else {
      useSyncState.getState().setError(err.message || "network_error");
    }
  } finally {
    isFlushing = false;
  }
}

/**
 * Handle Auth State Changes: Trigger sync when user logs in
 */
export async function syncLocalMapOnLogin(): Promise<void> {
  if (!isSupabaseReady || !supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const buffer = loadPendingBuffer();
  if (buffer && buffer.needsSync) {
    if (runtimeEnv.isDev) console.log("[MapSync] Syncing local map to cloud after login...");
    pendingBuffer = buffer;
    void flushMapSync();
  }
}

function initializeMapSync(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // Initial Sync Check
  syncLocalMapOnLogin();

  window.addEventListener("online", () => {
    useSyncState.getState().setOffline(false);
    void tryCloudSync();
  });

  window.addEventListener("offline", () => {
    useSyncState.getState().setOffline(true);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (!navigator.onLine) {
        useSyncState.getState().setOffline(true);
      } else {
        useSyncState.getState().setOffline(false);
        void tryCloudSync();
      }
    }
  });

  // Listen for storage changes (multi-tab support)
  window.addEventListener("storage", (e) => {
    if (e.key === SYNC_BUFFER_KEY) {
      pendingBuffer = loadPendingBuffer();
      useSyncState.getState().markLocalSaved(new Date().toISOString());
    }
  });
}

if (typeof window !== "undefined") {
  initializeMapSync();
}
