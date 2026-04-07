/**
 * EMOTIONAL_PRICING_ENGINE.ts — محرك التسعير العاطفي
 * =====================================================
 * "الماكينة تحس بالمستخدم وتساعده في الوقت المناسب"
 *
 * المبدأ الأساسي:
 * - في الأزمة: ندعم (شهر مجاني)
 * - في الاستقرار: نعرض قيمة (Premium بخصم)
 *
 * الخصوصية:
 * - كل التحليل Local-First (على متصفح/جهاز المستخدم)
 * - لا نرسل محتوى الـ Journal للسيرفر أبداً
 * - نرسل فقط "Signal" (crisis/stable) بدون تفاصيل
 */

import { telegramBot } from "../services/telegramBot";
import { decisionEngine } from "./decision-framework";
import type { MapNode } from "../modules/map/mapTypes";
import type { DailyJournalEntry } from "../state/dailyJournalState";
import { grantEmotionalFreeMonth, saveEmotionalOffer } from "../services/subscriptionManager";
import { recordEmotionalPricingEvent } from "../services/emotionalPricingAnalytics";

// ═══════════════════════════════════════════════════════════════════════════
// 📊 User State Analysis
// ═══════════════════════════════════════════════════════════════════════════

export interface UserEmotionalState {
  userId: string;
  timestamp: number;

  // المؤشرات الأساسية (0-100)
  tei: number; // Trauma Entropy Index (100 = فوضى كاملة)
  shadowPulse: number; // Shadow Pulse Score (100 = ضغط عالي)
  engagement: number; // مستوى التفاعل (100 = نشط جداً)

  // المؤشرات الثانوية
  journalDepth: number; // عمق الكتابة (0-100)
  clarityImprovement: number; // تحسن الوضوح (-100 to +100)
  boundariesSet: number; // عدد الحدود المحددة
  consecutiveDays: number; // عدد الأيام المتتالية للاستخدام

  // التصنيف
  state: "crisis" | "struggling" | "stable" | "thriving";
  recommendedAction: "free_support" | "premium_offer" | "no_action";
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧠 Emotional Pricing Engine
// ═══════════════════════════════════════════════════════════════════════════

export class EmotionalPricingEngine {
  private readonly actionHistoryKey = "dawayir-emotional-pricing-last-action";
  /**
   * ─────────────────────────────────────────────────────────────────
   * تحليل حالة المستخدم (LOCAL-FIRST)
   * ─────────────────────────────────────────────────────────────────
   */
  analyzeUserState(params: {
    userId: string;
    nodes: MapNode[];
    journalEntries: DailyJournalEntry[];
    teiHistory: number[];
    shadowPulseHistory: number[];
  }): UserEmotionalState {
    const { userId, nodes, journalEntries, teiHistory, shadowPulseHistory } = params;

    // 1. حساب TEI (آخر قيمة)
    const currentTEI = teiHistory[teiHistory.length - 1] || 0;

    // 2. حساب Shadow Pulse (آخر قيمة)
    const currentShadowPulse = shadowPulseHistory[shadowPulseHistory.length - 1] || 0;

    // 3. حساب Engagement
    const engagement = this.calculateEngagement({
      nodes,
      journalEntries,
      recentDays: 7,
    });

    // 4. حساب Journal Depth
    const journalDepth = this.calculateJournalDepth(journalEntries);

    // 5. حساب Clarity Improvement
    const clarityImprovement = this.calculateClarityImprovement(teiHistory);

    // 6. حساب Boundaries Set
    const boundariesSet = nodes.filter((n) =>
      n.label.includes("حدود") || n.notes?.some((note) => note.text.includes("حدود"))
    ).length;

    // 7. حساب Consecutive Days
    const consecutiveDays = this.calculateConsecutiveDays(journalEntries);

    // 8. تحديد الحالة
    const state = this.determineState({
      tei: currentTEI,
      shadowPulse: currentShadowPulse,
      clarityImprovement,
      engagement,
    });

    // 9. تحديد الإجراء المقترح
    const recommendedAction = this.determineAction(state, {
      tei: currentTEI,
      engagement,
      consecutiveDays,
    });

    return {
      userId,
      timestamp: Date.now(),
      tei: currentTEI,
      shadowPulse: currentShadowPulse,
      engagement,
      journalDepth,
      clarityImprovement,
      boundariesSet,
      consecutiveDays,
      state,
      recommendedAction,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حساب مستوى التفاعل (Engagement)
   * ─────────────────────────────────────────────────────────────────
   */
  private calculateEngagement(params: {
    nodes: MapNode[];
    journalEntries: DailyJournalEntry[];
    recentDays: number;
  }): number {
    const { nodes, journalEntries, recentDays } = params;

    const recentCutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;

    // عدد الـ nodes المُنشأة مؤخراً
    const recentNodes = nodes.filter(
      (n) => n.journeyStartDate && n.journeyStartDate > recentCutoff
    ).length;

    // عدد إدخالات الـ Journal مؤخراً
    const recentJournals = journalEntries.filter(
      (e) => e.savedAt > recentCutoff
    ).length;

    // مجموع طول النصوص
    const totalTextLength = journalEntries
      .filter((e) => e.savedAt > recentCutoff)
      .reduce((sum, e) => sum + (e.answer?.length || 0), 0);

    // التقييم:
    // - كل node = 10 نقاط
    // - كل journal entry = 15 نقطة
    // - كل 100 حرف كتابة = 5 نقاط
    const score = Math.min(
      100,
      recentNodes * 10 + recentJournals * 15 + (totalTextLength / 100) * 5
    );

    return Math.round(score);
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حساب عمق الكتابة (Journal Depth)
   * ─────────────────────────────────────────────────────────────────
   */
  private calculateJournalDepth(entries: DailyJournalEntry[]): number {
    if (entries.length === 0) return 0;

    const recent = entries.slice(-7); // آخر 7 إدخالات

    const avgLength =
      recent.reduce((sum, e) => sum + (e.answer?.length || 0), 0) / recent.length;

    // كلمات عميقة (دلائل على تأمل)
    const deepWords = [
      "حاسس",
      "شاعر",
      "فاهم",
      "واعي",
      "مدرك",
      "محتاج",
      "عايز أفهم",
      "ليه",
      "إزاي",
      "خايف",
      "قلقان",
      "زعلان",
      "فرحان",
      "ممتن",
    ];

    const deepWordCount = recent.reduce((sum, e) => {
      const text = e.answer?.toLowerCase() || "";
      return (
        sum + deepWords.filter((word) => text.includes(word.toLowerCase())).length
      );
    }, 0);

    // التقييم:
    // - متوسط الطول > 50 حرف = 30 نقطة
    // - كل كلمة عميقة = 10 نقاط
    const score = Math.min(100, (avgLength > 50 ? 30 : 0) + deepWordCount * 10);

    return Math.round(score);
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حساب تحسن الوضوح (Clarity Improvement)
   * ─────────────────────────────────────────────────────────────────
   */
  private calculateClarityImprovement(teiHistory: number[]): number {
    if (teiHistory.length < 2) return 0;

    // مقارنة آخر 7 أيام بالـ 7 أيام قبلها
    const recent = teiHistory.slice(-7);
    const previous = teiHistory.slice(-14, -7);

    if (previous.length === 0) return 0;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

    // TEI بينخفض = وضوح بيزيد (positive improvement)
    const improvement = previousAvg - recentAvg;

    // تحويل لنطاق -100 to +100
    return Math.max(-100, Math.min(100, improvement));
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حساب الأيام المتتالية
   * ─────────────────────────────────────────────────────────────────
   */
  private calculateConsecutiveDays(entries: DailyJournalEntry[]): number {
    if (entries.length === 0) return 0;

    const sorted = [...entries].sort((a, b) => b.savedAt - a.savedAt);

    let consecutive = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of sorted) {
      const entryDate = new Date(entry.savedAt);
      entryDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (diffDays === consecutive) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحديد الحالة العاطفية
   * ─────────────────────────────────────────────────────────────────
   */
  private determineState(params: {
    tei: number;
    shadowPulse: number;
    clarityImprovement: number;
    engagement: number;
  }): UserEmotionalState["state"] {
    const { tei, shadowPulse, clarityImprovement, engagement } = params;

    // أزمة: TEI عالي جداً + Shadow Pulse عالي + وضوح بيسوء
    if (
      tei > 70 &&
      shadowPulse > 60 &&
      clarityImprovement < -20 &&
      engagement > 50
    ) {
      return "crisis";
    }

    // بيكافح: TEI متوسط-عالي + تحسن بطيء
    if (tei > 50 && clarityImprovement < 10 && engagement > 30) {
      return "struggling";
    }

    // مزدهر: TEI منخفض + تحسن واضح + engagement عالي
    if (tei < 30 && clarityImprovement > 20 && engagement > 60) {
      return "thriving";
    }

    // مستقر: كل شيء معتدل
    return "stable";
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحديد الإجراء المقترح
   * ─────────────────────────────────────────────────────────────────
   */
  private determineAction(
    state: UserEmotionalState["state"],
    params: {
      tei: number;
      engagement: number;
      consecutiveDays: number;
    }
  ): UserEmotionalState["recommendedAction"] {
    const { tei, engagement, consecutiveDays } = params;

    // في أزمة → دعم مجاني
    if (state === "crisis") {
      return "free_support";
    }

    // مستقر أو مزدهر + engagement عالي + ملتزم → عرض Premium
    if (
      (state === "stable" || state === "thriving") &&
      engagement > 70 &&
      consecutiveDays >= 7
    ) {
      return "premium_offer";
    }

    // بيكافح → دعم مجاني (لكن أخف من الأزمة)
    if (state === "struggling" && tei > 60) {
      return "free_support";
    }

    // باقي الحالات → لا شيء
    return "no_action";
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تنفيذ القرار (مع موافقة محمد للحالات الحرجة)
   * ─────────────────────────────────────────────────────────────────
   */
  async executeAction(state: UserEmotionalState): Promise<{
    executed: boolean;
    message: string;
  }> {
    if (state.recommendedAction === "no_action") {
      return { executed: false, message: "No action needed" };
    }

    const lastActionRaw = localStorage.getItem(this.actionHistoryKey);
    if (lastActionRaw) {
      try {
        const lastAction = JSON.parse(lastActionRaw) as { timestamp: number; action: UserEmotionalState["recommendedAction"] };
        const cooldownMs = 5 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastAction.timestamp < cooldownMs && lastAction.action === state.recommendedAction) {
          return { executed: false, message: "Action skipped (cooldown active)" };
        }
      } catch {
        // ignore parse errors
      }
    }

    // سجّل القرار
    await decisionEngine.execute({
      type: "emotional_pricing_triggered",
      reasoning: `User ${state.userId} in ${state.state} state. Action: ${state.recommendedAction}`,
      timestamp: Date.now(),
      payload: state,
      outcome: "executed",
    });

    // أبلغ محمد عبر Telegram
    await telegramBot.notifyEmotionalPricing({
      userId: state.userId,
      reason: state.state === "crisis" || state.state === "struggling" ? "crisis" : "stable_offer",
      action: state.recommendedAction === "free_support" ? "free_month" : "premium_offer",
      analysis: {
        tei: state.tei,
        shadowPulse: state.shadowPulse,
        engagement: state.engagement,
      },
    });

    // تنفيذ الإجراء
    if (state.recommendedAction === "free_support") {
      const offerId = `offer-${Date.now()}`;
      grantEmotionalFreeMonth();
      recordEmotionalPricingEvent("gift_granted", { offerId });
      localStorage.setItem(
        this.actionHistoryKey,
        JSON.stringify({ timestamp: Date.now(), action: state.recommendedAction })
      );
      console.warn(`🎁 Granting free month to ${state.userId}`);
      return {
        executed: true,
        message: "Free month granted as emotional support",
      };
    }

    if (state.recommendedAction === "premium_offer") {
      const offerId = `offer-${Date.now()}`;
      saveEmotionalOffer({
        id: offerId,
        createdAt: Date.now(),
        type: "premium_discount",
        title: "عرض تقدير لثباتك",
        message: "واضح إنك ماشي بخط ثابت. لك عرض Premium بخصم 35% لفترة محدودة.",
        discountPercent: 35,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        consumed: false,
      });
      recordEmotionalPricingEvent("discount_offer_created", { offerId });
      localStorage.setItem(
        this.actionHistoryKey,
        JSON.stringify({ timestamp: Date.now(), action: state.recommendedAction })
      );
      console.warn(`⭐ Offering premium to ${state.userId}`);
      return {
        executed: true,
        message: "Premium offer presented with special discount",
      };
    }

    return { executed: false, message: "Unknown action" };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * فحص دوري لكل المستخدمين (يوميا)
   * ─────────────────────────────────────────────────────────────────
   */
  async runDailyEmotionalCheck(): Promise<void> {
    console.warn("🧠 Running daily emotional pricing check...");

    try {
      // TODO: جلب بيانات كل المستخدمين من Supabase
      // مؤقتاً: نستخدم البيانات المحلية (localStorage)

      const nodes = JSON.parse(localStorage.getItem("dawayir-nodes") || "[]") as MapNode[];
      const journalEntries = JSON.parse(
        localStorage.getItem("dawayir-journal-entries") || "[]"
      ) as DailyJournalEntry[];
      const teiHistory = JSON.parse(
        localStorage.getItem("dawayir-tei-history") || "[]"
      ) as number[];
      const shadowPulseHistory = JSON.parse(
        localStorage.getItem("dawayir-shadow-history") || "[]"
      ) as number[];

      const state = this.analyzeUserState({
        userId: "current-user", // TODO: استخدام User ID الفعلي
        nodes,
        journalEntries,
        teiHistory,
        shadowPulseHistory,
      });

      console.warn("📊 User emotional state:", state);

      // تنفيذ الإجراء إذا لزم الأمر
      if (state.recommendedAction !== "no_action") {
        const result = await this.executeAction(state);
        console.warn("✅ Action result:", result);
      }
    } catch (error) {
      console.error("❌ Daily emotional check failed:", error);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const emotionalPricingEngine = new EmotionalPricingEngine();

/**
 * تشغيل الفحص اليومي التلقائي
 */
export function startDailyEmotionalCheck(): void {
  // تشغيل فوراً
  void emotionalPricingEngine.runDailyEmotionalCheck();

  // كل 24 ساعة
  setInterval(() => {
    void emotionalPricingEngine.runDailyEmotionalCheck();
  }, 24 * 60 * 60 * 1000);

  console.warn("✅ Daily emotional pricing check scheduled");
}

