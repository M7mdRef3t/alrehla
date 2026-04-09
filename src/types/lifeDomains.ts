/**
 * 🧬 Life Domains — نظام تشغيل الحياة
 * =========================================
 * التقسيم الشامل لكل مجالات حياة المستخدم.
 * كل مجال له بيانات مستقلة + score خاص + ربط بالمجالات الأخرى.
 */

// ─── Domain Taxonomy ─────────────────────────────────────────────
export type LifeDomainId =
  | "self"       // الذات — صحة نفسية، نمو شخصي، عادات
  | "body"       // الجسد — صحة جسدية، رياضة، نوم، طاقة
  | "relations"  // العلاقات — الـ Dawayir الحالية
  | "work"       // العمل — مهنة، مشاريع، إنتاجية
  | "finance"    // المال — ميزانية، دخل، ادخار
  | "dreams"     // الأحلام — أهداف كبيرة، رؤى، مشاريع حياة
  | "spirit"     // الروح — إيمان، تأمل، هدف أعلى
  | "knowledge"; // المعرفة — تعلم، مهارات، قراءة

export interface LifeDomainConfig {
  id: LifeDomainId;
  label: string;
  labelEn: string;
  icon: string;
  color: string;        // Primary color for UI
  colorLight: string;   // Lighter variant
  description: string;
  /** أسئلة سريعة لتقييم المجال (1-10) */
  quickAssessmentQuestions: string[];
}

// ─── Domain Registry ─────────────────────────────────────────────
export const LIFE_DOMAINS: LifeDomainConfig[] = [
  {
    id: "self",
    label: "الذات",
    labelEn: "Self",
    icon: "🧘",
    color: "#8b5cf6",
    colorLight: "#c4b5fd",
    description: "صحتك النفسية، عاداتك، ونموك الشخصي",
    quickAssessmentQuestions: [
      "حاسس بالرضا عن نفسك النهاردة؟",
      "قدرت تلتزم بعاداتك الإيجابية؟",
      "مستوى الوعي بمشاعرك ودوافعك؟"
    ]
  },
  {
    id: "body",
    label: "الجسد",
    labelEn: "Body",
    icon: "💪",
    color: "#10b981",
    colorLight: "#6ee7b7",
    description: "صحتك الجسدية، نومك، وطاقتك",
    quickAssessmentQuestions: [
      "جسمك مرتاح ومفيش آلام؟",
      "نمت كويس الليلة اللي فاتت؟",
      "أكلت أكل صحي النهاردة؟"
    ]
  },
  {
    id: "relations",
    label: "العلاقات",
    labelEn: "Relations",
    icon: "🤝",
    color: "#06b6d4",
    colorLight: "#67e8f9",
    description: "علاقاتك مع الناس — الدوائر والحدود",
    quickAssessmentQuestions: [
      "علاقاتك القريبة مستقرة؟",
      "حدودك واضحة ومحترمة؟",
      "فيه حد مأثر سلبياً عليك دلوقتي؟"
    ]
  },
  {
    id: "work",
    label: "العمل",
    labelEn: "Work",
    icon: "💼",
    color: "#f59e0b",
    colorLight: "#fcd34d",
    description: "شغلك، إنتاجيتك، ومشاريعك",
    quickAssessmentQuestions: [
      "راضي عن إنتاجيتك النهاردة؟",
      "شغلك ماشي في الاتجاه الصح؟",
      "فيه ضغط شغل مأثر عليك؟"
    ]
  },
  {
    id: "finance",
    label: "المال",
    labelEn: "Finance",
    icon: "💰",
    color: "#22c55e",
    colorLight: "#86efac",
    description: "دخلك، مصاريفك، وأمانك المالي",
    quickAssessmentQuestions: [
      "حاسس بأمان مادي؟",
      "مصاريفك تحت السيطرة؟",
      "بتدخر أو بتستثمر؟"
    ]
  },
  {
    id: "dreams",
    label: "الأحلام",
    labelEn: "Dreams",
    icon: "✨",
    color: "#ec4899",
    colorLight: "#f9a8d4",
    description: "أهدافك الكبيرة، أحلامك، ومشاريع حياتك",
    quickAssessmentQuestions: [
      "بتشتغل على حلم أو هدف كبير؟",
      "حاسس بأمل وحماس تجاه المستقبل؟",
      "عارف الخطوة الجاية في رحلة حلمك؟"
    ]
  },
  {
    id: "spirit",
    label: "الروح",
    labelEn: "Spirit",
    icon: "🌙",
    color: "#6366f1",
    colorLight: "#a5b4fc",
    description: "إيمانك، سلامك الداخلي، وهدفك الأعلى",
    quickAssessmentQuestions: [
      "حاسس بسلام داخلي؟",
      "عندك اتصال بهدف أكبر من نفسك؟",
      "بتاخد وقت للتأمل أو العبادة؟"
    ]
  },
  {
    id: "knowledge",
    label: "المعرفة",
    labelEn: "Knowledge",
    icon: "📚",
    color: "#0ea5e9",
    colorLight: "#7dd3fc",
    description: "تعلمك، مهاراتك، وفضولك",
    quickAssessmentQuestions: [
      "اتعلمت حاجة جديدة مؤخراً؟",
      "بتطور مهاراتك بانتظام؟",
      "بتقرأ أو بتتابع محتوى تعليمي؟"
    ]
  }
];

export function getDomainConfig(id: LifeDomainId): LifeDomainConfig {
  return LIFE_DOMAINS.find(d => d.id === id) ?? LIFE_DOMAINS[0];
}

// ─── Domain Assessment Entry ─────────────────────────────────────
export interface DomainAssessment {
  domainId: LifeDomainId;
  score: number;          // 1-10
  answers: number[];      // scores for each quick question
  note?: string;          // optional free-text note
  timestamp: number;
}

// ─── Life Entry (Quick Capture) ──────────────────────────────────
export type LifeEntryType = "thought" | "problem" | "decision" | "goal" | "note" | "win" | "lesson";

export interface LifeEntry {
  id: string;
  type: LifeEntryType;
  content: string;
  domainId: LifeDomainId;
  /** Optional: linked to a specific problem or decision */
  linkedEntryId?: string;
  /** AI-generated tags */
  tags?: string[];
  /** Priority: 1 (low) to 5 (critical) */
  priority: number;
  status: "active" | "resolved" | "archived" | "deferred";
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
}

// ─── Problem Tracker ─────────────────────────────────────────────
export type ProblemImpact = "low" | "medium" | "high" | "critical";

export interface LifeProblem extends LifeEntry {
  type: "problem";
  impact: ProblemImpact;
  /** Which domains does this problem affect? */
  affectedDomains: LifeDomainId[];
  /** What's the root cause? (AI-assisted) */
  rootCause?: string;
  /** Suggested actions from AI */
  suggestedActions?: string[];
  /** Is this recurring? */
  isRecurring: boolean;
  /** How many times has this type of problem occurred? */
  occurrenceCount: number;
}

// ─── Decision Tracker ────────────────────────────────────────────
export type DecisionUrgency = "can_wait" | "this_week" | "today" | "now";
export type DecisionOutcome = "pending" | "decided" | "executed" | "reviewed";

export interface LifeDecision extends LifeEntry {
  type: "decision";
  urgency: DecisionUrgency;
  outcome: DecisionOutcome;
  /** The options being considered */
  options: DecisionOption[];
  /** Which option was chosen */
  chosenOptionId?: string;
  /** AI analysis of pros/cons */
  aiAnalysis?: string;
  /** Post-decision reflection */
  retrospective?: string;
  /** Deadline if any */
  deadline?: number;
}

export interface DecisionOption {
  id: string;
  label: string;
  pros: string[];
  cons: string[];
  /** AI-calculated score (0-1) */
  alignmentScore?: number;
}

// ─── Life Score ──────────────────────────────────────────────────
export interface LifeScore {
  /** Overall life score (0-100) */
  overall: number;
  /** Score per domain (0-100) */
  domains: Record<LifeDomainId, number>;
  /** Trend: improving, stable, declining */
  trend: "improving" | "stable" | "declining";
  /** The domain that needs most attention */
  weakestDomain: LifeDomainId;
  /** The domain that's thriving */
  strongestDomain: LifeDomainId;
  /** Timestamp of calculation */
  calculatedAt: number;
  /** Active problems count */
  activeProblems: number;
  /** Pending decisions count */
  pendingDecisions: number;
}

// ─── Morning Brief ───────────────────────────────────────────────
export interface MorningBriefData {
  /** AI-generated greeting based on user data */
  greeting: string;
  /** Top 3 priorities for today */
  topPriorities: MorningPriority[];
  /** Life score snapshot */
  lifeScore: LifeScore;
  /** Quick insight about a pattern */
  patternInsight?: string;
  /** Active streak */
  streakDays: number;
  /** Proactive mission for today build on weakest domain */
  dailyMission?: {
    label: string;
    domainId: LifeDomainId;
    rewardXp: number;
    description: string;
  };
  /** Generated at */
  generatedAt: number;
}

export interface MorningPriority {
  id: string;
  label: string;
  domainId: LifeDomainId;
  reason: string;
  type: "problem" | "decision" | "goal" | "routine" | "relationship";
}
