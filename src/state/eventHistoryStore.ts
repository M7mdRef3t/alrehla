/**
 * Event History Store — سجل الأحداث 📚
 * ==========================================
 * يخزن أحداث "دواير" الأخيرة لتمكين الذكاء الاصطناعي من فهم سياق المستخدم.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GraphEvent } from "../services/automagicLoop";

interface EventHistoryState {
    events: GraphEvent[];
    addEvent: (event: GraphEvent) => void;
    clearEvents: () => void;
    /** ذاكرة الظل: اكتشاف الأنماط المتكررة في تاريخ الأحداث */
    getShadowMemoryAnalysis: () => { cycleDetected: boolean; intensity: number; description?: string };
}

export const useEventHistoryStore = create<EventHistoryState>()(
    persist(
        (set, get) => ({
            events: [],
            addEvent: (event) => set((state) => ({
                // Shadow Memory: Keep last 100 events for deep pattern recognition
                events: [event, ...state.events].slice(0, 100)
            })),
            clearEvents: () => set({ events: [] }),
            getShadowMemoryAnalysis: () => {
                const events = get().events;
                if (events.length < 5) return { cycleDetected: false, intensity: 0 };

                // Look for repeated "stress" or "pullback" events for specific nodes
                const nodeFrequency: Record<string, number> = {};
                events.forEach(e => {
                    if (e.nodeId) {
                        nodeFrequency[e.nodeId] = (nodeFrequency[e.nodeId] || 0) + 1;
                    }
                });

                const topNodeId = Object.entries(nodeFrequency)
                    .sort(([, a], [, b]) => b - a)[0]?.[0];

                const intensity = nodeFrequency[topNodeId] || 0;

                return {
                    cycleDetected: intensity >= 3,
                    intensity,
                    description: intensity >= 3
                        ? `نمط متكرر مرصود للعقدة ${topNodeId} - قد يشير لدورة سلوكية سامة.`
                        : undefined
                };
            }
        }),
        {
            name: "dawayir-event-history"
        }
    )
);
