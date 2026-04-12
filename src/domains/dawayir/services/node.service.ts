/**
 * Domain: Dawayir — Node Service
 *
 * Facade فوق useMapState — يوفر API نظيفة للعمليات على الـ nodes
 * بدون أن يجبر أي component على الاستيراد المباشر من state/mapState.
 *
 * الـ state ذاتها تبقى في useMapState (Zustand) — لا ننقلها.
 */

import { useMapState } from "@/domains/dawayir/store/map.store";
import { queueMapSync } from "@/services/mapSync";
import { eventBus } from "@/shared/events";
import type { MapNode, Ring, HealthAnswers, TreeRelation, RealityAnswers, QuickAnswerValue } from "../types";

export const nodeService = {
  /**
   * جلب كل الـ nodes النشطة (بدون المؤرشفة)
   */
  getActiveNodes(): MapNode[] {
    return useMapState.getState().nodes.filter((n) => !n.isNodeArchived);
  },

  /**
   * جلب كل الـ nodes (بما فيها المؤرشفة)
   */
  getAllNodes(): MapNode[] {
    return useMapState.getState().nodes;
  },

  /**
   * إضافة شخص للدوائر
   */
  addNode(
    label: string,
    ring: Ring = "yellow",
    analysis?: { score: number; answers: HealthAnswers },
    options?: {
      goalId?: string;
      treeRelation?: TreeRelation;
      detachmentMode?: boolean;
      contact?: "low" | "medium" | "high";
      isSOS?: boolean;
      realityAnswers?: RealityAnswers;
      safetyAnswer?: QuickAnswerValue;
      isMirrorNode?: boolean;
    }
  ): string {
    const state = useMapState.getState();
    const nodeId = state.addNode(
      label, ring, analysis,
      options?.goalId,
      options?.treeRelation,
      options?.detachmentMode,
      options?.contact,
      options?.isSOS,
      options?.realityAnswers,
      options?.safetyAnswer,
      false, // isAnalyzing starts false
      options?.isMirrorNode
    );

    // trigger map sync
    queueMapSync(useMapState.getState().nodes);

    // emit domain event
    eventBus.emit("dawayir:node_added", { nodeId, ring, label });

    return nodeId;
  },

  /**
   * تعديل بيانات شخص
   */
  updateNode(id: string, updates: Partial<MapNode>): void {
    useMapState.getState().updateNode(id, updates);
    queueMapSync(useMapState.getState().nodes);
  },

  /**
   * نقل شخص لدائرة مختلفة
   */
  moveToRing(id: string, ring: Ring, realityAnswers?: RealityAnswers): void {
    const prev = useMapState.getState().nodes.find((n) => n.id === id);
    useMapState.getState().moveNodeToRing(id, ring, realityAnswers);
    queueMapSync(useMapState.getState().nodes);

    if (prev && prev.ring !== ring) {
      eventBus.emit("dawayir:ring_changed", { nodeId: id, from: prev.ring, to: ring });
    }
  },

  /**
   * أرشفة شخص
   */
  archiveNode(id: string): void {
    useMapState.getState().archiveNode(id);
    queueMapSync(useMapState.getState().nodes);
    eventBus.emit("dawayir:node_archived", { nodeId: id });
  },

  /**
   * استعادة شخص من الأرشيف
   */
  unarchiveNode(id: string): void {
    useMapState.getState().unarchiveNode(id);
    queueMapSync(useMapState.getState().nodes);
  },

  /**
   * حذف شخص نهائياً
   */
  deleteNode(id: string): void {
    useMapState.getState().deleteNode(id);
    queueMapSync(useMapState.getState().nodes);
  },

  /**
   * تحديث تحليل شخص
   */
  analyzeNode(id: string, result: { score: number; answers: HealthAnswers }): void {
    useMapState.getState().analyzeNode(id, result);
    queueMapSync(useMapState.getState().nodes);
  },

  /**
   * مزامنة الخريطة يدوياً
   */
  syncMapNow(): void {
    queueMapSync(useMapState.getState().nodes);
  },

  /**
   * حساب إحصاءات سريعة للدوائر
   */
  getRingStats(): { red: number; yellow: number; green: number; archived: number; total: number } {
    const nodes = useMapState.getState().nodes;
    return {
      red: nodes.filter((n) => n.ring === "red" && !n.isNodeArchived).length,
      yellow: nodes.filter((n) => n.ring === "yellow" && !n.isNodeArchived).length,
      green: nodes.filter((n) => n.ring === "green" && !n.isNodeArchived).length,
      archived: nodes.filter((n) => n.isNodeArchived).length,
      total: nodes.length,
    };
  },
};
