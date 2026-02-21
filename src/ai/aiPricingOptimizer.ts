/**
 * AI_PRICING_OPTIMIZER.ts — محسّن التسعير بالذكاء الاصطناعي
 * =====================================================
 * نظام ذكي لتحليل الأسعار واقتراح استراتيجيات تسعير ديناميكية
 */

import { geminiClient } from "../services/geminiClient";
import { decisionEngine } from "./decision-framework";
import {
  revenueEngine,
  type RevenueMetrics,
  type PricingStrategy,
  type PricingRecommendation,
} from "./revenueAutomation";

// ═══════════════════════════════════════════════════════════════════════════
// 📊 Market Intelligence Types
// ═══════════════════════════════════════════════════════════════════════════

export interface CompetitorPricing {
  name: string;
  tier: "basic" | "premium" | "enterprise";
  priceMonthly: number;
  features: string[];
  marketPosition: "budget" | "mid_market" | "premium";
  source: string; // URL or reference
}

export interface MarketAnalysis {
  timestamp: number;
  averagePricing: {
    basic: number;
    premium: number;
    enterprise: number;
  };
  competitors: CompetitorPricing[];
  marketTrends: {
    direction: "increasing" | "stable" | "decreasing";
    reasoning: string;
  };
  recommendedPosition: "budget" | "mid_market" | "premium";
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 A/B Testing Types
// ═══════════════════════════════════════════════════════════════════════════

export interface PricingExperiment {
  id: string;
  name: string;
  startDate: number;
  endDate: number | null;
  variants: {
    control: { b2c: number; b2b: number };
    variant: { b2c: number; b2b: number };
  };
  results: {
    control: {
      conversions: number;
      revenue: number;
      avgOrderValue: number;
    };
    variant: {
      conversions: number;
      revenue: number;
      avgOrderValue: number;
    };
  } | null;
  status: "running" | "completed" | "stopped";
  winner: "control" | "variant" | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 AI Pricing Optimizer Class
// ═══════════════════════════════════════════════════════════════════════════

export class AIPricingOptimizer {
  private currentExperiment: PricingExperiment | null = null;

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحليل السوق من المنافسين
   * ─────────────────────────────────────────────────────────────────
   */
  async analyzeMarket(): Promise<MarketAnalysis | null> {
    console.log("🔍 Analyzing market and competitors...");

    // قائمة المنافسين في مجال الصحة النفسية الرقمية
    const competitors: CompetitorPricing[] = [
      {
        name: "BetterHelp",
        tier: "premium",
        priceMonthly: 60,
        features: ["Live therapy sessions", "Messaging", "Worksheets"],
        marketPosition: "mid_market",
        source: "https://www.betterhelp.com/pricing/",
      },
      {
        name: "Talkspace",
        tier: "premium",
        priceMonthly: 69,
        features: ["Unlimited messaging", "Live sessions", "Psychiatry"],
        marketPosition: "mid_market",
        source: "https://www.talkspace.com/pricing/",
      },
      {
        name: "Calm (Meditation)",
        tier: "basic",
        priceMonthly: 14.99,
        features: ["Meditation", "Sleep stories", "Music"],
        marketPosition: "budget",
        source: "https://www.calm.com/pricing/",
      },
      {
        name: "Headspace",
        tier: "basic",
        priceMonthly: 12.99,
        features: ["Meditation", "Mindfulness", "Sleep"],
        marketPosition: "budget",
        source: "https://www.headspace.com/pricing/",
      },
      {
        name: "Notion (Productivity)",
        tier: "premium",
        priceMonthly: 10,
        features: ["Unlimited pages", "Collaboration", "AI"],
        marketPosition: "mid_market",
        source: "https://www.notion.so/pricing",
      },
    ];

    const prompt = `
أنت خبير في تحليل الأسواق والتسعير التنافسي.

# بيانات المنافسين
${competitors.map((c) => `- **${c.name}** (${c.tier}): $${c.priceMonthly}/month — ${c.features.join(", ")}`).join("\n")}

# منتجنا: دواير (Dawayir)
- نوع المنتج: AI-powered mental health + self-awareness platform
- السوق المستهدف: الوطن العربي + Arabic speakers globally
- الميزات الفريدة: خريطة دواير تفاعلية + أسئلة يومية مدفوعة بالـ AI + تحليل نفسي ذكي
- السعر الحالي: $4.99 (B2C), $49 (B2B)

# المطلوب
حلل السوق واقترح:
1. متوسط الأسعار في كل Tier
2. اتجاه السوق (هل الأسعار بترتفع ولا بتنخفض؟)
3. الموقع الأمثل لمنتجنا (budget / mid-market / premium)

# الرد (JSON)
\`\`\`json
{
  "average_pricing": {
    "basic": 13.5,
    "premium": 50.0,
    "enterprise": 100.0
  },
  "market_trend": "stable|increasing|decreasing",
  "trend_reasoning": "السبب في جملة واحدة",
  "recommended_position": "budget|mid_market|premium",
  "positioning_reasoning": "ليه الموقع ده مناسب لمنتجنا (2-3 جمل)"
}
\`\`\`
`;

    const analysis = await geminiClient.generateJSON<{
      average_pricing: { basic: number; premium: number; enterprise: number };
      market_trend: "stable" | "increasing" | "decreasing";
      trend_reasoning: string;
      recommended_position: "budget" | "mid_market" | "premium";
      positioning_reasoning: string;
    }>(prompt);

    if (!analysis) {
      console.warn("❌ Failed to analyze market");
      return null;
    }

    const result: MarketAnalysis = {
      timestamp: Date.now(),
      averagePricing: analysis.average_pricing,
      competitors,
      marketTrends: {
        direction: analysis.market_trend,
        reasoning: analysis.trend_reasoning,
      },
      recommendedPosition: analysis.recommended_position,
    };

    console.log("✅ Market analysis complete:", result);
    return result;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * اقتراح تحسين التسعير بناءً على البيانات الداخلية + السوق
   * ─────────────────────────────────────────────────────────────────
   */
  async optimizePricing(params: {
    currentMetrics: RevenueMetrics;
    marketAnalysis?: MarketAnalysis;
  }): Promise<PricingRecommendation | null> {
    console.log("💡 Optimizing pricing with AI...");

    const { currentMetrics, marketAnalysis } = params;

    const prompt = this.buildOptimizationPrompt(currentMetrics, marketAnalysis);

    const recommendation = await geminiClient.generateJSON<{
      strategy: PricingStrategy;
      b2c_price: number;
      b2b_price: number;
      reasoning: string;
      revenue_change_percent: number;
      conversion_change_percent: number;
      confidence: number;
      alternative_strategies?: Array<{
        name: string;
        b2c: number;
        b2b: number;
        pros: string;
        cons: string;
      }>;
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
      requiresApproval: true,
    };

    console.log("✅ Pricing optimization complete:", result);

    // سجّل القرار في الـ Decision Log
    await decisionEngine.execute({
      type: "pricing_change",
      reasoning: result.reasoning,
      timestamp: Date.now(),
      payload: result,
      outcome: "pending_approval",
    });

    return result;
  }

  /**
   * بناء Prompt للتحسين
   */
  private buildOptimizationPrompt(
    metrics: RevenueMetrics,
    marketAnalysis?: MarketAnalysis
  ): string {
    const marketSection = marketAnalysis
      ? `
# تحليل السوق
- متوسط الأسعار: Basic=$${marketAnalysis.averagePricing.basic}, Premium=$${marketAnalysis.averagePricing.premium}, Enterprise=$${marketAnalysis.averagePricing.enterprise}
- اتجاه السوق: ${marketAnalysis.marketTrends.direction} (${marketAnalysis.marketTrends.reasoning})
- الموقع المقترح: ${marketAnalysis.recommendedPosition}
`
      : "";

    return `
أنت خبير استراتيجية تسعير SaaS.

# البيانات الداخلية
- إجمالي المستخدمين: ${metrics.totalUsers}
- Free: ${metrics.breakdown.free}
- B2C Premium ($4.99): ${metrics.breakdown.premium}
- B2B Enterprise ($49): ${metrics.breakdown.coach}
- MRR: $${metrics.mrr.toFixed(2)}
- ARR: $${metrics.arr.toFixed(2)}
- Churn Rate: ${(metrics.churnRate * 100).toFixed(1)}%
- Conversion (Free→B2C): ${(metrics.conversionRate.freeToPremium * 100).toFixed(1)}%
- LTV: $${metrics.lifetimeValue.toFixed(2)}

${marketSection}

# المطلوب
اقترح استراتيجية تسعير محسّنة لزيادة الدخل بنسبة 20-40% خلال 3 شهور.

# استراتيجيات ممكنة
1. **value_based**: زيادة السعر بناءً على القيمة (لو LTV عالي + Churn منخفض)
2. **competitor_based**: مطابقة المنافسين
3. **penetration**: تخفيض مؤقت للاختراق
4. **premium**: رفع السعر لـ premium positioning
5. **dynamic**: أسعار ديناميكية (حسب الموقع / الطلب)

# الرد (JSON)
\`\`\`json
{
  "strategy": "value_based",
  "b2c_price": 6.99,
  "b2b_price": 59,
  "reasoning": "السبب المنطقي (3-4 جمل)",
  "revenue_change_percent": 30.0,
  "conversion_change_percent": -5.0,
  "confidence": 80,
  "alternative_strategies": [
    {
      "name": "Penetration",
      "b2c": 2.99,
      "b2b": 39,
      "pros": "زيادة Conversion",
      "cons": "تقليل ARPU"
    }
  ]
}
\`\`\`
`;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * إنشاء A/B Test للتسعير
   * ─────────────────────────────────────────────────────────────────
   */
  async createPricingExperiment(params: {
    name: string;
    variantPrices: { b2c: number; b2b: number };
    durationDays: number;
  }): Promise<PricingExperiment | null> {
    console.log("🧪 Creating pricing experiment...", params);

    // التحقق من عدم وجود تجربة جارية
    if (this.currentExperiment?.status === "running") {
      console.warn("⚠️ An experiment is already running");
      return null;
    }

    const experiment: PricingExperiment = {
      id: `exp-${Date.now()}`,
      name: params.name,
      startDate: Date.now(),
      endDate: Date.now() + params.durationDays * 24 * 60 * 60 * 1000,
      variants: {
        control: { b2c: 4.99, b2b: 49 },
        variant: params.variantPrices,
      },
      results: null,
      status: "running",
      winner: null,
    };

    this.currentExperiment = experiment;

    // حفظ في localStorage
    localStorage.setItem(
      "dawayir-pricing-experiment",
      JSON.stringify(experiment)
    );

    console.log("✅ Pricing experiment started:", experiment.id);

    // سجّل القرار
    await decisionEngine.execute({
      type: "ab_test_started",
      reasoning: `Started pricing experiment: ${params.name}`,
      timestamp: Date.now(),
      payload: experiment,
      outcome: "executed",
    });

    return experiment;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تحليل نتائج الـ A/B Test
   * ─────────────────────────────────────────────────────────────────
   */
  async analyzeExperimentResults(
    experimentId: string
  ): Promise<{ winner: "control" | "variant"; confidence: number } | null> {
    console.log("📊 Analyzing experiment results...", experimentId);

    const experiment = this.getExperiment(experimentId);
    if (!experiment || !experiment.results) {
      console.warn("❌ Experiment not found or no results");
      return null;
    }

    const { control, variant } = experiment.results;

    // حساب Statistical Significance (Chi-square test مبسط)
    const controlConversionRate = control.conversions / 100; // assume 100 trials
    const variantConversionRate = variant.conversions / 100;

    const difference = Math.abs(variantConversionRate - controlConversionRate);
    const pooledRate = (control.conversions + variant.conversions) / 200;
    const standardError = Math.sqrt(
      (pooledRate * (1 - pooledRate) * 2) / 100
    );
    const zScore = difference / standardError;

    // Z-score > 1.96 = 95% confidence
    const confidence = Math.min(100, (1 - 2 * (1 - this.normalCDF(zScore))) * 100);

    const winner = variant.revenue > control.revenue ? "variant" : "control";

    console.log(
      `✅ Experiment analysis: Winner=${winner}, Confidence=${confidence.toFixed(1)}%`
    );

    // تحديث التجربة
    experiment.winner = winner;
    experiment.status = "completed";
    localStorage.setItem(
      "dawayir-pricing-experiment",
      JSON.stringify(experiment)
    );

    // سجّل القرار
    await decisionEngine.execute({
      type: "ab_test_ended",
      reasoning: `Experiment "${experiment.name}" ended. Winner: ${winner} (${confidence.toFixed(1)}% confidence)`,
      timestamp: Date.now(),
      payload: { experimentId, winner, confidence },
      outcome: "executed",
    });

    return { winner, confidence };
  }

  /**
   * Normal CDF (للـ statistical significance)
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const probability =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
  }

  /**
   * استرجاع تجربة
   */
  private getExperiment(id: string): PricingExperiment | null {
    try {
      const stored = localStorage.getItem("dawayir-pricing-experiment");
      if (!stored) return null;

      const experiment = JSON.parse(stored) as PricingExperiment;
      return experiment.id === id ? experiment : null;
    } catch {
      return null;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تشغيل دورة كاملة للتحسين (Market + Metrics + Recommendation)
   * ─────────────────────────────────────────────────────────────────
   */
  async runFullOptimizationCycle(): Promise<{
    marketAnalysis: MarketAnalysis | null;
    metrics: RevenueMetrics | null;
    recommendation: PricingRecommendation | null;
  }> {
    console.log("🚀 Running full pricing optimization cycle...");

    // 1. تحليل السوق
    const marketAnalysis = await this.analyzeMarket();

    // 2. جلب الميتريكس الحالية
    const metrics = await revenueEngine.analyzeCurrentMetrics();

    // 3. اقتراح تحسين
    let recommendation: PricingRecommendation | null = null;
    if (metrics) {
      recommendation = await this.optimizePricing({
        currentMetrics: metrics,
        marketAnalysis: marketAnalysis || undefined,
      });
    }

    console.log("✅ Full optimization cycle complete");

    return { marketAnalysis, metrics, recommendation };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const pricingOptimizer = new AIPricingOptimizer();

/**
 * تشغيل التحليل الشهري التلقائي
 */
export function startMonthlyPricingAnalysis(): void {
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

  // تشغيل فوراً
  void pricingOptimizer.runFullOptimizationCycle();

  // كل شهر
  setInterval(() => {
    void pricingOptimizer.runFullOptimizationCycle();
  }, ONE_MONTH_MS);

  console.log("✅ Monthly pricing analysis scheduled");
}
