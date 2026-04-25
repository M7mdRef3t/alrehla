/* eslint-disable no-console */
/**
 * Leadership Overseer — الحاكم الذكي / الناصية 👁️
 * ===================================================
 * العقل المدبر الذي يعمل في الخلفية لمراقبة النشاط العصبي.
 * يحلل الأنماط (Patterns) يتخذ قرارات تلقائية (e.g., Lockdown).
 */

import { SynapseBus } from "./SynapseBus";
import { NeuralEvent } from "./types";

class PrefrontalCortex {
  private eventPatternWindow: NeuralEvent[] = [];
  private readonly WINDOW_DURATION_MS = 60000; // 1 minute context window

  constructor() {
    this.startListening();
  }

  private startListening() {
    SynapseBus.subscribe((event) => {
      this.registerEvent(event);
      this.analyzePatterns();
    });
  }

  private registerEvent(event: NeuralEvent) {
    const now = Date.now();
    this.eventPatternWindow.push(event);

    // Clean up old events outside the time window
    this.eventPatternWindow = this.eventPatternWindow.filter(
      (e) => now - e.timestamp < this.WINDOW_DURATION_MS
    );
  }

  /**
   * AI / Pattern Analysis Logic
   */
  private analyzePatterns() {
    // 1. Detect Overwhelming Stress (Multiple High-Intensity Or Drains)
    const stressfulEvents = this.eventPatternWindow.filter(
      (e) => e.type === "NODE_SHIFTED_OUTWARD" || e.type === "VAMPIRE_DETECTED" || e.type === "STRESS_SPIKED"
    );

    if (stressfulEvents.length >= 3) {
      // System goes into auto-lockdown to protect the user's energy
      console.warn("🛡️ Leadership Overseer: High stress pattern detected. Initiating Lockdown.");
      
      // Clear the window to avoid continuous firing
      this.eventPatternWindow = [];
      
      // Dispatch a System Meta-Event
      setTimeout(() => { // Dispatch asynchronously to avoid infinite loops if it triggers another analysis immediately
          SynapseBus.dispatch("LOCKDOWN_INITIATED", "SYSTEM_OVERSEER", 1.0, { reason: "Pattern of high energetic drain detected." });
      }, 0);
      return;
    }

    // 2. Detect Positive Momentum (Multiple Catharsis or Inward Shifts)
    const positiveEvents = this.eventPatternWindow.filter(
      (e) => e.type === "NODE_SHIFTED_INWARD" || e.type === "CATHARSIS_REACHED"
    );

    if (positiveEvents.length >= 3) {
        console.log("✨ Leadership Overseer: Positive healing pattern detected.");
        this.eventPatternWindow = [];
        setTimeout(() => {
            SynapseBus.dispatch("LOCKDOWN_LIFTED", "SYSTEM_OVERSEER", 1.0, { reason: "Positive momentum restoring system balance." });
        }, 0);
        return;
    }
  }
}

// Initialize the Overseer
export const LeadershipOverseer = new PrefrontalCortex();
