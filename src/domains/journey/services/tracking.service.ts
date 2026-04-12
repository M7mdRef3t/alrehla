/**
 * Domain: Journey — Tracking Service
 *
 * Facade نظيف فوق journeyTracking.ts
 * يوفر API موحدة للتتبع والإحصاءات.
 */

import {
  recordJourneyEvent,
  recordFlowEvent,
  recordPathStartedOnce,
  getAggregateStats,
  getTimelineEvents,
  getEventsByDay,
  getSessionsWithProgress,
  getSessionTimelineEvents,
  getLastTaskForNode,
  getRecentJourneyEvents,
  clearAllJourneyEvents,
  getTrackingMode,
  getTrackingSessionId,
  ensureIdentifiedTrackingSession,
} from "@/services/journeyTracking";
import type {
  JourneyEventType,
  JourneyEventPayload,
  FlowStep,
  AggregateStats,
  DayAggregate,
  SessionSummary,
  SessionTimelineEvent,
  LastTaskForNode,
  JourneyEvent,
} from "../types";

export const trackingService = {
  // ─── Event Recording ────────────────────────────────

  /**
   * تسجيل حدث رحلة
   */
  record<T extends JourneyEventType>(
    type: T,
    payload: JourneyEventPayload[T]
  ): void {
    recordJourneyEvent(type, payload as JourneyEventPayload[JourneyEventType]);
  },

  /**
   * تسجيل flow event (frontend funnel)
   */
  recordFlow(
    step: FlowStep,
    extra?: {
      timeToAction?: number;
      atStep?: string;
      meta?: Record<string, unknown>;
    }
  ): void {
    recordFlowEvent(step, extra);
  },

  /**
   * تسجيل بدء مسار — مرة واحدة فقط لكل شخص
   */
  recordPathStartedOnce(
    payload: JourneyEventPayload["path_started"]
  ): boolean {
    return recordPathStartedOnce(payload);
  },

  // ─── Session ──────────────────────────────────────────

  getTrackingMode,
  getSessionId: getTrackingSessionId,
  ensureIdentifiedSession: ensureIdentifiedTrackingSession,

  // ─── Read / Stats ─────────────────────────────────────

  /**
   * إحصاءات مجمّعة
   */
  getAggregateStats(): AggregateStats {
    return getAggregateStats();
  },

  /**
   * أحداث الـ timeline (للعرض في واجهة المستخدم)
   */
  getTimeline(): JourneyEvent[] {
    return getTimelineEvents();
  },

  /**
   * أحداث مجمّعة حسب اليوم
   */
  getByDay(): DayAggregate[] {
    return getEventsByDay();
  },

  /**
   * ملخص الجلسات (لوحة تحكم الأونر)
   */
  getSessions(): SessionSummary[] {
    return getSessionsWithProgress();
  },

  /**
   * timeline جلسة واحدة
   */
  getSessionTimeline(sessionId: string, limit = 200): SessionTimelineEvent[] {
    return getSessionTimelineEvents(sessionId, limit);
  },

  /**
   * آخر مهمة مكتملة لشخص — لـ ViewPersonModal
   */
  getLastTaskForNode(nodeId: string): LastTaskForNode | null {
    return getLastTaskForNode(nodeId);
  },

  /**
   * آخر N حدث
   */
  getRecent(limit = 500): JourneyEvent[] {
    return getRecentJourneyEvents(limit);
  },

  // ─── Admin ─────────────────────────────────────────────

  /**
   * حذف كل الأحداث (للاختبار أو الـ reset)
   */
  clearAll(): void {
    clearAllJourneyEvents();
  },
};
