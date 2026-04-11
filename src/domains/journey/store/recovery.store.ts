import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RecoveryPath } from '@/services/RecoveryEngine';

interface RecoveryState {
    activeInsightId: string | null;
    currentPath: RecoveryPath | null;
    completedTaskIds: string[];
    isRecoveryLoading: boolean;

    setActiveInsightId: (id: string | null) => void;
    setCurrentPath: (path: RecoveryPath | null) => void;
    completeTask: (taskId: string) => void;
    setLoading: (loading: boolean) => void;
    resetRecovery: () => void;
}

export const useRecoveryState = create<RecoveryState>()(
    persist(
        (set) => ({
            activeInsightId: null,
            currentPath: null,
            completedTaskIds: [],
            isRecoveryLoading: false,

            setActiveInsightId: (id) => set({ activeInsightId: id }),
            setCurrentPath: (path) => set({ currentPath: path, completedTaskIds: [] }),
            completeTask: (taskId) => set((state) => ({
                completedTaskIds: [...state.completedTaskIds, taskId]
            })),
            setLoading: (loading) => set({ isRecoveryLoading: loading }),
            resetRecovery: () => set({
                activeInsightId: null,
                currentPath: null,
                completedTaskIds: [],
                isRecoveryLoading: false
            }),
        }),
        {
            name: 'dawayir-recovery-storage'
        }
    )
);
