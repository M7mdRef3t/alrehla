import { useRef, useEffect, useCallback } from 'react';

/**
 * useCognitiveDebounce — هوك الاستقرار المعرفي 🧠
 * ============================================
 * Ensures map mutations are only sent after cognitive "settling" 
 * or upon explicit user exit intent.
 */

export interface MutationPayload {
    userId: string;
    actionType: 'MAJOR_DETACHMENT' | 'CIRCLE_SHIFT' | 'CLOSER_BOND' | 'RECONCILIATION';
    targetId: string;
    nodeLabel?: string;
    fromRing?: string;
    toRing?: string;
    timestamp: number;
}

export const useCognitiveDebounce = (
    dispatchToQueue: (payload: MutationPayload) => void,
    delayMs: number = 15000 // 15 seconds cognitive settling time
) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const payloadRef = useRef<MutationPayload | null>(null);

    /**
     * Guaranteed delivery of pending mutations
     */
    const flush = useCallback(() => {
        if (payloadRef.current) {
            // Send data to background queue
            dispatchToQueue(payloadRef.current);
            // Clear memory
            payloadRef.current = null;
        }
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, [dispatchToQueue]);

    /**
     * Records a map movement and starts/resets the countdown
     */
    const registerMutation = useCallback((newPayload: MutationPayload) => {
        payloadRef.current = newPayload; // Always hold the latest state

        if (timerRef.current) clearTimeout(timerRef.current);

        // Start the 15s settling timer
        timerRef.current = setTimeout(() => {
            flush();
        }, delayMs);
    }, [delayMs, flush]);

    /**
     * Monitor for browser-level exit intents (Tab closure, Refresh)
     */
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (payloadRef.current) {
                // Use sendBeacon to ensure data reaches the server even as tab closes
                const blob = new Blob([JSON.stringify(payloadRef.current)], { type: 'application/json' });
                navigator.sendBeacon('/api/awareness-queue', blob);
                payloadRef.current = null;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup: Instant flush on component unmount (e.g., closing Dawayir modal)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            flush();
        };
    }, [flush]);

    return { registerMutation, flushNow: flush };
};
