import { create } from "zustand";
import { UIMutation } from "@/infrastructure/agents/swarmOrchestrator";

interface SwarmMutationState {
  currentTheme: "NORMAL" | "RECOVERY" | "CRITICAL" | "CALM";
  activeTool: string | null;
  pulseEffect: "NONE" | "CRITICAL" | "SUCCESS" | "WARNING";
  artistMessage: string | null;
  isArtistOpen: boolean;
  
  applyMutations: (mutations: UIMutation[]) => void;
  setArtistMessage: (msg: string | null) => void;
  setIsArtistOpen: (isOpen: boolean) => void;
  clearMutations: () => void;
}

export const useSwarmMutationStore = create<SwarmMutationState>((set) => ({
  currentTheme: "NORMAL",
  activeTool: null,
  pulseEffect: "NONE",
  artistMessage: null,
  isArtistOpen: false,

  applyMutations: (mutations) => {
    set((state) => {
      let newState = { ...state };
      
      mutations.forEach((m) => {
        switch (m.type) {
          case "CHANGE_THEME":
            newState.currentTheme = m.payload;
            break;
          case "OPEN_TOOL":
            newState.activeTool = m.payload;
            break;
          case "SHOW_MESSAGE":
            newState.artistMessage = m.payload;
            break;
          case "PULSE_EFFECT":
            newState.pulseEffect = m.payload;
            break;
        }
      });
      
      return newState;
    });

    // Auto-clear pulse effects after 5 seconds to prevent epilepsy/infinite loops
    const hasPulse = mutations.some(m => m.type === "PULSE_EFFECT");
    if (hasPulse) {
      setTimeout(() => {
        set({ pulseEffect: "NONE" });
      }, 5000);
    }
  },

  setArtistMessage: (msg) => set({ artistMessage: msg }),
  setIsArtistOpen: (isOpen) => set({ isArtistOpen: isOpen }),

  clearMutations: () => set({
    currentTheme: "NORMAL",
    activeTool: null,
    pulseEffect: "NONE",
    artistMessage: null
  })
}));
