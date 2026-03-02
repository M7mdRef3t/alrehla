export interface DriftEdge {
    source: string;
    target: string;
    currentStrength: number;
    previousStrength: number;
    drift: number; // current - previous
    confidence: number;
}

export interface DriftMap {
    nodes: any[];
    edges: DriftEdge[];
    comparisonDate: string;
}

export function calculateDrift(current: any, previous: any): DriftMap {
    if (!previous) {
        return {
            nodes: current.nodes,
            edges: current.edges.map((e: any) => ({
                ...e,
                currentStrength: e.strength,
                previousStrength: e.strength,
                drift: 0
            })),
            comparisonDate: current.snapshot_date
        };
    }

    const driftEdges: DriftEdge[] = [];

    // Map previous edges for quick lookup
    const prevMap = new Map<string, number>();
    previous.edges.forEach((e: any) => {
        prevMap.set(`${e.source}->${e.target}`, e.strength);
    });

    current.edges.forEach((e: any) => {
        const key = `${e.source}->${e.target}`;
        const prevStrength = prevMap.get(key) ?? e.strength; // Fallback to current if not exists in prev

        // Logical "Improvement" calculation:
        // For negative relations (work weighing down mood), a decrease in absolute value is positive drift.
        // For positive relations, an increase is positive drift.
        // But for simplicity, we use raw delta and interpret visually.
        const drift = e.strength - prevStrength;

        driftEdges.push({
            source: e.source,
            target: e.target,
            currentStrength: e.strength,
            previousStrength: prevStrength,
            drift: drift,
            confidence: e.confidence
        });
    });

    return {
        nodes: current.nodes,
        edges: driftEdges,
        comparisonDate: previous.snapshot_date
    };
}
