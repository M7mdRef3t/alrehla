import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PersonaType } from "../agent/personae";

interface SwarmState {
    activePersona: PersonaType;
    manualOverride: boolean;

    // Actions
    setActivePersona: (persona: PersonaType) => void;
    setManualOverride: (override: boolean) => void;
    resetToAuto: () => void;
}

export const useSwarmState = create<SwarmState>()(
    persist(
        (set) => ({
            activePersona: "AUTO",
            manualOverride: false,

            setActivePersona: (persona) => set({ activePersona: persona, manualOverride: persona !== "AUTO" }),
            setManualOverride: (override) => set({ manualOverride: override }),
            resetToAuto: () => set({ activePersona: "AUTO", manualOverride: false }),
        }),
        {
            name: "dawayir-swarm-state",
        }
    )
);
