import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDocumentOrNull, getWindowOrNull } from "../services/clientRuntime";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
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
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
        applyTheme(resolvedTheme);
        set({ theme, resolvedTheme });
      }
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
