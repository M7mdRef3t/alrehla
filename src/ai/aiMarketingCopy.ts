import { logger } from "@/services/logger";
/**
 * AI_MARKETING_COPY.ts — كاتب النصوص التسويقية بالذكاء الاصطناعي
 * =====================================================
 * نظام ذكي لتوليد نصوص تسويقية، إعلانات، ومحتوى Social Media
 */

import { geminiClient } from "@/services/geminiClient";
import { decisionEngine } from "./decision-framework";

// ═══════════════════════════════════════════════════════════════════════════
// 📝 Marketing Copy Types
// ═══════════════════════════════════════════════════════════════════════════

export type CopyType =
  | "landing_page_hero" // عنوان رئيسي للصفحة الرئيسية
  | "landing_page_cta" // Call to Action
  | "email_onboarding" // بريد ترحيبي
  | "email_nurture" // بريد تثقيفي
  | "social_post" // منشور سوشيال ميديا
  | "ad_facebook" // إعلان فيسبوك
  | "ad_google" // إعلان جوجل
  | "testimonial_request" // طلب شهادة من مستخدم
  | "pricing_page_value" // قيمة مقترحة في صفحة التسعير
  | "feature_announcement"; // إعلان فيتشر جديدة

export interface MarketingCopy {
  type: CopyType;
  content: string;
  headline?: string; // للإعلانات
  cta?: string; // Call to Action
  variations?: string[]; // نسخ بديلة للـ A/B testing
  tone: "empathetic" | "inspirational" | "educational" | "conversational";
  targetAudience: "new_users" | "active_users" | "churned_users" | "enterprise";
  generatedAt: number;
  voiceScore: number; // مدى توافق النص مع صوت محمد (0-100)
}

export interface TikTokScriptGeneration {
  hook: string;
  visualConcept: string;
  rationale: string; // لماذا هذا المحتوى؟
  format: "video" | "design" | "carousel"; // نوع القالب المرشح
  platform: "tiktok" | "instagram" | "facebook"; // المنصة الأنسب
  scriptBlocks: Array<{
    text: string;
    cue: string;
    imagePrompt?: string; // برومت توليد الصورة للذكاء الاصطناعي
    motionPrompt?: string; // برومت تحريك المشهد (Flow/Runway)
  }>;
  caption: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Campaign Types
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketingCampaign {
  id: string;
  name: string;
  goal: "acquisition" | "activation" | "retention" | "revenue";
  startDate: number;
  endDate: number | null;
  copies: MarketingCopy[];
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    revenue: number;
  } | null;
  status: "draft" | "running" | "paused" | "completed";
}

export interface WeeklyAdBudgetConfig {
  /** الميزانية الأسبوعية بالجنيه المصري */
  weeklyBudgetEGP: number;
  channel: "facebook";
  locale: "ar-EG";
  autoSpendEnabled: boolean;
  realPlatformEnabled: boolean;
  /** @deprecated استخدم weeklyBudgetEGP */
  weeklyBudgetUSD?: number;
}

export interface AdABVariantResult {
  variantId: "A" | "B";
  headline: string;
  body: string;
  cta: string;
  /** الميزانية المخصصة بالجنيه المصري */
  allocatedBudgetEGP: number;
  impressions: number;
  clicks: number;
  conversions: number;
  /** الإنفاق الفعلي بالجنيه المصري */
  spendEGP: number;
  ctr: number;
  cvr: number;
  /** تكلفة التحويل بالجنيه المصري */
  cpaEGP: number;
  /** @deprecated */ allocatedBudgetUSD?: number;
  /** @deprecated */ spendUSD?: number;
  /** @deprecated */ cpaUSD?: number;
}

export interface WeeklyAdABTestReport {
  id: string;
  startedAt: number;
  endedAt: number;
  status: "completed" | "requires_approval";
  budget: WeeklyAdBudgetConfig;
  variants: AdABVariantResult[];
  winnerVariantId: "A" | "B";
  recommendedNextAction: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 AI Marketing Copywriter Class
// ═══════════════════════════════════════════════════════════════════════════

export class AIMarketingCopywriter {
  private readonly weeklyBudgetStorageKey = "dawayir-marketing-weekly-budget";
  private readonly weeklyABReportsStorageKey = "dawayir-marketing-weekly-ab-reports";

  getWeeklyBudgetConfig(): WeeklyAdBudgetConfig {
    try {
      const raw = localStorage.getItem(this.weeklyBudgetStorageKey);
      if (!raw) {
        return {
          weeklyBudgetEGP: 350,
          channel: "facebook",
          locale: "ar-EG",
          autoSpendEnabled: true,
          realPlatformEnabled: false,
        };
      }

      const parsed = JSON.parse(raw) as Partial<WeeklyAdBudgetConfig>;
      // Migrate from old USD field if present
      const budgetFromOld = parsed.weeklyBudgetUSD ? parsed.weeklyBudgetUSD * 50 : undefined;
      return {
        weeklyBudgetEGP: Math.max(350, Number(parsed.weeklyBudgetEGP ?? budgetFromOld ?? 350)),
        channel: "facebook",
        locale: "ar-EG",
        autoSpendEnabled: parsed.autoSpendEnabled !== false,
        realPlatformEnabled: parsed.realPlatformEnabled === true,
      };
    } catch {
      return {
        weeklyBudgetEGP: 350,
        channel: "facebook",
        locale: "ar-EG",
        autoSpendEnabled: true,
        realPlatformEnabled: false,
      };
    }
  }

  saveWeeklyBudgetConfig(config: WeeklyAdBudgetConfig): void {
    try {
      localStorage.setItem(this.weeklyBudgetStorageKey, JSON.stringify(config));
    } catch (error) {
      logger.error("❌ Failed to save weekly budget config:", error);
    }
  }

  getWeeklyABReports(): WeeklyAdABTestReport[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.weeklyABReportsStorageKey) || "[]"
      ) as WeeklyAdABTestReport[];
    } catch {
      return [];
    }
  }

  private saveWeeklyABReport(report: WeeklyAdABTestReport): void {
    try {
      const existing = this.getWeeklyABReports();
      existing.push(report);
      localStorage.setItem(this.weeklyABReportsStorageKey, JSON.stringify(existing.slice(-52))); // آخر سنة
    } catch (error) {
      logger.error("❌ Failed to save weekly A/B report:", error);
    }
  }

  private simulateVariantMetrics(allocatedBudgetEGP: number): Omit<AdABVariantResult, "variantId" | "headline" | "body" | "cta"> {
    const spendEGP = Number((allocatedBudgetEGP * (0.9 + Math.random() * 0.1)).toFixed(2));
    // Egyptian market: ~100-180 impressions per EGP (very cheap market)
    const impressions = Math.round(spendEGP * (100 + Math.random() * 80));
    const ctrBase = 0.015 + Math.random() * 0.025; // 1.5% - 4.0% (Egypt tends higher)
    const clicks = Math.max(1, Math.round(impressions * ctrBase));
    const cvrBase = 0.08 + Math.random() * 0.17; // 8% - 25%
    const conversions = Math.max(1, Math.round(clicks * cvrBase));
    const ctr = Number((clicks / Math.max(1, impressions)).toFixed(4));
    const cvr = Number((conversions / Math.max(1, clicks)).toFixed(4));
    const cpaEGP = Number((spendEGP / Math.max(1, conversions)).toFixed(2));

    return {
      allocatedBudgetEGP,
      impressions,
      clicks,
      conversions,
      spendEGP,
      ctr,
      cvr,
      cpaEGP
    };
  }

  async runWeeklyEgyptianAdABTest(params?: {
    goal?: "acquisition" | "activation";
    audience?: MarketingCopy["targetAudience"];
  }): Promise<WeeklyAdABTestReport | null> {
    const goal = params?.goal ?? "acquisition";
    const audience = params?.audience ?? "new_users";
    const budget = this.getWeeklyBudgetConfig();

    if (!budget.autoSpendEnabled) {
      console.warn("⚠️ Weekly ad automation is disabled.");
      return null;
    }

    const variantACopy = await this.generateCopy({
      type: "ad_facebook",
      tone: "conversational",
      targetAudience: audience,
      context: `اختبار A/B أسبوعي بالمصري للهدف ${goal} - نسخة A: مباشرة وجريئة — ميزانية ${budget.weeklyBudgetEGP} ج.م`,
      includeVariations: false
    });

    const variantBCopy = await this.generateCopy({
      type: "ad_facebook",
      tone: "empathetic",
      targetAudience: audience,
      context: `اختبار A/B أسبوعي بالمصري للهدف ${goal} - نسخة B: دافئة وعاطفية — ميزانية ${budget.weeklyBudgetEGP} ج.م`,
      includeVariations: false
    });

    if (!variantACopy || !variantBCopy) return null;

    const perVariantBudget = Number((budget.weeklyBudgetEGP / 2).toFixed(2));
    const aMetrics = this.simulateVariantMetrics(perVariantBudget);
    const bMetrics = this.simulateVariantMetrics(perVariantBudget);

    const variantA: AdABVariantResult = {
      variantId: "A",
      headline: variantACopy.headline ?? "حاسس إنك تايه؟ الرحلة تقدر تساعدك",
      body: variantACopy.content,
      cta: variantACopy.cta ?? "ابدأ رحلتك دلوقتي",
      ...aMetrics
    };
    const variantB: AdABVariantResult = {
      variantId: "B",
      headline: variantBCopy.headline ?? "بطل تحمل كل حاجة لوحدك",
      body: variantBCopy.content,
      cta: variantBCopy.cta ?? "جرب أول خطوة ببلاش",
      ...bMetrics
    };

    const winner = variantA.cpaEGP <= variantB.cpaEGP ? "A" : "B";
    const startedAt = Date.now();
    const endedAt = startedAt + 6 * 24 * 60 * 60 * 1000;
    const status: WeeklyAdABTestReport["status"] = budget.realPlatformEnabled ? "requires_approval" : "completed";

    const report: WeeklyAdABTestReport = {
      id: `weekly-ab-${startedAt}`,
      startedAt,
      endedAt,
      status,
      budget,
      variants: [variantA, variantB],
      winnerVariantId: winner,
      recommendedNextAction:
        winner === "A"
          ? "اعتمد النسخة A الأسبوع الجاي وزوّدها ٢٠% من الميزانية."
          : "اعتمد النسخة B الأسبوع الجاي وكرّر نفس الـ hook مع CTA أقوى."
    };

    this.saveWeeklyABReport(report);

    await decisionEngine.execute({
      type: "ab_test_started",
      reasoning: `Weekly Egyptian A/B ad test started with ${budget.weeklyBudgetEGP} EGP budget`,
      timestamp: startedAt,
      payload: { reportId: report.id, goal, audience, budgetEGP: budget.weeklyBudgetEGP },
      outcome: budget.realPlatformEnabled ? "pending_approval" : "executed",
      approvedBy: budget.realPlatformEnabled ? "system" : "admin"
    });

    await decisionEngine.execute({
      type: "ab_test_ended",
      reasoning: `Weekly Egyptian A/B ad test ended. Winner=${winner}`,
      timestamp: endedAt,
      payload: { reportId: report.id, winnerVariantId: winner },
      outcome: budget.realPlatformEnabled ? "pending_approval" : "executed",
      approvedBy: budget.realPlatformEnabled ? "system" : "admin"
    });

    return report;
  }
  /**
   * ─────────────────────────────────────────────────────────────────
   * توليد نص تسويقي
   * ─────────────────────────────────────────────────────────────────
   */
  async generateCopy(params: {
    type: CopyType;
    tone: MarketingCopy["tone"];
    targetAudience: MarketingCopy["targetAudience"];
    context?: string; // سياق إضافي (مثلاً: "فيتشر جديدة: AI Insights")
    includeVariations?: boolean;
  }): Promise<MarketingCopy | null> {
    console.warn("✍️ Generating marketing copy...", params);

    const prompt = this.buildCopyPrompt(params);

    const result = await geminiClient.generateJSON<{
      content: string;
      headline?: string;
      cta?: string;
      variations?: string[];
      voice_score: number;
    }>(prompt);

    if (!result) {
      console.warn("❌ Failed to generate copy");
      return null;
    }

    const copy: MarketingCopy = {
      type: params.type,
      content: result.content,
      headline: result.headline,
      cta: result.cta,
      variations: result.variations,
      tone: params.tone,
      targetAudience: params.targetAudience,
      generatedAt: Date.now(),
      voiceScore: result.voice_score,
    };

    console.warn("✅ Marketing copy generated:", copy);

    // سجّل القرار
    await decisionEngine.execute({
      type: "content_generated",
      reasoning: `Generated ${params.type} copy for ${params.targetAudience}`,
      timestamp: Date.now(),
      payload: { copyType: params.type, voiceScore: copy.voiceScore },
      outcome: "executed",
    });

    return copy;
  }

  /**
   * بناء Prompt للنص التسويقي
   */
  private buildCopyPrompt(params: {
    type: CopyType;
    tone: MarketingCopy["tone"];
    targetAudience: MarketingCopy["targetAudience"];
    context?: string;
    includeVariations?: boolean;
  }): string {
    const audienceMap = {
      new_users: "ناس جديدة ما سمعتش عن المنصة قبل كده",
      active_users: "مستخدمين حاليين نشطين",
      churned_users: "ناس كانت بتستخدم المنصة وبطّلت",
      enterprise: "شركات وعيادات نفسية (B2B)",
    };

    const toneMap = {
      empathetic: "متفهم ورحيم",
      inspirational: "ملهم ومشجع",
      educational: "تعليمي وواضح",
      conversational: "ودّي وخفيف",
    };

    const typeInstructions: Record<CopyType, string> = {
      landing_page_hero: "عنوان رئيسي قوي (headline) + نص فرعي (subheadline) يشرح القيمة",
      landing_page_cta: "نص لزر Call to Action مقنع",
      email_onboarding: "بريد ترحيبي للمستخدمين الجدد (3-4 فقرات)",
      email_nurture: "بريد تثقيفي يشرح فيتشر أو يشارك نصيحة",
      social_post: "منشور قصير للسوشيال ميديا (100-150 كلمة)",
      ad_facebook: "إعلان فيسبوك (headline + نص قصير + CTA)",
      ad_google: "إعلان جوجل (headline 30 حرف + description 90 حرف)",
      testimonial_request: "طلب من مستخدم يكتب شهادة عن تجربته",
      pricing_page_value: "نص يشرح القيمة المقدمة في خطة الاشتراك",
      feature_announcement: "إعلان فيتشر جديدة بطريقة مثيرة",
    };

    return `
أنت كاتب نصوص تسويقية محترف متخصص في الصحة النفسية والعافية.

# صوت العلامة التجارية (محمد — مؤسس الرحلة)
- **اللغة**: العامية المصرية (warm, authentic, relatable)
- **النبرة**: ${toneMap[params.tone]}
- **الفلسفة العلاجية**: الألم رحلة للوعي، الأسئلة أهم من الإجابات، الحدود حماية مش رفض
- **الأسلوب**: بسيط، واضح، بدون مصطلحات معقدة، مباشر للقلب

# المنتج: الرحلة (Alrehla)
- منصة علاج نفسي تفاعلية مدعومة بالذكاء الاصطناعي
- الفيتشرز الرئيسية:
  - خريطة "الرحلة" تفاعلية لتنظيم العلاقات
  - أسئلة يومية للوعي الذاتي
  - تحليل نفسي ذكي بالـ AI
  - مؤشر الوضوح العاطفي (TEI)
  - تتبع "نبضات الظل" (السلوك اللا واعي)

# الجمهور المستهدف
${audienceMap[params.targetAudience]}

# نوع النص المطلوب
${typeInstructions[params.type]}

${params.context ? `# السياق الإضافي\n${params.context}\n` : ""}

# المطلوب
اكتب نص تسويقي ${params.includeVariations ? "+ 2 نسخ بديلة للـ A/B testing" : ""}.

# الرد (JSON)
\`\`\`json
{
  "content": "النص الرئيسي هنا...",
  "headline": "${["ad_facebook", "ad_google", "landing_page_hero"].includes(params.type) ? "العنوان الرئيسي" : "null"}",
  "cta": "${["landing_page_cta", "ad_facebook", "email_onboarding"].includes(params.type) ? "Call to Action" : "null"}",
  "variations": ${params.includeVariations ? '["نسخة بديلة 1", "نسخة بديلة 2"]' : "null"},
  "voice_score": 85
}
\`\`\`

**ملاحظات مهمة:**
- استخدم العامية المصرية الطبيعية (مثال: "عايز تفهم نفسك؟" بدل "هل تريد فهم ذاتك؟")
- تجنب المبالغة أو الوعود الكاذبة
- ركّز على القيمة الحقيقية والتحول العاطفي
- voice_score = مدى توافق النص مع صوت محمد (0-100)
`;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * توليد حملة تسويقية كاملة
   * ─────────────────────────────────────────────────────────────────
   */
  async generateCampaign(params: {
    name: string;
    goal: MarketingCampaign["goal"];
    durationDays: number;
  }): Promise<MarketingCampaign | null> {
    console.warn("🚀 Generating marketing campaign...", params);

    // توليد 5 أنواع من النصوص للحملة
    const copyTypes: Array<{
      type: CopyType;
      tone: MarketingCopy["tone"];
      audience: MarketingCopy["targetAudience"];
    }> = [
      {
        type: "landing_page_hero",
        tone: "inspirational",
        audience: "new_users",
      },
      { type: "ad_facebook", tone: "empathetic", audience: "new_users" },
      {
        type: "email_onboarding",
        tone: "conversational",
        audience: "new_users",
      },
      {
        type: "social_post",
        tone: "inspirational",
        audience: "active_users",
      },
      {
        type: "email_nurture",
        tone: "educational",
        audience: "active_users",
      },
    ];

    const copies: MarketingCopy[] = [];

    for (const spec of copyTypes) {
      const copy = await this.generateCopy({
        type: spec.type,
        tone: spec.tone,
        targetAudience: spec.audience,
        context: `حملة: ${params.name} — الهدف: ${params.goal}`,
        includeVariations: true,
      });

      if (copy) copies.push(copy);
    }

    if (copies.length === 0) {
      console.warn("❌ Failed to generate campaign copies");
      return null;
    }

    const campaign: MarketingCampaign = {
      id: `campaign-${Date.now()}`,
      name: params.name,
      goal: params.goal,
      startDate: Date.now(),
      endDate: Date.now() + params.durationDays * 24 * 60 * 60 * 1000,
      copies,
      performance: null,
      status: "draft",
    };

    console.warn("✅ Campaign generated:", campaign.id);

    // حفظ في localStorage
    this.saveCampaign(campaign);

    // سجّل القرار
    await decisionEngine.execute({
      type: "campaign_created",
      reasoning: `Created campaign: ${params.name} (${copies.length} copies)`,
      timestamp: Date.now(),
      payload: { campaignId: campaign.id, goal: params.goal },
      outcome: "executed",
    });

    return campaign;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * توليد نص لإعلان Google Ads تلقائياً
   * ─────────────────────────────────────────────────────────────────
   */
  async generateGoogleAd(params: {
    keyword: string; // الكلمة المفتاحية
    painPoint: string; // نقطة الألم (مثلاً: "قلق مستمر")
  }): Promise<{
    headline1: string;
    headline2: string;
    headline3: string;
    description1: string;
    description2: string;
  } | null> {
    console.warn("📢 Generating Google Ad...", params);

    const prompt = `
أنت خبير في كتابة إعلانات Google Ads للصحة النفسية.

# المعلومات
- الكلمة المفتاحية: "${params.keyword}"
- نقطة الألم: "${params.painPoint}"
- المنتج: الرحلة — منصة علاج نفسي تفاعلية مدعومة بالذكاء الاصطناعي

# متطلبات Google Ads
- Headline 1: 30 حرف كحد أقصى (يجب أن يحتوي على الكلمة المفتاحية)
- Headline 2: 30 حرف كحد أقصى (يركز على الحل)
- Headline 3: 30 حرف كحد أقصى (يحفز على الفعل)
- Description 1: 90 حرف كحد أقصى (يشرح القيمة)
- Description 2: 90 حرف كحد أقصى (يحفز على التسجيل)

# الصوت
- عامية مصرية طبيعية
- متفهم وداعم (مش بيعي مباشر)

# الرد (JSON)
\`\`\`json
{
  "headline1": "افهم ${params.keyword} بطريقة جديدة",
  "headline2": "دواير — رحلتك للوضوح",
  "headline3": "ابدأ مجاناً دلوقتي",
  "description1": "منصة ذكية تساعدك تفهم ${params.painPoint} وتلاقي الوضوح اللي بتدور عليه.",
  "description2": "سجّل دلوقتي مجاناً. أول 14 يوم مجانية 100%."
}
\`\`\`
`;

    const ad = await geminiClient.generateJSON<{
      headline1: string;
      headline2: string;
      headline3: string;
      description1: string;
      description2: string;
    }>(prompt);

    if (!ad) {
      console.warn("❌ Failed to generate Google Ad");
      return null;
    }

    // تحقق من الطول
    const valid =
      ad.headline1.length <= 30 &&
      ad.headline2.length <= 30 &&
      ad.headline3.length <= 30 &&
      ad.description1.length <= 90 &&
      ad.description2.length <= 90;

    if (!valid) {
      console.warn("⚠️ Google Ad text exceeds character limits");
    }

    console.warn("✅ Google Ad generated:", ad);

    return ad;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * توليد محتوى Social Media (Twitter / Instagram)
   * ─────────────────────────────────────────────────────────────────
   */
  async generateSocialPost(params: {
    platform: "twitter" | "instagram" | "linkedin";
    topic: string; // الموضوع (مثلاً: "الحدود الصحية")
    tone: "inspirational" | "educational" | "personal_story";
  }): Promise<{
    text: string;
    hashtags: string[];
    imagePrompt?: string; // وصف الصورة المقترحة
  } | null> {
    console.warn("📱 Generating social media post...", params);

    const platformLimits = {
      twitter: 280,
      instagram: 2200,
      linkedin: 3000,
    };

    const prompt = `
أنت Content Creator محترف للصحة النفسية.

# المعلومات
- المنصة: ${params.platform}
- الموضوع: ${params.topic}
- النبرة: ${params.tone}
- الحد الأقصى: ${platformLimits[params.platform]} حرف

# الصوت
- عامية مصرية دافئة
- أصيل ومباشر للقلب
- بدون مصطلحات معقدة

# المطلوب
منشور كامل + هاشتاجات + وصف صورة مقترحة

# الرد (JSON)
\`\`\`json
{
  "text": "المنشور هنا...",
  "hashtags": ["#الصحة_النفسية", "#الوعي_الذاتي", "#الرحلة"],
  "image_prompt": "وصف الصورة المقترحة (للـ AI image generation)"
}
\`\`\`
`;

    const post = await geminiClient.generateJSON<{
      text: string;
      hashtags: string[];
      image_prompt: string;
    }>(prompt);

    if (!post) {
      console.warn("❌ Failed to generate social post");
      return null;
    }

    console.warn("✅ Social post generated:", post);

    return post;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * حفظ الحملة في localStorage
   * ─────────────────────────────────────────────────────────────────
   */
  private saveCampaign(campaign: MarketingCampaign): void {
    try {
      const existing = this.getCampaigns();
      existing.push(campaign);
      localStorage.setItem("dawayir-campaigns", JSON.stringify(existing));
    } catch (error) {
      logger.error("❌ Failed to save campaign:", error);
    }
  }


  /**
   * ─────────────────────────────────────────────────────────────────
   * مساعد صناعة المحتوى الذكي (AI Content Co-Pilot) لتفكيك الأوهام
   * ─────────────────────────────────────────────────────────────────
   */
  async generateIllusionDismantlingScript(params: {
    illusionName: string;
    description?: string;
    tone?: 'deep' | 'direct' | 'sarcastic';
    topic?: 'energy' | 'toxic' | 'mindset';
  }): Promise<TikTokScriptGeneration | null> {
    console.warn("🛡️ Generating Illusion Dismantling Script...", params);

    const toneLabels: Record<string, string> = {
      deep: "هادي وعميق نفسياً — بتبني مفاهيم بدل ما تهدم",
      direct: "مباشر وتحدي واضح — بيفوق اللي قدامه",
      sarcastic: "ساخر وصادم — بيضرب الدجل بذكاء",
    };
    const topicLabels: Record<string, string> = {
      energy: "نزيف الطاقة والاحتراق النفسي",
      toxic: "العلاقات السامة واختراق الحدود",
      mindset: "تصحيح مفاهيم التنمية البشرية بالمبادئ الأولى",
    };

    const toneDirective = params.tone ? `\n# نبرة الأداء\n${toneLabels[params.tone]}\n` : "";
    const topicDirective = params.topic ? `\n# المحور المستهدف\n${topicLabels[params.topic]}\n` : "";

    const prompt = `
أنت معماري أنظمة (System Architect) وعالم نفس طبي إسلامي، مهمتك "قتل الدجال بالعلم" عبر منصة الرحلة (Alrehla).
صاغ محتوى تفاعلي (فيديو أو تصميم) لتفكيك الأوهام السائدة.

# الوهم الحالي المستهدف
"${params.illusionName}"
${params.description ? `(تفاصيل عن الوهم في النظام: ${params.description})` : ""}
${toneDirective}${topicDirective}
# القواعد الصارمة (First Principles)
1. **اللغة:** عامية مصرية، صارمة، مباشرة، كاريزمية (أداء "محمد"). تجنب المصطلحات المعقدة مثل "السيستم" أو "المحور الأفقي".
2. **الربط الروحي:** أي وجع سببه "علاقة بشرية" هو في الحقيقة عرض لضعف "علاقتك بالله/المصدر". اشرح إن البشر "مرايات" مش مصادر طاقة. لو العلاقة انقطعت، المصدر لسه موجود.
3. **مهمة قتل الدجال:** الدجال هنا هو "الزيف" اللي بيخلي الإنسان موهوم بـ "الوحدة" أو "الضعف". فكك الزيف ده بالعلم والحقيقة.
4. **الدعوة (CTA):** وجه المشاهد لـ "مساحتك الخاصة" على "منصة الرحلة alrehla.app".

# الهيكلة المطلوبة (JSON المتوافق للاستوديو)
- rationale: اشرح للمستخدم ليه رشحت التنسيق ده (فيديو/تصميم) وليه المنصة دي بالذات بناءً على طبيعة الوهم.
- format: (video / design / carousel).
- platform: (tiktok / instagram / facebook).
- hook: جملة البداية القاتلة (أول 3 ثواني).
- visualConcept: فكرة الإضاءة ولغة الجسد.
- scriptBlocks: مصفوفة "ستوري بورد" لكل مشهد:
    - text: النص المكتوب.
    - cue: حركة اليد أو الكاميرا.
    - imagePrompt: وصف دقيق للصورة (للذكاء الاصطناعي) لتوليد المشهد.
    - motionPrompt: وصف لطريقة تحريك الصورة (لبرامج مثل Luma/Flow).
- caption: الكابشن مع الهاشتاجات.

**مهم جداً:** استخدم اسم "الرحلة" دائماً. لا تذكر اسم "دواير" نهائياً.

# الرد (JSON فقط)
\`\`\`json
{
  "rationale": "...",
  "format": "...",
  "platform": "...",
  "hook": "...",
  "visualConcept": "...",
  "scriptBlocks": [
    { "text": "...", "cue": "...", "imagePrompt": "...", "motionPrompt": "..." }
  ],
  "caption": "..."
}
\`\`\`
`;

    const result = await geminiClient.generateJSON<TikTokScriptGeneration>(prompt, "illusion_dismantling");

    if (!result || !result.scriptBlocks) {
      console.warn("❌ Failed to generate dismantling script");
      return null;
    }

    console.warn("✅ Dismantling script generated:", result);
    return result;
  }

  /**
   * استرجاع الحملات
   */
  getCampaigns(): MarketingCampaign[] {
    try {
      return JSON.parse(
        localStorage.getItem("dawayir-campaigns") || "[]"
      ) as MarketingCampaign[];
    } catch {
      return [];
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * تشغيل توليد محتوى أسبوعي تلقائي (Social Media)
   * ─────────────────────────────────────────────────────────────────
   */
  async runWeeklySocialContent(): Promise<void> {
    console.warn("📆 Running weekly social content generation...");

    const topics = [
      "الحدود الصحية",
      "فهم الألم العاطفي",
      "الوعي الذاتي",
      "التعافي من العلاقات السامة",
      "قبول الذات",
    ];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const platforms: Array<"twitter" | "instagram" | "linkedin"> = [
      "twitter",
      "instagram",
    ];

    for (const platform of platforms) {
      const post = await this.generateSocialPost({
        platform,
        topic: randomTopic,
        tone: "inspirational",
      });

      if (post) {
        console.warn(`✅ ${platform} post generated:`, post.text.substring(0, 100));
      }
    }

    console.warn("✅ Weekly social content generation complete");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const marketingCopywriter = new AIMarketingCopywriter();

/**
 * تشغيل توليد المحتوى الأسبوعي
 */
export function startWeeklySocialContentGeneration(): void {
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  // تشغيل فوراً
  void marketingCopywriter.runWeeklySocialContent();

  // كل أسبوع
  setInterval(() => {
    void marketingCopywriter.runWeeklySocialContent();
  }, ONE_WEEK_MS);

  console.warn("✅ Weekly social content generation scheduled");
}

export function startWeeklyEgyptianAdABTesting(): void {
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  void marketingCopywriter.runWeeklyEgyptianAdABTest();
  setInterval(() => {
    void marketingCopywriter.runWeeklyEgyptianAdABTest();
  }, ONE_WEEK_MS);

  console.warn("✅ Weekly Egyptian Ad A/B testing scheduled");
}

