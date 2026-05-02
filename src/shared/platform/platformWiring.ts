/**
 * platformWiring.ts
 * ══════════════════════════════════════════════════
 * يربط كل الـ stores بالـ EventBus — عن طريق subscribe.
 *
 * بدل ما نعدّل كل store على حدة (خطر + sovereign guard)
 * نستخدم zustand subscribe من بره لمراقبة التغييرات
 * وبث الأحداث المناسبة.
 *
 * ⚠️ Uses vanilla subscribe(listener) — NO subscribeWithSelector needed.
 *
 * Usage: استورده مرة واحدة في App.tsx
 *   import "@/shared/platform/platformWiring";
 */

import { eventBus } from "@/shared/events/bus";

// ── Helper: safe subscribe to a zustand store (vanilla pattern) ──

type StoreApi = {
  getState: () => unknown;
  subscribe: (listener: (state: unknown, prevState: unknown) => void) => () => void;
};

function safeWire(
  modulePath: string,
  hookName: string,
  handler: (state: unknown, prev: unknown) => void,
) {
  // Delay wiring to next tick so stores have time to initialize
  setTimeout(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(modulePath);
      const store = mod[hookName] as StoreApi | undefined;
      if (store?.subscribe) {
        store.subscribe((state, prevState) => {
          try { handler(state, prevState); } catch { /* silent */ }
        });
      }
    } catch {
      // Module not loaded yet — that's fine
    }
  }, 0);
}

// ═══════════════════════════════════════════════════════════
//                    STORE SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════

// ── Wird: بث عند تغيير الـ streak ──

safeWire(
  "@/modules/wird/store/wird.store",
  "useWirdState",
  (state, prev) => {
    const s = state as { streak?: number };
    const p = prev as { streak?: number };
    if (s.streak !== undefined && p.streak !== undefined) {
      if (s.streak > p.streak) {
        eventBus.emit("wird:completed_today", { streak: s.streak });
      } else if (s.streak < p.streak && p.streak > 0) {
        eventBus.emit("wird:streak_broken", { lastStreak: p.streak });
      }
    }
  }
);

// ── Qalb: بث عند تغيير منطقة القلب ──

safeWire(
  "@/modules/qalb/store/qalb.store",
  "useQalbState",
  (state, prev) => {
    const s = state as { currentZone?: string };
    const p = prev as { currentZone?: string };
    if (s.currentZone && p.currentZone && s.currentZone !== p.currentZone) {
      eventBus.emit("qalb:zone_changed", { from: p.currentZone, to: s.currentZone });
    }
  }
);

// ── Niyya: بث عند إضافة نية جديدة ──

safeWire(
  "@/modules/niyya/store/niyya.store",
  "useNiyyaState",
  (state, prev) => {
    const s = state as { intentions?: Array<{ intention: string; category: string }> };
    const p = prev as { intentions?: Array<unknown> };
    const sLen = s.intentions?.length ?? 0;
    const pLen = p.intentions?.length ?? 0;
    if (sLen > pLen && s.intentions) {
      const latest = s.intentions[s.intentions.length - 1];
      if (latest) {
        eventBus.emit("niyya:intention_set", { intention: latest.intention, category: latest.category });
      }
    }
  }
);

// ── Mithaq: بث عند إنشاء ميثاق ──

safeWire(
  "@/modules/mithaq/store/mithaq.store",
  "useMithaqState",
  (state, prev) => {
    const s = state as { pledges?: Array<{ id: string; category: string }> };
    const p = prev as { pledges?: Array<unknown> };
    const sLen = s.pledges?.length ?? 0;
    const pLen = p.pledges?.length ?? 0;
    if (sLen > pLen && s.pledges) {
      const latest = s.pledges[s.pledges.length - 1];
      if (latest) {
        eventBus.emit("mithaq:pledge_created", { pledgeId: latest.id, category: latest.category });
      }
    }
  }
);

// ── Tazkiya: بث عند تقدم الخطوة ──

safeWire(
  "@/modules/tazkiya/store/tazkiya.store",
  "useTazkiyaState",
  (state, prev) => {
    const s = state as { activeCycle?: { currentStep: string } | null };
    const p = prev as { activeCycle?: { currentStep: string } | null };
    const sCur = s.activeCycle?.currentStep;
    const pCur = p.activeCycle?.currentStep;
    if (sCur && pCur && sCur !== pCur) {
      eventBus.emit("tazkiya:step_advanced", { from: pCur, to: sCur });
    }
  }
);

// ── Kanz: بث عند إضافة جوهرة ──

safeWire(
  "@/modules/kanz/store/kanz.store",
  "useKanzState",
  (state, prev) => {
    const s = state as { gems?: Array<{ category?: string; source?: string }> };
    const p = prev as { gems?: Array<unknown> };
    const sLen = s.gems?.length ?? 0;
    const pLen = p.gems?.length ?? 0;
    if (sLen > pLen && s.gems) {
      const latest = s.gems[s.gems.length - 1];
      if (latest) {
        eventBus.emit("kanz:gem_added", {
          category: latest.category ?? "insight",
          source: latest.source ?? "manual",
        });
      }
    }
  }
);

// ── Raya: بث عند تغيير حالة هدف ──

safeWire(
  "@/modules/raya/store/raya.store",
  "useRayaState",
  (state, prev) => {
    const s = state as { goals?: Array<{ id: string; status: string; category: string }> };
    const p = prev as { goals?: Array<{ id: string; status: string }> };
    if (!s.goals || !p.goals) return;
    // Check for newly created goals
    if (s.goals.length > p.goals.length) {
      const latest = s.goals[s.goals.length - 1];
      if (latest) eventBus.emit("raya:goal_created", { goalId: latest.id, category: latest.category });
    }
    // Check for newly completed goals
    for (const goal of s.goals) {
      const prevGoal = p.goals.find(g => g.id === goal.id);
      if (prevGoal && prevGoal.status !== "completed" && goal.status === "completed") {
        eventBus.emit("raya:goal_completed", { goalId: goal.id });
      }
    }
  }
);

// ── Sila: بث عند إضافة علاقة ──

safeWire(
  "@/modules/sila/store/sila.store",
  "useSilaState",
  (state, prev) => {
    const s = state as { people?: Array<{ id?: string; type?: string }> };
    const p = prev as { people?: Array<unknown> };
    const sLen = s.people?.length ?? 0;
    const pLen = p.people?.length ?? 0;
    if (sLen > pLen && s.people) {
      const latest = s.people[s.people.length - 1];
      if (latest) {
        eventBus.emit("sila:connection_added", {
          personId: latest.id ?? "",
          type: latest.type ?? "friend",
        });
      }
    }
  }
);

// ── Zill: بث عند اكتشاف ظل جديد ──

safeWire(
  "@/modules/zill/store/zill.store",
  "useZillState",
  (state, prev) => {
    const s = state as { entries?: Array<{ type?: string }> };
    const p = prev as { entries?: Array<unknown> };
    const sLen = s.entries?.length ?? 0;
    const pLen = p.entries?.length ?? 0;
    if (sLen > pLen && s.entries) {
      const latest = s.entries[s.entries.length - 1];
      if (latest) {
        eventBus.emit("zill:shadow_discovered", { type: latest.type ?? "pattern" });
      }
    }
  }
);

// ── Nadhir: بث عند كشف/حل أزمة ──

safeWire(
  "@/modules/nadhir/store/nadhir.store",
  "useNadhirState",
  (state, prev) => {
    const s = state as { isInCrisis?: boolean };
    const p = prev as { isInCrisis?: boolean };
    if (s.isInCrisis === true && p.isInCrisis !== true) {
      eventBus.emit("nadhir:crisis_detected", { severity: "high" });
    } else if (s.isInCrisis === false && p.isInCrisis === true) {
      eventBus.emit("nadhir:crisis_resolved", {});
    }
  }
);

// ── Warsha: بث عند تقدم التحدي ──

safeWire(
  "@/modules/warsha/store/warsha.store",
  "useWarshaState",
  (state, prev) => {
    const s = state as { activeChallenge?: { completedDays?: number; id?: string } | null };
    const p = prev as { activeChallenge?: { completedDays?: number } | null };
    const sDays = s.activeChallenge?.completedDays ?? 0;
    const pDays = p.activeChallenge?.completedDays ?? 0;
    if (sDays > pDays && s.activeChallenge?.id) {
      eventBus.emit("warsha:day_completed", {
        challengeId: s.activeChallenge.id,
        day: sDays,
      });
    }
  }
);

console.log("[Platform] 🧠 Neural wiring active — 11 module subscriptions");
