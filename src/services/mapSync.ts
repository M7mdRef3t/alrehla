import type { MapNode } from "../modules/map/mapTypes";
import { isSupabaseReady, supabase } from "./supabaseClient";
import { getTrackingMode, getTrackingSessionId } from "./journeyTracking";

const SUPABASE_MAPS_TABLE = "journey_maps";
const SYNC_DEBOUNCE_MS = 1200;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingNodes: MapNode[] | null = null;

export function queueMapSync(nodes: MapNode[]): void {
  if (!isSupabaseReady || !supabase) return;
  if (getTrackingMode() !== "identified") return;
  pendingNodes = nodes;

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void flushMapSync();
  }, SYNC_DEBOUNCE_MS);
}

async function flushMapSync(): Promise<void> {
  if (!isSupabaseReady || !supabase) return;
  const sessionId = getTrackingSessionId();
  if (!sessionId || !pendingNodes) return;

  const payload = {
    session_id: sessionId,
    nodes: pendingNodes,
    updated_at: new Date().toISOString()
  };
  pendingNodes = null;

  const { error } = await supabase.from(SUPABASE_MAPS_TABLE).upsert(payload, {
    onConflict: "session_id"
  });

  if (error && import.meta.env.DEV) {
    console.warn("mapSync: supabase upsert failed", error);
  }
}
