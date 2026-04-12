import { create } from "zustand";

interface ToastState {
    message: string | null;
    isVisible: boolean;
    type: "info" | "success" | "warning" | "error";
    showToast: (message: string, type?: "info" | "success" | "warning" | "error") => void;
    hideToast: () => void;
}

export const useToastState = create<ToastState>((set) => ({
    message: null,
    isVisible: false,
    type: "info",
    showToast: (message, type = "info") =>
        set({ message, isVisible: true, type }),
    hideToast: () => set({ isVisible: false }),
}));
