export { useGamificationState } from '../state/gamificationState';
export type { Rank } from '../state/gamificationState';

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
    PULSE_COMPLETED: 30
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
}

export function getDailyQuests(nodes: any[] = [], completedKeys: string[] = []): DailyQuest[] {
    const quests: DailyQuest[] = [];
    
    // 1. Mandatory Core Quest
    quests.push({
        id: "dq_checkin",
        title: "تسجيل حضور",
        description: "ادخل للمنصة وسجل دخولك اليومي",
        xpReward: 20,
        isCompleted: completedKeys.includes("dq_checkin"),
        actionKey: "daily_visit"
    });

    // 2. Dynamic Relational Quest
    const redNodes = nodes.filter(n => !n.isNodeArchived && n.ring === 'red');
    const yellowNodes = nodes.filter(n => !n.isNodeArchived && n.ring === 'yellow');

    if (redNodes.length > 0) {
        const target = redNodes[0];
        quests.push({
            id: "dq_neutralize",
            title: "تكتيك التحييد",
            description: `قم بكتم أو أرشفة "${target.label}" لتقليل الضغط الرقمي`,
            xpReward: 60,
            isCompleted: completedKeys.includes("dq_neutralize"),
            actionKey: "node_muted_or_archived"
        });
    } else if (yellowNodes.length > 0) {
        const target = yellowNodes[0];
        quests.push({
            id: "dq_inspect",
            title: "جلسة تفتيش",
            description: `افحص حالة "${target.label}" وتأكد من ثبات الحدود`,
            xpReward: 40,
            isCompleted: completedKeys.includes("dq_inspect"),
            actionKey: "node_inspected"
        });
    } else if (nodes.length < 5) {
        quests.push({
            id: "dq_expand",
            title: "بناء الرادار",
            description: "أضف شخصاً جديداً لخريطة السيادة الخاصة بك",
            xpReward: 50,
            isCompleted: completedKeys.includes("dq_expand"),
            actionKey: "node_added"
        });
    }

    // 3. Social/Wisdom Quest (Static for now)
    quests.push({
        id: "dq_wisdom",
        title: "نبع حكمة",
        description: "شارك حكمة واحدة في مجتمع الدعم",
        xpReward: 40,
        isCompleted: completedKeys.includes("dq_wisdom"),
        actionKey: "wisdom_shared"
    });

    return quests;
}


