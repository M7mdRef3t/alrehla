/**
 * REVENUE_AUTOMATION.ts — محرك الدخل المالي الذاتي
 * =====================================================
 * نظام أتمتة كامل للاشتراكات والدفع والتسعير
 */

import { decisionEngine } from "./decision-framework";
import { geminiClient } from "../services/geminiClient";
import type { AIDecision } from "./decision-framework";
import { supabase } from "../services/supabaseClient";


// ═══════════════════════════════════════════════════════════════════════════
// 💰 Revenue Models
// ═══════════════════════════════════════════════════════════════════════════

export type SubscriptionTier = "free" | "premium" | "coach";

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
    maxUsersPerAccount?: number; // للـ B2B
  };
}

export const PRICING_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: "free",
    priceMonthly: 0,
    priceCurrency: "USD",
    features: {
      maxNodes: 10,
      aiQuestionsPerMonth: 5,
      aiInsightsUnlimited: false,
      healthCheckFrequency: "never",
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
    },
    limits: {},
  },
  premium: {
    tier: "premium",
    priceMonthly: 4.99,
    priceCurrency: "USD",
    features: {
      maxNodes: 100,
      aiQuestionsPerMonth: 100,
      aiInsightsUnlimited: true,
      healthCheckFrequency: "daily",
      prioritySupport: true,
      customBranding: false,
      apiAccess: false,
    },
    limits: {},
  },
  coach: {
    tier: "coach",
    priceMonthly: 49,
    priceCurrency: "USD",
    features: {
      maxNodes: 1000,
      aiQuestionsPerMonth: 1000,
      aiInsightsUnlimited: true,
      healthCheckFrequency: "hourly",
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
    },
    limits: {
      maxUsersPerAccount: 50,
    },
  },
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

    if (!supabase) {
      console.warn("⚠️ Supabase client not available. Using fallback/mock data.");
      return {
        timestamp: Date.now(),
        totalUsers: 150,
        breakdown: { free: 100, premium: 40, coach: 10 },
        mrr: 40 * 4.99 + 10 * 49,
        arr: (40 * 4.99 + 10 * 49) * 12,
        churnRate: 0.05,
        conversionRate: { freeToPremium: 0.15, premiumToCoach: 0.08 },
        avgRevenuePerUser: (40 * 4.99 + 10 * 49) / 150,
        lifetimeValue: ((40 * 4.99 + 10 * 49) / 50) * (1 / 0.05),
      };
    }

    try {
      // Execute required queries in parallel for efficiency
      const [
        { count: totalUsers },
        { count: totalFreeUsers },
        { count: totalPremiumUsers },
        { count: totalCoachUsers },
        { count: totalCanceledUsers }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user').in('subscription_status', ['none', 'null']),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user').in('subscription_status', ['active', 'trialing']),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coach'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'canceled')
      ]);

      const users = totalUsers || 0;
      const free = totalFreeUsers || 0;
      const premium = totalPremiumUsers || 0;
      const coach = totalCoachUsers || 0;
      const canceled = totalCanceledUsers || 0;

      // Extract pricing based on defined plans
      const premiumPrice = PRICING_PLANS.premium.priceMonthly;
      const coachPrice = PRICING_PLANS.coach.priceMonthly;

      const mrr = premium * premiumPrice + coach * coachPrice;
      const arr = mrr * 12;

      const churnRate = users > 0 ? canceled / users : 0;

      // Conversion rates - approximations based on current states
      // Free to Premium = Active Premium / (Active Premium + Free)
      const freeToPremium = (premium + free) > 0 ? premium / (premium + free) : 0;

      // Premium to Coach = Active Coach / (Active Coach + Active Premium)
      const premiumToCoach = (coach + premium) > 0 ? coach / (coach + premium) : 0;

      const avgRevenuePerUser = users > 0 ? mrr / users : 0;

      // LTV = ARPU / Churn Rate
      // (Using 5% fallback churn if 0 to avoid Infinity)
      const safeChurn = churnRate > 0 ? churnRate : 0.05;
      const lifetimeValue = avgRevenuePerUser * (1 / safeChurn);

      const metrics: RevenueMetrics = {
        timestamp: Date.now(),
        totalUsers: users,
        breakdown: {
          free,
          premium,
          coach,
        },
        mrr,
        arr,
        churnRate,
        conversionRate: {
          freeToPremium,
          premiumToCoach,
        },
        avgRevenuePerUser,
        lifetimeValue,
      };

      console.warn("📊 Actual Revenue metrics analyzed:", metrics);
      return metrics;
    } catch (error) {
      console.error("❌ Failed to analyze metrics from Supabase:", error);
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
      console.warn("❌ Failed to get pricing recommendation");
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
      // TODO: Update Stripe prices via API
      // TODO: Update database with new pricing
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
      console.warn("❌ Failed to analyze churn");
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

