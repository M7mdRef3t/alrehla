/**
 * Domain: Dawayir — Relational Analysis Service
 *
 * Facade فوق relationalFieldEngine.ts و graphProjectionEngine.ts
 * يوفر API موحدة للتحليل العلائقي.
 */

import {
  buildRelationalFieldSnapshot,
  computeRelationalFieldSnapshot,
} from "@/services/relationalFieldEngine";
import { GraphProjectionEngine } from "@/services/graphProjectionEngine";
import type {
  RelationalFieldSnapshot,
  BuildRelationalFieldInput,
} from "../dawayirIndex";
import {
  interpretPainLevel,
  summarizeTwinRecommendation,
} from "../dawayirIndex";

export const relationalAnalysisService = {
  /**
   * بناء snapshot التحليل العلائقي من بيانات مُمررة
   * (pure function — لا تعتمد على global state)
   */
  buildSnapshot(input: BuildRelationalFieldInput): RelationalFieldSnapshot {
    return buildRelationalFieldSnapshot(input);
  },

  /**
   * حساب snapshot من الـ state الحالية تلقائياً
   * (يقرأ من mapState + pulseState + shadowPulseState)
   */
  computeCurrentSnapshot(now?: number): RelationalFieldSnapshot {
    return computeRelationalFieldSnapshot(now);
  },

  /**
   * إسقاط الخريطة على الـ Consciousness Graph في Supabase
   * (للتفعيل البطيء — production فقط)
   */
  async projectToGraph(
    userId: string,
    nodes: import("@/modules/map/mapTypes").MapNode[]
  ): Promise<void> {
    return GraphProjectionEngine.projectMapToGraph(userId, nodes);
  },

  /**
   * تفسير مستوى الألم لعرضه في الـ UI
   */
  interpretPainLevel(intensity: number) {
    return interpretPainLevel(intensity);
  },

  /**
   * تلخيص الـ twin decision بجملة واحدة للعرض
   */
  summarizeTwinRecommendation(snapshot: RelationalFieldSnapshot): string {
    return summarizeTwinRecommendation(snapshot);
  },
};
