export type DreamStatus = 'DREAMING' | 'IN_FLIGHT' | 'REALIZED' | 'ARCHIVED';

export interface KPI {
    label: string;
    target: number;
    current: number;
    unit: string;
}

export interface MomentumTask {
    id: string;
    label: string;
    isCompleted: boolean;
    dopamineWeight: number; // 1-10
}

export interface Knot {
    id: string;
    label: string;
    severity: number; // 1-10
    type: 'psychological' | 'physical';
    description?: string;
}

export type CognitiveDomain = 'CREATIVE' | 'ANALYTICAL' | 'SOCIAL' | 'TACTICAL' | 'LOGISTICAL';

export interface Dream {
    id: string;
    userId: string;
    title: string;
    description?: string;
    visionUrl?: string;
    status: DreamStatus;
    kpis: KPI[];
    knots: Knot[];
    cognitiveDomain?: CognitiveDomain;
    energyRequired: number;
    estimatedCompletionDate?: string;
    alignmentScore: number;
    isSovereign: boolean;
    relatedNodeIds?: string[];
    momentumTasks?: MomentumTask[];
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
