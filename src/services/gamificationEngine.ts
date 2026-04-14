export { useGamificationState } from '@/domains/gamification/store/gamification.store';
export type { Rank } from '@/domains/gamification/store/gamification.store';

/**
 * Gamification Engine — محرك التلعيب 🎮
 * ==========================================
 * يحول السلوكيات الإيجابية (الصدق، الانضباط) إلى نقاط خبرة (XP) ورتب عسكرية.
 */

export const XP_ACTIONS = {
    MIRROR_CONFRONT: 50,
    DAILY_VISIT: 20,
    MAP_SHARED: 50,
    WISDOM_SHARED: 40,
    PULSE_COMPLETED: 30,
    NODE_ADDED: 50,
    NODE_ARCHIVED: 60,
    NOTE_ADDED: 15,
    ENERGY_TRANSACTION: 25,
    JOURNEY_MILESTONE: 100,
    // ❄️ Tajmeed Freeze Actions
    FREEZE_RELATIONSHIP: 60,
    UNFREEZE_RELATIONSHIP: 40,
    BOUNDARY_SET: 30,
    PATTERN_DETECTED: 20,
    RING_IMPROVED: 35,
    FROST_COMBO: 100,
} as const;

/**
 * المهام اليومية (Daily Quests)
 */
export interface DailyQuest {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    isCompleted: boolean;
    actionKey: string;
    category?: 'relational' | 'wisdom' | 'discipline' | 'growth';
}

export function getDailyQuests(nodes: any[] = [], completedKeys: string[] = []): DailyQuest[] {
    const quests: DailyQuest[] = [];
    
    // 1. Mandatory Core Quest: Check-in
    quests.push({
        id: "dq_checkin",
        title: "تسجيل حضور",
        description: "ادخل للمنصة وسجل حضورك السِيادي اليومي",
        xpReward: 20,
        isCompleted: completedKeys.includes("dq_checkin"),
        actionKey: "daily_visit",
        category: 'discipline'
    });

    // 2. Pulse Check Quest
    quests.push({
        id: "dq_pulse",
        title: "فحص النبض",
        description: "قم بتسجيل حالتك الشعورية والطاقية الآن",
        xpReward: 30,
        isCompleted: completedKeys.includes("dq_pulse"),
        actionKey: "pulse_completed",
        category: 'discipline'
    });

    // 3. Dynamic Relational Quest
    const redNodes = nodes.filter(n => !n.isNodeArchived && n.ring === 'red');
    if (redNodes.length > 0) {
        quests.push({
            id: "dq_relational",
            title: "رعاية الروابط",
            description: "قم بتحديث حالة أحد الأشخاص في الدائرة الحمراء",
            xpReward: 40,
            isCompleted: completedKeys.includes("dq_relational"),
            actionKey: "node_updated",
            category: 'relational'
        });
    } else if (nodes.length < 5) {
        quests.push({
            id: "dq_expand",
            title: "بناء الرادار",
            description: "أضف شخصاً جديداً لخريطة السيادة الخاصة بك",
            xpReward: 50,
            isCompleted: completedKeys.includes("dq_expand"),
            actionKey: "node_added",
            category: 'relational'
        });
    }

    // 4. Wisdom/Knowledge Quest
    quests.push({
        id: "dq_wisdom_matrix",
        title: "استكشاف مصفوفة الحكمة",
        description: "افتح مورد معرفي واحد من مصفوفة الحكمة لتعزيز وعيك",
        xpReward: 35,
        isCompleted: completedKeys.includes("dq_wisdom_matrix"),
        actionKey: "wisdom_resource_viewed",
        category: 'wisdom'
    });

    // 5. Growth Quest: Reflection
    quests.push({
        id: "dq_note_reflection",
        title: "لحظة تأمل",
        description: "أضف ملاحظة أو بصيرة جديدة لأحد الأشخاص في مدارك",
        xpReward: 30,
        isCompleted: completedKeys.includes("dq_note_reflection"),
        actionKey: "note_added",
        category: 'growth'
    });

    // 6. Weekly Sovereign Milestone (Bonus)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 5) { // Friday / Jalsa Day
        quests.push({
            id: "wq_weekly_review",
            title: "جلسة المراجعة الأسبوعية",
            description: "راجع خريطتك بالكامل وحدد الأولويات للأسبوع القادم",
            xpReward: 100,
            isCompleted: completedKeys.includes("wq_weekly_review"),
            actionKey: "weekly_review_completed",
            category: 'growth'
        });
    }

    // --- ❄️ Tajmeed: Freeze-themed Quests ---

    // 7. Freeze Guardian Quest (when there are archived/frozen nodes)
    const archivedNodes = nodes.filter((n: any) => n.isNodeArchived === true);
    if (archivedNodes.length > 0) {
        quests.push({
            id: "dq_frost_check",
            title: "❄️ مراجعة الصقيع",
            description: `راجع ${archivedNodes.length} علاقة مجمدة — هل حان وقت الذوبان الواعي؟`,
            xpReward: 35,
            isCompleted: completedKeys.includes("dq_frost_check"),
            actionKey: "frost_review",
            category: 'relational'
        });
    }

    // 8. Boundary Quest (encourage boundary setting)
    const hasRedOrYellow = nodes.some((n: any) => !n.isNodeArchived && (n.ring === 'red' || n.ring === 'yellow'));
    if (hasRedOrYellow) {
        quests.push({
            id: "dq_set_boundary",
            title: "🛡️ حراسة الحدود",
            description: "ضع حدّاً واضحاً مع شخص في المدار الأحمر أو الأصفر",
            xpReward: 45,
            isCompleted: completedKeys.includes("dq_set_boundary"),
            actionKey: "boundary_set",
            category: 'relational'
        });
    }

    return quests;
}
