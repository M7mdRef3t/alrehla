import { logger } from "@/services/logger";
// mapSync.ts
import type { MapNode } from "@/modules/map/mapTypes";
import { isSupabaseReady, safeGetUser, supabase } from "./supabaseClient";
import {
  getTrackingSessionId
} from "./journeyTracking";
import { runtimeEnv } from "@/config/runtimeEnv";
import { getFromLocalStorage, removeFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { useSyncState } from "@/domains/journey/store/sync.store";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { triggerMapCompletionCheck } from "../lib/gate/handoffCore";
import type { StoredState } from "./localStore";
import type { MapType, FeelingCheckResult } from "@/modules/map/mapTypes";
import type { TransformationDiagnosis } from "@/modules/transformationEngine/interpretationEngine";

const SUPABASE_MAPS_TABLE = "journey_maps";
const SYNC_DEBOUNCE_MS = 1200;
const SYNC_BUFFER_KEY = "dawayir-map-sync-buffer";


interface PendingSyncBuffer {
  sessionId: string;
  nodes: MapNode[];
  mapType?: MapType;
  feelingResults?: FeelingCheckResult | null;
  transformationDiagnosis?: TransformationDiagnosis | null;
  aiInterpretation?: string | null;
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

export function queueMapSync(state: StoredState): void {
  const sessionId = getTrackingSessionId();
  if (!sessionId) return;

  const now = new Date().toISOString();
  pendingBuffer = {
    sessionId,
    nodes: state.nodes,
    mapType: state.mapType,
    feelingResults: state.feelingResults,
    transformationDiagnosis: state.transformationDiagnosis,
    aiInterpretation: state.aiInterpretation,
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
  if (!navigator.onLine) {
    useSyncState.getState().setOffline(true);
    return;
  }
  scheduleFlush(SYNC_DEBOUNCE_MS);
}

async function flushMapSync(): Promise<void> {
  if (isFlushing || !pendingBuffer) return;

  const user = await safeGetUser();

  isFlushing = true;
  useSyncState.getState().setSyncing();

  // Pick up any locally stored phone (if user provided it during session checkout earlier)
  const clientPhone = getFromLocalStorage("dawayir-client-phone") || undefined;

  const payload: any = {
    session_id: pendingBuffer.sessionId,
    nodes: pendingBuffer.nodes,
    map_type: pendingBuffer.mapType || "dawayir",
    feeling_results: pendingBuffer.feelingResults,
    transformation_diagnosis: pendingBuffer.transformationDiagnosis,
    ai_interpretation: pendingBuffer.aiInterpretation,
    updated_at: pendingBuffer.updatedAt,
    user_id: user ? user.id : undefined,
    client_phone: clientPhone,
    origin_product: "alrehla",
    last_sync_at: new Date().toISOString(),
    last_local_save_at: pendingBuffer.updatedAt
  };

  try {
    let error;
    
    if (user && isSupabaseReady && supabase) {
      const res = await supabase.from(SUPABASE_MAPS_TABLE).upsert(payload, {
        onConflict: "session_id"
      });
      error = res.error;
    } else {
      // Anonymous Sync via Gateway
      const res = await fetch("/api/sync/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        error = new Error(errData.error || `HTTP ${res.status}`);
      }
    }

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
  const user = await safeGetUser();
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

/**
 * Fetch ALL Maps from the cloud and merge nodes.
 * Deduplicates by label (person name), keeping the richest version.
 * Ensures no person added in any previous session is ever lost.
 */
export async function fetchCloudMap(): Promise<StoredState | null> {
  if (!isSupabaseReady || !supabase) return null;
  const user = await safeGetUser();
  if (!user) return null;

  try {
    // 1. Fetch ALL sessions (latest first for metadata priority)
    const { data: rows, error } = await supabase
      .from(SUPABASE_MAPS_TABLE)
      .select("nodes, map_type, feeling_results, transformation_diagnosis, ai_interpretation, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error || !rows || rows.length === 0) return null;

    // 2. Use latest session's metadata (map_type, feelings, diagnosis, etc.)
    const latest = rows[0];

    // 3. Merge all nodes across all sessions, dedup by label
    const nodesByLabel = new Map<string, any>();
    // Traverse newest → oldest so the latest version wins ties
    for (const row of rows) {
      if (!Array.isArray(row.nodes)) continue;
      for (const node of row.nodes) {
        if (!node || !node.label) continue;
        const label = String(node.label).trim();
        if (!label) continue;
        // Skip test/junk labels
        if (/^[0-9]+$/.test(label) || label.length <= 1) continue;
        
        const existing = nodesByLabel.get(label);
        if (!existing) {
          nodesByLabel.set(label, node);
        } else {
          // Keep the version with more data (more JSON keys = richer)
          const existingKeys = Object.keys(existing).length;
          const candidateKeys = Object.keys(node).length;
          if (candidateKeys > existingKeys) {
            nodesByLabel.set(label, node);
          }
        }
      }
    }

    // 4. Re-assign clean sequential IDs to avoid collisions
    const mergedNodes = Array.from(nodesByLabel.values()).map((node, idx) => ({
      ...node,
      id: String(idx + 1)
    }));

    if (runtimeEnv.isDev) {
      console.log(`[MapSync] Cloud merge: ${rows.length} sessions → ${mergedNodes.length} unique people`);
    }

    return {
      nodes: mergedNodes,
      mapType: latest.map_type,
      feelingResults: latest.feeling_results,
      transformationDiagnosis: latest.transformation_diagnosis,
      aiInterpretation: latest.ai_interpretation
    };
  } catch (err) {
    if (runtimeEnv.isDev) logger.error("[MapSync] Error fetching cloud map:", err);
    return null;
  }
}

if (typeof window !== "undefined") {
  initializeMapSync();
}
