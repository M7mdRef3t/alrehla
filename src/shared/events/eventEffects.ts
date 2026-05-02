/**
 * eventEffects.ts
 * ══════════════════════════════════════════════════════════
 * الجهاز العصبي المركزي — يربط أحداث الـ EventBus
 * بالتأثيرات الجانبية (Side Effects) عبر المنصة.
 *
 * بدلاً من ما كل module يستورد stores تانية مباشرة،
 * الأحداث بتتبث على الـ bus والـ effects بتستقبلها هنا.
 *
 * Usage: call `initEventEffects()` once at app startup.
 *
 * Rule: هذا الملف يستمع فقط (on) — لا يبث أحداث (emit).
 * Rule: كل side-effect ملفوف في try/catch — لا يسقط الـ app أبداً.
 */

import { eventBus } from "./bus";

// ── Lazy Store Accessors (avoid circular imports) ───────

function getSijil() {
  try {
    const mod = require("@/modules/sijil/store/sijil.store");
    return mod.useSijilState?.getState?.() ?? null;
  } catch { return null; }
}

function getRaseed() {
  try {
    const mod = require("@/modules/raseed/store/raseed.store");
    return mod.useRaseedState?.getState?.() ?? null;
  } catch { return null; }
}

function getAthar() {
  try {
    const mod = require("@/modules/athar/store/athar.store");
    return mod.useAtharState?.getState?.() ?? null;
  } catch { return null; }
}

function getYawmiyyat() {
  try {
    const mod = require("@/modules/yawmiyyat/store/yawmiyyat.store");
    return mod.useYawmiyyatState?.getState?.() ?? null;
  } catch { return null; }
}

// ── Cleanup Tracker ─────────────────────────────────────

const cleanups: Array<() => void> = [];

function listen<K extends keyof import("./bus").DomainEvents>(
  event: K,
  handler: (payload: import("./bus").DomainEvents[K]) => void
) {
  cleanups.push(eventBus.on(event, handler));
}

// ═══════════════════════════════════════════════════════════
//               EFFECT REGISTRATIONS
// ═══════════════════════════════════════════════════════════

function registerWirdEffects() {
  // عند إكمال الورد اليومي → XP + Impact + Journal
  listen("wird:completed_today", ({ streak }) => {
    try {
      const raseed = getRaseed();
      raseed?.addXp?.("wird:daily", "peace", 15, `ورد يومي (سلسلة ${streak})`);

      // Bonus XP for streaks
      if (streak > 0 && streak % 7 === 0) {
        raseed?.addXp?.("wird:streak_milestone", "peace", 30, `سلسلة ${streak} يوم ⭐`);
      }

      const athar = getAthar();
      athar?.addEntry?.({
        content: `أكملت الورد اليومي — سلسلة ${streak} يوم`,
        category: "spiritual",
        emoji: "📿",
      });
    } catch { /* silent */ }
  });

  listen("wird:dhikr_completed", ({ category, count }) => {
    try {
      const sijil = getSijil();
      sijil?.addEvent?.({ source: "wird", action: "dhikr_completed", meta: { category, count } });
    } catch { /* silent */ }
  });
}

function registerDawayirEffects() {
  // عند إضافة شخص على الخريطة → Sijil + XP
  listen("dawayir:node_added", ({ nodeId, ring, label }) => {
    try {
      const sijil = getSijil();
      sijil?.addEvent?.({
        source: "dawayir",
        action: "node_added",
        meta: { nodeId, ring, label },
      });

      const raseed = getRaseed();
      raseed?.addXp?.("dawayir:node_added", "awareness", 10, `أضاف "${label}" في ${ring}`);
    } catch { /* silent */ }
  });

  listen("dawayir:ring_changed", ({ nodeId, from, to }) => {
    try {
      const sijil = getSijil();
      sijil?.addEvent?.({
        source: "dawayir",
        action: "ring_changed",
        meta: { nodeId, from, to },
      });

      const athar = getAthar();
      athar?.addEntry?.({
        content: `نقل شخص من "${from}" إلى "${to}" — تحول في الوعي`,
        category: "relational",
        emoji: "🔄",
      });
    } catch { /* silent */ }
  });

  listen("dawayir:node_archived", ({ nodeId }) => {
    try {
      const sijil = getSijil();
      sijil?.addEvent?.({ source: "dawayir", action: "node_archived", meta: { nodeId } });

      const raseed = getRaseed();
      raseed?.addXp?.("dawayir:archive", "clarity", 5, "أرشف شخص — حدود واضحة");
    } catch { /* silent */ }
  });
}

function registerJourneyEffects() {
  listen("journey:baseline-completed", ({ score }) => {
    try {
      const raseed = getRaseed();
      raseed?.addXp?.("journey:baseline", "awareness", 20, "أكمل فحص خط الأساس");

      const yawmiyyat = getYawmiyyat();
      yawmiyyat?.addEntry?.({
        type: "milestone",
        content: `أكملت فحص خط الأساس — النتيجة: ${score}`,
        tags: ["journey", "baseline"],
      });
    } catch { /* silent */ }
  });

  listen("journey:goal-selected", ({ goalId, category }) => {
    try {
      const sijil = getSijil();
      sijil?.addEvent?.({ source: "journey", action: "goal_selected", meta: { goalId, category } });
    } catch { /* silent */ }
  });
}

function registerKhalwaEffects() {
  listen("khalwa:session_completed", ({ duration, intention }) => {
    try {
      const raseed = getRaseed();
      const minutes = Math.round(duration / 60);
      raseed?.addXp?.("khalwa:session", "peace", Math.min(minutes * 5, 50), `خلوة ${minutes} دقيقة`);

      const athar = getAthar();
      athar?.addEntry?.({
        content: `أكمل خلوة ${minutes} دقيقة${intention ? ` — "${intention}"` : ""}`,
        category: "spiritual",
        emoji: "🧘",
      });

      const sijil = getSijil();
      sijil?.addEvent?.({ source: "khalwa", action: "session_completed", meta: { duration, intention } });
    } catch { /* silent */ }
  });
}

function registerMasaratEffects() {
  listen("masarat:journey_completed", ({ pathId }) => {
    try {
      const raseed = getRaseed();
      raseed?.addXp?.("masarat:completed", "clarity", 40, "أكمل مساراً كاملاً 🏁");

      const athar = getAthar();
      athar?.addEntry?.({
        content: `أكمل مسار "${pathId}" — إتمام رحلة`,
        category: "growth",
        emoji: "🏁",
      });
    } catch { /* silent */ }
  });

  listen("masarat:step_completed", ({ pathId, stepId }) => {
    try {
      const sijil = getSijil();
      sijil?.addEvent?.({ source: "masarat", action: "step_completed", meta: { pathId, stepId } });
    } catch { /* silent */ }
  });
}

function registerWarshaEffects() {
  listen("warsha:challenge_completed", ({ challengeId, daysCompleted }) => {
    try {
      const raseed = getRaseed();
      raseed?.addXp?.("warsha:challenge_done", "growth", 50, `أكمل تحدي ${daysCompleted} يوم 💪`);

      const athar = getAthar();
      athar?.addEntry?.({
        content: `أنهى تحدي "${challengeId}" بنجاح — ${daysCompleted} يوم`,
        category: "growth",
        emoji: "💪",
      });
    } catch { /* silent */ }
  });
}

function registerMithaqEffects() {
  listen("mithaq:pledge_completed", ({ pledgeId }) => {
    try {
      const raseed = getRaseed();
      raseed?.addXp?.("mithaq:fulfilled", "integrity", 25, "وفى بالميثاق ✨");

      const sijil = getSijil();
      sijil?.addEvent?.({ source: "mithaq", action: "pledge_fulfilled", meta: { pledgeId } });
    } catch { /* silent */ }
  });

  listen("mithaq:pledge_broken", ({ pledgeId }) => {
    try {
      const sijil = getSijil();
      sijil?.addEvent?.({ source: "mithaq", action: "pledge_broken", meta: { pledgeId } });
    } catch { /* silent */ }
  });
}

function registerNadhirEffects() {
  listen("nadhir:crisis_detected", ({ severity }) => {
    try {
      const sijil = getSijil();
      sijil?.addEvent?.({ source: "nadhir", action: "crisis_detected", meta: { severity } });

      const yawmiyyat = getYawmiyyat();
      yawmiyyat?.addEntry?.({
        type: "alert",
        content: `⚠️ تم رصد حالة طوارئ — مستوى: ${severity}`,
        tags: ["nadhir", "crisis"],
      });
    } catch { /* silent */ }
  });
}

function registerTazkiyaEffects() {
  listen("tazkiya:cycle_completed", ({ totalCycles }) => {
    try {
      const raseed = getRaseed();
      raseed?.addXp?.("tazkiya:cycle", "peace", 35, `دورة تزكية #${totalCycles}`);

      const athar = getAthar();
      athar?.addEntry?.({
        content: `أكمل دورة تزكية رقم ${totalCycles}`,
        category: "spiritual",
        emoji: "🧹",
      });
    } catch { /* silent */ }
  });
}

function registerSessionEffects() {
  listen("session:completed", ({ sessionId, duration }) => {
    try {
      const minutes = Math.round(duration / 60000);
      const raseed = getRaseed();
      raseed?.addXp?.("session:completed", "awareness", Math.min(minutes * 3, 30), `جلسة ${minutes} دقيقة`);

      const sijil = getSijil();
      sijil?.addEvent?.({ source: "session", action: "completed", meta: { sessionId, duration } });
    } catch { /* silent */ }
  });
}

// ═══════════════════════════════════════════════════════════
//               INITIALIZATION
// ═══════════════════════════════════════════════════════════

let initialized = false;

/**
 * يُفعّل الجهاز العصبي المركزي للمنصة.
 * يُستدعى مرة واحدة عند بداية التطبيق.
 */
export function initEventEffects(): void {
  if (initialized) return;
  initialized = true;

  registerWirdEffects();
  registerDawayirEffects();
  registerJourneyEffects();
  registerKhalwaEffects();
  registerMasaratEffects();
  registerWarshaEffects();
  registerMithaqEffects();
  registerNadhirEffects();
  registerTazkiyaEffects();
  registerSessionEffects();

  if (typeof window !== "undefined" && (import.meta as any).env?.DEV) {
    console.log("[EventEffects] 🧠 Neural Mesh side-effects wired ✓");
  }
}

/**
 * يوقف جميع المستمعين — مفيد في التنظيف أو الاختبارات.
 */
export function teardownEventEffects(): void {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
  initialized = false;
}
