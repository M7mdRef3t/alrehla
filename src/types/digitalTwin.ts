
/**
 * The Digital Twin Data Model
 * Focuses on "Semantic Connectivity" and "Micro-Telemetry"
 */

export type EntityType = 'PERSON' | 'DREAM' | 'STATE' | 'MODULE';

export interface TelemetrySnapshot {
    timestamp: number;
    latency: number; // ms between interaction events
    jitter: number; // variance in interaction frequency
    velocity: number; // scroll/move speed pixels/sec
    pressureEstimate: number; // normalized 0-1 (derived from touch/click duration)
}

export interface ConsciousnessNode {
    id: string;
    type: EntityType;
    label: string;
    energyLevel: number; // 0-1 (Current "Heat")
    stability: number; // 0-1 (Consistent interaction vs volatile)
    metadata: Record<string, any>; // Links to Dreams or MapNodes
    position: { x: number; y: number };
}

export interface ConnectivityEdge {
    id: string;
    source: string;
    target: string;
    weight: number; // +ve for support, -ve for friction/blocking
    type: 'SUPPORT' | 'BLOCK' | 'NEUTRAL';
}

export interface DigitalTwinGraph {
    nodes: ConsciousnessNode[];
    edges: ConnectivityEdge[];
    globalStability: number;
}
