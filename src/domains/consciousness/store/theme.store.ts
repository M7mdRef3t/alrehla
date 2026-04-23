/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
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
  vignetteStrength: number;
  grainOpacity: number;
  chromaticAberration: number;
  ambientVolume: number;
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
  voiceTone: "default",
  vignetteStrength: 0,
  grainOpacity: 0,
  chromaticAberration: 0,
  ambientVolume: 0.5,
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

export function injectTokens(tokens: DesignTokens) {
  const documentRef = getDocumentOrNull();
  if (!documentRef) return;
  const root = documentRef.documentElement;
  
  // Safe extraction with fallbacks to prevent .toString() on undefined
  const primary = tokens.primaryColor || DEFAULT_TOKENS.primaryColor;
  const accent = tokens.accentColor || DEFAULT_TOKENS.accentColor;
  const voidColor = tokens.spaceVoid || DEFAULT_TOKENS.spaceVoid;
  const radius = tokens.borderRadius || DEFAULT_TOKENS.borderRadius;
  const blurVal = tokens.blur || DEFAULT_TOKENS.blur;
  const spacingVal = tokens.spacing || DEFAULT_TOKENS.spacing;
  const pulse = tokens.pulseDuration || DEFAULT_TOKENS.pulseDuration;
  
  const vignette = tokens.vignetteStrength ?? DEFAULT_TOKENS.vignetteStrength;
  const grain = tokens.grainOpacity ?? DEFAULT_TOKENS.grainOpacity;
  const aberration = tokens.chromaticAberration ?? DEFAULT_TOKENS.chromaticAberration;

  root.style.setProperty("--teal-400", primary);
  root.style.setProperty("--amber-500", accent);
  root.style.setProperty("--space-void", voidColor);
  root.style.setProperty("--consciousness-border-radius", radius);
  root.style.setProperty("--consciousness-blur", blurVal);
  root.style.setProperty("--consciousness-spacing", spacingVal);
  root.style.setProperty("--pulse-duration", pulse);
  root.style.setProperty("--atmosphere-vignette", vignette.toString());
  root.style.setProperty("--atmosphere-grain", grain.toString());
  root.style.setProperty("--atmosphere-aberration", aberration.toString());
}

function applyTheme(resolvedTheme: "light" | "dark") {
  // We no longer manually manipulate root.classList here.
  // next-themes handles DOM class list application to avoid flashing.
  // The ThemeSync component bridges useThemeState with next-themes.
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
        set({ theme, resolvedTheme });
        // Emit event so AppRuntimeControllers can forward to next-themes
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("zustand-theme-change", { detail: { theme } })
          );
        }
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
          const { fetchThemePalette } = await import("@/services/admin/adminSettings");
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
          const { updateThemePalette } = await import("@/services/admin/adminSettings");
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
      name: "dawayir-theme", storage: zustandIdbStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Heal state: merge with defaults to ensure new properties exist
          state.customTokens = { ...DEFAULT_TOKENS, ...state.customTokens };
          
          const resolvedTheme = state.theme === "system" ? getSystemTheme() : state.theme;
          applyTheme(resolvedTheme);
          state.resolvedTheme = resolvedTheme;
          injectTokens(state.customTokens);
        }
      }
    }
  )
);

// Synapse Receptor (Neural Link)
// NOTE: Auto-theme-changes from SynapseBus are intentionally disabled.
// They caused conflicts with next-themes system. Theme is managed by the user
// or system preference only. Consciousness states can change visual tokens
// (colors/effects) without overriding the whole day/night mode.
import { SynapseBus } from "@/core/synapse/SynapseBus";
import { zustandIdbStorage } from '@/utils/idbStorage';


SynapseBus.subscribe((_event) => {
  // Theme changes from SynapseBus disabled intentionally.
  // Previously this caused light/dark mode to flip on user stress/catharsis events.
});
