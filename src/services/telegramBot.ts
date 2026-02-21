/**
 * TELEGRAM_BOT.ts — الجهاز العصبي للنظام
 * =====================================================
 * نقطة الاتصال الوحيدة بين الماكينة ومحمد
 *
 * الوظائف:
 * 1. إرسال تقارير صحة النظام يومياً
 * 2. إرسال تقارير الدخل أسبوعياً
 * 3. طلب الموافقة على القرارات الحرجة
 * 4. استقبال الأوامر (موافق/رفض/إيقاف)
 */

import type { HealthCheckResult, HealthIssue } from "../ai/autoHealthCheck";
import type { RevenueMetrics, PricingRecommendation } from "../ai/revenueAutomation";
import type { AIDecision } from "../ai/decision-framework";

// ═══════════════════════════════════════════════════════════════════════════
// 🔑 Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TELEGRAM_CONFIG = {
  botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "",
  chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || "", // محمد's chat ID
  apiUrl: "https://api.telegram.org/bot",
};

// ═══════════════════════════════════════════════════════════════════════════
// 📊 Message Types
// ═══════════════════════════════════════════════════════════════════════════

export type TelegramMessageType =
  | "daily_health_report"
  | "weekly_revenue_report"
  | "decision_approval_request"
  | "emotional_pricing_notification"
  | "critical_error_alert"
  | "system_startup";

export interface TelegramMessage {
  type: TelegramMessageType;
  text: string;
  parseMode?: "Markdown" | "HTML";
  replyMarkup?: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 Telegram Bot Service
// ═══════════════════════════════════════════════════════════════════════════

export class TelegramBotService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = Boolean(TELEGRAM_CONFIG.botToken && TELEGRAM_CONFIG.chatId);
    if (!this.isEnabled) {
      console.warn("⚠️ Telegram Bot not configured. Set VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID in .env");
    }
  }

  private countIssuesByCategory(issues: HealthIssue[], category: HealthIssue["category"]): number {
    return issues.filter((issue) => issue.category === category).length;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * إرسال رسالة للتليجرام
   * ─────────────────────────────────────────────────────────────────
   */
  async sendMessage(message: TelegramMessage): Promise<boolean> {
    if (!this.isEnabled) {
      console.log("📱 [Telegram Bot Disabled] Would send:", message.text);
      return false;
    }

    try {
      const url = `${TELEGRAM_CONFIG.apiUrl}${TELEGRAM_CONFIG.botToken}/sendMessage`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.chatId,
          text: message.text,
          parse_mode: message.parseMode || "Markdown",
          reply_markup: message.replyMarkup,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      console.log("✅ Telegram message sent:", message.type);
      return true;
    } catch (error) {
      console.error("❌ Failed to send Telegram message:", error);
      return false;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تقرير الصحة اليومي
   * ─────────────────────────────────────────────────────────────────
   */
  async sendDailyHealthReport(health: HealthCheckResult): Promise<void> {
    const statusEmoji =
      health.status === "healthy" ? "✅" : health.status === "warning" ? "⚠️" : "🚨";

    const text = `
${statusEmoji} **تقرير دواير اليومي**

🏥 **الصحة:** ${health.score}/100 (${this.getStatusLabel(health.status)})

📊 **المشاكل المكتشفة:**
• أخطاء Console: ${this.countIssuesByCategory(health.issues, "error")}
• مشاكل التخزين: ${this.countIssuesByCategory(health.issues, "data")}
• مشاكل الأداء: ${this.countIssuesByCategory(health.issues, "performance")}
• مشاكل الحالة: ${this.countIssuesByCategory(health.issues, "state")}

${health.autoFixedIssues.length > 0 ? `🔧 **تم إصلاح ${health.autoFixedIssues.length} مشاكل تلقائياً**` : ""}

${health.status === "critical" ? "⚠️ **يحتاج انتباهك فوراً!**" : "✨ **كل شيء تمام**"}

📅 ${new Date(health.timestamp).toLocaleString("ar-EG")}
    `.trim();

    await this.sendMessage({
      type: "daily_health_report",
      text,
      parseMode: "Markdown",
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تقرير الدخل الأسبوعي
   * ─────────────────────────────────────────────────────────────────
   */
  async sendWeeklyRevenueReport(metrics: RevenueMetrics): Promise<void> {
    const text = `
💰 **تقرير الدخل الأسبوعي**

👥 **المستخدمين:** ${metrics.totalUsers}
• Free: ${metrics.breakdown.free}
• Premium (B2C): ${metrics.breakdown.premium}
• Enterprise (B2B): ${metrics.breakdown.coach}

💵 **الدخل:**
• MRR: $${metrics.mrr.toFixed(2)}
• ARR: $${metrics.arr.toFixed(2)}
• ARPU: $${metrics.avgRevenuePerUser.toFixed(2)}
• LTV: $${metrics.lifetimeValue.toFixed(2)}

📉 **Churn Rate:** ${(metrics.churnRate * 100).toFixed(1)}%

📈 **Conversion:**
• Free → B2C: ${(metrics.conversionRate.freeToPremium * 100).toFixed(1)}%
• B2C → B2B: ${(metrics.conversionRate.premiumToCoach * 100).toFixed(1)}%

📅 ${new Date().toLocaleString("ar-EG")}
    `.trim();

    await this.sendMessage({
      type: "weekly_revenue_report",
      text,
      parseMode: "Markdown",
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * طلب الموافقة على قرار تسعير
   * ─────────────────────────────────────────────────────────────────
   */
  async requestPricingApproval(
    recommendation: PricingRecommendation
  ): Promise<void> {
    const text = `
💡 **قرار معلق: تغيير الأسعار**

📊 **الاستراتيجية:** ${this.getStrategyLabel(recommendation.strategy)}

💵 **الأسعار المقترحة:**
• B2C Premium: $${recommendation.suggestedPrices.premium}/شهر
• B2B Enterprise: $${recommendation.suggestedPrices.coach}/شهر

📈 **التأثير المتوقع:**
• الدخل: ${recommendation.expectedImpact.revenueChange > 0 ? "+" : ""}${recommendation.expectedImpact.revenueChange.toFixed(1)}%
• Conversion: ${recommendation.expectedImpact.conversionChange > 0 ? "+" : ""}${recommendation.expectedImpact.conversionChange.toFixed(1)}%

🧠 **السبب:**
${recommendation.reasoning}

🎯 **الثقة:** ${recommendation.confidenceScore}%

**رد بـ "موافق" أو "رفض"**
    `.trim();

    await this.sendMessage({
      type: "decision_approval_request",
      text,
      parseMode: "Markdown",
      replyMarkup: {
        inline_keyboard: [
          [
            { text: "✅ موافق", callback_data: "approve_pricing" },
            { text: "❌ رفض", callback_data: "reject_pricing" },
          ],
        ],
      },
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * إشعار بالتسعير العاطفي (شهر مجاني لشخص في أزمة)
   * ─────────────────────────────────────────────────────────────────
   */
  async notifyEmotionalPricing(params: {
    userId: string;
    reason: "crisis" | "stable_offer";
    action: "free_month" | "premium_offer";
    analysis: {
      tei: number;
      shadowPulse: number;
      engagement: number;
    };
  }): Promise<void> {
    const actionEmoji = params.action === "free_month" ? "🎁" : "⭐";
    const reasonLabel =
      params.reason === "crisis"
        ? "شخص بيمر بأزمة حقيقية"
        : "شخص مستقر وجاهز للـ Premium";

    const text = `
${actionEmoji} **قرار التسعير العاطفي**

👤 **المستخدم:** ${params.userId}

🧠 **التحليل:**
• TEI (الفوضى العاطفية): ${params.analysis.tei}/100
• Shadow Pulse (الضغط النفسي): ${params.analysis.shadowPulse}/100
• Engagement (التفاعل): ${params.analysis.engagement}/100

💡 **السبب:** ${reasonLabel}

🎯 **القرار:**
${params.action === "free_month" ? "تم منح شهر مجاني كهدية من الرحلة 🌱" : "تم عرض Premium عليه بخصم خاص"}

**هذا القرار اتخذته الماكينة تلقائياً بناءً على المبادئ العلاجية.**

ملحوظة: البيانات محللة محلياً (Local-First) — لم يتم الاطلاع على المحتوى.
    `.trim();

    await this.sendMessage({
      type: "emotional_pricing_notification",
      text,
      parseMode: "Markdown",
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تنبيه بخطأ حرج
   * ─────────────────────────────────────────────────────────────────
   */
  async alertCriticalError(error: {
    message: string;
    severity: "critical" | "high";
    affectedFeatures: string[];
  }): Promise<void> {
    const text = `
🚨 **تنبيه: خطأ ${error.severity === "critical" ? "حرج" : "عالي"}**

⚠️ **الخطأ:**
${error.message}

🎯 **الفيتشرز المتأثرة:**
${error.affectedFeatures.map((f) => `• ${f}`).join("\n")}

${error.severity === "critical" ? "🛑 **يحتاج تدخل فوري!**" : "⏳ **يُفضل المراجعة قريباً**"}

📅 ${new Date().toLocaleString("ar-EG")}
    `.trim();

    await this.sendMessage({
      type: "critical_error_alert",
      text,
      parseMode: "Markdown",
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * إشعار بدء النظام
   * ─────────────────────────────────────────────────────────────────
   */
  async notifySystemStartup(): Promise<void> {
    const text = `
🌱 **دواير بدأت**

✅ Self-Healing System: نشط
✅ Revenue Automation: نشط
✅ Emotional Pricing Engine: نشط
✅ Telegram Bot: متصل

📡 **الماكينة جاهزة للعمل.**

سأرسل لك:
• تقرير صحة يومي (9 صباحاً)
• تقرير دخل أسبوعي (الأحد 9 صباحاً)
• طلبات موافقة على القرارات الحرجة

📅 ${new Date().toLocaleString("ar-EG")}
    `.trim();

    await this.sendMessage({
      type: "system_startup",
      text,
      parseMode: "Markdown",
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * Helpers
   * ─────────────────────────────────────────────────────────────────
   */
  private getStatusLabel(status: HealthCheckResult["status"]): string {
    switch (status) {
      case "healthy":
        return "ممتاز";
      case "warning":
        return "تحذير";
      case "critical":
        return "حرج";
      default:
        return "غير معروف";
    }
  }

  private getStrategyLabel(strategy: PricingRecommendation["strategy"]): string {
    const labels: Record<PricingRecommendation["strategy"], string> = {
      value_based: "التسعير بناءً على القيمة",
      competitor_based: "التسعير بناءً على المنافسين",
      penetration: "اختراق السوق (سعر منخفض)",
      premium: "تموضع Premium (سعر عالي)",
      dynamic: "تسعير ديناميكي",
    };
    return labels[strategy] || strategy;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const telegramBot = new TelegramBotService();

// ═══════════════════════════════════════════════════════════════════════════
// 📅 Scheduled Reports
// ═══════════════════════════════════════════════════════════════════════════

/**
 * جدولة التقارير اليومية والأسبوعية
 */
export function scheduleTelegramReports(): void {
  // تقرير صحة يومي الساعة 9 صباحاً
  const scheduleDailyReport = () => {
    const now = new Date();
    const next9AM = new Date(now);
    next9AM.setHours(9, 0, 0, 0);

    if (now.getHours() >= 9) {
      next9AM.setDate(next9AM.getDate() + 1);
    }

    const timeUntil9AM = next9AM.getTime() - now.getTime();

    setTimeout(() => {
      void sendDailyHealthReportNow();
      setInterval(() => {
        void sendDailyHealthReportNow();
      }, 24 * 60 * 60 * 1000); // كل 24 ساعة
    }, timeUntil9AM);
  };

  // تقرير دخل أسبوعي (كل أحد الساعة 9 صباحاً)
  const scheduleWeeklyReport = () => {
    const checkAndSend = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday
      const hour = now.getHours();

      if (day === 0 && hour === 9) {
        void sendWeeklyRevenueReportNow();
      }
    };

    // فحص كل ساعة
    checkAndSend();
    setInterval(checkAndSend, 60 * 60 * 1000);
  };

  scheduleDailyReport();
  scheduleWeeklyReport();

  console.log("✅ Telegram reports scheduled");
}

async function sendDailyHealthReportNow(): Promise<void> {
  try {
    const healthHistory = JSON.parse(
      localStorage.getItem("dawayir-health-history") || "[]"
    ) as HealthCheckResult[];

    const latestHealth = healthHistory[healthHistory.length - 1];

    if (latestHealth) {
      await telegramBot.sendDailyHealthReport(latestHealth);
    }
  } catch (error) {
    console.error("❌ Failed to send daily health report:", error);
  }
}

async function sendWeeklyRevenueReportNow(): Promise<void> {
  try {
    // Import dynamically to avoid circular dependency
    const { revenueEngine } = await import("../ai/revenueAutomation");
    const metrics = await revenueEngine.analyzeCurrentMetrics();

    if (metrics) {
      await telegramBot.sendWeeklyRevenueReport(metrics);
    }
  } catch (error) {
    console.error("❌ Failed to send weekly revenue report:", error);
  }
}
