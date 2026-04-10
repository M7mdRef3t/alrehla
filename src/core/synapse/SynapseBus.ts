/**
 * Synapse Event Bus — جهاز النقل العصبي للمنصة 🌩️
 * ===================================================
 * بدلاً من أن تستدعي المكونات بعضها بشكل مباشر، تقوم بـ "إطلاق" أحداث عصبية.
 * والمكونات الأخرى أو المشرف الذكي (Overseer) يستمع ويتعامل.
 * مبني على نمط Publish/Subscribe خفيف جداً ومستقل عن React.
 */

import { NeuralEvent, NeuralEventType } from "./types";

type NeuralObserver = (event: NeuralEvent) => void;

class SynapseNetwork {
  private observers: Set<NeuralObserver> = new Set();
  // Optional: Keep history of last N events for context
  private history: NeuralEvent[] = [];
  private readonly MAX_HISTORY = 100;

  /**
   * إطلاق نبضة عصبية في المنصة
   */
  public dispatch(
    type: NeuralEventType,
    origin: NeuralEvent["origin"],
    intensity: number,
    payload?: any
  ) {
    const event: NeuralEvent = {
      id: crypto.randomUUID(),
      type,
      origin,
      intensity,
      timestamp: Date.now(),
      payload,
    };

    // حفظ في الذاكرة قصيرة المدى
    this.history.unshift(event);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.pop();
    }

    // إبلاغ جميع العقد والمستقبلات
    this.observers.forEach((observer) => {
      try {
        observer(event);
      } catch (err) {
        console.error("Synapse: Error in observer execution", err);
      }
    });

    // Optional debug logging in Dev
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SYNAPSE] ⚡ ${origin} -> ${type} (Intensity: ${intensity})`, payload);
    }
  }

  /**
   * الاستماع لكل النبضات
   */
  public subscribe(observer: NeuralObserver): () => void {
    this.observers.add(observer);
    // Return unsubscribe function
    return () => {
      this.observers.delete(observer);
    };
  }

  /**
   * استرجاع الذاكرة العصبية الأخيرة (تفيد الـ Overseer)
   */
  public getRecentEvents(limit: number = 10): NeuralEvent[] {
    return this.history.slice(0, limit);
  }
}

// Global Singleton Instance
export const SynapseBus = new SynapseNetwork();
