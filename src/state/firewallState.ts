import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NodeROI {
    nodeId: string;
    roiScore: number; // -10 to +10 (delta energy)
    lastUpdated: number;
    interactionCount: number;
}

interface FirewallState {
    isShieldActive: boolean;
    blockedNodeIds: string[];
    roiData: Record<string, NodeROI>;

    setShieldActive: (active: boolean) => void;
    toggleBlockNode: (nodeId: string) => void;
    updateROIData: (nodeId: string, delta: number) => void;
    getROI: (nodeId: string) => number;
}

export const useFirewallState = create<FirewallState>()(
    persist(
        (set, get) => ({
            isShieldActive: false,
            blockedNodeIds: [],
            roiData: {},

            setShieldActive: (active) => set({ isShieldActive: active }),

            toggleBlockNode: (nodeId) => set((state) => ({
                blockedNodeIds: state.blockedNodeIds.includes(nodeId)
                    ? state.blockedNodeIds.filter(id => id !== nodeId)
                    : [...state.blockedNodeIds, nodeId]
            })),

            updateROIData: (nodeId, delta) => set((state) => {
                const current = state.roiData[nodeId] || { nodeId, roiScore: 0, lastUpdated: 0, interactionCount: 0 };
                const newCount = current.interactionCount + 1;
                // Running average
                const newScore = (current.roiScore * current.interactionCount + delta) / newCount;

                return {
                    roiData: {
                        ...state.roiData,
                        [nodeId]: {
                            nodeId,
                            roiScore: newScore,
                            lastUpdated: Date.now(),
                            interactionCount: newCount
                        }
                    }
                };
            }),

            getROI: (nodeId) => get().roiData[nodeId]?.roiScore ?? 0,
        }),
        {
            name: 'dawayir-firewall-storage'
        }
    )
);
