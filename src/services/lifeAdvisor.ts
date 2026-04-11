/**
 * 🧠 Life Advisor — مستشار الحياة الذكي
 * ========================================
 * يوسع جارفيس ليصبح مستشار حياة شامل يفهم كل المجالات.
 * يجمع بين:
 * - بيانات Pulse (mood, energy)
 * - بيانات Map (relationships)
 * - بيانات Life State (problems, decisions, assessments)
 * - بيانات Consciousness (awareness vectors)
 * - بيانات Memory (recurring patterns)
 *
 * ينتج:
 * - Morning Briefs
 * - Pattern Insights
 * - Daily Priorities
 * - Life Coaching Advice
 */

import type {
  LifeDomainId,
  LifeScore,
  MorningBriefData,
  MorningPriority,
  LifeEntry,
  DomainAssessment
} from "@/types/lifeDomains";
import { getDomainConfig, LIFE_DOMAINS } from "@/types/lifeDomains";
import { useLifeState } from "@/domains/dawayir/store/life.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { loadStreak } from "@/services/streakSystem";
import { resolveDisplayName } from "@/services/userMemory";

// ─── Life Context Builder ────────────────────────────────────────

export interface LifeContext {
  lifeScore: LifeScore | null;
  activeProblems: LifeEntry[];
  pendingDecisions: LifeEntry[];
  recentEntries: LifeEntry[];
  streakDays: number;
  userName: string | null;
  currentMood: string | null;
  currentEnergy: number | null;
  relationshipHealth: {
    total: number;
    green: number;
    yellow: number;
    red: number;
    detached: number;
  };
  domainAssessments: Record<LifeDomainId, { score: number; trend: string } | null>;
}

/**
 * Collect all available life data into a single context object
 */
export function buildLifeContext(): LifeContext {
  const lifeState = useLifeState.getState();
  const pulseState = usePulseState.getState();
  const mapState = useMapState.getState();
  const streak = loadStreak();

  // Pulse data
  const lastPulse = pulseState.lastPulse;

  // Relationship data
  const activeNodes = mapState.nodes.filter(n => !n.isNodeArchived);
  const relationshipHealth = {
    total: activeNodes.length,
    green: activeNodes.filter(n => n.ring === "green").length,
    yellow: activeNodes.filter(n => n.ring === "yellow").length,
    red: activeNodes.filter(n => n.ring === "red").length,
    detached: activeNodes.filter(n => n.detachmentMode || n.isDetached).length
  };

  // Domain assessments
  const domainAssessments: Record<string, { score: number; trend: string } | null> = {};
  for (const domain of LIFE_DOMAINS) {
    const latest = lifeState.getLatestAssessment(domain.id);
    if (latest) {
      domainAssessments[domain.id] = { score: latest.score, trend: "stable" };
    } else {
      domainAssessments[domain.id] = null;
    }
  }

  return {
    lifeScore: lifeState.lifeScore,
    activeProblems: lifeState.getActiveProblems(),
    pendingDecisions: lifeState.getPendingDecisions(),
    recentEntries: lifeState.entries.slice(0, 10),
    streakDays: streak.currentStreak,
    userName: resolveDisplayName(),
    currentMood: lastPulse?.mood ?? null,
    currentEnergy: lastPulse?.energy ?? null,
    relationshipHealth,
    domainAssessments: domainAssessments as Record<LifeDomainId, { score: number; trend: string } | null>
  };
}

// ─── Morning Brief Generator ─────────────────────────────────────

/**
 * Generate a Morning Brief locally (without AI) based on life context
 */
export function generateMorningBrief(ctx: LifeContext): MorningBriefData {
  const priorities: MorningPriority[] = [];

  // Priority 1: Urgent decisions
  for (const entry of ctx.pendingDecisions.slice(0, 2)) {
    const domainConfig = getDomainConfig(entry.domainId);
    priorities.push({
      id: entry.id,
      label: entry.content.slice(0, 60) + (entry.content.length > 60 ? "..." : ""),
      domainId: entry.domainId,
      reason: `قرار معلق في ${domainConfig.label}`,
      type: "decision"
    });
  }

  // Priority 2: Critical problems
  for (const entry of ctx.activeProblems
    .filter(e => e.priority >= 4)
    .slice(0, 2)) {
    const domainConfig = getDomainConfig(entry.domainId);
    priorities.push({
      id: entry.id,
      label: entry.content.slice(0, 60) + (entry.content.length > 60 ? "..." : ""),
      domainId: entry.domainId,
      reason: `مشكلة ${entry.priority >= 5 ? "حرجة" : "مهمة"} في ${domainConfig.label}`,
      type: "problem"
    });
  }

  // Priority 3: Weak domain attention
  if (ctx.lifeScore && priorities.length < 3) {
    const weakest = ctx.lifeScore.weakestDomain;
    const weakConfig = getDomainConfig(weakest);
    const weakScore = ctx.lifeScore.domains[weakest];
    if (weakScore < 50) {
      priorities.push({
        id: `weak-${weakest}`,
        label: `حسّن ${weakConfig.label}`,
        domainId: weakest,
        reason: `النتيجة ${weakScore}% — محتاج اهتمام`,
        type: "goal"
      });
    }
  }

  // Priority 4: Relationship check
  if (ctx.relationshipHealth.red > 0 && priorities.length < 3) {
    priorities.push({
      id: "rel-check",
      label: `${ctx.relationshipHealth.red} علاقة في المنطقة الحمراء`,
      domainId: "relations",
      reason: "راجع وضع العلاقات الصعبة",
      type: "relationship"
    });
  }

  // Generate greeting
  const hour = new Date().getHours();
  const name = ctx.userName ?? "";
  let greeting: string;
  if (hour < 12) {
    greeting = `صباح الخير ${name}! يومك لسه بادئ — خليه يوم مميز`;
  } else if (hour < 17) {
    greeting = `أهلاً ${name}! نص اليوم عدى — تابع الزخم`;
  } else {
    greeting = `مساء الخير ${name}! وقت المراجعة والاسترخاء`;
  }

  // Pattern insight
  let patternInsight: string | undefined;
  if (ctx.activeProblems.length >= 3) {
    const domainCounts: Record<string, number> = {};
    for (const problem of ctx.activeProblems) {
      domainCounts[problem.domainId] = (domainCounts[problem.domainId] ?? 0) + 1;
    }
    const maxDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0];
    if (maxDomain && maxDomain[1] >= 2) {
      const config = getDomainConfig(maxDomain[0] as LifeDomainId);
      patternInsight = `${maxDomain[1]} من ${ctx.activeProblems.length} مشاكلك في مجال "${config.label}" — ممكن يكون في سبب جذري واحد`;
    }
  }

  if (!patternInsight && ctx.currentMood) {
    const moodMessages: Record<string, string> = {
      anxious: "لاحظ جسمك — القلق بيأثر على قراراتك. خذ نفس عميق قبل أي خطوة 🫁",
      overwhelmed: "كل حاجة ممكن تتقسم لخطوات صغيرة. ابدأ بحاجة واحدة بس 🎯",
      sad: "الحزن رسالة مش عقاب. اسمعها واشتغل عليها 🤍",
      tense: "التوتر = طاقة مكبوتة. وجهها لحاجة إيجابية النهاردة 💪"
    };
    patternInsight = moodMessages[ctx.currentMood];
  }

  return {
    greeting,
    topPriorities: priorities.slice(0, 3),
    lifeScore: ctx.lifeScore ?? {
      overall: 50,
      domains: {
        self: 50, body: 50, relations: 50, work: 50,
        finance: 50, dreams: 50, spirit: 50, knowledge: 50
      },
      trend: "stable",
      weakestDomain: "self",
      strongestDomain: "self",
      calculatedAt: Date.now(),
      activeProblems: ctx.activeProblems.length,
      pendingDecisions: ctx.pendingDecisions.length
    },
    patternInsight,
    streakDays: ctx.streakDays,
    dailyMission: generateDailyMission(ctx.lifeScore?.weakestDomain || "self"),
    generatedAt: Date.now()
  };
}

/**
 * Generate a proactive mission based on the weakest domain
 */
export function generateDailyMission(domainId: LifeDomainId): MorningBriefData["dailyMission"] {
  const missions: Record<LifeDomainId, { label: string; description: string }> = {
    self: {
      label: "خمس دقائق تدوين",
      description: "اكتب أهم 3 حاجات شاغلة بالك دلوقتي عشان تفضي مساحة في عقلك."
    },
    body: {
      label: "قسط راحة حقيقي",
      description: "ابعد عن الشاشات لمدة 20 دقيقة وغمض عينك. جسمك محتاج يفصل."
    },
    relations: {
      label: "رسالة تقدير",
      description: "ابعت رسالة سريعة لشخص عزيز عليك قوله شكراً على وجوده."
    },
    work: {
      label: "إنجاز المهمة المؤجلة",
      description: "اختار أصغر مهمة كنت مأجلها وخلصها في أول ساعة شغل."
    },
    finance: {
      label: "مراجعة المصاريف",
      description: "سجل مصروفات آخر يومين وشوف إيه اللي كان ممكن يتوفر."
    },
    dreams: {
      label: "خطوة نحو الحلم",
      description: "اعمل بحث صغير أو خطوة فعلية واحدة بتقربك من هدفك الكبير."
    },
    spirit: {
      label: "لحظة تأمل",
      description: "اقعد في هدوء تام لمدة 10 دقائق بدون أي مشتتات."
    },
    knowledge: {
      label: "تعلم مفهوم جديد",
      description: "اقرأ مقال أو اتفرج على فيديو بيشرح حاجة جديدة في مجالك."
    }
  };

  const mission = missions[domainId];
  return {
    ...mission,
    domainId,
    rewardXp: 60
  };
}

// ─── AI System Prompt Builder ────────────────────────────────────

/**
 * Build the system prompt that turns Jarvis into a full Life Advisor
 */
export function buildLifeAdvisorSystemPrompt(ctx: LifeContext): string {
  const domainSummary = LIFE_DOMAINS.map(domain => {
    const assessment = ctx.domainAssessments[domain.id];
    const score = ctx.lifeScore?.domains[domain.id] ?? "?";
    return `- ${domain.icon} ${domain.label}: ${score}/100${assessment ? ` (آخر تقييم: ${assessment.score}/10)` : ""}`;
  }).join("\n");

  const problemsSummary = ctx.activeProblems.length > 0
    ? ctx.activeProblems.slice(0, 5).map((p, i) =>
        `${i + 1}. [${getDomainConfig(p.domainId).label}] ${p.content.slice(0, 80)}`
      ).join("\n")
    : "لا توجد مشاكل مفتوحة";

  const decisionsSummary = ctx.pendingDecisions.length > 0
    ? ctx.pendingDecisions.slice(0, 3).map((d, i) =>
        `${i + 1}. [${getDomainConfig(d.domainId).label}] ${d.content.slice(0, 80)}`
      ).join("\n")
    : "لا توجد قرارات معلقة";

  return `أنت "جارفيس" — مستشار الحياة الذكي في منصة "الرحلة".

## هويتك:
- أنت مش ثيرابست، أنت استراتيجي حياة
- بتشوف الصورة الكبيرة وبتوصل النقط
- بتتكلم بالعامية المصرية
- مباشر، صريح، لكن إنساني
- مبتحكمش أخلاقياً — بتحلل استراتيجياً

## بيانات المستخدم الحالية:
الاسم: ${ctx.userName ?? "مجهول"}
المزاج: ${ctx.currentMood ?? "غير محدد"}
الطاقة: ${ctx.currentEnergy ?? "?"}/10
الـ Streak: ${ctx.streakDays} يوم

## Life Score: ${ctx.lifeScore?.overall ?? "?"}/100 (${ctx.lifeScore?.trend ?? "stable"})
${domainSummary}

## العلاقات:
- إجمالي: ${ctx.relationshipHealth.total} شخص
- أخضر: ${ctx.relationshipHealth.green} | أصفر: ${ctx.relationshipHealth.yellow} | أحمر: ${ctx.relationshipHealth.red}
- معزولين: ${ctx.relationshipHealth.detached}

## مشاكل مفتوحة (${ctx.activeProblems.length}):
${problemsSummary}

## قرارات معلقة (${ctx.pendingDecisions.length}):
${decisionsSummary}

## قواعد التعامل:
1. لا تكرر المعلومات اللي المستخدم يعرفها — استنتج وقدم رؤى جديدة
2. لو لاحظت نمط (مشاكل متكررة في نفس المجال)، نبه عليه
3. Prioritize: إيه أهم حاجة يعملها دلوقتي؟
4. لو الـ Life Score تحت 30: كن حنون ومشجع
5. لو الـ Life Score فوق 70: تحدّيه يحقق أكتر
6. ربط بين المجالات — "العلاقة المتوترة دي بتأثر على شغلك"
7. خليك مختصر — أقصى 3 فقرات في الرد`;
}

// ─── Pattern Detector ────────────────────────────────────────────

export interface DetectedPattern {
  id: string;
  type: "recurring_problem" | "domain_decline" | "decision_avoidance" | "energy_cycle" | "streak_risk";
  label: string;
  description: string;
  severity: "info" | "warning" | "critical";
  domainId?: LifeDomainId;
  suggestedAction?: string;
}

/**
 * Detect patterns across all life data
 */
export function detectLifePatterns(ctx: LifeContext): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Pattern 1: Recurring problems in same domain
  const domainProblemCounts: Record<string, number> = {};
  for (const problem of ctx.activeProblems) {
    domainProblemCounts[problem.domainId] = (domainProblemCounts[problem.domainId] ?? 0) + 1;
  }
  for (const [domainId, count] of Object.entries(domainProblemCounts)) {
    if (count >= 3) {
      const config = getDomainConfig(domainId as LifeDomainId);
      patterns.push({
        id: `recurring-${domainId}`,
        type: "recurring_problem",
        label: `تراكم مشاكل في ${config.label}`,
        description: `${count} مشاكل مفتوحة في نفس المجال — محتمل فيه سبب جذري واحد`,
        severity: "warning",
        domainId: domainId as LifeDomainId,
        suggestedAction: `ابدأ بحل أصغر مشكلة في ${config.label} عشان تكسر الحلقة`
      });
    }
  }

  // Pattern 2: Decision avoidance
  if (ctx.pendingDecisions.length >= 4) {
    patterns.push({
      id: "decision-avoidance",
      type: "decision_avoidance",
      label: "تأجيل القرارات",
      description: `${ctx.pendingDecisions.length} قرارات معلقة — تأجيل القرارات بيزود التوتر`,
      severity: ctx.pendingDecisions.length >= 6 ? "critical" : "warning",
      suggestedAction: "اختار أسهل قرار واحسمه النهاردة. القرار الغلط أحسن من عدم القرار"
    });
  }

  // Pattern 3: Domain decline
  if (ctx.lifeScore) {
    for (const domain of LIFE_DOMAINS) {
      const score = ctx.lifeScore.domains[domain.id];
      if (score < 25) {
        patterns.push({
          id: `decline-${domain.id}`,
          type: "domain_decline",
          label: `${domain.label} في خطر`,
          description: `نتيجة ${domain.label} = ${score}% — محتاج تدخل فوري`,
          severity: "critical",
          domainId: domain.id,
          suggestedAction: domain.quickAssessmentQuestions[0]
        });
      }
    }
  }

  // Pattern 4: Energy cycle
  if (ctx.currentEnergy !== null && ctx.currentEnergy <= 3) {
    patterns.push({
      id: "low-energy",
      type: "energy_cycle",
      label: "طاقة منخفضة",
      description: "مستوى الطاقة ${ctx.currentEnergy}/10 — جسمك بيطلب راحة",
      severity: "warning",
      domainId: "body",
      suggestedAction: "قلل المهام لأقل حاجة ممكنة. النوم أو التمشية أولوية"
    });
  }

  // Pattern 5: Streak at risk
  if (ctx.streakDays > 5) {
    patterns.push({
      id: "streak-momentum",
      type: "streak_risk",
      label: `${ctx.streakDays} يوم streak 🔥`,
      description: "حافظ! ده إنجاز مش سهل",
      severity: "info",
      suggestedAction: "لو مش قادر تعمل حاجة كبيرة، عمل نبضة واحدة بس عشان ما تكسرش الـ streak"
    });
  }

  return patterns;
}

// ─── Contextual Daily Intelligence ───────────────────────────────

/**
 * Smarter daily brief that considers time of day, day of week, and rituals
 */
export function generateDailyBrief(ctx: LifeContext): {
  greeting: string;
  dayMessage: string;
  focusArea: string | null;
  energyAdvice: string | null;
} {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  const name = ctx.userName ?? "";

  // Time-aware greeting
  let greeting: string;
  let dayMessage: string;

  if (hour < 10) {
    greeting = `صباح الخير ${name}! ☀️`;
    dayMessage = "يومك لسه بادئ — اعمل أهم حاجة أول ما طاقتك عالية";
  } else if (hour < 14) {
    greeting = `إيه أخبارك ${name}! 🌤️`;
    dayMessage = "نص اليوم — ركّز على أهم فكرة واحدة بس";
  } else if (hour < 18) {
    greeting = `مساء الخير ${name}! 🌅`;
    dayMessage = "آخر ساعات الشغل — لو مش قادر تخلص، أجّل بذكاء";
  } else {
    greeting = `مساء النور ${name}! 🌙`;
    dayMessage = "وقت المراجعة والاسترخاء — إيه أنجزت النهاردة؟";
  }

  // Day of week awareness
  const weekendDays = [5, 6]; // Friday, Saturday (Egypt)
  if (weekendDays.includes(dayOfWeek)) {
    dayMessage = "يوم إجازة — خلّيه لراحتك وعلاقاتك 🏖️";
  } else if (dayOfWeek === 0) {
    dayMessage = "أول يوم في الأسبوع — ابدأ بخطوة واحدة واضحة 🎯";
  }

  // Focus area from weakest domain
  let focusArea: string | null = null;
  if (ctx.lifeScore) {
    const weakest = ctx.lifeScore.weakestDomain;
    const weakScore = ctx.lifeScore.domains[weakest];
    const weakConfig = getDomainConfig(weakest);
    if (weakScore < 50) {
      focusArea = `${weakConfig.icon} ${weakConfig.label} محتاج اهتمامك (${weakScore}%)`;
    }
  }

  // Energy-based advice
  let energyAdvice: string | null = null;
  if (ctx.currentEnergy !== null) {
    if (ctx.currentEnergy <= 3) {
      energyAdvice = "طاقتك منخفضة — قلل مهامك لأقل حاجة. الراحة إنتاجية";
    } else if (ctx.currentEnergy <= 5) {
      energyAdvice = "طاقتك معتدلة — اشتغل على حاجة واحدة بس وخلصها";
    } else if (ctx.currentEnergy >= 8) {
      energyAdvice = "طاقتك عالية 🔥 — استغل ده في أصعب مهمة عندك";
    }
  }

  return { greeting, dayMessage, focusArea, energyAdvice };
}

/**
 * Generate an evening insight based on the day's data
 */
export function generateEveningInsight(ctx: LifeContext): string {
  const insights: string[] = [];

  // Check active problems trend
  if (ctx.activeProblems.length === 0 && ctx.pendingDecisions.length === 0) {
    insights.push("يومك كان نظيف — مفيش مشاكل أو قرارات معلقة ✨");
  }

  // Check for resolved items today
  const today = new Date().toISOString().slice(0, 10);
  const resolvedToday = ctx.recentEntries.filter(
    e => e.status === "resolved" && e.resolvedAt &&
    new Date(e.resolvedAt).toISOString().slice(0, 10) === today
  );
  if (resolvedToday.length > 0) {
    insights.push(`حليت ${resolvedToday.length} حاجة النهاردة — شغل ممتاز! 💪`);
  }

  // Relationship health
  if (ctx.relationshipHealth.red > 2) {
    insights.push(`${ctx.relationshipHealth.red} علاقات في المنطقة الحمراء — حاول تخصصلهم وقت بكره`);
  }

  // Decision pile-up
  if (ctx.pendingDecisions.length >= 3) {
    insights.push(`عندك ${ctx.pendingDecisions.length} قرارات معلقة — تأجيل القرار هو أسوأ قرار`);
  }

  // Default
  if (insights.length === 0) {
    insights.push("يوم عادي — والأيام العادية هي اللي بتبني العادات القوية 🌱");
  }

  return insights[0];
}
