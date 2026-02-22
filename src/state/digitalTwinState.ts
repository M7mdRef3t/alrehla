
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DigitalTwinGraph, ConsciousnessNode, ConnectivityEdge, TelemetrySnapshot } from '../types/digitalTwin';

interface DigitalTwinState {
    graph: DigitalTwinGraph;
    lastSnapshots: TelemetrySnapshot[];
    isMirroring: boolean;
    interventionMode: 'NORMAL' | 'STABILIZE' | 'RECOVERY';
    stabilityTrend: number[]; // History of globalStability

    setMirroring: (enabled: boolean) => void;
    setInterventionMode: (mode: 'NORMAL' | 'STABILIZE' | 'RECOVERY') => void;
    addSnapshot: (snapshot: TelemetrySnapshot) => void;
    updateGraph: (nodes: ConsciousnessNode[], edges: ConnectivityEdge[]) => void;
    seedGraph: () => void;
    setGlobalStability: (stability: number) => void;
    updateNodeEnergy: (nodeId: string, energy: number) => void;
    resetDigitalTwin: () => void;
}

export const useDigitalTwinState = create<DigitalTwinState>()(
    persist(
        (set) => ({
            graph: {
                nodes: [],
                edges: [],
                globalStability: 1.0
            },
            lastSnapshots: [],
            isMirroring: false,
            interventionMode: 'NORMAL',
            stabilityTrend: [],

            setMirroring: (enabled) => set({ isMirroring: enabled }),

            setInterventionMode: (mode) => set({ interventionMode: mode }),

            addSnapshot: (snapshot) => set((state) => {
                const newSnapshots = [snapshot, ...state.lastSnapshots].slice(0, 50);
                return { lastSnapshots: newSnapshots };
            }),

            updateGraph: (nodes, edges) => set((state) => ({
                graph: { ...state.graph, nodes, edges }
            })),

            seedGraph: () => set((state) => {
                const initialNodes: ConsciousnessNode[] = [
                    { id: 'me', type: 'STATE', label: 'Ego', energyLevel: 0.8, stability: 0.9, position: { x: 400, y: 200 }, metadata: {} },
                    { id: 'dawayir', type: 'MODULE', label: 'Dawayir', energyLevel: 0.6, stability: 0.8, position: { x: 300, y: 150 }, metadata: {} },
                    { id: 'alrehla', type: 'MODULE', label: 'Alrehla', energyLevel: 0.7, stability: 0.8, position: { x: 500, y: 150 }, metadata: {} },
                    { id: 'inner', type: 'PERSON', label: 'Inner Circle', energyLevel: 0.4, stability: 0.9, position: { x: 350, y: 280 }, metadata: {} },
                    { id: 'outer', type: 'PERSON', label: 'Outer World', energyLevel: 0.2, stability: 0.5, position: { x: 450, y: 280 }, metadata: {} },
                ];
                const initialEdges: ConnectivityEdge[] = [
                    { id: 'e1', source: 'me', target: 'dawayir', weight: 0.8, type: 'SUPPORT' },
                    { id: 'e2', source: 'me', target: 'alrehla', weight: 0.9, type: 'SUPPORT' },
                    { id: 'e3', source: 'inner', target: 'me', weight: 0.5, type: 'SUPPORT' },
                ];
                return { graph: { ...state.graph, nodes: initialNodes, edges: initialEdges } };
            }),

            setGlobalStability: (stability) => set((state) => ({
                graph: { ...state.graph, globalStability: stability },
                stabilityTrend: [...state.stabilityTrend, stability].slice(-100)
            })),

            updateNodeEnergy: (nodeId, energy) => set((state) => ({
                graph: {
                    ...state.graph,
                    nodes: state.graph.nodes.map(n =>
                        n.id === nodeId ? { ...n, energyLevel: energy } : n
                    )
                }
            })),

            resetDigitalTwin: () => set({
                graph: { nodes: [], edges: [], globalStability: 1.0 },
                lastSnapshots: [],
                isMirroring: false,
                interventionMode: 'NORMAL',
                stabilityTrend: []
            })
        }),
        {
            name: 'dawayir-digital-twin-storage'
        }
    )
);
