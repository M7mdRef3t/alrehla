import { Dream, DreamStatus } from './dreams';

export type AlignmentZone = "dreamland" | "planning" | "action";

export interface DreamNode extends Dream {
    x: number;
    y: number;
    zone: AlignmentZone;
    glowColor: string;
}

export interface DreamEdge {
    id: string;
    sourceId: string; // Dream ID
    targetId: string; // Connected Person/Node ID (The source of the "Knot")
    relationType: 'TRIGGERS' | 'BLOCKS' | 'FEEDS';
    friction: number; // Visual weight of the line
}

export interface DreamsMatrixState {
    nodes: DreamNode[];
    edges: DreamEdge[];
    lastSimulationId?: string;
}
