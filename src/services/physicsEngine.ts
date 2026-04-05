/**
 * Physics Engine — محرك فيزياء العلاقات 🌌
 * ==========================================
 * يحول العلاقات إلى كتل جاذبية (Gravity Mass) وأنماط صدى (Echo Patterns).
 */

import { useMapState } from "../state/mapState";
import { useEventHistoryStore } from "../state/eventHistoryStore";
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
 * Detects hidden temporal patterns in the user's graph history by scanning the Automagic Loop timeline.
 */
export const detectEchoPatterns = (): EchoPattern[] => {
    const events = useEventHistoryStore.getState().events;
    const patterns: EchoPattern[] = [];

    if (events.length < 5) return patterns; // Not enough data

    // Logic 1: The "Decay Cycle"
    // Identify if there is a massive wave of outward movements in the recent 20 events.
    const recentEvents = events.slice(0, 20);
    let driftOutwardCount = 0;
    
    recentEvents.forEach(e => {
        if (e.type === "MAJOR_DETACHMENT" || e.type === "ORBIT_SHIFT_OUTWARD") {
            driftOutwardCount++;
        }
    });

    if (recentEvents.length >= 5 && driftOutwardCount / recentEvents.length > 0.4) {
        patterns.push({
            type: "Decay Cycle",
            confidence: Math.min(driftOutwardCount / recentEvents.length + 0.3, 0.95),
            description: "نلاحظ تكرار نمط 'الترحيل الكثيف'. الكثير من العلاقات تبتعد عن مدارك الحيوي بشكل متسارع مؤخراً، هل هذا تنظيف صحي أم استنزاف طاقي متكرر؟"
        });
    }

    // Logic 2: Rapid Orbit Shift
    // Detect if the same node was moved inward then dragged outward (or vice versa) in a short span.
    const nodeShifts: Record<string, string[]> = {};
    recentEvents.forEach(e => {
        if (!nodeShifts[e.nodeId]) nodeShifts[e.nodeId] = [];
        nodeShifts[e.nodeId].push(e.type);
    });

    let detectedUnstableNodes = 0;
    for (const [nodeId, shifts] of Object.entries(nodeShifts)) {
        if (shifts.includes("ORBIT_SHIFT_INWARD") && (shifts.includes("ORBIT_SHIFT_OUTWARD") || shifts.includes("MAJOR_DETACHMENT"))) {
            detectedUnstableNodes++;
        }
    }

    if (detectedUnstableNodes > 0) {
        patterns.push({
            type: "Rapid Orbit Shift",
            confidence: 0.85,
            description: `هناك ${detectedUnstableNodes > 1 ? 'عدة أشخاص يتأرجحون' : 'شخص يتأرجح'} بين الدخول والخروج من مدارك بسرعة. هذا التردد العنيف يسبب انهياراً مفاجئاً للطاقة (التخبط المداري).`
        });
    }
    
    // Logic 3: Stable Harmony (Reconciliation + Inward without Outward)
    const inwardEventsCount = recentEvents.filter(e => e.type === "RECONCILIATION" || e.type === "KEYSTONE_RESOLVED").length;
    if (inwardEventsCount >= 2 && driftOutwardCount === 0) {
        patterns.push({
            type: "Stable Harmony",
            confidence: 0.9,
            description: "دوائرك تشهد استقراراً ونمواً صحياً ملحوظاً. أنت تتعافى وتُصلح الروابط الجوهرية (KEYSTONE) بنجاح."
        });
    }

    return patterns;
};
