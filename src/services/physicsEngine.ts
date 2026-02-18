/**
 * Physics Engine — محرك فيزياء العلاقات 🌌
 * ==========================================
 * يحول العلاقات إلى كتل جاذبية (Gravity Mass) وأنماط صدى (Echo Patterns).
 */

import { useMapState } from "../state/mapState";
import { type MapNode, type Ring } from "../modules/map/mapTypes";

// 1. Gravity Mass Calculation
// ------------------------------------------------------------------
export interface GravityNode {
    nodeId: string;
    mass: number; // 0 to 100+ (Relative Weight)
    classification: "Black Hole" | "Star" | "Planet" | "Nebula";
}

/**
 * Calculate the "Psychological Mass" of a node.
 * Formula: (Intensity + 1) * (Frequency Factor) / (Distance Factor)
 */
export const calculateGravityMass = (node: MapNode): GravityNode => {
    // A. Intensity (from Analysis Score 0-6)
    // If no analysis, assume neutral (1). Score 6 = High Intensity.
    const intensity = node.analysis?.score ?? 1;

    // B. Distance Factor (Ring)
    // Green = 1 (Close/Healthy), Yellow = 2, Red = 3 (Far/Strained)
    // However, "Gravity" is higher when someone consumes energy regardless of distance.
    // Actually, a "Black Hole" in the Green zone is MORE dangerous.
    // We'll invert distance for impact: Closer = Higher Impact.
    const distanceMap: Record<Ring, number> = {
        green: 3,  // Close orbit
        yellow: 2, // Medium orbit
        red: 1     // Far orbit
    };
    const distanceFactor = distanceMap[node.ring] || 1;

    // C. Frequency/Weight (from Notes/Logs)
    // More notes/logs = Higher Mental Occupancy
    const notesCount = (node.notes?.length ?? 0);
    const logsCount = (node.recoveryProgress?.situationLogs?.length ?? 0);
    const occupancy = 1 + (notesCount * 0.5) + (logsCount * 1);

    // Mass Formula
    // Mass = (Intensity^1.5) * Occupancy * DistanceFactor
    // We use Intensity^1.5 to exponentially weigh "Toxic" traits.
    const mass = Math.pow(intensity + 1, 1.5) * occupancy * distanceFactor;

    // Classification
    let classification: GravityNode["classification"] = "Planet";
    if (mass > 50) classification = "Black Hole"; // Massive drain
    else if (mass > 20) classification = "Star";  // Central figure
    else if (mass < 5) classification = "Nebula"; // Weak/Undefined

    return { nodeId: node.id, mass, classification };
};

export const getSystemGravity = (): GravityNode[] => {
    const nodes = useMapState.getState().nodes;
    return nodes.map(calculateGravityMass).sort((a, b) => b.mass - a.mass);
};


// 2. Echo Engine (Pattern Detection)
// ------------------------------------------------------------------
export interface EchoPattern {
    type: "Decay Cycle" | "Rapid Orbit Shift" | "Stable Harmony";
    confidence: number; // 0-1
    description: string;
}

/**
 * Detects hidden temporal patterns in the user's graph history.
 * (Mock implementation for prototype - requires historical snapshots in real DB)
 */
export const detectEchoPatterns = (): EchoPattern[] => {
    const nodes = useMapState.getState().nodes;
    const patterns: EchoPattern[] = [];

    // Logic 1: The "Red Orbit" Accumulation
    // If > 50% of nodes are in Red Ring
    const redNodes = nodes.filter(n => n.ring === "red").length;
    if (nodes.length > 3 && redNodes / nodes.length > 0.5) {
        patterns.push({
            type: "Decay Cycle",
            confidence: 0.85,
            description: "نلاحظ تكرار نمط 'الترحيل للأحمر'. ٥٠٪ من علاقاتك تنتهي في المدار الخارجي."
        });
    }

    // Logic 2: Rapid Shift (Simulation)
    // If a node has high intensity but is in Green ring (Danger!)
    const dangerousGreen = nodes.some(n => n.ring === "green" && (n.analysis?.score ?? 0) >= 5);
    if (dangerousGreen) {
        patterns.push({
            type: "Rapid Orbit Shift",
            confidence: 0.9,
            description: "هناك 'ثقب أسود' في مدارك الأخضر. هذا النمط يسبب انهياراً مفاجئاً للطاقة."
        });
    }

    return patterns;
};
