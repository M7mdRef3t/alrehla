import { create } from "zustand";

export type SyncStatus = 'idle' | 'local_saved' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncState {
    status: SyncStatus;
    lastLocalSaveAt?: string;
    lastSyncAt?: string;
    error?: string;

    markLocalSaved: (timestamp: string) => void;
    setSyncing: () => void;
    setSynced: (timestamp: string) => void;
    setError: (msg: string) => void;
    setOffline: (isOffline: boolean) => void;
}

export const useSyncState = create<SyncState>((set, get) => ({
    status: 'idle',

    markLocalSaved: (timestamp) => set((state) => {
        return {
            status: state.status === 'offline' ? 'offline' : 'local_saved',
            lastLocalSaveAt: timestamp,
            error: undefined
        };
    }),

    setSyncing: () => set((state) => {
        if (state.status === 'offline') return {};
        return { status: 'syncing', error: undefined };
    }),

    setSynced: (timestamp) => set({
        status: 'synced',
        lastSyncAt: timestamp,
        error: undefined
    }),

    setError: (msg) => set({
        status: 'error',
        error: msg
    }),

    setOffline: (isOffline) => set((state) => {
        if (isOffline) {
            return { status: 'offline' };
        }
        const needsSync = state.lastLocalSaveAt && (!state.lastSyncAt || state.lastLocalSaveAt > state.lastSyncAt);
        return { status: needsSync ? 'local_saved' : 'idle' };
    })
}));
