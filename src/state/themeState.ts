import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDocumentOrNull, getWindowOrNull } from "@/services/clientRuntime";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  liteMode: boolean;
  setTheme: (theme: Theme) => void;
  setLiteMode: (lite: boolean) => void;
}

function getSystemTheme(): "light" | "dark" {
  const windowRef = getWindowOrNull();
  if (!windowRef) return "light";
  return windowRef.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolvedTheme: "light" | "dark") {
  const documentRef = getDocumentOrNull();
  if (!documentRef) return;

  const root = documentRef.documentElement;
  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const useThemeState = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      resolvedTheme: getSystemTheme(),
      liteMode: false,
      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
        applyTheme(resolvedTheme);
        set({ theme, resolvedTheme });
      },
      setLiteMode: (liteMode: boolean) => set({ liteMode })
    }),
    {
      name: "dawayir-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolvedTheme = state.theme === "system" ? getSystemTheme() : state.theme;
          applyTheme(resolvedTheme);
          state.resolvedTheme = resolvedTheme;
        }
      }
    }
  )
);

// Listen for system theme changes
const windowRef = getWindowOrNull();
if (windowRef) {
  windowRef.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const state = useThemeState.getState();
    if (state.theme === "system") {
      const resolvedTheme = e.matches ? "dark" : "light";
      applyTheme(resolvedTheme);
      useThemeState.setState({ resolvedTheme });
    }
  });
}

// 🧠 Synapse Receptor (Neural Link)
import { SynapseBus } from "@/core/synapse/SynapseBus";

SynapseBus.subscribe((event) => {
  if (event.intensity >= 0.8) {
    if (event.type === "LOCKDOWN_INITIATED" || event.type === "VAMPIRE_DETECTED" || event.type === "STRESS_SPIKED") {
      // Emergency -> Dark Theme
      useThemeState.getState().setTheme("dark");
    } else if (event.type === "CATHARSIS_REACHED" || event.type === "LOCKDOWN_LIFTED") {
      // Relief -> Light Theme
      useThemeState.getState().setTheme("light");
    }
  }
});
