/**
 * Action Plan Engine — محرك خطة العمل 📋
 * ========================================
 * بيحوّل الـ insight من الخريطة إلى خطوات يومية قابلة للتنفيذ.
 * كل خطوة مرتبطة بدائرة معينة في الخريطة.
 */

import { logger } from "@/services/logger";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";

const STORAGE_KEY = "dawayir_action_plan";

export interface MicroAction {
    id: string;
    title: string;
    description: string;
    linkedNodeId?: string;
    linkedNodeLabel?: string;
    category: "boundary" | "communication" | "self-care" | "awareness" | "decision";
    isCompleted: boolean;
    createdAt: number;
    completedAt?: number;
}

export interface ActionPlan {
    mapId?: string;
    actions: MicroAction[];
    generatedAt: number;
    insightUsed: string;
}

const CATEGORY_LABELS: Record<MicroAction["category"], string> = {
    boundary: "حدود",
    communication: "تواصل",
    "self-care": "عناية ذاتية",
    awareness: "وعي",
    decision: "قرار",
};

/**
 * يولّد خطة عمل بناءً على بيانات الخريطة.
 * في هذه المرحلة يعمل locally بدون AI call — يستخدم منطق rule-based.
 * يمكن ترقيته لاحقاً ليستخدم Gemini.
 */
export function generateActionPlan(
    insightMessage: string,
    nodes: Array<{ id: string; label: string; color?: string; size?: string; mass?: number }>,
): ActionPlan {
    const actions: MicroAction[] = [];
    const now = Date.now();

    // Find the most problematic nodes (danger, high mass)
    const dangerNodes = nodes.filter((n) => n.color === "danger" || (n.mass && n.mass > 6));
    const targetNodes = dangerNodes.length > 0 ? dangerNodes : nodes.filter((n) => n.color !== "core").slice(0, 3);

    for (const node of targetNodes) {
        const isDanger = node.color === "danger";
        const isHeavy = (node.mass ?? 0) > 6;

        // Rule 1: Boundary action for draining relationships
        if (isDanger) {
            actions.push({
                id: `action-${node.id}-boundary`,
                title: `حدد وقت محدد للتفاعل مع "${node.label}"`,
                description: `العلاقة مع ${node.label} بتستنزف طاقتك. حاول تحدد 30 دقيقة كحد أقصى للتفاعل اليومي وراقب تأثير ده على طاقتك.`,
                linkedNodeId: node.id,
                linkedNodeLabel: node.label,
                category: "boundary",
                isCompleted: false,
                createdAt: now,
            });
        }

        // Rule 2: Awareness action for heavy relationships
        if (isHeavy) {
            actions.push({
                id: `action-${node.id}-awareness`,
                title: `سجّل مشاعرك بعد كل تفاعل مع "${node.label}"`,
                description: `خذ دقيقة بعد كل محادثة أو لقاء مع ${node.label}. اسأل نفسك: "طاقتي زادت ولا نقصت؟" وسجّل الإجابة.`,
                linkedNodeId: node.id,
                linkedNodeLabel: node.label,
                category: "awareness",
                isCompleted: false,
                createdAt: now,
            });
        }

        // Rule 3: Communication action
        if (isDanger || isHeavy) {
            actions.push({
                id: `action-${node.id}-comm`,
                title: `عبّر عن حاجة واحدة لـ "${node.label}"`,
                description: `اختار حاجة واحدة بسيطة بتضايقك في العلاقة مع ${node.label} وعبّر عنها بهدوء. مش لازم تحل المشكلة كلها — خطوة واحدة كفاية.`,
                linkedNodeId: node.id,
                linkedNodeLabel: node.label,
                category: "communication",
                isCompleted: false,
                createdAt: now,
            });
        }
    }

    // Always add a self-care action
    actions.push({
        id: `action-selfcare-${now}`,
        title: "خذ 10 دقائق صمت اليوم",
        description: "قبل ما تنام، اقفل الموبايل وخذ 10 دقائق من غير أي مؤثر خارجي. ركّز على تنفسك بس. ده بيعيد ضبط الجهاز العصبي.",
        category: "self-care",
        isCompleted: false,
        createdAt: now,
    });

    const plan: ActionPlan = {
        actions: actions.slice(0, 5), // Max 5 actions
        generatedAt: now,
        insightUsed: insightMessage,
    };

    // Save to localStorage
    savePlan(plan);

    return plan;
}

/** Save the action plan to localStorage */
export function savePlan(plan: ActionPlan): void {
    try {
        setInLocalStorage(STORAGE_KEY, JSON.stringify(plan));
    } catch (e) {
        logger.error("[ActionPlan] Failed to save:", e);
    }
}

/** Load the action plan from localStorage */
export function loadPlan(): ActionPlan | null {
    try {
        const raw = getFromLocalStorage(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as ActionPlan;
    } catch {
        return null;
    }
}

/** Toggle action completion */
export function toggleAction(actionId: string): ActionPlan | null {
    const plan = loadPlan();
    if (!plan) return null;

    plan.actions = plan.actions.map((a) =>
        a.id === actionId
            ? {
                ...a,
                isCompleted: !a.isCompleted,
                completedAt: !a.isCompleted ? Date.now() : undefined,
              }
            : a
    );

    savePlan(plan);
    return plan;
}

/** Get category label in Arabic */
export function getCategoryLabel(category: MicroAction["category"]): string {
    return CATEGORY_LABELS[category] || category;
}

/** Calculate completion percentage */
export function getCompletionPercent(plan: ActionPlan): number {
    if (plan.actions.length === 0) return 0;
    const completed = plan.actions.filter((a) => a.isCompleted).length;
    return Math.round((completed / plan.actions.length) * 100);
}
