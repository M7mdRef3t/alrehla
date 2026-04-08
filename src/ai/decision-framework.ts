import { logger } from "@/services/logger";
/**
 * DECISION_FRAMEWORK.ts — إطار القرارات للـ AI Autonomy
 * ========================================================
 * يحدد إيه اللي الـ AI Agent يقدر يعمله **لوحده**،
 * وإيه اللي محتاج **موافقة من محمد** (أو المستخدم).
 *
 * المبدأ الأساسي:
 * "الـ AI = Extension of Consciousness، مش Replacement"
 */

import type { MapNode } from "@/modules/map/mapTypes";
import type { DailyQuestion } from "@/data/dailyQuestions";
import { useEmergencyState } from "@/state/emergencyState";
import { useToastState } from "@/state/toastState";



// ═══════════════════════════════════════════════════════════════════════════
// 🎯 تصنيف القرارات (Decision Categories)
// ═══════════════════════════════════════════════════════════════════════════

export type DecisionType =
  // ── محتوى ──
  | "generate_daily_question"
  | "generate_content_packet"
  | "generate_recovery_script"
  | "filter_community_content"
  | "content_generated"
  | "campaign_created"

  // ── تحليل ──
  | "analyze_user_state"
  | "calculate_tei"
  | "detect_shadow_pulse"
  | "recommend_action"

  // ── تعديلات على الـ State ──
  | "add_node"
  | "move_node_to_ring"
  | "archive_node"
  | "delete_node"
  | "update_insights"

  // ── تفاعل مع المستخدم ──
  | "send_notification"
  | "trigger_breathing_exercise"
  | "escalate_crisis"

  // ── تجارية ──
  | "adjust_pricing"
  | "pricing_change"
  | "ab_test_started"
  | "ab_test_ended"
  | "emotional_pricing_triggered"
  | "send_marketing_email"
  | "process_payment"
  | "grant_discount"
  | "subscription_activated"
  | "subscription_cancelled"

  // ── تقنية ──
  | "optimize_performance"
  | "fix_bug"
  | "a_b_test_ui"
  | "update_dependency"

  // ── استراتيجية ──
  | "change_core_principles"
  | "pivot_business_model"
  | "remove_major_feature"
  | "legal_decision";

// ═══════════════════════════════════════════════════════════════════════════
// 🚦 مستويات الحكم الذاتي (Autonomy Levels)
// ═══════════════════════════════════════════════════════════════════════════

export type AutonomyLevel =
  | "FULLY_AUTONOMOUS" // AI ينفذ فوراً بدون سؤال
  | "AUTONOMOUS_WITH_LOG" // AI ينفذ، لكن يسجل القرار للمراجعة
  | "REQUIRES_APPROVAL" // AI يقترح، لكن محتاج موافقة بشرية
  | "FORBIDDEN"; // AI ممنوع منعاً باتاً

// ═══════════════════════════════════════════════════════════════════════════
// 📋 القواعد الأساسية (Base Rules)
// ═══════════════════════════════════════════════════════════════════════════

export const DECISION_RULES: Record<DecisionType, AutonomyLevel> = {
  // ── محتوى ── (AI يقدر يولّد، لكن بشروط جودة)
  generate_daily_question: "AUTONOMOUS_WITH_LOG",
  generate_content_packet: "AUTONOMOUS_WITH_LOG",
  generate_recovery_script: "AUTONOMOUS_WITH_LOG",
  filter_community_content: "FULLY_AUTONOMOUS",
  content_generated: "AUTONOMOUS_WITH_LOG",
  campaign_created: "REQUIRES_APPROVAL",

  // ── تحليل ── (AI حر تماماً)
  analyze_user_state: "FULLY_AUTONOMOUS",
  calculate_tei: "FULLY_AUTONOMOUS",
  detect_shadow_pulse: "FULLY_AUTONOMOUS",
  recommend_action: "AUTONOMOUS_WITH_LOG",

  // ── تعديلات على الـ State ──
  add_node: "FORBIDDEN", // فقط المستخدم يضيف أشخاص
  move_node_to_ring: "REQUIRES_APPROVAL", // AI يقترح، المستخدم يقرر
  archive_node: "FORBIDDEN", // فقط المستخدم يؤرشف
  delete_node: "FORBIDDEN", // ممنوع حذف بيانات نهائياً
  update_insights: "AUTONOMOUS_WITH_LOG", // AI يكتب insights للشخص

  // ── تفاعل مع المستخدم ──
  send_notification: "AUTONOMOUS_WITH_LOG",
  trigger_breathing_exercise: "FULLY_AUTONOMOUS",
  escalate_crisis: "FULLY_AUTONOMOUS", // حالات الطوارئ فورية

  // ── تجارية ── (كل قرار مالي محتاج موافقة)
  adjust_pricing: "REQUIRES_APPROVAL",
  pricing_change: "REQUIRES_APPROVAL",
  ab_test_started: "REQUIRES_APPROVAL",
  ab_test_ended: "AUTONOMOUS_WITH_LOG",
  emotional_pricing_triggered: "AUTONOMOUS_WITH_LOG",
  send_marketing_email: "REQUIRES_APPROVAL",
  process_payment: "FORBIDDEN", // الدفع لا يُنفذ تلقائيًا من الـ AI
  grant_discount: "REQUIRES_APPROVAL",
  subscription_activated: "AUTONOMOUS_WITH_LOG",
  subscription_cancelled: "AUTONOMOUS_WITH_LOG",

  // ── تقنية ──
  optimize_performance: "AUTONOMOUS_WITH_LOG",
  fix_bug: "AUTONOMOUS_WITH_LOG",
  a_b_test_ui: "REQUIRES_APPROVAL",
  update_dependency: "REQUIRES_APPROVAL",

  // ── استراتيجية ── (كل حاجة استراتيجية ممنوعة)
  change_core_principles: "FORBIDDEN",
  pivot_business_model: "FORBIDDEN",
  remove_major_feature: "FORBIDDEN",
  legal_decision: "FORBIDDEN",
};

// ═══════════════════════════════════════════════════════════════════════════
// 🧩 واجهة القرار (Decision Interface)
// ═══════════════════════════════════════════════════════════════════════════

export interface AIDecision {
  id?: string;
  type: DecisionType;
  timestamp: number;
  reasoning: string; // ليه الـ AI اتخذ القرار ده؟
  payload: unknown; // البيانات المرتبطة بالقرار
  outcome?: "executed" | "pending_approval" | "rejected" | "forbidden";
  approvedBy?: "system" | "user" | "admin";
  executedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ⚖️ Decision Engine — محرك القرارات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DecisionEngine — يستقبل قرار من AI ويحدد إذا يُنفّذ أو يُرفض
 */
export class DecisionEngine {
  private decisionLog: AIDecision[] = [];

  /**
   * تقييم قرار من الـ AI
   */
  async evaluate(decision: Omit<AIDecision, "timestamp">): Promise<{
    allowed: boolean;
    autonomyLevel: AutonomyLevel;
    requiresApproval: boolean;
    reason?: string;
  }> {
    const autonomyLevel = DECISION_RULES[decision.type];

    // حالة 1: ممنوع منعاً باتاً
    if (autonomyLevel === "FORBIDDEN") {
      return {
        allowed: false,
        autonomyLevel,
        requiresApproval: false,
        reason: `Decision type "${decision.type}" is forbidden for AI agents`,
      };
    }

    // حالة 2: محتاج موافقة
    if (autonomyLevel === "REQUIRES_APPROVAL") {
      return {
        allowed: false,
        autonomyLevel,
        requiresApproval: true,
        reason: `Decision type "${decision.type}" requires human approval`,
      };
    }

    // حالة 3: مسموح مع تسجيل
    if (autonomyLevel === "AUTONOMOUS_WITH_LOG") {
      // تحقق من Quality Checks (لو القرار content generation)
      if (this.isContentGeneration(decision.type)) {
        const qualityCheck = await this.validateContentQuality(decision);
        if (!qualityCheck.passed) {
          return {
            allowed: false,
            autonomyLevel,
            requiresApproval: true,
            reason: qualityCheck.reason,
          };
        }
      }

      // سجّل القرار
      this.logDecision({ ...decision, timestamp: Date.now(), outcome: "executed" });

      return {
        allowed: true,
        autonomyLevel,
        requiresApproval: false,
      };
    }

    // حالة 4: مسموح تماماً (FULLY_AUTONOMOUS)
    return {
      allowed: true,
      autonomyLevel,
      requiresApproval: false,
    };
  }

  /**
   * تنفيذ قرار (بعد الموافقة)
   */
  async execute(decision: AIDecision): Promise<void> {
    console.warn(`[DecisionEngine] Executing: ${decision.type}`, decision.payload);

    switch (decision.type) {
      case "trigger_breathing_exercise":
        try { useEmergencyState.getState().open(); } catch (e) { logger.error(e); }
        break;
      case "send_notification":
        try {
          const p = decision.payload as { message?: string } | null;
          console.warn("AI TACTICAL SIGNAL:", p?.message);
          if (p?.message) {
            useToastState.getState().showToast(p.message, "info");
          }
        } catch (e) { logger.error(e); }
        break;

    }

    this.logDecision({ ...decision, executedAt: Date.now(), outcome: "executed" });
  }

  private pendingResolvers = new Map<string, (approved: boolean) => void>();

  async requestApproval(decision: AIDecision): Promise<boolean> {
    const actId = decision.id || `decision-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    decision.id = actId;
    this.logDecision({ ...decision, outcome: "pending_approval" });

    const title = `طلب موافقة سيادية: ${decision.type}`;
    const body = decision.reasoning;

    try {
      useToastState.getState().showToast(title, "warning");
    } catch (e) {
      console.error(e);
    }

    try {
      import("@/services/notifications").then((mod) => {
        mod.sendNotification({
          title,
          body,
          tag: `approval-${decision.type}-${Date.now()}`,
          requireInteraction: true
        });
      }).catch(console.error);
    } catch (e) {
      console.error(e);
    }

    return new Promise((resolve) => {
      this.pendingResolvers.set(actId, resolve);
    });
  }

  resolveApproval(decisionId: string, approved: boolean): void {
    const resolver = this.pendingResolvers.get(decisionId);
    if (!resolver) return;

    const dIdx = this.decisionLog.findIndex(d => d.id === decisionId);
    if (dIdx >= 0) {
      this.decisionLog[dIdx] = {
        ...this.decisionLog[dIdx],
        outcome: approved ? "executed" : "rejected",
        approvedBy: "admin",
        executedAt: approved ? Date.now() : undefined,
      };
      this.saveLogToStorage();
    }

    resolver(approved);
    this.pendingResolvers.delete(decisionId);
    
    if (approved) {
      useToastState.getState().showToast("تم التصديق وبدء التنفيذ", "success");
    } else {
      useToastState.getState().showToast("تم نقض قرار الذكاء الاصطناعي", "error");
    }
  }

  private saveLogToStorage() {
    try {
      localStorage.setItem("dawayir-ai-decisions", JSON.stringify(this.decisionLog));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  /**
   * سجل القرار
   */
  private logDecision(decision: AIDecision): void {
    if (!decision.id) {
       decision.id = `decision-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    const existingIdx = this.decisionLog.findIndex(d => d.id === decision.id);
    if (existingIdx >= 0) {
      this.decisionLog[existingIdx] = decision;
    } else {
      this.decisionLog.push(decision);
    }
    
    if (this.decisionLog.length > 100) {
       this.decisionLog = this.decisionLog.slice(-100);
    }
    this.saveLogToStorage();
  }

  /**
   * رجوع آخر القرارات (للمراجعة)
   */
  getRecentDecisions(limit = 20): AIDecision[] {
    try {
      const log = JSON.parse(
        localStorage.getItem("dawayir-ai-decisions") || "[]"
      ) as AIDecision[];
      return log.slice(-limit).reverse();
    } catch {
      return [];
    }
  }

  /**
   * هل القرار متعلق بتوليد محتوى؟
   */
  private isContentGeneration(type: DecisionType): boolean {
    return [
      "generate_daily_question",
      "generate_content_packet",
      "generate_recovery_script",
      "content_generated",
    ].includes(type);
  }

  /**
   * تحقق من جودة المحتوى المُولّد
   */
  private async validateContentQuality(
    _decision: Omit<AIDecision, "timestamp">
  ): Promise<{ passed: boolean; reason?: string }> {
    // TODO: استخدم isAlignedWithPrinciples() من CORE_PRINCIPLES.ts

    // مؤقتاً: نقبل كل حاجة
    return { passed: true };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ Safety Constraints — قيود الأمان
// ═══════════════════════════════════════════════════════════════════════════

/**
 * قواعد إضافية تُطبّق على كل القرارات
 */
export const SAFETY_CONSTRAINTS = {
  /**
   * 1. لا تحذف بيانات المستخدم نهائياً
   */
  neverDeleteUserData: true,

  /**
   * 2. لا تعدل الـ CORE_PRINCIPLES
   */
  neverModifyPrinciples: true,

  /**
   * 3. لا تبعت فلوس أو تعمل معاملات مالية
   */
  neverHandleMoney: true,

  /**
   * 4. لا تعرض بيانات مستخدم لمستخدم تاني
   */
  neverLeakUserData: true,

  /**
   * 5. لو في شك، اسأل
   */
  whenInDoubtAsk: true,

  /**
   * 6. كل قرار لازم يكون له reasoning واضح
   */
  requireReasoning: true,

  /**
   * 7. الـ AI مينفعش يدّعي إنه إنسان
   */
  transparentAI: true,

  /**
   * 8. لو في crisis (انتحار/أذى)، تصعيد فوري
   */
  escalateCrisis: true,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 📊 أمثلة على استخدام DecisionEngine
// ═══════════════════════════════════════════════════════════════════════════

/**
 * مثال 1: AI يولّد سؤال يومي
 */
export async function exampleGenerateQuestion(
  engine: DecisionEngine
): Promise<void> {
  const decision: Omit<AIDecision, "timestamp"> = {
    type: "generate_daily_question",
    reasoning: "المستخدم أجاب على كل الأسئلة الموجودة",
    payload: {
      generatedQuestion: {
        id: 31,
        week: 1,
        theme: "الوعي بالذات",
        text: "إيه اللي خلاك تبدأ رحلتك في دواير؟",
      } as DailyQuestion,
    },
  };

  const result = await engine.evaluate(decision);

  if (result.allowed) {
    console.warn("✅ AI generated a new question autonomously");
    await engine.execute({ ...decision, timestamp: Date.now() });
  } else if (result.requiresApproval) {
    console.warn("⏸️ Question requires approval from محمد");
    await engine.requestApproval({ ...decision, timestamp: Date.now() });
  } else {
    console.warn("❌ Decision forbidden:", result.reason);
  }
}

/**
 * مثال 2: AI يقترح نقل شخص لدائرة تانية
 */
export async function exampleMoveNode(
  engine: DecisionEngine,
  node: MapNode
): Promise<void> {
  const decision: Omit<AIDecision, "timestamp"> = {
    type: "move_node_to_ring",
    reasoning: `Shadow Score للشخص "${node.label}" = 75 (عالي جداً). يُنصح بنقله للدائرة الحمراء.`,
    payload: {
      nodeId: node.id,
      fromRing: node.ring,
      toRing: "red",
    },
  };

  const result = await engine.evaluate(decision);

  if (result.requiresApproval) {
    console.warn("⏸️ AI suggests moving node, requires user approval");
    // هنا نبعت notification للمستخدم
  } else {
    console.warn("❌ Cannot move node automatically:", result.reason);
  }
}

/**
 * مثال 3: AI يحاول يحذف شخص (ممنوع)
 */
export async function exampleDeleteNode(
  engine: DecisionEngine,
  nodeId: string
): Promise<void> {
  const decision: Omit<AIDecision, "timestamp"> = {
    type: "delete_node",
    reasoning: "المستخدم ما تفاعلش مع الشخص ده من 90 يوم",
    payload: { nodeId },
  };

  const result = await engine.evaluate(decision);

  console.warn("❌ FORBIDDEN:", result.reason);
  // النتيجة: "Decision type 'delete_node' is forbidden for AI agents"
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔮 استراتيجية التدرج (Gradual Autonomy)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * في البداية، معظم القرارات REQUIRES_APPROVAL.
 * مع الوقت (لما نثق في الـ AI أكتر)، نقدر نرفع بعض القرارات لـ AUTONOMOUS_WITH_LOG.
 *
 * الخطة:
 * - Month 1-2: AI يقترح فقط، محمد يوافق/يرفض
 * - Month 3-4: AI ينفذ content generation لوحده، لكن بـ quality checks صارمة
 * - Month 5-6: AI ينفذ UX optimizations لوحده (A/B testing)
 * - Month 6+: AI يصل لـ 95% autonomy
 */

export const AUTONOMY_ROADMAP = {
  phase1: {
    duration: "2 months",
    autonomyLevel: 30, // 30% من القرارات autonomous
    allowedDecisions: [
      "analyze_user_state",
      "calculate_tei",
      "detect_shadow_pulse",
      "trigger_breathing_exercise",
    ] as DecisionType[],
  },
  phase2: {
    duration: "2 months",
    autonomyLevel: 60,
    allowedDecisions: [
      ...["generate_daily_question", "generate_content_packet"],
    ] as DecisionType[],
  },
  phase3: {
    duration: "2 months",
    autonomyLevel: 95,
    allowedDecisions: [
      ...["optimize_performance", "fix_bug", "send_notification"],
    ] as DecisionType[],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 التصدير
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
export const decisionEngine = new DecisionEngine();

/**
 * دالة مساعدة: هل القرار مسموح؟
 */
export async function canAIDecide(type: DecisionType): Promise<boolean> {
  const level = DECISION_RULES[type];
  return level === "FULLY_AUTONOMOUS" || level === "AUTONOMOUS_WITH_LOG";
}

/**
 * دالة مساعدة: هل القرار محتاج موافقة؟
 */
export function requiresApproval(type: DecisionType): boolean {
  return DECISION_RULES[type] === "REQUIRES_APPROVAL";
}

/**
 * دالة مساعدة: هل القرار ممنوع؟
 */
export function isForbidden(type: DecisionType): boolean {
  return DECISION_RULES[type] === "FORBIDDEN";
}

