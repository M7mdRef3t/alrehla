/**
 * Domain: Dawayir — useGraphSync hook
 *
 * مهاجر من src/hooks/useGraphSync.ts
 * يستمع لـ DawayirSignals ويزامن الـ Consciousness Graph تلقائياً.
 */

"use client";
import { useEffect } from "react";
import { subscribeToDawayirSignals } from "@/modules/recommendation/recommendationBus";
import { useMapState } from '@/modules/map/store/map.store';
import { relationalAnalysisService } from "../services/relational.service";
import { runtimeEnv } from "@/config/runtimeEnv";

const SYNC_SIGNAL_TYPES = new Set([
  "node_added",
  "ring_changed",
  "detachment_toggled",
  "symptoms_updated",
]);

export function useDawayirGraphSync() {
  const nodes = useMapState((s) => s.nodes);

  useEffect(() => {
    // Skip in dev mode — no need to spam the vector DB
    if (runtimeEnv.isDev) return;

    const unsubscribe = subscribeToDawayirSignals(async (event) => {
      if (!SYNC_SIGNAL_TYPES.has(event.type)) return;

      try {
        const { supabase } = await import("@/infrastructure/database");
        if (!supabase) return;

        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) return;

        await relationalAnalysisService.projectToGraph(userId, nodes);
      } catch (err) {
        console.warn("[GraphSync] Failed to sync:", err);
      }
    });

    return () => unsubscribe();
  }, [nodes]);
}
