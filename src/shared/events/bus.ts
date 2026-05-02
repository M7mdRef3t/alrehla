/**
 * Shared — Event Bus
 * 
 * قناة تواصل بين الـ Domains بدون imports مباشرة.
 * بدلاً من:
 *   import { gamificationEngine } from '@/services/gamificationEngine'
 * 
 * نستخدم:
 *   eventBus.emit('session:completed', { sessionId, userId })
 * 
 * وفي domain الـ gamification:
 *   eventBus.on('session:completed', handlePostSession)
 */

type EventCallback<T = unknown> = (payload: T) => void;

// ─── Event Definitions (Type-safe) ────────────────────

export interface DomainEvents {
  // Sessions
  "session:intake-submitted": { userId: string; intakeId: string };
  "session:brief-generated": { sessionId: string; briefId: string };
  "session:completed": { sessionId: string; userId: string; duration: number };
  "session:cancelled": { sessionId: string; reason: string };

  // Dawayir (Relationship Map)
  "dawayir:person-added": { userId: string; personName: string };
  "dawayir:connection-updated": { userId: string; connectionId: string };
  "dawayir:node_added": { nodeId: string; ring: string; label: string };
  "dawayir:ring_changed": { nodeId: string; from: string; to: string };
  "dawayir:node_archived": { nodeId: string };
  "dawayir:map_synced": { timestamp: string };

  // Journey
  "journey:path-started": { userId: string; pathId: string };
  "journey:milestone-reached": { userId: string; milestoneId: string };
  "journey:path-completed": { userId: string; pathId: string };
  "journey:step-changed": { from: string; to: string };
  "journey:baseline-completed": { score: number };
  "journey:goal-selected": { goalId: string; category: string };
  "journey:reset": undefined;

  // Billing
  "billing:payment-completed": { userId: string; amount: number; plan: string };
  "billing:subscription-cancelled": { userId: string };

  // Auth
  "auth:signed-in": { userId: string; method: string };
  "auth:signed-out": { userId: string };

  // Gamification
  "gamification:achievement-unlocked": { userId: string; achievementId: string };
  "gamification:streak-updated": { userId: string; streak: number };

  // ❄️ Tajmeed (Freeze Gamification)
  "tajmeed:achievement-unlocked": { achievements: string[]; trigger: string };
  "tajmeed:frost-earned": { amount: number; reason: string; nodeId?: string };
  "tajmeed:combo-activated": { comboCount: number; multiplier: number };

  // Analytics
  "analytics:event": { name: string; properties?: Record<string, unknown> };

  // 🪞 Maraya (Digital Twin)
  "maraya:story_completed": { userId?: string };
  "maraya:pattern_discovered": { patternId?: string };
  "maraya:judge_finale": { userId?: string };

  // 🎯 Session Intake
  "session:intake_completed": { userId?: string };
  "session:session_completed": { sessionId?: string };

  // 🌬️ Atmosfera (Consciousness-Aware Theming)
  "atmosfera:mood_explored": { state?: string };
  "atmosfera:state_changed": { from?: string; to?: string };
  "atmosfera:soundscape_toggled": { enabled: boolean };

  // 🧭 Masarat (Guided Path Engine)
  "masarat:quick_path_used": { situation: string };
  "masarat:path_resolved": { pathId: string };
  "masarat:path_activated": { pathId: string };
  "masarat:journey_started": { pathId: string; timestamp: number };
  "masarat:step_completed": { pathId: string; stepId?: string; timestamp: number };
  "masarat:stage_completed": { pathId: string; stageId?: string; timestamp: number };
  "masarat:journey_completed": { pathId: string; timestamp: number };

  // 📿 Wird (الورد)
  "wird:completed_today": { streak: number };
  "wird:streak_broken": { lastStreak: number };
  "wird:dhikr_completed": { category: string; count: number };

  // 🧘 Khalwa (الخلوة)
  "khalwa:session_started": { intention?: string };
  "khalwa:session_completed": { duration: number; intention?: string };

  // ❤️ Qalb (القلب)
  "qalb:zone_changed": { from: string; to: string };
  "qalb:pulse_logged": { health: number };

  // 🧹 Tazkiya (التزكية)
  "tazkiya:cycle_started": { step: string };
  "tazkiya:cycle_completed": { totalCycles: number };
  "tazkiya:step_advanced": { from: string; to: string };

  // 🫁 Samt (الصمت)
  "samt:session_started": { pattern: string };
  "samt:session_completed": { duration: number; pattern: string };

  // 🎯 Niyya (النية)
  "niyya:intention_set": { intention: string; category: string };
  "niyya:intention_fulfilled": { intention: string };

  // 📜 Mithaq (الميثاق)
  "mithaq:pledge_created": { pledgeId: string; category: string };
  "mithaq:pledge_completed": { pledgeId: string };
  "mithaq:pledge_broken": { pledgeId: string };
  "mithaq:checkin_added": { pledgeId: string };

  // 🎭 Qinaa (القناع)
  "qinaa:mask_logged": { context: string; intensity: number };
  "qinaa:authentic_moment": { context: string };

  // 🌑 Zill (الظل)
  "zill:shadow_discovered": { type: string };
  "zill:integration_advanced": { shadowId: string; level: number };

  // 🤝 Sila (الصلة)
  "sila:connection_added": { personId: string; type: string };
  "sila:quality_changed": { personId: string; from: number; to: number };

  // 🌉 Jisr (الجسر)
  "jisr:fracture_identified": { fractureId: string; kind: string };
  "jisr:fracture_repaired": { fractureId: string };

  // 💪 Warsha (الورشة)
  "warsha:challenge_started": { challengeId: string; category: string };
  "warsha:challenge_completed": { challengeId: string; daysCompleted: number };
  "warsha:day_completed": { challengeId: string; day: number };

  // 💎 Kanz (الكنز)
  "kanz:gem_added": { category: string; source: string };

  // 🏁 Raya (الراية)
  "raya:goal_created": { goalId: string; category: string };
  "raya:goal_completed": { goalId: string };
  "raya:milestone_reached": { goalId: string; milestoneId: string };

  // ⭐ Qutb (القطب)
  "qutb:north_star_set": { statement: string };
  "qutb:alignment_changed": { score: number };

  // 🧬 Basma (البصمة)
  "basma:trait_discovered": { name: string; category: string };
  "basma:value_identified": { label: string };

  // 📋 Sijil (السجل)
  "sijil:activity_logged": { source: string; action: string };

  // 🚨 Nadhir (النذير)
  "nadhir:crisis_detected": { severity: string };
  "nadhir:crisis_resolved": Record<string, never>;

  // 💰 Raseed (الرصيد)
  "raseed:xp_earned": { source: string; amount: number; dimension: string };
  "raseed:level_up": { newLevel: number };

  // 📊 Athar (الأثر)
  "athar:impact_logged": { category: string; content: string };

  // 🔄 Dawra (الدورة)
  "dawra:entry_logged": { type: string; value: number };
  "dawra:pattern_detected": { type: string; phase: string };

  // Generic
  [key: `custom:${string}`]: unknown;
}

// ─── Event Bus Implementation ──────────────────────────

class EventBus {
  private listeners = new Map<string, Set<EventCallback>>();
  private _debug = false;
  private _history: Array<{ event: string; payload: unknown; time: number }> = [];
  private static readonly MAX_HISTORY = 100;

  /**
   * Subscribe to a domain event
   */
  on<K extends keyof DomainEvents>(
    event: K,
    callback: EventCallback<DomainEvents[K]>
  ): () => void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event as string)?.delete(callback as EventCallback);
    };
  }

  /**
   * Emit a domain event
   */
  emit<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]): void {
    // Debug logging
    if (this._debug) {
      const listenerCount = this.listeners.get(event as string)?.size ?? 0;
      console.log(
        `%c[EventBus] %c${String(event)}%c → ${listenerCount} listener(s)`,
        "color: #6366f1; font-weight: bold",
        "color: #34d399; font-weight: bold",
        "color: #94a3b8",
        payload
      );
    }

    // Record in history (always, for diagnostics)
    this._history.push({ event: event as string, payload, time: Date.now() });
    if (this._history.length > EventBus.MAX_HISTORY) {
      this._history.shift();
    }

    const callbacks = this.listeners.get(event as string);
    if (!callbacks) return;

    callbacks.forEach((cb) => {
      try {
        cb(payload);
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${String(event)}":`, error);
      }
    });
  }

  /**
   * Subscribe to an event, but only fire once
   */
  once<K extends keyof DomainEvents>(
    event: K,
    callback: EventCallback<DomainEvents[K]>
  ): () => void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      callback(payload);
    });
    return unsubscribe;
  }

  /**
   * Remove all listeners for an event
   */
  off<K extends keyof DomainEvents>(event: K): void {
    this.listeners.delete(event as string);
  }

  /**
   * Remove ALL listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  // ═══════════════════════════════════════════════════════════
  //                    DEBUG & DIAGNOSTICS
  // ═══════════════════════════════════════════════════════════

  /**
   * 🔍 تشغيل/إيقاف وضع التتبع — يسجل كل حدث في الـ console.
   *
   * @example
   *   eventBus.debug(true);   // تفعيل
   *   eventBus.debug(false);  // إيقاف
   *
   * Or from browser DevTools:
   *   __eventBus.debug(true)
   */
  debug(enable = true): void {
    this._debug = enable;
    console.log(`[EventBus] Debug mode ${enable ? "ON 🟢" : "OFF 🔴"}`);
  }

  /**
   * 📊 يرجع آخر N حدث تم بثهم (الأحدث أولاً)
   *
   * @example
   *   eventBus.history()     // آخر 20
   *   eventBus.history(50)   // آخر 50
   */
  history(count = 20): typeof this._history {
    return [...this._history].reverse().slice(0, count);
  }

  /**
   * 📡 يرجع عدد المستمعين لكل event — مفيد لكشف التسريبات
   *
   * @example
   *   eventBus.stats()
   *   // { "wird:completed_today": 2, "dawayir:node_added": 1, ... }
   */
  stats(): Record<string, number> {
    const result: Record<string, number> = {};
    this.listeners.forEach((set, key) => {
      if (set.size > 0) result[key] = set.size;
    });
    return result;
  }
}

// Singleton
export const eventBus = new EventBus();

// Expose to browser DevTools for live debugging
if (typeof window !== "undefined") {
  (window as any).__eventBus = eventBus;
}
