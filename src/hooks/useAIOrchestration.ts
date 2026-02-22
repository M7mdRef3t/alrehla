import { useEffect, useRef } from "react";
import { useMapState } from "../state/mapState";
import { useJourneyState } from "../state/journeyState";
import { useDailyJournalState } from "../state/dailyJournalState";
import { useAchievementState } from "../state/achievementState";
import { orchestrator } from "../ai/orchestrator/Core";
import { SystemSnapshot } from "../ai/orchestrator/types";

/**
 * useAIOrchestration — الجسر بين الحالة الحقيقية وعقل الأوركسترا
 */
export function useAIOrchestration() {
    const nodes = useMapState((s) => s.nodes);
    const baselineScore = useJourneyState((s) => s.baselineScore);
    const journalEntries = useDailyJournalState((s) => s.entries);
    const unlockedIds = useAchievementState((s) => s.unlockedIds);

    // لضمان عدم تكرار الأوركسترا بشكل مزعج
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 30000) return; // تشغيل كل 30 ثانية كحد أقصى

        const snapshot: SystemSnapshot = {
            nodesCount: nodes.length,
            unlockedMedals: unlockedIds.length,
            dailyJournalCount: journalEntries.length,
            lastMoodScore: baselineScore ?? 50, // القيمة الافتراضية
            teiScore: calculateTEI(nodes, journalEntries), // حساب كفاءة المستخدم
            activeRecoverySteps: countActiveSteps(nodes),
        };

        void orchestrator.orchestrate(snapshot);
        lastUpdateRef.current = now;
    }, [nodes, journalEntries, unlockedIds, baselineScore]);
}

/**
 * دالة تجريبية لحساب مؤشر الكفاءة التكتيكية
 */
function calculateTEI(nodes: any[], journal: any[]): number {
    const base = Math.min(nodes.length * 5, 40); // 40% من الدواير
    const clarity = Math.min(journal.length * 3, 40); // 40% من اليوميات
    const interaction = 20; // 20% ثابتة حالياً
    return base + clarity + interaction;
}

function countActiveSteps(nodes: any[]): number {
    return nodes.reduce((acc, node) => acc + (node.completedSteps?.length || 0), 0);
}
