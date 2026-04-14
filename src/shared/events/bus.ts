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

  // Generic
  [key: `custom:${string}`]: unknown;
}

// ─── Event Bus Implementation ──────────────────────────

class EventBus {
  private listeners = new Map<string, Set<EventCallback>>();

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
}

// Singleton
export const eventBus = new EventBus();
