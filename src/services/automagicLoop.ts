/**
 * Automagic Loop — حلقة التغذية الآلية 🔄
 * ==========================================
 * يربط أحداث "دواير" (تغييرات الخريطة) بمحرك التوصيات في "الرحلة".
 * 
 * الفلسفة: المستخدم يتصرف في دواير → النظام يفهم المعنى → الرحلة تستجيب.
 * 
 * مثال:
 *   المستخدم ينقل "الأب" من الأخضر → الأحمر
 *   → النظام يكتشف "انفصال عاطفي كبير"
 *   → يغير المحتوى اليومي فوراً
 *   → يرسل nudge: "الشجاعة مش سهلة.. بس انت اخترت صح."
 */

import { type MapNode, type Ring } from "../modules/map/mapTypes";
import { useGamificationState } from "./gamificationEngine";
import { useEventHistoryStore } from "../state/eventHistoryStore";

// ─── Event Types ──────────────────────────────────────────────────
export type GraphEventType =
    | "ORBIT_SHIFT_INWARD"   // Moved closer (e.g., red → green)
    | "ORBIT_SHIFT_OUTWARD"  // Moved farther (e.g., green → red)
    | "MAJOR_DETACHMENT"     // Close person moved to red
    | "RECONCILIATION"       // Distant person moved to green
    | "VAMPIRE_DETECTED"     // High-drain node identified
    | "KEYSTONE_RESOLVED";   // Keystone node moved to green

export interface GraphEvent {
    type: GraphEventType;
    nodeId: string;
    nodeLabel: string;
    fromRing: Ring;
    toRing: Ring;
    timestamp: number;
}

// ─── Prescription Map ─────────────────────────────────────────────
// Maps a graph event to a human-readable prescription
export interface Prescription {
    nudge: string;           // Short notification text
    missionTag: string;      // Which mission category to surface
    contentTheme: string;    // Which content theme to prioritize
    xpReward: number;        // XP to award for this action
}

const PRESCRIPTIONS: Record<GraphEventType, Prescription> = {
    MAJOR_DETACHMENT: {
        nudge: "الشجاعة مش سهلة.. بس انت اخترت صح. 🛡️",
        missionTag: "boundaries",
        contentTheme: "الحدود الصحية",
        xpReward: 50,
    },
    ORBIT_SHIFT_OUTWARD: {
        nudge: "قرار صعب. الوضوح أهم من الراحة المؤقتة.",
        missionTag: "clarity",
        contentTheme: "الوضوح الداخلي",
        xpReward: 30,
    },
    ORBIT_SHIFT_INWARD: {
        nudge: "خطوة للأمام. الثقة تُبنى بالتدريج. 🌱",
        missionTag: "trust",
        contentTheme: "بناء الثقة",
        xpReward: 20,
    },
    RECONCILIATION: {
        nudge: "المصالحة شجاعة. الباب مفتوح. ✨",
        missionTag: "reconciliation",
        contentTheme: "التسامح والمصالحة",
        xpReward: 75,
    },
    VAMPIRE_DETECTED: {
        nudge: "⚠️ رادار الطاقة يرصد استنزافاً. هل أنت بخير؟",
        missionTag: "protection",
        contentTheme: "حماية الطاقة",
        xpReward: 0,
    },
    KEYSTONE_RESOLVED: {
        nudge: "🔑 أصلحت الحجر الأساسي. التأثير سيمتد لعلاقات أخرى.",
        missionTag: "keystone",
        contentTheme: "التعافي المتسلسل",
        xpReward: 100,
    },
};

import { analyzeEnergyDrain } from "./propheticEngine";

// ─── Event Detection ──────────────────────────────────────────────
export const detectGraphEvents = (
    oldNode: MapNode,
    newNode: MapNode
): GraphEvent[] => {
    const events: GraphEvent[] = [];

    // 1. Ring shifted events
    if (oldNode.ring !== newNode.ring) {
        const ringOrder: Record<Ring, number> = { green: 0, yellow: 1, red: 2 };
        const movedOutward = ringOrder[newNode.ring] > ringOrder[oldNode.ring];
        const movedInward = ringOrder[newNode.ring] < ringOrder[oldNode.ring];

        let type: GraphEventType;

        if (movedOutward && oldNode.ring === "green") {
            type = "MAJOR_DETACHMENT";
        } else if (movedOutward) {
            type = "ORBIT_SHIFT_OUTWARD";
        } else if (movedInward && newNode.ring === "green") {
            type = "RECONCILIATION";
        } else {
            type = "ORBIT_SHIFT_INWARD";
        }

        events.push({
            type,
            nodeId: newNode.id,
            nodeLabel: newNode.label,
            fromRing: oldNode.ring,
            toRing: newNode.ring,
            timestamp: Date.now(),
        });
    }

    // 2. Vampire Detection (Energy Drain Radar)
    const oldEnergy = analyzeEnergyDrain(oldNode);
    const newEnergy = analyzeEnergyDrain(newNode);

    if (newEnergy.isVampire && !oldEnergy.isVampire) {
        events.push({
            type: "VAMPIRE_DETECTED",
            nodeId: newNode.id,
            nodeLabel: newNode.label,
            fromRing: oldNode.ring,
            toRing: newNode.ring,
            timestamp: Date.now(),
        });
    }

    // 3. Keystone Resolved (Root or High Gravity node moving to Green)
    if (oldNode.ring !== "green" && newNode.ring === "green") {
        const isKeystone = newNode.treeRelation?.relationLabel
            && ["father", "mother", "spouse"].includes(newNode.treeRelation.relationLabel);

        if (isKeystone) {
            events.push({
                type: "KEYSTONE_RESOLVED",
                nodeId: newNode.id,
                nodeLabel: newNode.label,
                fromRing: oldNode.ring,
                toRing: newNode.ring,
                timestamp: Date.now(),
            });
        }
    }

    return events;
};

// ─── Prescription Dispatcher ──────────────────────────────────────
export const getPrescription = (event: GraphEvent): Prescription => {
    return PRESCRIPTIONS[event.type];
};

// ─── Full Loop (called when map changes) ─────────────────────────
export const runAutomagicLoop = (
    oldNodes: MapNode[],
    newNodes: MapNode[]
): { events: GraphEvent[]; prescriptions: Prescription[] } => {
    const events: GraphEvent[] = [];
    const prescriptions: Prescription[] = [];

    newNodes.forEach((newNode) => {
        const oldNode = oldNodes.find((n) => n.id === newNode.id);
        if (!oldNode) return;

        const nodeEvents = detectGraphEvents(oldNode, newNode);
        nodeEvents.forEach(event => {
            events.push(event);
            prescriptions.push(getPrescription(event));
            // Log to history store for AI context
            useEventHistoryStore.getState().addEvent(event);
        });
    });

    // Award XP for each event
    if (events.length > 0) {
        const totalXP = prescriptions.reduce((sum, p) => sum + p.xpReward, 0);
        if (totalXP > 0) {
            useGamificationState.getState().addXP(totalXP, "Graph Event Reward");
        }
    }

    return { events, prescriptions };
};
