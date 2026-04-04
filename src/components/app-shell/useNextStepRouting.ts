import { useCallback, useEffect, useRef, useState } from "react";
import type { AdviceCategory } from "../../data/adviceScripts";
import type { FeatureFlagKey } from "../../config/features";
import { getTrackingSessionId, recordFlowEvent } from "../../services/journeyTracking";
import { useIdleAwareTelemetry, type IdleAwareTelemetrySnapshot } from "../../hooks/useIdleAwareTelemetry";
import { requestIdleCallback, cancelIdleCallback } from "../../utils/performanceOptimizations";
import {
  computeNextStepDecision,
  reportDecisionOutcome,
  subscribeToDawayirSignals,
  type NextStepDecisionV1,
  type RecentTelemetrySignalV1
} from "../../modules/recommendation";
import type { AppScreen } from "../../navigation/navigationMachine";
import { useMapState } from "../../state/mapState";


export interface ActiveInterventionState {
  decisionId: string;
  hesitationSec: number;
  cognitiveLoadRequired: number;
}

interface UseNextStepRoutingParams {
  screen: AppScreen;
  goalId: string;
  category: AdviceCategory;
  availableFeatures: Record<FeatureFlagKey, boolean>;
  selectedNodeId: string | null;
  navigateToScreen: (screen: AppScreen) => boolean;
  openJourneyTools: () => void;
  openMissionScreen: (nodeId: string) => void;
  openFeedback: () => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setShowBreathing: (show: boolean) => void;
}

function inferCognitiveLoadFromDecision(decision: NextStepDecisionV1): number {
  const payload = decision.action.actionPayload ?? {};
  const fromPayload = Number((payload as Record<string, unknown>).cognitiveLoadRequired);
  if (Number.isFinite(fromPayload)) return Math.max(1, Math.min(5, Math.round(fromPayload)));
  if (decision.action.actionType === "open_mission") return 4;
  if (decision.action.actionType === "journal_reflection") return 3;
  if (decision.action.actionType === "open_breathing") return 1;
  return 3;
}

export function useNextStepRouting({
  screen,
  goalId,
  category,
  availableFeatures,
  selectedNodeId,
  navigateToScreen,
  openJourneyTools,
  openMissionScreen,
  openFeedback,
  setSelectedNodeId,
  setShowBreathing
}: UseNextStepRoutingParams) {
  const [activeIntervention, setActiveIntervention] = useState<ActiveInterventionState | null>(null);
  const [nextStepDecision, setNextStepDecision] = useState<NextStepDecisionV1 | null>(null);
  const [nextStepRefreshTick, setNextStepRefreshTick] = useState(0);
  const nextStepRequestSeqRef = useRef(0);
  const nextStepLastRefreshRef = useRef(0);
  const recentRoutingTelemetryRef = useRef<RecentTelemetrySignalV1[]>([]);
  const nextStepTelemetry = useIdleAwareTelemetry();
  const availableFeaturesRef = useRef(availableFeatures);
  availableFeaturesRef.current = availableFeatures;

  const clearActiveIntervention = useCallback(() => {
    setActiveIntervention(null);
  }, []);

  const handleRefreshNextStep = useCallback(() => {
    setActiveIntervention(null);
    if (nextStepDecision) {
      void reportDecisionOutcome({
        decisionId: nextStepDecision.decisionId,
        acted: false
      });
      nextStepTelemetry.clearSession(nextStepDecision.decisionId);
    }
    recordFlowEvent("next_step_dismissed", {
      meta: { reason: "manual_refresh", surface: screen }
    });
    setNextStepRefreshTick((tick) => tick + 1);
  }, [nextStepDecision, nextStepTelemetry, screen]);

  const handleTakeNextStep = useCallback((decision: NextStepDecisionV1) => {
    setActiveIntervention(null);
    const nodeIdFromPayload =
      typeof decision.action.actionPayload?.nodeId === "string"
        ? decision.action.actionPayload.nodeId
        : null;
    const telemetry = nextStepTelemetry.capture(decision.decisionId);
    const timeToActionSec =
      telemetry?.activeElapsedSec ?? Math.max(0, Math.round((Date.now() - decision.createdAt) / 1000));

    recordFlowEvent("next_step_action_taken", {
      timeToAction: timeToActionSec,
      meta: {
        decisionId: decision.decisionId,
        actionType: decision.action.actionType,
        source: decision.source,
        phase: decision.phase,
        riskBand: decision.riskBand
      }
    });

    void reportDecisionOutcome({
      decisionId: decision.decisionId,
      acted: true,
      completed: undefined,
      completionLatencySec: timeToActionSec,
      timeToActionSec,
      hesitationSec: telemetry?.hesitationSec,
      idleTimeSec: telemetry?.idleElapsedSec,
      rawElapsedSec: telemetry?.rawElapsedSec,
      interactionCount: telemetry?.interactionCount
    });

    const recentPoint: RecentTelemetrySignalV1 = {
      hesitationSec: telemetry?.hesitationSec ?? 0,
      activeElapsedSec: timeToActionSec,
      idleElapsedSec: telemetry?.idleElapsedSec ?? 0,
      interactionCount: telemetry?.interactionCount ?? 0,
      recordedAt: Date.now()
    };
    recentRoutingTelemetryRef.current = [...recentRoutingTelemetryRef.current, recentPoint].slice(-3);
    nextStepTelemetry.clearSession(decision.decisionId);

    switch (decision.action.actionType) {
      case "open_breathing":
        setShowBreathing(true);
        break;
      case "open_map":
        if (screen === "map" && useMapState.getState().nodes.length === 0) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("dawayir-open-add-person"));
          }
        } else {
          void navigateToScreen("map");
        }
        break;
      case "open_tools":
        openJourneyTools();
        break;
      case "open_mission":
        if (nodeIdFromPayload) {
          openMissionScreen(nodeIdFromPayload);
        } else if (selectedNodeId) {
          openMissionScreen(selectedNodeId);
        } else {
          const nodes = useMapState.getState().nodes;
          let targetNode = nodes.find(n => n.missionProgress?.startedAt && !n.missionProgress.isCompleted);
          if (!targetNode) {
            targetNode = nodes.find(n => n.analysis);
          }
          if (targetNode) {
            openMissionScreen(targetNode.id);
          } else {
            void navigateToScreen("map");
            if (nodes[0]) setSelectedNodeId(nodes[0].id);
          }
        }
        break;
      case "review_red_node":
      case "log_situation":
      case "set_soft_boundary":
        void navigateToScreen("map");
        if (nodeIdFromPayload) setSelectedNodeId(nodeIdFromPayload);
        break;
      case "journal_reflection":
        openFeedback();
        break;
      default:
        void navigateToScreen("map");
        break;
    }

    setTimeout(() => setNextStepRefreshTick((tick) => tick + 1), 1200);
  }, [
    navigateToScreen,
    nextStepTelemetry,
    openFeedback,
    openJourneyTools,
    openMissionScreen,
    selectedNodeId,
    setSelectedNodeId,
    setShowBreathing
  ]);

  const handleActiveIntervention = useCallback((snapshot: IdleAwareTelemetrySnapshot, decision: NextStepDecisionV1) => {
    // Guard: don't fire if hesitation is unrealistically short — prevents React StrictMode double-invoke spurious calls
    if (snapshot.hesitationSec < 30) return;

    const cognitiveLoadRequired = inferCognitiveLoadFromDecision(decision);
    setActiveIntervention({
      decisionId: snapshot.decisionId,
      hesitationSec: snapshot.hesitationSec,
      cognitiveLoadRequired
    });
    recordFlowEvent("routing_intervention_triggered", {
      meta: {
        decisionId: snapshot.decisionId,
        hesitationSec: snapshot.hesitationSec,
        cognitiveLoadRequired,
        activeElapsedSec: snapshot.activeElapsedSec
      }
    });
    void fetch("/api/routing/intervention-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisionId: snapshot.decisionId,
        sessionId: getTrackingSessionId(),
        hesitationSec: snapshot.hesitationSec,
        cognitiveLoadRequired,
        actionType: decision.action.actionType,
        surface: screen
      })
    }).catch(() => undefined);
  }, [screen]);

  useEffect(() => {
    const unsubscribe = subscribeToDawayirSignals(() => {
      setNextStepRefreshTick((tick) => tick + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (screen !== "map" && screen !== "tools") {
      nextStepTelemetry.clearSession();
      setNextStepDecision(null);
      return;
    }

    const seq = ++nextStepRequestSeqRef.current;
    const forceRefresh = nextStepRefreshTick !== nextStepLastRefreshRef.current;
    nextStepLastRefreshRef.current = nextStepRefreshTick;
    const surface = screen === "map" ? "map" : "tools";

    // Delay the first fetch by 1.5s so the map can render before the expensive API call
    // Then defer to idle time using requestIdleCallback so it never blocks a click handler
    let idleHandle: ReturnType<typeof requestIdleCallback> | null = null;
    const delayTimer = setTimeout(() => {
      idleHandle = requestIdleCallback(
        () => {
          void computeNextStepDecision({
            goalId,
            category,
            availableFeatures: availableFeaturesRef.current,
            surface,
            forceRefresh,
            recentTelemetry: recentRoutingTelemetryRef.current
          }).then((decision) => {
            if (seq !== nextStepRequestSeqRef.current) return;
            if (decision) {
              nextStepTelemetry.startSession(decision.decisionId, decision.createdAt, {
                cognitiveLoadRequired: inferCognitiveLoadFromDecision(decision),
                hesitationThresholdSec: 120,
                onIntervention: (snapshot) => handleActiveIntervention(snapshot, decision)
              });
            }
            setNextStepDecision(decision);
          });
        },
        { timeout: 3000 }
      );
    }, 1500);

    return () => {
      clearTimeout(delayTimer);
      if (idleHandle !== null) cancelIdleCallback(idleHandle);
    };
  }, [
    category,
    goalId,
    handleActiveIntervention,
    nextStepRefreshTick,
    nextStepTelemetry,
    screen
  ]);

  return {
    activeIntervention,
    clearActiveIntervention,
    nextStepDecision,
    handleTakeNextStep,
    handleRefreshNextStep
  };
}
