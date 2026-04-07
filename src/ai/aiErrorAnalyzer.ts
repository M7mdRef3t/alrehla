/**
 * AI_ERROR_ANALYZER.ts — محلل الأخطاء الذكي
 * =============================================
 * يستخدم Gemini لتحليل الـ errors واقتراح حلول
 */

import { geminiClient } from "../services/geminiClient";
import { decisionEngine } from "./decision-framework";

// ═══════════════════════════════════════════════════════════════════════════
// 📊 Error Analysis Result
// ═══════════════════════════════════════════════════════════════════════════

export interface ErrorAnalysisResult {
  error: {
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
  };
  analysis: {
    rootCause: string;
    severity: "low" | "medium" | "high" | "critical";
    category: string;
    affectedFeatures: string[];
  };
  suggestedFixes: {
    description: string;
    code?: string;
    filePath?: string;
    replaceTarget?: string;
    autoApplicable: boolean;
    estimatedImpact: "low" | "medium" | "high";
  }[];
  similarErrors: {
    message: string;
    timestamp: number;
    resolved: boolean;
  }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 AI Error Analyzer Class
// ═══════════════════════════════════════════════════════════════════════════

export class AIErrorAnalyzer {
  private errorHistory: Array<{
    error: Error;
    timestamp: number;
    analysis?: ErrorAnalysisResult;
    resolved: boolean;
  }> = [];

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحليل خطأ واحد
   * ─────────────────────────────────────────────────────────────────
   */
  async analyzeError(error: Error | string): Promise<ErrorAnalysisResult | null> {
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorStack = typeof error === "string" ? undefined : error.stack;

    console.warn("🔍 Analyzing error:", errorMessage);

    // بناء الـ prompt
    const prompt = this.buildAnalysisPrompt(errorMessage, errorStack);

    // طلب التحليل من Gemini
    const analysis = await geminiClient.generateJSON<{
      rootCause: string;
      severity: "low" | "medium" | "high" | "critical";
      category: string;
      affectedFeatures: string[];
      suggestedFixes: Array<{
        description: string;
        code?: string;
        filePath?: string;
        replaceTarget?: string;
        autoApplicable: boolean;
        estimatedImpact: "low" | "medium" | "high";
      }>;
    }>(prompt);

    if (!analysis) {
      console.warn("❌ Failed to analyze error");
      return null;
    }

    // البحث عن أخطاء مشابهة
    const similarErrors = this.findSimilarErrors(errorMessage);

    const result: ErrorAnalysisResult = {
      error: {
        message: errorMessage,
        stack: errorStack,
      },
      analysis,
      suggestedFixes: analysis.suggestedFixes,
      similarErrors,
    };

    // حفظ في الـ history
    this.saveToHistory(error, result);

    return result;
  }

  /**
   * بناء Prompt للتحليل
   */
  private buildAnalysisPrompt(message: string, stack?: string): string {
    return `
أنت خبير في تحليل الأخطاء في تطبيقات React + TypeScript.

# الخطأ
\`\`\`
${message}
${stack ? `\n${stack}` : ""}
\`\`\`

# السياق
- التطبيق: "دواير" — منصة علاجية تفاعلية
- التقنيات: React 18, TypeScript, Zustand, Supabase
- الهدف: نظام مستقر بنسبة 99.9%

# المطلوب
حلل الخطأ واقترح حلول. حاول استنتاج مسار الملف (filePath) من الـ stack trace والجزء المراد استبداله (replaceTarget). أرجع JSON:

\`\`\`json
{
  "rootCause": "السبب الجذري للخطأ",
  "severity": "low|medium|high|critical",
  "category": "نوع الخطأ (runtime, state, api, etc.)",
  "affectedFeatures": ["الميزات المتأثرة"],
  "suggestedFixes": [
    {
      "description": "وصف الحل",
      "code": "الكود المقترح (لو applicable)",
      "filePath": "المسار التقريبي للملف",
      "replaceTarget": "الكود القديم المراد استبداله",
      "autoApplicable": true/false,
      "estimatedImpact": "low|medium|high"
    }
  ]
}
\`\`\`
`;
  }

  /**
   * البحث عن أخطاء مشابهة
   */
  private findSimilarErrors(message: string): ErrorAnalysisResult["similarErrors"] {
    const similar: ErrorAnalysisResult["similarErrors"] = [];

    for (const entry of this.errorHistory) {
      const entryMessage =
        typeof entry.error === "string" ? entry.error : entry.error.message;

      // حساب similarity (Jaccard)
      const similarity = this.calculateSimilarity(message, entryMessage);

      if (similarity > 0.6) {
        similar.push({
          message: entryMessage,
          timestamp: entry.timestamp,
          resolved: entry.resolved,
        });
      }
    }

    return similar.slice(0, 5); // أقرب 5 أخطاء
  }

  /**
   * حساب Similarity بين رسالتي خطأ
   */
  private calculateSimilarity(msg1: string, msg2: string): number {
    const words1 = new Set(msg1.toLowerCase().split(/\s+/));
    const words2 = new Set(msg2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * محاولة تطبيق fix تلقائي
   * ─────────────────────────────────────────────────────────────────
   */
  async attemptAutoFix(
    analysis: ErrorAnalysisResult
  ): Promise<{ success: boolean; applied: string[] }> {
    const applied: string[] = [];

    for (const fix of analysis.suggestedFixes) {
      if (!fix.autoApplicable) continue;

      // طلب موافقة من Decision Engine
      const decision = {
        type: "fix_bug" as const,
        reasoning: `Auto-fix for: ${analysis.error.message}`,
        payload: { fix, error: analysis.error },
      };

      const canFix = await decisionEngine.evaluate(decision);
      if (!canFix.allowed) continue;

      // محاولة التطبيق
      const success = await this.applyFix(fix);

      if (success) {
        applied.push(fix.description);
        console.warn(`✅ Applied fix: ${fix.description}`);

        await decisionEngine.execute({
          ...decision,
          timestamp: Date.now(),
          outcome: "executed",
        });
      }
    }

    return { success: applied.length > 0, applied };
  }

  /**
   * تطبيق fix واحد
   */
  private async applyFix(fix: ErrorAnalysisResult["suggestedFixes"][0]): Promise<boolean> {
    if (!fix.filePath || !fix.replaceTarget || !fix.code) {
      console.warn("⚠️ Cannot apply fix: Missing filePath, replaceTarget, or code");
      return false;
    }

    try {
      const response = await fetch("/api/dev/apply-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: fix.filePath,
          replaceTarget: fix.replaceTarget,
          code: fix.code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Failed to apply AST fix:", errorData.error || response.statusText);
        return false;
      }

      console.warn(`✅ Applied AST fix to ${fix.filePath}`);
      return true;
    } catch (error) {
      console.error("❌ Error applying fix via API:", error);
      return false;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حفظ في الـ History
   * ─────────────────────────────────────────────────────────────────
   */
  private saveToHistory(error: Error | string, analysis: ErrorAnalysisResult): void {
    const errorObj = typeof error === "string" ? new Error(error) : error;

    this.errorHistory.push({
      error: errorObj,
      timestamp: Date.now(),
      analysis,
      resolved: false,
    });

    // احتفظ بآخر 100 خطأ
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }

    // حفظ في localStorage
    try {
      const summary = this.errorHistory.slice(-20).map((e) => ({
        message: e.error.message,
        timestamp: e.timestamp,
        severity: e.analysis?.analysis.severity,
        resolved: e.resolved,
      }));

      localStorage.setItem("dawayir-error-history", JSON.stringify(summary));
    } catch {
      // ignore
    }
  }

  /**
   * تعليم خطأ كـ "محلول"
   */
  markAsResolved(errorMessage: string): void {
    for (const entry of this.errorHistory) {
      const msg = typeof entry.error === "string" ? entry.error : entry.error.message;
      if (msg === errorMessage) {
        entry.resolved = true;
      }
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * Helpers
   * ─────────────────────────────────────────────────────────────────
   */
  getErrorHistory() {
    return [...this.errorHistory];
  }

  getUnresolvedErrors() {
    return this.errorHistory.filter((e) => !e.resolved);
  }

  getCriticalErrors() {
    return this.errorHistory.filter(
      (e) => e.analysis?.analysis.severity === "critical" && !e.resolved
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const aiErrorAnalyzer = new AIErrorAnalyzer();

/**
 * دالة مساعدة: تحليل خطأ سريع
 */
export async function quickAnalyze(error: Error | string): Promise<ErrorAnalysisResult | null> {
  return aiErrorAnalyzer.analyzeError(error);
}

/**
 * Global Error Handler — يمسك كل الـ errors
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    console.error("🚨 Global error caught:", event.error);

    // تحليل تلقائي
    void aiErrorAnalyzer.analyzeError(event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("🚨 Unhandled promise rejection:", event.reason);

    // تحليل تلقائي
    void aiErrorAnalyzer.analyzeError(
      event.reason instanceof Error ? event.reason : String(event.reason)
    );
  });

  console.warn("✅ Global error handler installed");
}

