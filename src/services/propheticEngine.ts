/**
 * Prophetic Engine — المحرك النبوئي 🔮
 * ==========================================
 * يتنبأ بالمستقبل بناءً على أنماط الحاضر.
 * 1. رادار الاستنزاف (Energy Drain Radar): يكشف العلاقات المستنزفة.
 * 2. التفاعل المتسلسل (Chain Reaction): يحدد العلاقات المفتاحية "Keystones".
 * 3. محاكي المستقبل (Future Simulator): يتوقع حالتك بعد سنة.
 */

import { useMapState } from "@/domains/dawayir/store/map.store";
import { type MapNode } from "@/modules/map/mapTypes";
import { calculateGravityMass } from "./physicsEngine";

// 1. Energy Drain Radar & Vampire Detection
// ------------------------------------------------------------------
export interface EnergyNode {
    nodeId: string;
    drainScore: number; // 0-100 (100 = Maximum Drain)
    isVampire: boolean;
    drainVelocity: "Stable" | "Accelerating" | "Critical";
}

export const analyzeEnergyDrain = (node: MapNode): EnergyNode => {
    // A. Analysis Score (Base Drain)
    // Score 0-6. 5-6 is high drain.
    const baseDrain = (node.analysis?.score ?? 0) * 15; // Max ~90

    // B. Interaction Velocity (Frequency of recent logs)
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const recentLogs = (node.recoveryProgress?.situationLogs ?? [])
        .filter(log => (now - log.date) < oneWeek).length;

    // High interactions with high negative score = High Velocity Drain
    const velocityFactor = recentLogs > 3 ? 1.5 : recentLogs > 0 ? 1.2 : 1;

    // C. Keyword Analysis (Simple Heuristic for Prototype)
    // In a real AI, this would use NLP. Here we check "Notes" length as mental load.
    const mentalLoad = (node.notes?.length ?? 0) * 2;

    const totalDrain = Math.min(100, (baseDrain + mentalLoad) * velocityFactor);

    let velocity: EnergyNode["drainVelocity"] = "Stable";
    if (totalDrain > 80) velocity = "Critical";
    else if (totalDrain > 50 && recentLogs > 2) velocity = "Accelerating";

    return {
        nodeId: node.id,
        drainScore: totalDrain,
        isVampire: totalDrain > 75,
        drainVelocity: velocity
    };
};

export const scanForVampires = (): EnergyNode[] => {
    const nodes = useMapState.getState().nodes;
    return nodes
        .map(analyzeEnergyDrain)
        .filter(n => n.drainScore > 30) // Only return relevant drains
        .sort((a, b) => b.drainScore - a.drainScore);
};


// 2. Chain Reaction (Keystone Detection)
// ------------------------------------------------------------------
export interface KeystoneNode {
    nodeId: string;
    impactFactor: number; // How many other nodes it might affect
    reason: string;
}

export const identifyKeystones = (): KeystoneNode[] => {
    const nodes = useMapState.getState().nodes;
    // Heuristic:
    // 1. Family members usually affect each other (Tree Relations).
    // 2. High Gravity nodes (Stars/Black Holes) are usually keystones.

    const keystones: KeystoneNode[] = [];

    nodes.forEach(node => {
        let impact = 0;
        const reasons: string[] = [];

        // Check if Parent/Spouse (High structural impact)
        if (node.treeRelation?.relationLabel === "father" || node.treeRelation?.relationLabel === "mother" || node.treeRelation?.relationLabel === "spouse") {
            impact += 3;
            reasons.push("Structural Root (Family)");
        }

        // Check Gravity
        const gravity = calculateGravityMass(node);
        if (gravity.mass > 20) {
            impact += 2;
            reasons.push("High Gravity Center");
        }

        if (impact >= 3) {
            keystones.push({
                nodeId: node.id,
                impactFactor: impact,
                reason: reasons.join(" + ")
            });
        }
    });

    return keystones.sort((a, b) => b.impactFactor - a.impactFactor);
};


// 3. What-If Simulator (Future Projection)
// ------------------------------------------------------------------
export interface FutureProjection {
    timeline: "3 Months" | "1 Year";
    predictedState: "Burnout" | "Stagnation" | "Thriving";
    healthScore: number; // 0-100
    description: string;
}

export const simulateFutureSelf = (): FutureProjection => {
    const nodes = useMapState.getState().nodes;
    return calculateFutureProjection(nodes);
};

/**
 * Calculates a future projection based on a provided set of nodes (Hypothetical or Real).
 */
const calculateFutureProjection = (nodes: MapNode[]): FutureProjection => {
    // We need to re-scan for vampires using the PROVIDED nodes, not the store.
    const vampires = nodes
        .map(analyzeEnergyDrain)
        .filter(n => n.drainScore > 75);

    if (vampires.length > 2) {
        return {
            timeline: "1 Year",
            predictedState: "Burnout",
            healthScore: 35,
            description: "إذا استمر هذا الاستنزاف، تتوقع الخوارزمية انهياراً عصبياً أو 'Burnout' كامل خلال ٨-١٢ شهراً. طاقتك الحالية لا تكفي لدعم ٣ ثقوب سوداء."
        };
    } else if (vampires.length > 0) {
        return {
            timeline: "1 Year",
            predictedState: "Stagnation",
            healthScore: 60,
            description: "وجود ثقب أسود واحد يبقيك في حالة 'دفاع' مستمر. لن تنهار، لكنك لن تنمو. ستظل تدور في نفس الحلقة المفرغة."
        };
    } else {
        return {
            timeline: "1 Year",
            predictedState: "Thriving",
            healthScore: 92,
            description: "المدارات نظيفة. الطاقة تذهب للنمو (Growth) وليس للدفاع. التوقعات تشير لقفزة نوعية في الكاريزما والإنتاجية."
        };
    }
};

/**
 * What-If Simulator: Projects your future self if you applied these changes.
 */
export const simulateHypotheticalState = (modifiedNodes: MapNode[]): FutureProjection => {
    return calculateFutureProjection(modifiedNodes);
};

