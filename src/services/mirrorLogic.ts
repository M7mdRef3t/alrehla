/**
 * Mirror Logic Engine — محرك منطق المرآة 🪞
 * ==========================================
 * يكشف التناقضات بين "النوايا المعلنة" (Goals) و"السلوك الفعلي" (Map Behavior).
 * يولد أسئلة وجودية (Socratic Questions) للمواجهة.
 */

import { useMapState } from '@/modules/map/dawayirIndex';
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";

export interface MirrorInsight {
    id: string;
    type: "emotional_denial" | "reality_detachment" | "placement_anxiety";
    title: string;
    message: string;
    question: string;
    relatedNodeId?: string;
    severity: "gentle" | "firm" | "shock";
}

const MIRROR_SHOWN_KEY = "dawayir-mirror-shown";

function getShownInsights(): Set<string> {
    try {
        const raw = localStorage.getItem(MIRROR_SHOWN_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

function markInsightShown(id: string): void {
    const shown = getShownInsights();
    shown.add(id);
    const arr = Array.from(shown).slice(-50); // Keep last 50
    try {
        localStorage.setItem(MIRROR_SHOWN_KEY, JSON.stringify(arr));
    } catch { /* noop */ }
}

/**
 * تحليل التناقضات بناءً على حالة الخريطة والرحلة
 */
export function detectContradictions(): MirrorInsight | null {
    const { nodes } = useMapState.getState();
    const { goalId } = useJourneyState.getState();
    const { lastPulse } = usePulseState.getState();
    const shown = getShownInsights();

    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Guard: don't evaluate contradictions if goalId is not yet set (e.g. right after onboarding)
    // An empty goalId would cause false positives since !goalId treated as isSelfFocus
    if (!goalId) return null;

    // 1. نمط "التعافي الزائف" (False Letting Go)
    // السيناريو: الهدف الحالي "تركيز على الذات" (أو غير موجود) لكن توجد عقد "صعبة" في المدار الأول (Red/Yellow).
    const isSelfFocus = goalId === "self" || goalId === "health";

    if (isSelfFocus) {
        const clingingNodes = nodes.filter(n => (n.ring === "red" || n.ring === "yellow") && !n.isNodeArchived);

        for (const node of clingingNodes) {
            // Check validation: if node is in close orbit but flagged as "detachmentMode", it might be okay.
            // But if it's strictly "red" (Inner Circle) and user says "Self Focus", that's a contradiction.
            if (node.ring === "red") {
                const id = `denial-${node.id}-${new Date().toISOString().split("T")[0]}`;
                if (!shown.has(id)) {
                    return {
                        id,
                        type: "emotional_denial",
                        title: "إنكار عاطفي",
                        message: `العنوان بيقول "تركيز على الذات".. بس "${node.label}" لسه واخد مساحة في دايرتك الحمراء.`,
                        question: "هل إحنا بنحتفظ بيهم عشان بنحبهم، ولا عشان خايفين من الفراغ؟",
                        relatedNodeId: node.id,
                        severity: "firm"
                    };
                }
            }
        }
    }

    // 2. نمط "المهم المهمل" (The Neglected VIP)
    // السيناريو: شخص في المدار الأحمر (Red) ولم يتم التفاعل معه (فتح العقدة/تعديل) لمدة > 10 أيام.
    const neglectedNodes = nodes.filter(n => n.ring === "red" && !n.isNodeArchived);
    for (const node of neglectedNodes) {
        // We utilize `lastViewedStep` or just creation time if no interaction, 
        // but `lastViewedStep` isn't a timestamp.
        // Let's use `situationLogs` last entry or fallback to checking generic inactivity if possible.
        // Assuming `recoveryProgress.lastPathGeneratedAt` or similar. 
        // If we don't have a direct "last interaction" timestamp, we can approximate with `journeyStartDate` if it's old and no logs.

        // Better approximation: check if `recoveryProgress.situationLogs` is empty AND node created > 10 days ago.
        // Or last log is old.

        const createdAt = node.journeyStartDate || 0;
        const lastLog = node.recoveryProgress?.situationLogs?.[node.recoveryProgress.situationLogs.length - 1];
        const lastInteraction = lastLog ? lastLog.date : createdAt;

        const diffDays = (now - lastInteraction) / DAY_MS;

        if (diffDays > 10) {
            const id = `neglected-${node.id}-${Math.floor(now / (DAY_MS * 5))}`; // Show every 5 days if ignored
            if (!shown.has(id)) {
                return {
                    id,
                    type: "reality_detachment",
                    title: "انفصال واقعي",
                    message: `الدوائر القريبة استثمار مش بس مكان. بقالك ${Math.floor(diffDays)} يوم ما زورتش دايرة "${node.label}".`,
                    question: "إمتى آخر مرة كان وجودهم حقيقي، مش مجرد اسم في دايرة؟",
                    relatedNodeId: node.id,
                    severity: "gentle"
                };
            }
        }
    }

    // 3. نمط "قلق التموضع" (Placement Anxiety)
    // يتطلب تتبع سجل الحركات (Node History). 
    // سنعتمد هنا على مؤشر الطاقة: لو الطاقة عالية (Anxious/Angry) وفيه عقد كتير في المنطقة الرمادية (Detachment Mode).
    if (lastPulse && (lastPulse.mood === "anxious" || lastPulse.mood === "overwhelmed")) {
        const grayNodes = nodes.filter(n => n.detachmentMode);
        if (grayNodes.length >= 3) {
            const id = `anxiety-${new Date().toISOString().split("T")[0]}`;
            if (!shown.has(id)) {
                return {
                    id,
                    type: "placement_anxiety",
                    title: "زحمة أفكار",
                    message: "طاقتك بتقول إنك قلقان، وفيه علاقات كتير متعلقة في النص.",
                    question: "لو اخترت قرار واحد بس النهاردة وتجاهلت الباقي.. إيه اللي هيحصل؟",
                    severity: "shock"
                };
            }
        }
    }

    return null;
}

export function dismissMirrorInsight(id: string): void {
    markInsightShown(id);
}
