/**
 * 🔮 Decision Oracle — مستشار القرارات الذكي
 * =============================================
 * يستخدم AI لتحليل القرارات وتقديم نصائح بناءً على:
 * - سياق الحياة الشامل (Life Score + Domains)
 * - تاريخ القرارات السابقة ونتائجها
 * - الأنماط المكتشفة من consciousness vectors
 * - المشاكل المفتوحة وتأثيرها على المجالات
 */

import type {
  LifeDecision,
  LifeDomainId,
  DecisionOption,
  LifeScore
} from "@/types/lifeDomains";
import { useLifeState } from "@/state/lifeState";
import { getDomainConfig } from "@/types/lifeDomains";

// ─── Decision Analysis Types ─────────────────────────────────────

export interface DecisionAnalysis {
  /** Per-option alignment score (0-1) */
  optionScores: Record<string, number>;
  /** Recommended option id */
  recommendedOptionId: string | null;
  /** Pro/con analysis text */
  analysis: string;
  /** Risk assessment */
  riskLevel: "low" | "medium" | "high";
  /** Which domains will be affected */
  impactedDomains: LifeDomainId[];
  /** Blind spots the user might not have considered */
  blindSpots: string[];
  /** Long-term projections */
  longTermImpact: string;
}

export interface ProblemDiagnosis {
  /** Root cause analysis */
  rootCause: string;
  /** Connected issues */
  relatedProblems: string[];
  /** Suggested actions, ordered by priority */
  actions: ProblemAction[];
  /** Which domain to fix first */
  startWith: LifeDomainId;
  /** Is this a symptom of a deeper issue? */
  isSymptom: boolean;
  /** The deeper issue if isSymptom */
  deeperIssue?: string;
}

export interface ProblemAction {
  id: string;
  label: string;
  domainId: LifeDomainId;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  /** Timeframe */
  timeframe: string;
}

// ─── Decision Scoring Engine (Offline) ───────────────────────────

/**
 * Score decision options based on life context without AI.
 * Uses domain health, urgency alignment, and pattern matching.
 */
export function scoreDecisionOptions(
  decision: Partial<LifeDecision>,
  lifeScore: LifeScore | null,
  options: DecisionOption[]
): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const option of options) {
    let score = 0.5; // Neutral start

    // Factor 1: Domain alignment
    if (lifeScore && decision.domainId) {
      const domainHealth = lifeScore.domains[decision.domainId] ?? 50;
      // If domain is weak, favor options that align with improvement
      if (domainHealth < 40) {
        score += option.pros.length > option.cons.length ? 0.15 : -0.1;
      }
    }

    // Factor 2: Pro/con ratio
    const proConRatio = option.pros.length / Math.max(option.pros.length + option.cons.length, 1);
    score += (proConRatio - 0.5) * 0.3;

    // Factor 3: Urgency × risk calibration
    if (decision.urgency === "now" || decision.urgency === "today") {
      // Under time pressure, favor the option with fewer cons (risk aversion)
      score -= option.cons.length * 0.05;
    }

    scores[option.id] = Math.max(0, Math.min(1, score));
  }

  return scores;
}

/**
 * Identify which domains a decision will impact
 */
export function identifyImpactedDomains(
  decision: Partial<LifeDecision>,
  options: DecisionOption[]
): LifeDomainId[] {
  const domains: Set<LifeDomainId> = new Set();

  if (decision.domainId) domains.add(decision.domainId);

  // Keyword analysis from content and options
  const allText = [
    decision.content ?? "",
    ...options.flatMap(o => [...o.pros, ...o.cons])
  ].join(" ").toLowerCase();

  const domainKeywords: Record<LifeDomainId, string[]> = {
    self: ["نفسي", "عادة", "صحة نفسية", "مزاج", "ثقة", "وعي"],
    body: ["جسم", "رياضة", "نوم", "أكل", "صحة", "طاقة"],
    relations: ["علاقة", "صديق", "أهل", "زواج", "حب", "شخص"],
    work: ["شغل", "عمل", "مشروع", "وظيفة", "إنتاجية", "مدير"],
    finance: ["فلوس", "مال", "مرتب", "ميزانية", "استثمار", "دخل"],
    dreams: ["حلم", "هدف", "مستقبل", "رؤية", "طموح"],
    spirit: ["إيمان", "صلاة", "تأمل", "سلام", "روح", "هدف أعلى"],
    knowledge: ["تعلم", "دراسة", "مهارة", "كورس", "قراءة", "كتاب"]
  };

  for (const [domainId, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(kw => allText.includes(kw))) {
      domains.add(domainId as LifeDomainId);
    }
  }

  return Array.from(domains);
}

/**
 * Detect blind spots — things the user might be missing
 */
export function detectBlindSpots(
  decision: Partial<LifeDecision>,
  lifeScore: LifeScore | null
): string[] {
  const spots: string[] = [];

  if (!lifeScore) return spots;

  // Check if decision ignores a weak domain
  const weakest = lifeScore.weakestDomain;
  const weakConfig = getDomainConfig(weakest);
  if (decision.domainId !== weakest && lifeScore.domains[weakest] < 30) {
    spots.push(
      `مجال "${weakConfig.label}" ضعيف جداً (${lifeScore.domains[weakest]}%) — هل القرار ده ممكن يأثر عليه؟`
    );
  }

  // Check for decision fatigue
  const pendingDecisions = lifeScore.pendingDecisions;
  if (pendingDecisions > 3) {
    spots.push(
      `عندك ${pendingDecisions} قرارات معلقة — ممكن يكون الأفضل تحسم واحدة قبل ما تبدأ دي`
    );
  }

  // Check overall stress
  if (lifeScore.overall < 35) {
    spots.push(
      "حالتك العامة تحت ضغط — القرارات الكبيرة في وقت الضغط بتكون أقل دقة"
    );
  }

  // Time pressure warning
  if (decision.urgency === "now") {
    spots.push(
      "القرار عاجل — خذ 5 دقائق للتنفس والتفكير قبل ما تختار"
    );
  }

  return spots;
}

/**
 * Build the AI prompt for a decision analysis
 */
export function buildDecisionPrompt(
  decision: Partial<LifeDecision>,
  lifeScore: LifeScore | null,
  options: DecisionOption[]
): string {
  const domainConfig = decision.domainId ? getDomainConfig(decision.domainId) : null;
  const impacted = identifyImpactedDomains(decision, options);

  return `أنت مستشار قرارات ذكي. حلل القرار التالي:

القرار: ${decision.content ?? "غير محدد"}
المجال: ${domainConfig?.label ?? "غير محدد"} (${domainConfig?.description ?? ""})
الاستعجال: ${decision.urgency ?? "غير محدد"}

الخيارات:
${options.map((o, i) => `${i + 1}. ${o.label}
   مزايا: ${o.pros.join("، ") || "—"}
   عيوب: ${o.cons.join("، ") || "—"}`
).join("\n")}

سياق الحياة:
- النتيجة الشاملة: ${lifeScore?.overall ?? "غير متاح"}/100
- أضعف مجال: ${lifeScore ? getDomainConfig(lifeScore.weakestDomain).label : "غير متاح"}
- مشاكل مفتوحة: ${lifeScore?.activeProblems ?? 0}
- المجالات المتأثرة: ${impacted.map(d => getDomainConfig(d).label).join("، ")}

قدم تحليل مختصر يتضمن:
1. توصية بالخيار الأفضل مع السبب
2. المخاطر المحتملة
3. التأثير طويل المدى
4. نقاط عمياء قد يكون المستخدم غافل عنها

اكتب بالعامية المصرية. كن مباشر وعملي.`;
}

/**
 * Build the AI prompt for a problem diagnosis
 */
export function buildProblemPrompt(
  content: string,
  domainId: LifeDomainId,
  lifeScore: LifeScore | null,
  relatedEntries: string[]
): string {
  const domainConfig = getDomainConfig(domainId);

  return `أنت محلل مشاكل ذكي. شخّص المشكلة التالية:

المشكلة: ${content}
المجال: ${domainConfig.label} (${domainConfig.description})

سياق الحياة:
- النتيجة الشاملة: ${lifeScore?.overall ?? "غير متاح"}/100
- صحة المجال: ${lifeScore?.domains[domainId] ?? "غير متاح"}/100
- أضعف مجال: ${lifeScore ? getDomainConfig(lifeScore.weakestDomain).label : "غير متاح"}

مشاكل/أفكار مشابهة سابقة:
${relatedEntries.length > 0 ? relatedEntries.map((e, i) => `${i + 1}. ${e}`).join("\n") : "لا يوجد"}

قدم تشخيص يتضمن:
1. السبب الجذري (الحقيقي مش السطحي)
2. هل دي مشكلة فعلية ولا عرض لمشكلة أعمق؟
3. 3 خطوات عملية مرتبة حسب الأولوية
4. ابدأ بأيه — أول خطوة يعملها دلوقتي

اكتب بالعامية المصرية. كن صريح ومباشر.`;
}
