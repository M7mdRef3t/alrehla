/**
 * 🔬 Truth Test Store — مخزن اختبارات المصداقية
 * ================================================
 * يحفظ كل اختبار + نتيجته محلياً.
 * لا يمكن تعديل التوقع بعد التسجيل (الطابع الزمني مقفول).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from "@/utils/idbStorage";
import type {
  TruthTest,
  TruthTestType,
  TestOutcome,
  ConnectionPrediction,
  PreFeelingPrediction,
  IntentReadingPrediction,
} from "@/services/truthTestEngine";

const genId = () =>
  `tt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// ═══════════════════════════════════════════════════════════════════════════
// 📊 الحالة
// ═══════════════════════════════════════════════════════════════════════════

interface TruthTestState {
  tests: TruthTest[];

  /** تسجيل اختبار جديد — التوقع مقفول بالطابع الزمني */
  createTest: (params: {
    type: TruthTestType;
    windowMs: number;
    personId?: string;
    personName?: string;
    prediction: ConnectionPrediction | PreFeelingPrediction | IntentReadingPrediction;
    energyAtPrediction?: number;
    moodAtPrediction?: string;
  }) => TruthTest;

  /** تسجيل النتيجة */
  recordOutcome: (testId: string, outcome: TestOutcome, note?: string) => void;

  /** الاختبارات المنتهية اللي مستنية نتيجة */
  getExpiredPending: () => TruthTest[];

  /** الاختبارات النشطة (لسه ما انتهتش) */
  getActivePending: () => TruthTest[];

  /** إحصائيات سريعة */
  getQuickStats: () => {
    total: number;
    completed: number;
    pending: number;
    hitRate: number;
  };

  /** اختبارات شخص معين */
  getPersonTests: (personId: string) => TruthTest[];

  /** مسح كل الاختبارات (للمالك فقط) */
  clearAll: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🏪 المخزن
// ═══════════════════════════════════════════════════════════════════════════

export const useTruthTestState = create<TruthTestState>()(
  persist(
    (set, get) => ({
      tests: [],

      createTest: (params) => {
        const now = Date.now();
        const test: TruthTest = {
          id: genId(),
          type: params.type,
          predictionTimestamp: now,
          windowMs: params.windowMs,
          expiresAt: now + params.windowMs,
          personId: params.personId,
          personName: params.personName,
          prediction: params.prediction,
          outcome: "pending",
          energyAtPrediction: params.energyAtPrediction,
          moodAtPrediction: params.moodAtPrediction,
        };

        set((s) => ({
          tests: [test, ...s.tests].slice(0, 500), // حد أقصى 500 اختبار
        }));

        return test;
      },

      recordOutcome: (testId, outcome, note) => {
        set((s) => ({
          tests: s.tests.map((t) =>
            t.id === testId
              ? {
                  ...t,
                  outcome,
                  outcomeTimestamp: Date.now(),
                  outcomeNote: note?.trim() || undefined,
                }
              : t
          ),
        }));
      },

      getExpiredPending: () => {
        const now = Date.now();
        return get().tests.filter(
          (t) => t.outcome === "pending" && now >= t.expiresAt
        );
      },

      getActivePending: () => {
        const now = Date.now();
        return get().tests.filter(
          (t) => t.outcome === "pending" && now < t.expiresAt
        );
      },

      getQuickStats: () => {
        const tests = get().tests;
        const completed = tests.filter((t) => t.outcome !== "pending");
        const decided = completed.filter(
          (t) => t.outcome === "confirmed" || t.outcome === "denied"
        );
        const confirmed = decided.filter((t) => t.outcome === "confirmed");

        return {
          total: tests.length,
          completed: completed.length,
          pending: tests.length - completed.length,
          hitRate:
            decided.length > 0
              ? Math.round((confirmed.length / decided.length) * 100)
              : 0,
        };
      },

      getPersonTests: (personId) =>
        get().tests.filter((t) => t.personId === personId),

      clearAll: () => set({ tests: [] }),
    }),
    { name: "alrehla-truth-tests", storage: zustandIdbStorage }
  )
);
