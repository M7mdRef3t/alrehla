import { useEffect } from 'react';
import { useMapState } from '@/domains/dawayir/store/map.store';

// Thresholds for stagnation (in milliseconds)
// For demo purposes, we set these low so the effect can be seen quickly.
// In production, this might be 7 days, 14 days, etc.
const STAGNATION_THRESHOLDS = {
    red: 2 * 60 * 1000, // 2 minutes for testing
    yellow: 5 * 60 * 1000, // 5 minutes for testing
    zeroCircle: 10 * 60 * 1000, // 10 minutes in archive
};

const PENALTY_AMOUNTS = {
    red: -5,
    yellow: -2,
    zeroCircle: -1, // Hidden footprint drain
};

export function useHiddenFootprint() {
    const nodes = useMapState((state) => state.nodes);
    const addEnergyTransaction = useMapState((state) => state.addEnergyTransaction);

    useEffect(() => {
        // Run the check every 1 minute
        const interval = setInterval(() => {
            const now = Date.now();

            nodes.forEach((node) => {
                // Skip nodes without a tracked change time
                if (!node.lastRingChangeAt) return;

                const timeInState = now - node.lastRingChangeAt;

                // Check Zero Circle (Archive)
                if (node.isNodeArchived) {
                    if (timeInState >= STAGNATION_THRESHOLDS.zeroCircle) {
                        // Apply stagnation drain and reset the timer so it doesn't drain every minute
                        addEnergyTransaction(node.id, PENALTY_AMOUNTS.zeroCircle, "غرامة ركود بالمدار الصفري 🧊");
                        useMapState.getState().updateNodeRing(node.id, node.ring); // Hack to reset lastRingChangeAt
                    }
                    return; // Skip ring checks if archived
                }

                // Check active rings
                if (node.ring === 'red' && timeInState >= STAGNATION_THRESHOLDS.red) {
                    addEnergyTransaction(node.id, PENALTY_AMOUNTS.red, "غرامة نزيف المدار الأحمر 🔴");
                    useMapState.getState().updateNodeRing(node.id, node.ring);
                } else if (node.ring === 'yellow' && timeInState >= STAGNATION_THRESHOLDS.yellow) {
                    addEnergyTransaction(node.id, PENALTY_AMOUNTS.yellow, "غرامة إرهاق المدار الأصفر 🟡");
                    useMapState.getState().updateNodeRing(node.id, node.ring);
                }
            });
        }, 60 * 1000); // 1 minute interval

        return () => clearInterval(interval);
    }, [nodes, addEnergyTransaction]);
}
