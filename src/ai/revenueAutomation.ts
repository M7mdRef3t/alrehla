/**
 * REVENUE_AUTOMATION.ts — محرك الدخل المالي الذاتي
 * =====================================================
 * نظام أتمتة كامل للاشتراكات والدفع والتسعير
 */

import { decisionEngine } from "./decision-framework";
import { geminiClient } from "../services/geminiClient";
import type { AIDecision } from "./decision-framework";
import {
  type PricingTier,
  TIER_PRICES_USD,
  TIER_LIMITS,
} from "../config/pricing";

// ═══════════════════════════════════════════════════════════════════════════
// 💰 Revenue Models
// ═══════════════════════════════════════════════════════════════════════════

export type SubscriptionTier = PricingTier;

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  priceMonthly: number;
  priceCurrency: "USD" | "EGP";
  features: {
    maxNodes: number;
    aiQuestionsPerMonth: number;
    aiInsightsUnlimited: boolean;
    healthCheckFrequency: "never" | "daily" | "hourly";
    prioritySupport: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  limits: {
    maxUsersPerAccount?: number;
  };
}

function buildPlan(tier: PricingTier): SubscriptionPlan {
  const limits = TIER_LIMITS[tier];
  return {
    tier,
    priceMonthly: TIER_PRICES_USD[tier].monthly,
    priceCurrency: "USD",
    features: {
      maxNodes: limits.maxMapNodes === -1 ? 1000 : limits.maxMapNodes,
      aiQuestionsPerMonth: limits.aiQuestionsPerMonth === -1 ? 1000 : limits.aiQuestionsPerMonth,
      aiInsightsUnlimited: limits.dailyAIMessages === -1,
      healthCheckFrequency: limits.healthCheckFrequency,
      prioritySupport: tier !== "basic",
      customBranding: tier === "coach",
      apiAccess: tier === "coach",
    },
    limits: {
      ...(tier === "coach" ? { maxUsersPerAccount: 50 } : {}),
    },
  };
}

export const PRICING_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  basic: buildPlan("basic"),
  premium: buildPlan("premium"),
  coach: buildPlan("coach"),
};

// ═══════════════════════════════════════════════════════════════════════════
// 📊 Revenue Analytics
// ═══════════════════════════════════════════════════════════════════════════

export interface RevenueMetrics {
  timestamp: number;
  totalUsers: number;
  breakdown: {
    free: number;
    premium: number;
    coach: number;
  };
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number; // معدل إلغاء الاشتراك
  conversionRate: {
    freeToPremium: number;
    premiumToCoach: number;
  };
  avgRevenuePerUser: number;
  lifetimeValue: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Pricing Strategy Types
// ═══════════════════════════════════════════════════════════════════════════

export type PricingStrategy =
  | "value_based" // سعر بناءً على القيمة المقدمة
  | "competitor_based" // سعر بناءً على المنافسين
  | "penetration" // سعر منخفض للاختراق السوق
  | "premium" // سعر عالي للـ premium positioning
  | "dynamic"; // سعر ديناميكي حسب الطلب

export interface PricingRecommendation {
  strategy: PricingStrategy;
  suggestedPrices: {
    premium: number;
    coach: number;
  };
  reasoning: string;
  expectedImpact: {
    revenueChange: number; // %
    conversionChange: number; // %
  };
  confidenceScore: number; // 0-100
  requiresApproval: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 Revenue Automation Engine
// ═══════════════════════════════════════════════════════════════════════════

export class RevenueAutomationEngine {
  /**
   * ─────────────────────────────────────────────────────────────────
   * تحليل الميتريكس الحالية
   * ─────────────────────────────────────────────────────────────────
   */
  async analyzeCurrentMetrics(): Promise<RevenueMetrics | null> {
    // في المستقبل: نجيب البيانات من Supabase
    // مؤقتاً: نحاكي البيانات

    try {
      // TODO: Replace with actual Supabase query
      const mockData: RevenueMetrics = {
        timestamp: Date.now(),
        totalUsers: 150,
        breakdown: {
          free: 100,
          premium: 40,
          coach: 10,
        },
        mrr: 40 * 4.99 + 10 * 49, // $689.6
        arr: (40 * 4.99 + 10 * 49) * 12, // $8,275.2
        churnRate: 0.05, // 5%
        conversionRate: {
          freeToPremium: 0.15, // 15% من Free بيحولوا لـ Premium
          premiumToCoach: 0.08, // 8% من B2C بيحولوا لـ B2B
        },
        avgRevenuePerUser: (40 * 4.99 + 10 * 49) / 150,
        lifetimeValue: ((40 * 4.99 + 10 * 49) / 50) * (1 / 0.05), // LTV = ARPU × (1/churn)
      };

      console.warn("📊 Revenue metrics analyzed:", mockData);
      return mockData;
    } catch (error) {
      console.error("❌ Failed to analyze metrics:", error);
      return null;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * اقتراح تسعير جديد بناءً على البيانات
   * ─────────────────────────────────────────────────────────────────
   */
  async suggestPricingOptimization(
    currentMetrics: RevenueMetrics
  ): Promise<PricingRecommendation | null> {
    console.warn("💡 Requesting pricing optimization from AI...");

    const prompt = this.buildPricingPrompt(currentMetrics);

    const recommendation = await geminiClient.generateJSON<{
      strategy: PricingStrategy;
      b2c_price: number;
      b2b_price: number;
      reasoning: string;
      revenue_change_percent: number;
      conversion_change_percent: number;
      confidence: number;
    }>(prompt);

    if (!recommendation) {
      console.warn("❌ Failed to get pricing recommendation. This could be due to API limits or malformed JSON.");
      return null;
    }

    const result: PricingRecommendation = {
      strategy: recommendation.strategy,
      suggestedPrices: {
        premium: recommendation.b2c_price,
        coach: recommendation.b2b_price,
      },
      reasoning: recommendation.reasoning,
      expectedImpact: {
        revenueChange: recommendation.revenue_change_percent,
        conversionChange: recommendation.conversion_change_percent,
      },
      confidenceScore: recommendation.confidence,
      requiresApproval: true, // دايماً يحتاج موافقة
    };

    console.warn("✅ Pricing recommendation generated:", result);
    return result;
  }

  /**
   * بناء Prompt لتحليل التسعير
   */
  private buildPricingPrompt(metrics: RevenueMetrics): string {
    return `
أنت خبير استراتيجية تسعير SaaS.

# البيانات الحالية
- إجمالي المستخدمين: ${metrics.totalUsers}
- Free: ${metrics.breakdown.free}
- Premium ($4.99/month): ${metrics.breakdown.premium}
- Coach ($49/month): ${metrics.breakdown.coach}
- MRR: $${metrics.mrr.toFixed(2)}
- ARR: $${metrics.arr.toFixed(2)}
- Churn Rate: ${(metrics.churnRate * 100).toFixed(1)}%
- Conversion (Free→Premium): ${(metrics.conversionRate.freeToPremium * 100).toFixed(1)}%
- Conversion (Premium→Coach): ${(metrics.conversionRate.premiumToCoach * 100).toFixed(1)}%
- ARPU: $${metrics.avgRevenuePerUser.toFixed(2)}
- LTV: $${metrics.lifetimeValue.toFixed(2)}

# السياق
- المنتج: منصة علاج نفسي تفاعلية ("دواير")
- السوق: الوطن العربي + Global (Arabic speakers)
- القيمة المقدمة: AI-powered therapy guidance + community + self-awareness tools

# المطلوب
اقترح استراتيجية تسعير محسّنة لزيادة الـ MRR بنسبة 20-40% خلال 3 أشهر.

# الخيارات الاستراتيجية
1. **value_based**: سعر بناءً على القيمة (زيادة السعر لو القيمة عالية)
2. **competitor_based**: سعر بناءً على المنافسين (BetterHelp, Talkspace)
3. **penetration**: تخفيض السعر للوصول لشريحة أكبر
4. **premium**: رفع السعر لـ premium positioning
5. **dynamic**: أسعار ديناميكية حسب الطلب/الموقع

# الرد المطلوب (JSON)
\`\`\`json
{
  "strategy": "value_based|competitor_based|penetration|premium|dynamic",
  "b2c_price": 4.99,  // السعر المقترح للـ B2C (شهري)
  "b2b_price": 49,    // السعر المقترح للـ B2B (شهري)
  "reasoning": "السبب المنطقي للاقتراح ده (3-4 جمل)",
  "revenue_change_percent": 25.0,  // التغيير المتوقع في الدخل (%)
  "conversion_change_percent": 5.0, // التغيير المتوقع في Conversion (%)
  "confidence": 75  // ثقتك في التوصية (0-100)
}
\`\`\`
`;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تطبيق تغيير التسعير (يحتاج موافقة)
   * ─────────────────────────────────────────────────────────────────
   */
  async applyPricingChange(
    recommendation: PricingRecommendation
  ): Promise<{ success: boolean; message: string }> {
    // طلب موافقة من Decision Engine
    const decision: Omit<AIDecision, "timestamp"> = {
      type: "pricing_change",
      reasoning: recommendation.reasoning,
      payload: recommendation,
    };

    const evaluation = await decisionEngine.evaluate(decision);

    if (!evaluation.allowed) {
      console.warn("❌ Pricing change denied by decision engine");
      return { success: false, message: "Decision engine denied the change" };
    }

    if (evaluation.requiresApproval) {
      console.warn("⏳ Pricing change requires manual approval");

      await decisionEngine.execute({
        ...decision,
        timestamp: Date.now(),
        outcome: "pending_approval",
      });

      return {
        success: false,
        message: "Waiting for admin approval in decision log",
      };
    }

    // تطبيق التغيير
    try {
      // TODO: ربط تغيير الأسعار بمصدر التسعير الفعلي عند تفعيله
      const { supabase } = await import("../services/supabaseClient");
      if (supabase) {
        const { error: dbError } = await supabase.from("system_settings").upsert({
          key: "ai_dynamic_pricing",
          value: {
            premium: recommendation.suggestedPrices.premium,
            coach: recommendation.suggestedPrices.coach,
            reasoning: recommendation.reasoning,
            updatedAt: new Date().toISOString()
          }
        }, { onConflict: "key" });

        if (dbError) {
          console.error("❌ Failed to update pricing in database:", dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }
      } else {
        console.warn("⚠️ Supabase client not available, skipping database update.");
      }
      // TODO: Notify existing users about grandfathering policy

      console.warn("✅ Pricing changed successfully:", recommendation.suggestedPrices);

      await decisionEngine.execute({
        ...decision,
        timestamp: Date.now(),
        outcome: "executed",
      });

      return {
        success: true,
        message: `Pricing updated: Premium=$${recommendation.suggestedPrices.premium}, Coach=$${recommendation.suggestedPrices.coach}`,
      };
    } catch (error) {
      console.error("❌ Failed to apply pricing change:", error);
      return { success: false, message: String(error) };
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحليل أسباب الـ Churn واقتراح حلول
   * ─────────────────────────────────────────────────────────────────
   */
  async analyzeChurn(metrics: RevenueMetrics): Promise<{
    topReasons: string[];
    suggestedActions: string[];
    estimatedChurnReduction: number;
  } | null> {
    console.warn("🔍 Analyzing churn reasons...");

    const prompt = `
أنت خبير في تحليل الـ Churn في SaaS.

# البيانات
- Churn Rate: ${(metrics.churnRate * 100).toFixed(1)}%
- المنتج: منصة علاج نفسي تفاعلية

# المطلوب
حدد أهم 3 أسباب محتملة للـ Churn + اقترح 3 حلول.

# الرد (JSON)
\`\`\`json
{
  "top_reasons": ["السبب الأول", "السبب الثاني", "السبب الثالث"],
  "suggested_actions": ["الحل الأول", "الحل الثاني", "الحل الثالث"],
  "estimated_reduction_percent": 30.0
}
\`\`\`
`;

    const analysis = await geminiClient.generateJSON<{
      top_reasons: string[];
      suggested_actions: string[];
      estimated_reduction_percent: number;
    }>(prompt);

    if (!analysis) {
      console.warn("❌ Failed to analyze churn. Gemini did not return a valid analysis.");
      return null;
    }

    return {
      topReasons: analysis.top_reasons,
      suggestedActions: analysis.suggested_actions,
      estimatedChurnReduction: analysis.estimated_reduction_percent,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تشغيل تحليل دوري للدخل (كل أسبوع)
   * ─────────────────────────────────────────────────────────────────
   */
  async runWeeklyRevenueAnalysis(): Promise<void> {
    console.warn("📈 Running weekly revenue analysis...");

    try {
      // 1. تحليل الميتريكس
      const metrics = await this.analyzeCurrentMetrics();
      if (!metrics) return;

      // 2. اقتراح تحسين التسعير
      const pricingRec = await this.suggestPricingOptimization(metrics);
      if (pricingRec) {
        console.warn("💡 Pricing recommendation:", pricingRec);
        // سيظهر في الـ Admin Dashboard للموافقة
      }

      // 3. تحليل الـ Churn
      const churnAnalysis = await this.analyzeChurn(metrics);
      if (churnAnalysis) {
        console.warn("🔍 Churn analysis:", churnAnalysis);
      }

      // 4. حفظ التقرير في localStorage
      this.saveWeeklyReport({
        timestamp: Date.now(),
        metrics,
        pricingRecommendation: pricingRec,
        churnAnalysis,
      });

      console.warn("✅ Weekly revenue analysis complete");
    } catch (error) {
      console.error("❌ Weekly revenue analysis failed:", error);
    }
  }

  /**
   * حفظ التقرير الأسبوعي
   */
  private saveWeeklyReport(report: {
    timestamp: number;
    metrics: RevenueMetrics | null;
    pricingRecommendation: PricingRecommendation | null;
    churnAnalysis: {
      topReasons: string[];
      suggestedActions: string[];
      estimatedChurnReduction: number;
    } | null;
  }): void {
    try {
      const existing = JSON.parse(
        localStorage.getItem("dawayir-revenue-reports") || "[]"
      ) as typeof report[];

      existing.push(report);

      // احتفظ بآخر 12 تقرير (3 شهور)
      const trimmed = existing.slice(-12);

      localStorage.setItem("dawayir-revenue-reports", JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  }

  /**
   * استرجاع التقارير السابقة
   */
  getRevenueReports(): Array<{
    timestamp: number;
    metrics: RevenueMetrics | null;
    pricingRecommendation: PricingRecommendation | null;
    churnAnalysis: {
      topReasons: string[];
      suggestedActions: string[];
      estimatedChurnReduction: number;
    } | null;
  }> {
    try {
      return JSON.parse(localStorage.getItem("dawayir-revenue-reports") || "[]");
    } catch {
      return [];
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const revenueEngine = new RevenueAutomationEngine();

/**
 * بدء التحليل الأسبوعي التلقائي
 */
export function startWeeklyRevenueAnalysis(): void {
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  // تشغيل فوراً
  void revenueEngine.runWeeklyRevenueAnalysis();

  // كل أسبوع
  setInterval(() => {
    void revenueEngine.runWeeklyRevenueAnalysis();
  }, ONE_WEEK_MS);

  console.warn("✅ Weekly revenue analysis scheduled");
}

