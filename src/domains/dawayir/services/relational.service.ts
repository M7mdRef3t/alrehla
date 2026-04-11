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
} from "../types";

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
  interpretPainLevel(intensity: number): {
    label: string;
    color: string;
    action: string;
  } {
    if (intensity >= 80) {
      return {
        label: "حرج",
        color: "var(--color-danger)",
        action: "اتخاذ إجراء فوري مطلوب",
      };
    }
    if (intensity >= 60) {
      return {
        label: "مرتفع",
        color: "var(--color-warning)",
        action: "مراجعة خطة التعافي",
      };
    }
    if (intensity >= 40) {
      return {
        label: "متوسط",
        color: "var(--color-caution)",
        action: "المتابعة اليومية كافية",
      };
    }
    return {
      label: "منخفض",
      color: "var(--color-success)",
      action: "استمر في نهجك الحالي",
    };
  },

  /**
   * تلخيص الـ twin decision بجملة واحدة للعرض
   */
  summarizeTwinRecommendation(snapshot: RelationalFieldSnapshot): string {
    const { recommended } = snapshot.twin;
    const painLabel = this.interpretPainLevel(snapshot.pain.painFieldIntensity).label;

    const actionMap: Record<string, string> = {
      no_action: "لا يوجد إجراء مطلوب حالياً",
      micro_regulation: "جلسة تنظيم 90 ثانية موصى بها",
      soft_boundary: "وضع حدود ناعمة مع أكثر الأشخاص استنزافاً",
      targeted_reflection: "كتابة تأمل موجه الآن",
      mission_focus: "ركز على خطوة واحدة من مهمتك",
    };

    return `[${painLabel}] ${actionMap[recommended.id] ?? recommended.label}`;
  },
};
