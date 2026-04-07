import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/services/supabaseClient";

type AwarenessActionType = "CIRCLE_SHIFT" | "MAJOR_DETACHMENT" | "INTENT_SEMANTIC";

interface PhoenixSyncState {
  sourceScore: number;
  optimisticDelta: number;
  pendingOps: number;
  isSyncing: boolean;
  lastSyncedAt: number | null;
}

function estimateDelta(actionType: AwarenessActionType): number {
  if (actionType === "MAJOR_DETACHMENT") return 0.02;
  if (actionType === "CIRCLE_SHIFT") return 0.01;
  return 0.005;
}

export function useOptimisticPhoenixSync(userId?: string | null) {
  const [state, setState] = useState<PhoenixSyncState>({
    sourceScore: 0,
    optimisticDelta: 0,
    pendingOps: 0,
    isSyncing: false,
    lastSyncedAt: null
  });

  const pendingRef = useRef(0);

  const refreshFromSourceTruth = useCallback(async () => {
    if (!supabase || !userId) return;

    setState((prev) => ({ ...prev, isSyncing: true }));
    const { data, error } = await supabase
      .from("pioneer_report_card")
      .select("phoenix_score")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      setState((prev) => ({ ...prev, isSyncing: false }));
      return;
    }

    const nextScore = Number(data?.phoenix_score ?? 0);
    pendingRef.current = 0;
    setState((prev) => ({
      ...prev,
      sourceScore: Number.isFinite(nextScore) ? nextScore : prev.sourceScore,
      optimisticDelta: 0,
      pendingOps: 0,
      isSyncing: false,
      lastSyncedAt: Date.now()
    }));
  }, [userId]);

  const applyOptimistic = useCallback((actionType: AwarenessActionType) => {
    const delta = estimateDelta(actionType);
    pendingRef.current += 1;
    setState((prev) => ({
      ...prev,
      optimisticDelta: prev.optimisticDelta + delta,
      pendingOps: prev.pendingOps + 1
    }));
  }, []);

  useEffect(() => {
    void refreshFromSourceTruth();
  }, [refreshFromSourceTruth]);

  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    const client = supabase;
    const channel = client
      .channel(`phoenix-sync:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "awareness_events_queue",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (cancelled) return;
          const status = String((payload as { new?: { status?: string } })?.new?.status ?? "").toLowerCase();
          if (status === "completed" || status === "failed" || status === "dlq") {
            void refreshFromSourceTruth();
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [refreshFromSourceTruth, userId]);

  useEffect(() => {
    if (pendingRef.current <= 0) return;
    const timer = setInterval(() => {
      void refreshFromSourceTruth();
    }, 8000);
    return () => clearInterval(timer);
  }, [state.pendingOps, refreshFromSourceTruth]);

  const displayScore = useMemo(() => {
    const score = state.sourceScore + state.optimisticDelta;
    return Math.max(0, Math.min(1.5, score));
  }, [state.optimisticDelta, state.sourceScore]);

  return {
    sourceScore: state.sourceScore,
    displayScore,
    pendingOps: state.pendingOps,
    isSyncing: state.isSyncing,
    lastSyncedAt: state.lastSyncedAt,
    applyOptimistic,
    refreshFromSourceTruth
  };
}
