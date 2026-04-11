/**
 * Domain: Dawayir — useMapNodes hook
 *
 * Hook رئيسي لقراءة وتعديل الـ nodes
 * يتجنب التعامل المباشر مع useMapState خارج الـ domain.
 */

"use client";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { nodeService } from "../services/node.service";
import type { MapNode, Ring, HealthAnswers, TreeRelation, RealityAnswers, QuickAnswerValue } from "../types";

export function useMapNodes() {
  const nodes = useMapState((s) => s.nodes);
  const isHydrated = useMapState((s) => s.isHydrated);
  const lastAddedNodeId = useMapState((s) => s.lastAddedNodeId);
  const showPlacementTooltip = useMapState((s) => s.showPlacementTooltip);

  const activeNodes = nodes.filter((n) => !n.isNodeArchived);
  const archivedNodes = nodes.filter((n) => n.isNodeArchived);

  const stats = nodeService.getRingStats();

  return {
    // Data
    nodes,
    activeNodes,
    archivedNodes,
    isHydrated,
    stats,
    lastAddedNodeId,
    showPlacementTooltip,

    // Actions (forwarded to service)
    addNode: nodeService.addNode.bind(nodeService),
    updateNode: nodeService.updateNode.bind(nodeService),
    moveToRing: nodeService.moveToRing.bind(nodeService),
    archiveNode: nodeService.archiveNode.bind(nodeService),
    unarchiveNode: nodeService.unarchiveNode.bind(nodeService),
    deleteNode: nodeService.deleteNode.bind(nodeService),
    analyzeNode: nodeService.analyzeNode.bind(nodeService),
    syncNow: nodeService.syncMapNow.bind(nodeService),

    // Passthrough actions that don't need orchestration
    addNoteToNode: useMapState.getState().addNoteToNode,
    deleteNoteFromNode: useMapState.getState().deleteNoteFromNode,
    toggleStepCompletion: useMapState.getState().toggleStepCompletion,
    addSituationLog: useMapState.getState().addSituationLog,
    updateNodeInsights: useMapState.getState().updateNodeInsights,
    dismissPlacementTooltip: useMapState.getState().dismissPlacementTooltip,
  };
}
