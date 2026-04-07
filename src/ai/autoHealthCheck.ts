/**
 * AUTO_HEALTH_CHECK.ts — نظام الفحص الصحي التلقائي
 * ======================================================
 * يشتغل كل ساعة ويفحص:
 * - Console errors
 * - localStorage corruption
 * - API failures
 * - Performance issues
 * - State inconsistencies
 *
 * ولو لقى مشكلة، يحاول يصلحها تلقائياً (لو بسيطة)
 * أو يبعت تنبيه للأدمن (لو معقدة)
 */

import { decisionEngine } from "./decision-framework";
import type { AIDecision } from "./decision-framework";
import { sendOwnerSecurityWebhook } from "@/services/adminApi";
import { sendNotification } from "@/services/notifications";

// ═══════════════════════════════════════════════════════════════════════════
// 🏥 Health Check Result
// ═══════════════════════════════════════════════════════════════════════════

export interface HealthCheckResult {
  timestamp: number;
  status: "healthy" | "warning" | "critical";
  issues: HealthIssue[];
  autoFixedIssues: HealthIssue[];
  score: number; // 0-100 (100 = perfect health)
}

export interface HealthIssue {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "error" | "performance" | "data" | "api" | "state";
  description: string;
  autoFixable: boolean;
  autoFixed?: boolean;
  fixAttempted?: boolean;
  solution?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 Auto Health Checker Class
// ═══════════════════════════════════════════════════════════════════════════

export class AutoHealthChecker {
  private intervalId: number | null = null;
  private lastCheckTime = 0;
  private healthHistory: HealthCheckResult[] = [];
  private readonly CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  private readonly HISTORY_LIMIT = 168; // أسبوع (24×7)

  /**
   * بدء الفحص التلقائي
   */
  start(): void {
    if (this.intervalId !== null) return;

    // فحص فوري عند البداية
    void this.runHealthCheck();

    // ثم كل ساعة
    this.intervalId = window.setInterval(() => {
      void this.runHealthCheck();
    }, this.CHECK_INTERVAL_MS);

    console.warn("✅ Auto Health Check started (runs every hour)");
  }

  /**
   * إيقاف الفحص التلقائي
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.warn("⏸️ Auto Health Check stopped");
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تشغيل فحص صحي كامل
   * ─────────────────────────────────────────────────────────────────
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    console.warn("🏥 Running health check...");
    this.lastCheckTime = Date.now();

    const issues: HealthIssue[] = [];

    // 1. فحص Console Errors
    const consoleIssues = this.checkConsoleErrors();
    issues.push(...consoleIssues);

    // 2. فحص localStorage
    const storageIssues = this.checkLocalStorage();
    issues.push(...storageIssues);

    // 3. فحص Performance
    const perfIssues = this.checkPerformance();
    issues.push(...perfIssues);

    // 4. فحص State Consistency
    const stateIssues = this.checkStateConsistency();
    issues.push(...stateIssues);

    // 5. Auto-fix البسيط
    const autoFixedIssues = await this.attemptAutoFix(issues);

    // 6. حساب الـ Health Score
    const score = this.calculateHealthScore(issues, autoFixedIssues);

    // 7. تحديد الـ Status
    const status = this.determineStatus(score, issues);

    const result: HealthCheckResult = {
      timestamp: this.lastCheckTime,
      status,
      issues,
      autoFixedIssues,
      score,
    };

    // حفظ في الـ history
    this.saveToHistory(result);

    // لو في مشاكل critical، نبّه
    if (status === "critical") {
      await this.notifyAdmin(result);
    }

    console.warn(`🏥 Health check complete: ${status.toUpperCase()} (${score}/100)`);
    return result;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * 1. فحص Console Errors
   * ─────────────────────────────────────────────────────────────────
   */
  private checkConsoleErrors(): HealthIssue[] {
    // TODO: في production، نستخدم error tracking service (مثل Sentry)
    // مؤقتاً: نفحص localStorage للـ errors المحفوظة

    const issues: HealthIssue[] = [];

    try {
      const errorLog = localStorage.getItem("dawayir-error-log");
      if (!errorLog) return issues;

      const errors = JSON.parse(errorLog) as Array<{
        message: string;
        timestamp: number;
      }>;

      // فحص آخر ساعة فقط
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentErrors = errors.filter((e) => e.timestamp > oneHourAgo);

      if (recentErrors.length > 0) {
        issues.push({
          id: `console-errors-${Date.now()}`,
          severity: recentErrors.length > 5 ? "high" : "medium",
          category: "error",
          description: `${recentErrors.length} console errors في آخر ساعة`,
          autoFixable: false,
          solution: "تحقق من الـ error log في الـ Admin Dashboard",
        });
      }
    } catch {
      // ignore
    }

    return issues;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * 2. فحص localStorage
   * ─────────────────────────────────────────────────────────────────
   */
  private checkLocalStorage(): HealthIssue[] {
    const issues: HealthIssue[] = [];

    try {
      // فحص الـ keys الأساسية
      const criticalKeys = [
        "dawayir-map-state",
        "dawayir-daily-journal",
        "dawayir-shadow-pulse",
      ];

      for (const key of criticalKeys) {
        const value = localStorage.getItem(key);

        if (!value) {
          issues.push({
            id: `storage-missing-${key}`,
            severity: "medium",
            category: "data",
            description: `Missing localStorage key: ${key}`,
            autoFixable: true,
            solution: "Initialize with empty state",
          });
          continue;
        }

        // تحقق من الـ JSON validity
        try {
          JSON.parse(value);
        } catch {
          issues.push({
            id: `storage-corrupt-${key}`,
            severity: "high",
            category: "data",
            description: `Corrupted localStorage: ${key}`,
            autoFixable: true,
            solution: "Reset to empty state",
          });
        }
      }

      // فحص الحجم
      const totalSize = Object.keys(localStorage)
        .filter((k) => k.startsWith("dawayir-"))
        .reduce((sum, k) => {
          const value = localStorage.getItem(k);
          return sum + (value?.length || 0);
        }, 0);

      // localStorage limit عادة 5-10 MB
      const sizeMB = totalSize / (1024 * 1024);
      if (sizeMB > 8) {
        issues.push({
          id: "storage-size-warning",
          severity: "medium",
          category: "performance",
          description: `localStorage size: ${sizeMB.toFixed(2)} MB (اقترب من الحد الأقصى)`,
          autoFixable: false,
          solution: "Consider moving old data to Supabase",
        });
      }
    } catch {
      issues.push({
        id: "storage-access-error",
        severity: "critical",
        category: "data",
        description: "Cannot access localStorage",
        autoFixable: false,
        solution: "Check browser permissions",
      });
    }

    return issues;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * 3. فحص Performance
   * ─────────────────────────────────────────────────────────────────
   */
  private checkPerformance(): HealthIssue[] {
    const issues: HealthIssue[] = [];

    try {
      // فحص Memory (لو متاح)
      if ("memory" in performance && performance.memory) {
        const memory = performance.memory as {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };

        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        if (usagePercent > 80) {
          issues.push({
            id: "memory-high",
            severity: "high",
            category: "performance",
            description: `Memory usage: ${usagePercent.toFixed(1)}%`,
            autoFixable: false,
            solution: "Consider reloading the app",
          });
        }
      }

      // فحص Long Tasks (لو متاح)
      if ("getEntriesByType" in performance) {
        const longTasks = performance.getEntriesByType("longtask");
        if (longTasks.length > 10) {
          issues.push({
            id: "performance-long-tasks",
            severity: "medium",
            category: "performance",
            description: `${longTasks.length} long tasks detected`,
            autoFixable: false,
            solution: "Optimize heavy computations",
          });
        }
      }
    } catch {
      // ignore
    }

    return issues;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * 4. فحص State Consistency
   * ─────────────────────────────────────────────────────────────────
   */
  private checkStateConsistency(): HealthIssue[] {
    const issues: HealthIssue[] = [];

    try {
      // فحص mapState
      const mapStateRaw = localStorage.getItem("dawayir-map-state");
      if (mapStateRaw) {
        const mapState = JSON.parse(mapStateRaw);
        const nodes = mapState?.nodes || [];

        // فحص: هل في nodes بدون ID؟
        const nodesWithoutId = nodes.filter((n: { id?: string }) => !n.id);
        if (nodesWithoutId.length > 0) {
          issues.push({
            id: "state-nodes-without-id",
            severity: "high",
            category: "state",
            description: `${nodesWithoutId.length} nodes بدون ID`,
            autoFixable: true,
            solution: "Assign unique IDs",
          });
        }

        // فحص: هل في duplicate IDs؟
        const ids = nodes.map((n: { id?: string }) => n.id);
        const duplicates = ids.filter(
          (id: string, i: number) => ids.indexOf(id) !== i
        );
        if (duplicates.length > 0) {
          issues.push({
            id: "state-duplicate-ids",
            severity: "critical",
            category: "state",
            description: `Duplicate node IDs found: ${duplicates.join(", ")}`,
            autoFixable: true,
            solution: "Regenerate IDs for duplicates",
          });
        }
      }
    } catch {
      // ignore
    }

    return issues;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * 5. محاولة الإصلاح التلقائي
   * ─────────────────────────────────────────────────────────────────
   */
  private async attemptAutoFix(issues: HealthIssue[]): Promise<HealthIssue[]> {
    const fixed: HealthIssue[] = [];

    for (const issue of issues) {
      if (!issue.autoFixable) continue;

      let success = false;

      try {
        // طلب موافقة من الـ Decision Engine
        const decision: Omit<AIDecision, "timestamp"> = {
          type: "fix_bug",
          reasoning: `Auto-fix attempt for: ${issue.description}`,
          payload: { issue },
        };

        const canFix = await decisionEngine.evaluate(decision);
        if (!canFix.allowed) continue;

        // محاولة الإصلاح
        success = await this.fixIssue(issue);

        if (success) {
          issue.autoFixed = true;
          issue.fixAttempted = true;
          fixed.push(issue);
          console.warn(`✅ Auto-fixed: ${issue.description}`);

          // سجّل القرار
          await decisionEngine.execute({
            ...decision,
            timestamp: Date.now(),
            outcome: "executed",
          });
        }
      } catch (err) {
        console.error(`❌ Failed to auto-fix: ${issue.description}`, err);
        issue.fixAttempted = true;
        issue.autoFixed = false;
      }
    }

    return fixed;
  }

  /**
   * إصلاح مشكلة واحدة
   */
  private async fixIssue(issue: HealthIssue): Promise<boolean> {
    switch (issue.id.split("-")[0]) {
      case "storage": {
        // إصلاح localStorage
        if (issue.id.includes("missing")) {
          const key = issue.id.replace("storage-missing-", "");
          localStorage.setItem(key, JSON.stringify({}));
          return true;
        }
        if (issue.id.includes("corrupt")) {
          const key = issue.id.replace("storage-corrupt-", "");
          localStorage.setItem(key, JSON.stringify({}));
          return true;
        }
        break;
      }

      case "state": {
        // إصلاح State issues
        if (issue.id.includes("without-id")) {
          // إعادة تعيين IDs
          const mapStateRaw = localStorage.getItem("dawayir-map-state");
          if (mapStateRaw) {
            const mapState = JSON.parse(mapStateRaw);
            const nodes = mapState.nodes || [];
            nodes.forEach((n: { id?: string }, i: number) => {
              if (!n.id) n.id = `node-${Date.now()}-${i}`;
            });
            localStorage.setItem("dawayir-map-state", JSON.stringify(mapState));
            return true;
          }
        }
        break;
      }
    }

    return false;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حساب Health Score
   * ─────────────────────────────────────────────────────────────────
   */
  private calculateHealthScore(
    issues: HealthIssue[],
    fixedIssues: HealthIssue[]
  ): number {
    let score = 100;

    // خصم نقاط على حسب الـ severity
    for (const issue of issues) {
      if (issue.autoFixed) continue; // لو اتصلح، ما نخصمش

      switch (issue.severity) {
        case "low":
          score -= 2;
          break;
        case "medium":
          score -= 5;
          break;
        case "high":
          score -= 10;
          break;
        case "critical":
          score -= 20;
          break;
      }
    }

    // مكافأة على الإصلاح التلقائي
    score += fixedIssues.length * 3;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * تحديد الـ Status
   */
  private determineStatus(
    score: number,
    issues: HealthIssue[]
  ): HealthCheckResult["status"] {
    const hasCritical = issues.some((i) => i.severity === "critical" && !i.autoFixed);

    if (hasCritical || score < 50) return "critical";
    if (score < 80) return "warning";
    return "healthy";
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حفظ النتيجة في الـ History
   * ─────────────────────────────────────────────────────────────────
   */
  private saveToHistory(result: HealthCheckResult): void {
    this.healthHistory.push(result);

    // احتفظ بآخر أسبوع فقط
    if (this.healthHistory.length > this.HISTORY_LIMIT) {
      this.healthHistory = this.healthHistory.slice(-this.HISTORY_LIMIT);
    }

    // حفظ في localStorage
    try {
      localStorage.setItem(
        "dawayir-health-history",
        JSON.stringify(this.healthHistory.slice(-24)) // آخر 24 ساعة
      );
    } catch {
      // ignore
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * إرسال تنبيه للأدمن
   * ─────────────────────────────────────────────────────────────────
   */
  private async notifyAdmin(result: HealthCheckResult): Promise<void> {
    console.error("🚨 CRITICAL HEALTH ISSUE DETECTED:", result);

    try {
      import("@/services/adminApi").then((mod) => {
        mod.sendOwnerSecurityWebhook({
            type: "health_critical",
            status: result.status,
            score: result.score,
            issuesCount: result.issues.length,
            timestamp: result.timestamp
        });
      }).catch(console.error);
    } catch (e) {
      console.error("[HealthCheck] Webhook dispatch failed", e);
    }

    try {
      import("@/services/notifications").then((mod) => {
        mod.sendNotification({
          title: `حالة طوارئ صحية: ${result.status}`,
          body: `تم رصد عطل استراتيجي. تقييم المنصة: ${result.score}`,
          tag: `health-${result.timestamp}`
        });
      }).catch(console.error);
    } catch (e) {
      console.error("[HealthCheck] Native push dispatch failed", e);
    }

    try {
      const alerts = JSON.parse(
        localStorage.getItem("dawayir-health-alerts") || "[]"
      ) as HealthCheckResult[];

      alerts.push(result);

      localStorage.setItem(
        "dawayir-health-alerts",
        JSON.stringify(alerts.slice(-10))
      );
    } catch {
      // ignore
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * Helper: رجوع آخر نتيجة
   * ─────────────────────────────────────────────────────────────────
   */
  getLastResult(): HealthCheckResult | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  /**
   * Helper: رجوع الـ History الكامل
   */
  getHistory(): HealthCheckResult[] {
    return [...this.healthHistory];
  }

  /**
   * Helper: رجوع متوسط الـ Score لآخر 24 ساعة
   */
  getAverageScore(): number {
    if (this.healthHistory.length === 0) return 100;

    const last24 = this.healthHistory.slice(-24);
    const sum = last24.reduce((s, r) => s + r.score, 0);
    return Math.round(sum / last24.length);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const autoHealthChecker = new AutoHealthChecker();

/**
 * بدء الفحص التلقائي (يُستدعى في App.tsx)
 */
export function startAutoHealthCheck(): void {
  if (typeof window === "undefined") return;

  // بدء الفحص بعد 5 ثواني من تحميل الـ app
  setTimeout(() => {
    autoHealthChecker.start();
  }, 5000);
}

/**
 * إيقاف الفحص التلقائي
 */
export function stopAutoHealthCheck(): void {
  autoHealthChecker.stop();
}

