import { supabase } from "./supabaseClient";
import { 
  subscribePerformanceWatchdog, 
  getPerformanceWatchdogSnapshot, 
  WatchdogSnapshot 
} from "./performanceWatchdog";
import { logger } from "./logger";

class PerformanceTracker {
  private lastSentAt: number = 0;
  private readonly SEND_INTERVAL_MS = 30000; // 30 seconds
  private isProcessing: boolean = false;

  /**
   * يبدأ تتبع الأداء وربطه بـ Watchdog
   */
  init() {
    if (typeof window === "undefined") return;
    
    console.log("[PerformanceTracker] Initializing Architect Sensors...");
    subscribePerformanceWatchdog((snapshot) => this.handleSnapshot(snapshot));
  }

  private async handleSnapshot(snapshot: WatchdogSnapshot) {
    const now = Date.now();
    
    // إرسال فوري لو فيه Freeze حرج، أو إرسال دوري كل 30 ثانية
    const isCritical = snapshot.status === "critical";
    const isIntervalPassed = now - this.lastSentAt >= this.SEND_INTERVAL_MS;

    if ((isCritical || isIntervalPassed) && !this.isProcessing) {
      await this.persistLogs(snapshot);
    }
  }

  private async persistLogs(snapshot: WatchdogSnapshot) {
    if (!supabase) return;

    this.isProcessing = true;
    try {
      const { error } = await supabase.from("performance_logs").insert({
        session_id: window.sessionStorage.getItem("alrehla_session_id") || "anonymous",
        status: snapshot.status,
        avg_lag_ms: snapshot.avgLagMs,
        p95_lag_ms: snapshot.p95LagMs,
        long_tasks_1m: snapshot.longTasks1m,
        freezes_1m: snapshot.freezes1m,
        last_freeze_at: snapshot.lastFreezeAt ? new Date(snapshot.lastFreezeAt).toISOString() : null,
        url: window.location.pathname
      });

      if (error) {
        // Silently Log to console if DB write fails, don't break the app
        console.error("[PerformanceTracker] Failed to persist logs:", error.message);
      } else {
        this.lastSentAt = Date.now();
      }
    } catch (err) {
      logger.error("[PerformanceTracker] Unexpected error during persistence", err);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const performanceTracker = new PerformanceTracker();
