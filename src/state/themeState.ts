import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDocumentOrNull, getWindowOrNull } from "@/services/clientRuntime";

type Theme = "light" | "dark" | "system";

export interface DesignTokens {
  primaryColor: string;
  accentColor: string;
  spaceVoid: string;
  borderRadius: string;
  blur: string;
  spacing: string;
  /** Resonance Sync: The heartbeat of the OS */
  pulseDuration: string;
  voiceTone: 'calm' | 'neon' | 'royal' | 'default';
  // Consciousness State Overrides
  states?: Record<string, Partial<Omit<DesignTokens, 'states'>>>;
}

const DEFAULT_TOKENS: DesignTokens = {
  primaryColor: "#2dd4bf",
  accentColor: "#f5a623",
  spaceVoid: "#0a0e1f",
  borderRadius: "16px",
  blur: "8px",
  spacing: "1rem",
  pulseDuration: "3s",
  voiceTone: "default"
};

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  liteMode: boolean;
  customTokens: DesignTokens;
  setTheme: (theme: Theme) => void;
  setLiteMode: (lite: boolean) => void;
  updateTokens: (tokens: Partial<DesignTokens>) => void;
  resetTokens: () => void;
  // Cloud Sync
  fetchCloudTokens: () => Promise<void>;
  publishToCloud: () => Promise<boolean>;
}

function getSystemTheme(): "light" | "dark" {
  const windowRef = getWindowOrNull();
  if (!windowRef) return "light";
  return windowRef.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function injectTokens(tokens: DesignTokens) {
  const documentRef = getDocumentOrNull();
  if (!documentRef) return;
  const root = documentRef.documentElement;
  
  root.style.setProperty("--teal-400", tokens.primaryColor);
  root.style.setProperty("--amber-500", tokens.accentColor);
  root.style.setProperty("--space-void", tokens.spaceVoid);
  root.style.setProperty("--consciousness-border-radius", tokens.borderRadius);
  root.style.setProperty("--consciousness-blur", tokens.blur);
  root.style.setProperty("--consciousness-spacing", tokens.spacing);
  root.style.setProperty("--pulse-duration", tokens.pulseDuration);
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
    (set, get) => ({
      theme: "system",
      resolvedTheme: getSystemTheme(),
      liteMode: false,
      customTokens: DEFAULT_TOKENS,
      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
        applyTheme(resolvedTheme);
        set({ theme, resolvedTheme });
      },
      setLiteMode: (liteMode: boolean) => set({ liteMode }),
      updateTokens: (tokens: Partial<DesignTokens>) => {
        const newTokens = { ...get().customTokens, ...tokens };
        injectTokens(newTokens);
        set({ customTokens: newTokens });
      },
      resetTokens: () => {
        injectTokens(DEFAULT_TOKENS);
        set({ customTokens: DEFAULT_TOKENS });
      },
      fetchCloudTokens: async () => {
        try {
          const { fetchThemePalette } = await import("@/services/adminApi");
          const cloudTokens = await fetchThemePalette();
          if (cloudTokens) {
            const mapped: DesignTokens = {
              ...DEFAULT_TOKENS,
              primaryColor: cloudTokens.primary || DEFAULT_TOKENS.primaryColor,
              accentColor: cloudTokens.accent || DEFAULT_TOKENS.accentColor,
              spaceVoid: cloudTokens.nebulaBase || DEFAULT_TOKENS.spaceVoid,
              ...cloudTokens as any
            };
            injectTokens(mapped);
            set({ customTokens: mapped });
          }
        } catch (error) {
          console.error("Failed to fetch cloud tokens:", error);
        }
      },
      publishToCloud: async () => {
        try {
          const { updateThemePalette } = await import("@/services/adminApi");
          const tokens = get().customTokens;
          const success = await updateThemePalette({
            primary: tokens.primaryColor,
            accent: tokens.accentColor,
            nebulaBase: tokens.spaceVoid,
            ...tokens as any
          });
          return success;
        } catch (error) {
          console.error("Failed to publish tokens to cloud:", error);
          return false;
        }
      }
    }),
    {
      name: "dawayir-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolvedTheme = state.theme === "system" ? getSystemTheme() : state.theme;
          applyTheme(resolvedTheme);
          state.resolvedTheme = resolvedTheme;
          injectTokens(state.customTokens || DEFAULT_TOKENS);
        }
      }
    }
  )
);

// Synapse Receptor (Neural Link)
import { SynapseBus } from "@/core/synapse/SynapseBus";

SynapseBus.subscribe((event) => {
  if (event.intensity >= 0.8) {
    if (event.type === "LOCKDOWN_INITIATED" || event.type === "VAMPIRE_DETECTED" || event.type === "STRESS_SPIKED") {
      useThemeState.getState().setTheme("dark");
    } else if (event.type === "CATHARSIS_REACHED" || event.type === "LOCKDOWN_LIFTED") {
      useThemeState.getState().setTheme("light");
    }
  }
});
