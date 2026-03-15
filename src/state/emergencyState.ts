import { create } from "zustand";
import type { EmergencyContext } from "../utils/emergencyContext";

interface EmergencyState {
  isOpen: boolean;
  context: EmergencyContext | null;
  open: (context?: EmergencyContext) => void;
  close: () => void;
}

export const useEmergencyOverlay = create<EmergencyState>((set) => ({
  isOpen: false,
  context: null,
  open: (context) => set({ isOpen: true, context: context ?? null }),
  close: () => set({ isOpen: false, context: null })
}));

export const useEmergencyState = useEmergencyOverlay;
