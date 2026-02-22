import { DecisionType } from "../decision-framework";

/**
 * USER_TRAJECTORY — مسار المستخدم الحالي
 */
export type UserTrajectory =
    | "STABLE"          // مستقر، محتاج محتوى تطويري
    | "CRISIS"          // في أزمة، محتاج تدخل طوارئ (Breathing/SOS)
    | "STUCK"           // عالق في منطقة معينة، محتاج "تحفيز" (MirrorInsight)
    | "DISCOVERY"       // في مرحلة استكشاف، محتاج أدوات تحليل (GuiltCourt/Map)
    | "EVOLVING";       // في مرحلة نمو سريعة، محتاج "تحديات" (DailyQuests)

/**
 * TACTICAL_PROTOCOL — مجموعة إجراءات ينفذها الـ AI
 */
export interface TacticalProtocol {
    id: string;
    name: string;
    trajectory: UserTrajectory;
    severity: number; // 0-10 (10 = critical)
    actions: {
        type: DecisionType;
        payload: any;
        delay?: number; // تأخير زمني بين الأكشن والتاني لواقعية التجربة
    }[];
    uiFeedback?: {
        showWidget?: string;
        notificationTitle?: string;
        notificationBody?: string;
        themeHint?: "zen" | "flow" | "crisis";
    };
}

/**
 * SYSTEM_SNAPSHOT — لقطة كاملة لحالة النظام
 */
export interface SystemSnapshot {
    nodesCount: number;
    unlockedMedals: number;
    dailyJournalCount: number;
    lastMoodScore: number; // 1-100
    teiScore: number; // Tactical Efficiency Index
    activeRecoverySteps: number;
}
