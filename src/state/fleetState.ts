
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FleetVessel {
    id: string;
    title: string;
    domain: 'CREATIVE' | 'ANALYTICAL' | 'SOCIAL' | 'TACTICAL' | 'LOGISTICAL';
    energyLevel: number; // 0-1
    isSandboxed: boolean;
    priority: number;
}

export interface FleetState {
    vessels: FleetVessel[];
    activeVesselId: string | null;
    routingDirective: string;
    isSandboxEnforced: boolean;

    setVessels: (vessels: FleetVessel[]) => void;
    setActiveVessel: (id: string | null) => void;
    setRoutingDirective: (directive: string) => void;
    toggleSandbox: (enforce: boolean) => void;
    toggleVesselSandbox: (id: string) => void;
    updateVesselEnergy: (id: string, energy: number) => void;
}

export const useFleetState = create<FleetState>()(
    persist(
        (set, get) => ({
            vessels: [],
            activeVesselId: null,
            routingDirective: 'Initializing Fleet Sensors...',
            isSandboxEnforced: false,

            setVessels: (vessels: FleetVessel[]) => set({ vessels }),
            setActiveVessel: (id: string | null) => set({
                activeVesselId: id,
                isSandboxEnforced: id ? (get().vessels.find(v => v.id === id)?.isSandboxed ?? false) : false
            }),
            setRoutingDirective: (directive: string) => set({ routingDirective: directive }),
            toggleSandbox: (enforce: boolean) => set({ isSandboxEnforced: enforce }),
            toggleVesselSandbox: (id: string) => set((state) => ({
                vessels: state.vessels.map(v => v.id === id ? { ...v, isSandboxed: !v.isSandboxed } : v),
                // If the toggled vessel is the active one, update global enforcement
                isSandboxEnforced: state.activeVesselId === id ? !state.vessels.find(v => v.id === id)?.isSandboxed : state.isSandboxEnforced
            })),
            updateVesselEnergy: (id: string, energy: number) => set((state) => ({
                vessels: state.vessels.map(v => v.id === id ? { ...v, energyLevel: energy } : v)
            }))
        }),
        { name: 'dawayir-fleet-state' }
    )
);
